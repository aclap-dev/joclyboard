var gulp = require('gulp');
var jison = require('gulp-jison');
var insert = require('gulp-insert');

gulp.task("build-pjn-parser",()=>{
    return gulp.src('./pjn-parser/*.jison')
        .pipe(jison({ moduleType: 'commonjs' }))
		.pipe(insert.prepend('// jshint ignore: start\n'))
        .pipe(gulp.dest('./app/'));
});




