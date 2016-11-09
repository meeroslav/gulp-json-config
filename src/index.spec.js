'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var jsonConfig = require('../.');
var es = require('event-stream');
var should = require('should');
var path = require('path');

describe('gulp-json-config', function() {
  var log;
  var logOutput = [];

  beforeEach(function () {
    log = gutil.log;
    logOutput = [];
    gutil.log = function () {
      logOutput.push(arguments);
    };
  });

  afterEach(function () {
    gutil.log = log;
  });

  it('should save single file', function(done) {
    var stream = src(['user.json'], {read: true})
      .pipe(jsonConfig('single.json'));

    streamShouldContain(stream, ['single.json'], done);
  });

  it('should combine two files', function(done) {
    var stream = src(['user.json', 'server.json'], {read: true})
      .pipe(jsonConfig('twofiles.json'));

    streamShouldContain(stream, ['twofiles.json'], done);
  });
});

// helpers
function src(files, opt) {
  opt = opt || {};
  var stream = es.readArray(files.map(function (file) {
    return fixture(file, opt.read);
  }));
  return stream;
}

// get fixture
function fixture(file, read) {
  var filepath = path.resolve(__dirname, 'fixtures', file);
  return new gutil.File({
    path: filepath,
    cwd: __dirname,
    base: path.resolve(__dirname, 'fixtures', path.dirname(file)),
    contents: read ? fs.readFileSync(filepath) : null
  });
}

// get expected file
function expectedFile(file) {
  var filepath = path.resolve(__dirname, 'expected', file);
  return new gutil.File({
    path: filepath,
    cwd: __dirname,
    base: path.resolve(__dirname, 'expected', path.dirname(file)),
    contents: fs.readFileSync(filepath)
  });
}

function streamShouldContain(stream, files, done, errRegexp) {
  var received = 0;

  stream.on('error', function (err) {
    console.log(err);
    err.message.should.match(errRegexp);
    done();
  });

  var contents = files.map(function (file) {
    return String(expectedFile(file).contents);
  });
  stream.on('data', function (newFile) {
    should.exist(newFile);
    should.exist(newFile.contents);

    if (contents.length === 1) {
      String(newFile.contents).should.equal(contents[0]);
    } else {
      contents.should.containEql(String(newFile.contents));
    }

    if (++received === files.length) {
      done();
    }
  });
}