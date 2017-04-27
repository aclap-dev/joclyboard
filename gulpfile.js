var gulp = require('gulp');
var jison = require('gulp-jison');

gulp.task("build-pjn-parser",()=>{
    return gulp.src('./pjn-parser/*.jison')
        .pipe(jison({ moduleType: 'commonjs' }))
        .pipe(gulp.dest('./app/'));
});




