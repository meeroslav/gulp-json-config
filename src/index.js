var argv = require('yargs').argv;
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;
var path = require('path');

var PLUGIN_NAME = 'combine-configs';

// Based on gulp-jsoncombine plugin
// https://github.com/reflog/gulp-jsoncombine/
module.exports = function(fileName, ENVIRONMENT_DEFINITION) {
    if (!fileName) {
        throw new PluginError(PLUGIN_NAME, 'Missing fileName');
    }

    var firstFile = null;
    var data = {};
    var skipConversion = false;

    function insertProperty(parent, env, destination) {
        if (parent && parent[env]) {
            Object.keys(parent[env]).forEach(function(prop){
                // don't override, only copy if doesn't exist
                destination[prop] = destination[prop] || parent[env][prop];
            });
        }
    }

    function parseJsonConfig(data, environmentOrder) {
        var result = {};

        // iterate through all configFiles
        Object.keys(data).forEach(function (configName) {
            if (configName.indexOf('.local') !== -1) {
                return; // skip local ones in here, we'll handle them later
            }
            // set config wrapper
            result[configName] = {};
            // iterate through environment order
            ENVIRONMENT_DEFINITION[environmentOrder].forEach(function(env){
                // check for locals first
                insertProperty(data[configName + '.local'], env, result[configName]);
                insertProperty(data[configName], env, result[configName]);
            });
        });
        return new Buffer(JSON.stringify(result));
    }

    function composeNewName(name, environment) {
        return name.replace('.json', '.' + environment + '.json');
    }

    function handleStream(target, encoding, cb) {
        if (!firstFile) {
            firstFile = target;
        }
        if (target.isNull()) {
            return cb(null, target);
        }
        if (target.isStream()) {
            skipConversion = true;
            return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
        }
        try {
            var name = target.relative.substr(0, target.relative.length-5); // get name
            data[name] = JSON.parse(target.contents.toString()); // archive content
            cb();
            return;
        } catch (err) {
            skipConversion = true;
            return cb(new PluginError(PLUGIN_NAME, 'Error parsing JSON: ' + err + ', file: ' + target.path.slice(target.base.length)));
        }
    }

    function endStream(cb) {
        if (firstFile && !skipConversion) {
            var cwd = firstFile.cwd;
            var base = firstFile.base;
            try {
                Object.keys(ENVIRONMENT_DEFINITION).forEach(function(environmentOrder){
                    var newFile = new File({
                        cwd: cwd,
                        base: base,
                        path: path.join(base, composeNewName(fileName, environmentOrder)),
                        contents: parseJsonConfig(data, environmentOrder)
                    });
                    this.push(newFile);
                }, this);
                return cb();
            } catch (ex) {
                return cb(new PluginError(PLUGIN_NAME, ex, { showStack: true }));
            }
        }
        cb();
    }

    return through.obj(handleStream, endStream);
}
