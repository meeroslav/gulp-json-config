'use strict';

const through = require('through2');
const PluginError = require('plugin-error');
const Vinyl = require('vinyl');
const path = require('path');

const PLUGIN_NAME = 'json-config';

module.exports = function (opt) {
  opt = opt || {};

  opt.fileName = opt.fileName || 'config.json';
  opt.modify = opt.modify || function (json) {
    return json;
  };
  opt.rules = opt.rules || null;


  let firstFile = null;
  let data = {};
  let skipConversion = false;

  /**
   * Get name based on environment
   * @param name
   * @param environment
   * @returns {string|void}
   */
  function composeNewName(name, environment) {
    return name.replace('.json', '.' + environment + '.json');
  }

  /**
   * Starting point
   * @param target
   * @param encoding
   * @param cb
   * @returns {*}
   */
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
      const name = target.relative.substr(0, target.relative.length - 5); // get name
      let content = JSON.parse(target.contents.toString());
      data[name] = opt.modify(content); // archive content
      cb();
    } catch (err) {
      skipConversion = true;
      return cb(new PluginError(PLUGIN_NAME, 'Error parsing JSON: ' + err + ', file: ' + target.path.slice(target.base.length)));
    }
  }

  /**
   * Close stream
   * @param cb
   * @returns {*}
   */
  function endStream(cb) {
    if (firstFile && !skipConversion) {
      const cwd = firstFile.cwd;
      const base = firstFile.base;

      if (opt.rules) {
        Object.keys(opt.rules).forEach(function (environmentOrder) {
          pushFile(this, cwd, base, environmentOrder);
        }, this);
      } else {
        pushFile(this, cwd, base);
      }
      return cb();

    }
    cb();
  }

  /**
   * Push combined files into a stream
   * @param stream
   * @param cwd
   * @param base
   * @param environmentOrder
   */
  function pushFile(stream, cwd, base, environmentOrder) {
    const newFile = new Vinyl({
      cwd: cwd,
      base: base,
      path: path.join(base, environmentOrder ? composeNewName(opt.fileName, environmentOrder) : opt.fileName),
      contents: combineJSONData(data, environmentOrder)
    });
    stream.push(newFile);
  }

  /**
   * Combine json data based on environment order
   * @param data
   * @param environmentOrder
   */
  function combineJSONData(data, environmentOrder) {
    let result = {};

    // iterate through all configFiles
    Object.keys(data).forEach(function (configName) {
      if (!environmentOrder) {
        result[configName] = data[configName];
        return;
      }
      if (configName.indexOf('.local') !== -1) {
        return; // skip local ones in here, we'll handle them later
      }
      // set config wrapper
      result[configName] = {};
      // iterate through environment order
      opt.rules[environmentOrder].forEach(function (env) {
        // check for locals first
        insertProperty(data[configName + '.local'], env, result[configName]);
        insertProperty(data[configName], env, result[configName]);
      });
    });

    /**
     * Insert property on correct location
     * @param parent
     * @param env
     * @param destination
     */
    function insertProperty(parent, env, destination) {
      if (parent && parent[env]) {
        Object.keys(parent[env]).forEach(function (prop) {
          // don't override, only copy if doesn't exist
          destination[prop] = destination[prop] || parent[env][prop];
        });
      }
    }

    /**
     * Run plugin
     */
    return new Buffer.from(JSON.stringify(result));
  }

  return through.obj(handleStream, endStream);
};
