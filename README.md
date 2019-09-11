# gulp-tinypng-web
use tinypng to compress images

## Install
```
$ npm install gulp-tinypng-web
```

## Usage
```js
const gulp = require('gulp');
const tiny = require('gulp-tinypng-web');

exports.default = () => {
gulp.src(./src/images/*)
	.pipe(tiny())
	.pipe(gulp.dest('./dist/images'))
};
```

## API

### tiny(options)

#### options
Type: `Object`
- verbose - Enabling this will log info on every image passed to gulp-tinypng-web:
```
gulp-tinypng-web: ✔ banner.jpg 87.1 kB -> 42.8 kB (saved 50.8%)
gulp-tinypng-web: ✔ show_award.png 66.1 kB -> 19.9 kB (saved 69.8%)
```
