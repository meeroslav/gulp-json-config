'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
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

  it('should...', function(done) {

  });
});