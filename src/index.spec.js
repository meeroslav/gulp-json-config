'use strict';

const fs = require('fs');
const jsonConfig = require('../.');
const es = require('event-stream');
const should = require('should');
const Vinyl = require('vinyl');
const path = require('path');

describe('gulp-json-config', function() {

  it('should save single file', function(done) {
    const stream = src(['user.json'], {read: true})
      .pipe(jsonConfig({fileName: 'single.json'}));

    streamShouldContain(stream, ['single.json'], done);
  });

  it('should combine two files', function(done) {
    const stream = src(['user.json', 'server.json'], {read: true})
      .pipe(jsonConfig({fileName: 'twofiles.json'}));

    streamShouldContain(stream, ['twofiles.json'], done);
  });

  it('should save two vesions of single file when environment definition provided', function(done) {
    const stream = src(['userfull.json'], {read: true})
      .pipe(jsonConfig({fileName: 'single.json', rules: {
        "prod": ["prod"],
        "dev": ["dev", "prod"]
      }}));

    streamShouldContain(stream, ['single.dev.json', 'single.prod.json'], done);
  });
  it('should save two vesions of combined file when environment definition provided', function(done) {
    const stream = src(['userfull.json', 'serverfull.json'], {read: true})
      .pipe(jsonConfig({fileName: 'twofiles.json', rules: {
        "prod": ["prod"],
        "dev": ["dev", "prod"]
      }}));

    streamShouldContain(stream, ['twofiles.dev.json', 'twofiles.prod.json'], done);
  });
});

// helpers
function src(files, opt) {
  opt = opt || {};
  const stream = es.readArray(files.map(function (file) {
    return fixture(file, opt.read);
  }));
  return stream;
}

// get fixture
function fixture(file, read) {
  const filePath = path.resolve(__dirname, 'fixtures', file);
  return new Vinyl({
    path: filePath,
    cwd: __dirname,
    base: path.resolve(__dirname, 'fixtures', path.dirname(file)),
    contents: read ? fs.readFileSync(filePath) : null
  });
}

// get expected file
function expectedFile(file) {
  const filePath = path.resolve(__dirname, 'expected', file);
  return new Vinyl({
    path: filePath,
    cwd: __dirname,
    base: path.resolve(__dirname, 'expected', path.dirname(file)),
    contents: fs.readFileSync(filePath)
  });
}

function streamShouldContain(stream, files, done, errRegexp) {
  let received = 0;

  stream.on('error', function (err) {
    err.message.should.match(errRegexp);
    done();
  });

  const contents = files.map(function (file) {
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
