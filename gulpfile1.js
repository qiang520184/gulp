var gulp = require("gulp");
var GulpSSH = require("gulp-ssh");
var config = require("./gulpConfig").ssh;
// 需要上传到服务器的路径
const staticPath = "/usr/share/xxxx/xxxxx";

var gulpTestSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: config.test,
});

var gulpProdSSH = new GulpSSH({
  ignoreErrors: false,
  sshConfig: config.prod,
});

// 删除test服务器上现有文件...
gulp.task("cleanTest", function () {
  return gulpTestSSH.shell(`rm -rf ${staticPath}`);
});

// 删除prod服务器上现有文件...
gulp.task("cleanProd", function () {
  return gulpProdSSH.shell(`rm -rf ${staticPath}`);
});

// dist 上传文件到test服务器
gulp.task(
  "push-to-test",
  gulp.series("cleanTest", function () {
    return gulp.src(["./dist/**"]).pipe(gulpTestSSH.dest(staticPath));
  })
);

//上传到prod服务器
gulp.task(
  "push-to-prod",
  gulp.series("cleanProd", function () {
    return gulp.src(["./dist/**"]).pipe(gulpProdSSH.dest(staticPath));
  })
);

gulp.task(
  "toTest",
  gulp.series("push-to-test", done => {
    console.log("upload done!");
    done();
  })
);

gulp.task(
  "default",
  gulp.series("push-to-prod", done => {
    console.log("upload done!");
    done();
  })
);