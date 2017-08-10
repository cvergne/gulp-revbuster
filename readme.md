# gulp-revbuster [![Build Status](https://travis-ci.org/cvergne/gulp-revbuster.svg?branch=master)](https://travis-ci.org/cvergne/gulp-revbuster) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

This package is a fork of the really good [gulp-rev](https://github.com/sindresorhus/gulp-rev/) package, but processing manifest file more like [gulp-buster](https://github.com/UltCombo/gulp-buster) with the handling merging of existing manifest file.

---

Make sure to set the files to [never expire](http://developer.yahoo.com/performance/rules.html#expires) for this to have an effect.

---


## Install

```
$ npm install --save-dev gulp-revbuster
```


## Usage

Unlike the original gulp-rev plugin, this one is totally useless if you use only `revbuster()` without `revbuster.manifest()`.

As `revbuster()` is getting hash for each asset file processed, `revbuster.manifest()` update *(or create)* the manifest file with all the files processed associated to its hash.

```js
const gulp = require('gulp');
const revbuster = require('gulp-revbuster');

gulp.task('default', () =>
	gulp.src('src/*.css')
		.pipe(revbuster())
		.pipe(gulp.dest('dist'))
		.pipe(revbuster.manifest())
		.pipe(gulp.dest('build/assets'))
);
```

An asset manifest, mapping the original paths to the revisioned paths, will be written to `build/assets/revbuster-manifest.json`:

```json
{
	"css/unicorn.css": "d41d8cd98f",
	"js/unicorn.js": "273c2c123f"
}
```
By default, `revbuster-manifest.json` will be replaced as a whole. To merge with an existing manifest, pass `merge: true` and the output destination (as `base`) to `revbuster.manifest()`:


```js
const gulp = require('gulp');
const revbuster = require('gulp-revbuster');

gulp.task('default', () =>
	// by default, gulp would pick `assets/css` as the base,
	// so we need to set it explicitly:
	gulp.src(['assets/css/*.css', 'assets/js/*.js'], {base: 'assets'})
		.pipe(gulp.dest('build/assets'))
		.pipe(revbuster())
		.pipe(gulp.dest('build/assets'))
		.pipe(revbuster.manifest({
			base: 'build/assets',
			merge: true // merge with the existing manifest if one exists
		}))
		.pipe(gulp.dest('build/assets'))
);
```
You can optionally call `revbuster.manifest('manifest.json')` to give it a different path or filename.


## Sourcemaps and `gulp-concat`

Because of the way `gulp-concat` handles file paths, you may need to set `cwd` and `path` manually on your `gulp-concat` instance to get everything to work correctly:

```js
const gulp = require('gulp');
const revbuster = require('gulp-revbuster');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

gulp.task('default', () =>
	gulp.src('src/*.js')
		.pipe(sourcemaps.init())
		.pipe(concat({path: 'bundle.js', cwd: ''}))
		.pipe(revbuster())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('dist'))
)
```


## Different hash for unchanged files

Since the order of streams are not guaranteed, some plugins such as `gulp-concat` can cause the final file's content and hash to change. To avoid generating a new hash for unchanged source files, you can:

- Sort the streams with [gulp-sort](https://github.com/pgilad/gulp-sort)
- Filter unchanged files with [gulp-unchanged](https://github.com/sindresorhus/gulp-changed)
- Read more about [incremental builds](https://github.com/gulpjs/gulp#incremental-builds)


## Streaming

This plugin does not support streaming. If you have files from a streaming source, such as Browserify, you should use [`gulp-buffer`](https://github.com/jeromew/gulp-buffer) before `gulp-revbuster` in your pipeline:

```js
const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('gulp-buffer');
const revbuster = require('gulp-revbuster');

gulp.task('default', () =>
	browserify('src/index.js')
		.bundle({debug: true})
		.pipe(source('index.min.js'))
		.pipe(buffer())
		.pipe(revbuster())
		.pipe(gulp.dest('dist'))
);
```

## Todo

As gulp-revbuster was quickly made to answer a need for a project, it might still have useless code or explainations in documentation.  
A cleanup should be made in code and doc. However, gulp-rev tests have been updated to work with gulp-revbuster.

## License

[MIT](license)
