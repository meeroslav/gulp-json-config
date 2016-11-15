# gulp-json-config

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][depstat-image]][depstat-url]
[![Code Climate][codeclimate-image]][codeclimate-url]

> A plugin for Gulp to combine JSON config files into combined files based on rule-set and modification function

**Gulp-json-config** parses JSON files, combines them into single file or when rule set provided into several combined files based on rules. See [Basic usage](#basic-usage) and [Advanced usage](#advanced-usage) below.

**Note:** NodeJs v4 or above and Gulp are required.
**Warning:** Version v2.x.x is not backwards compatible with version 1.0.1.

## Installation

Install `gulp-json-config` as a development dependency:

```shell
npm install --save-dev gulp-json-config
```

## Basic usage

`Gulp-json-config` combines contents of input JSON files and saves them into single file.

**gulpfile.js**
```javascript
var gulp = require('gulp');
var jsonConfig = require('gulp-json-config');

gulp.task('index', function () {
  return gulp.src(['path/to/*.json'])
           .pipe(jsonConfig())
           .pipe(gulp.dest('dest/path'));
});
```

**inputA.json**
```json
{
  "key1": "value1"
}
```

**inputB.json**
```json
{
  "key2": "value2"
}
```

Will result in **config.json**:
```json
{
  "inputA": { 
    "key1": "value1" 
  },
  "inputB": { 
    "key2": "value2" 
  }  
}
```

## Advanced usage

When provided rule set it will parse the content and apply rule filtering to combine appropriate content in resulting files.
Intended usage or this rule set is to provide easy mechanism for different configs for different deployment environments.

**gulpfile.js**
```javascript
var gulp = require('gulp');
var jsonConfig = require('gulp-json-config');

gulp.task('index', function () {
  return gulp.src(['path/to/*.json'])
           .pipe(jsonConfig({
             fileName: 'configName.json',
             modify: function(jsonObj) {
               Object.keys(jsonObj).forEach(function(key) {
                 jsonObj[key + '_env'] = jsonObj[key];
                 delete jsonObj[key];
               });
             },
             rules: {
                "prod_env": ["prod_env"],
                "dev_env": ["dev_env", "prod_env"]
             }
           }))
           .pipe(gulp.dest('dest/path'));
});
```

Plugin will generate separate file for each rule-set group by applying priority described in group definition.
In this file it means that for `dev` file it will take all keys from `dev` and merge them into `prod` overriding all the existing fields.

**inputA.json**
```json
{
  "dev": {
    "onlyInDev": "value1",
    "shared": "value2"
  }, 
  "prod": {
    "shared": "value3",
    "onlyInProd": "value4"
  }
}
```

**inputB.json**
```json
{
  "dev": {
    "onlyInDev": "valueA",
    "shared": "valueB"
  }, 
  "prod": {
    "shared": "valueC",
    "onlyInProd": "valueD"
  }
}
```

Will result in two files:
**configName.prod_env.json**
```json
{
  "inputA": { 
    "shared": "value3",
    "onlyInProd": "value4"
  },
  "inputB": { 
    "shared": "valueC",
    "onlyInProd": "valueD"
  }
}
```
**configName.dev_env.json**
```json
{
  "inputA": { 
    "onlyInDev": "value1",
    "shared": "value2",
    "onlyInProd": "value4"
  },
  "inputB": { 
    "onlyInDev": "valueA",
    "shared": "valueB",
    "onlyInProd": "valueD"
  }
}
```
 
All the combinations are possible.

### Local overrides

Local overrides are possible with use of prefix `.local` in file naming e.g. `my-config.local.json`. Those files will override all fields of parent configs and will follow the same rule set as their parents. 

**my-config.json**
```json
{
  "user": {
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

**my-config.local.json**
```json
{
  "user": {
    "firstname": "Jane",
    "middle": "Marry"
  }
}
```

Will result in following config:
```json
{
  "my-config": {
    "user": {
      "firstname": "Jane",
      "middle": "Marry",
      "lastname": "Doe"
    }  
  }
}
```

Normally, `*.local.json` is easy to be added to `.gitignore` so your local experiments/overrides do not pollute code base.
 
## API
 
gulp-inject-partial(options)
 
### options.fileName
Type: `String`
Param: `optional`
Default: `config.json`
Example: 
```
my-config.json
```
Filename of resulting config file


### options.rules
Type: `[key: string]: string[]`
Param: `optional`
Default: `null`
Example: 
```json
  {
    "prod": ["prod"],
    "staging": ["staging", "prod"],
    "dev": ["dev", "staging", "prod"]
  }
```

Rule dictionary for parsing and combining between different rule groups. 

### options.modify
Type: `(json: Object): Object`
Param: `optional`
Default: `function(json) { return json; }`
Example: 
```js
function(jsonObj) {
   Object.keys(jsonObj).forEach(function(key) {
     jsonObj[key + '_env'] = jsonObj[key];
     delete jsonObj[key];
   });
}
```

Custom function to modify file contents (parsed JSON objects) before merging them together.

## License

[MIT](http://en.wikipedia.org/wiki/MIT_License) © [Miroslav Jonas](mailto:meeroslav@yahoo.com)

[npm-url]: https://npmjs.org/package/gulp-json-config
[npm-image]: https://badge.fury.io/js/gulp-json-config.png

[travis-url]: http://travis-ci.org/meeroslav/gulp-json-config
[travis-image]: https://travis-ci.org/meeroslav/gulp-json-config.svg?branch=master

[depstat-url]: https://david-dm.org/meeroslav/gulp-json-config
[depstat-image]: https://david-dm.org/meeroslav/gulp-json-config/status.svg

[codeclimate-url]: https://codeclimate.com/github/meeroslav/gulp-json-config
[codeclimate-image]: https://codeclimate.com/github/meeroslav/gulp-json-config/badges/gpa.svg