var gulp = require('gulp');
const { series, src, dest, watch } = require('gulp');
var exec = require('child_process').exec;
var gulpSequence = require('gulp-sequence')
var argv = require('minimist')(process.argv.slice(2));
//RUN  npm run build   打包命令(按照你项目的打包命令配置)
// gulp.task('build',function (cb) {
//   exec('npm run build', function (err, stdout, stderr) {
//     cb(err);
//   });
// });
function build (cb) {
  exec('npm run build', function (err, stdout, stderr) {
    cb(err);
  });
}

// cmd back 返回上一层
function back (cb) {
  exec('cd ..', function (err, stdout, stderr) {
    cb(err);
  });
}

// add   等同于执行 git add * 命令(具体可以自己配置,如 add -A或者add .)
function add (cb) {
  exec('git add .', function (err, stdout, stderr) {
    cb(err);
  });
}


// push  执行git push 操作
function push (cb) {
  exec('git push', function (err, stdout, stderr) {
    cb(err);
  });
}

// pull  执行git pull 操作
function pull (cb) {
  exec('git pull', function (err, stdout, stderr) {
    cb(err);
  });
}

// commit   附加自定义commit的push操作
var commitdefault = 's'
function commit (cb) {
  if (!argv.a) {
    commitcon = commitdefault
  } else {
    var commitcon = argv.a
  }
  console.log('commit', commitcon)
  exec('git commit -m ' + commitcon, function (err, stdout, stderr) {
    cb(err);
  });
}

function defaultTask (cb) {
  console.log("gulp配置成功");
  cb();
}

function commits (cb) {
  if (!argv.m) {
    commitcon = ''
  } else {
    var commitcon = argv.m
  }
  console.log('commit', commitcon, typeof (commitcon), JSON.stringify(argv))
  // exec('git commit -m ' + commitcon, function (err, stdout, stderr) {
  //   cb(err);
  // });
}

exports.pull = pull;
exports.add = add;
exports.commit = commit;
exports.push = push;

exports.commits = commits;

exports.default = series(defaultTask, add, commit, push);
//**********************具体使用命令*****************************

// //  默认  gulp 命令推送到仓库  (如需自定义 commit  执行  gulp -a 自定义commit)
// gulp.task('default', gulpSequence('add', 'commit', 'push'));

// //    gulp b 命令执行build打包，并且推送到仓库 (如需自定义 commit  执行  gulp b -a 自定义commit)
// gulp.task('b', gulpSequence('build', 'add', 'commit', 'push'));

// //    gulp p 命令更新远程仓库
// gulp.task('p', gulpSequence('pull'));