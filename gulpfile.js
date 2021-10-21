const browsersync = require('browser-sync').create();
const cached = require('gulp-cached');
const cleancss = require('gulp-clean-css');
const del = require('del');
const fileinclude = require('gulp-file-include');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const npmdist = require('gulp-npm-dist');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const useref = require('gulp-useref');
const postcss = require('gulp-postcss');
const tailwindcss = require('tailwindcss');
const TAILWIND_CONFIG = './tailwind.config.js';

// Define paths
const paths = {
  base: {
    base: {
      dir: './'
    },
    node: {
      dir: './node_modules'
    },
    packageLock: {
      files: './package-lock.json'
    }
  },
  dist: {
    base: {
      dir: './dist'
    },
    libs: {
      dir: './dist/assets/libs'
    }
  },
  build: {
    dir: './build'
  },
  src: {
    base: {
      dir: './src',
      files: './src/**/*'
    },
    css: {
      dir: './src/assets/css',
      files: './src/assets/css/**/*'
    },
    html: {
      dir: './src',
      files: './src/**/*.html'
    },
    img: {
      dir: './src/assets/img',
      files: './src/assets/img/**/*'
    },
    js: {
      dir: './src/assets/js',
      files: './src/assets/js/**/*'
    },
    partials: {
      dir: './src/partials',
      files: './src/partials/**/*'
    },
    scss: {
      dir: './src/assets/scss',
      files: './src/assets/scss/**/*',
      main: './src/assets/scss/*.scss'
    },
    tmp: {
      dir: './src/.tmp',
      files: './src/.tmp/**/*'
    }
  }
};

//
// Tasks ===================================
//

gulp.task('browsersync', callback => {
  browsersync.init({
    server: {
      baseDir: [paths.src.tmp.dir, paths.src.base.dir, paths.base.base.dir]
    }
  });
  callback();
});

gulp.task('browsersyncReload', callback => {
  browsersync.reload();
  callback();
});

gulp.task('watch', () => {
  gulp.watch([paths.src.scss.files, paths.src.html.files], gulp.series('scss', 'browsersyncReload'));
  gulp.watch([paths.src.js.files, paths.src.img.files], gulp.series('browsersyncReload'));
  gulp.watch([paths.src.html.files, paths.src.partials.files], gulp.series('fileinclude', 'browsersyncReload'));
});

gulp.task('scss', () =>
  gulp
    .src(paths.src.scss.main)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.src.tmp.dir))
    .pipe(postcss([tailwindcss(TAILWIND_CONFIG), require('autoprefixer')]))
    .pipe(concat({ path: 'theme.css' }))
    .pipe(gulp.dest(paths.src.css.dir))
);

gulp.task('fileinclude', () =>
  gulp
    .src([paths.src.html.files, '!' + paths.src.tmp.files, '!' + paths.src.partials.files])
    .pipe(
      fileinclude({
        prefix: '@@',
        basepath: '@file',
        indent: true
      })
    )
    .pipe(cached())
    .pipe(gulp.dest(paths.src.tmp.dir))
);

gulp.task('clean:tmp', callback => {
  del.sync(paths.src.tmp.dir);
  callback();
});

gulp.task('clean:dist', callback => {
  del.sync(paths.dist.base.dir);
  callback();
});

gulp.task('copy:all', () =>
  gulp
    .src([
      paths.src.base.files,
      '!' + paths.src.partials.dir,
      '!' + paths.src.partials.files,
      '!' + paths.src.scss.dir,
      '!' + paths.src.scss.files,
      '!' + paths.src.tmp.dir,
      '!' + paths.src.tmp.files,
      '!' + paths.src.js.dir,
      '!' + paths.src.js.files,
      '!' + paths.src.css.dir,
      '!' + paths.src.css.files,
      '!' + paths.src.html.files
    ])
    .pipe(gulp.dest(paths.dist.base.dir))
);

gulp.task('copy:libs', () => gulp.src(npmdist(), { base: paths.base.node.dir }).pipe(gulp.dest(paths.dist.libs.dir)));

gulp.task('html', () =>
  gulp
    .src([paths.src.html.files, '!' + paths.src.tmp.files, '!' + paths.src.partials.files])
    .pipe(
      fileinclude({
        prefix: '@@',
        basepath: '@file',
        indent: true
      })
    )
    .pipe(replace(/href="(.{0,10})node_modules/g, 'href="$1assets/libs'))
    .pipe(replace(/src="(.{0,10})node_modules/g, 'src="$1assets/libs'))
    .pipe(useref())
    .pipe(cached())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', cleancss()))
    .pipe(gulp.dest(paths.dist.base.dir))
);

gulp.task('build', gulp.series(gulp.parallel('clean:tmp', 'clean:dist', 'copy:all', 'copy:libs'), 'scss', 'html'));

gulp.task('default', gulp.series(gulp.parallel('fileinclude', 'scss'), gulp.parallel('browsersync', 'watch')));
