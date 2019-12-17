const gulp = require('gulp')
const nunjucks = require('gulp-nunjucks')
const sass = require('gulp-sass')
const sourcemap = require('gulp-sourcemaps')
const autoprefixer = require('gulp-autoprefixer')
const scssLint = require('gulp-scss-lint')
const browserify = require('browserify')
const sourceStream = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const uglify = require('gulp-uglify')
const babelify = require('babelify')
const browserSync = require('browser-sync').create()
const clean = require('gulp-clean')
const runSequence = require('run-sequence')
const plumber = require('gulp-plumber')

const init = {
  srcPath: './src',
  destPath: './public'
}

gulp.task('html', () => {
  return gulp.src([`${init.srcPath}/html/**/*.html`, `!${init.srcPath}/html/shared/*`, `!${init.srcPath}/html/layout/*`])
      .pipe(nunjucks.compile())
      .pipe(gulp.dest(`${init.destPath}/`))
})

gulp.task('css', () => {
  return gulp.src(`${init.srcPath}/scss/**/*.scss`)
      .pipe(plumber({
        handleError: err => {
        console.log(err);
        this.emit('end');
        }
      }))
      .pipe(scssLint({ 'config': '.scss-lint.yml' }))
      .pipe(sourcemap.init())
      .pipe(sass({ outputStyle: 'compressed' }))
      .pipe(autoprefixer({ cascade: false }))
      .pipe(sourcemap.write())
      .pipe(gulp.dest(`${init.destPath}/css`))
      .pipe(browserSync.stream())
})

gulp.task('js', () => {
  return browserify({
    entries: `${init.srcPath}/js/main.js`,
    debug: false
  })
  .transform(babelify, { 'presets': ['@babel/preset-env'] })
  .bundle().on('error', err => {
    console.log(err);
  })
  .pipe(sourceStream('main.min.js'))
  .pipe(buffer())
  .pipe(sourcemap.init())
  .pipe(uglify())
  .pipe(sourcemap.write())
  .pipe(gulp.dest(`${init.destPath}/js`))
})

gulp.task('browserSync', () => {
  return browserSync.init({
    server: {
      baseDir: `${init.destPath}`
    },
    port: 8001
  })
})

gulp.task('watch', gulp.series('browserSync', 'css'), () => {
  gulp.watch(`${init.srcPath}/scss/**/*.scss`, gulp.series('css'));
  gulp.watch(`${init.srcPath}/js/**/*.js`, gulp.series('js')).on('change', () => browserSync.reload());
  gulp.watch(`${init.srcPath}/html/**/*.html`, gulp.series('html')).on('change', () => browserSync.reload());
})

gulp.task('clean', () => {
  gulp.src(`${init.destPath}/*`)
      .pipe(clean())
})

gulp.task('default', gulp.series('html', 'css', 'js'));
gulp.task('deploy', (callback) => {
  runSequence('clean', 'html', 'image', 'css', 'js', callback);
})
