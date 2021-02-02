// gulp中提供了文件读取流（src），写入流（dest），parallel（多任务同时执行），series（多任务按顺序进行），watch（监听文件变化）
const { src, dest, parallel, series, watch } = require('gulp')

// 这里的del不是gulp插件
const del = require('del')

// 这里的browserSync不是gulp插件
const browserSync = require('browser-sync')

// 解构出stream，用于刷新页面
const { stream } = require('browser-sync')

// 自动引入所有gulp插件
const loadPlugins = require('gulp-load-plugins')

// loadPlugins()返回一个对象，对应的插件可以使用plugins.name去使用
const plugins = loadPlugins()

const bs = browserSync.create()

// 当前命令行运行的目录
const cwd = process.cwd()

// 默认配置，用户可以根据在项目下创建pages.config.js文件来覆盖此默认配置
let config = {
  // default config
  build: {
    src: 'src', // 开发时候下的目录
    dist: 'dist', // 部署时候打包的文件夹名称
    temp: 'temp', // 开发时候打包的文件夹名称
    public: 'public', //公共文件
    // src文件夹下的路径
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
}

// 读取用户的pages.config.js（如果有的情况下），覆盖掉原来的默认配置
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) { }

//删除文件任务，一般打包上线前，删除原来的dist目录或者其它文件夹再打包。
const clean = () => {
  return del([config.build.dist, config.build.temp])
}

// 处理sass文件任务
const style = () => {
  // src第二参数中传入一个对象，对象中设置base键值，表示保留这个值后面的目录
  // 也就是说会自动创建assets文件夹，styles文件夹
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    //sass默认会忽略掉带_的scss文件，这是因为sass认为这些scss文件已经在其它的
    //scss文件中被引入了。
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(dest(config.build.temp))
    // bs.reload()其实不是读写流，但是可以设置stream参数为true让它把文件按流的
    // 方式推到浏览器
    .pipe(bs.reload({ stream: true }))
}

// 处理Js文件
const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
    // babel()这是帮助唤醒babel/core中的转换过程，没有像gulp-sass一样
    // 自动安装node-sass转换模块,所以要手动安装 @babel/core(核心转换模块)
    // 以及@babel/preset-env(ECMAScript所以新特性都会做转换)
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

//处理html文件
const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    // 项目中的html使用模板编写的，模板中有的地方要填写数据
    // 这里用data去模拟数据
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

// 处理照片
const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 字体文件中可能有svg，所以同样使用imagemin压缩
const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

// 复制其他文件（publish目录下的文件）
const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

// 开启一个开发服务器
const serve = () => {
  // 使用watch监听文件的变化，一旦变化就执行相应的任务，重新编译。
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)

  // 我们同样也希望在图片，字体等目录文件变化时，页面也能实时刷新
  // bs.reload就是用来刷新浏览器。
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    // 打开浏览器的时候右上角有连接成功的提示，这里false去掉
    notify: false,
    // 设置端口
    port: 2080,
    // 设置是否默认打开浏览器
    // open: false,
    //监听变化的目录，如果不使用这种方法，可以在watch的目录所执行的任务后面加一个ba.reload（）
    // files: 'dist',
    // 开启服务的文件夹
    server: {
      // 上面watch没有监听字体以及图片的信息，是因为在开发阶段，请求（imagemin）处理过后的
      // 图片字体没有很大意义。在下面baseDir中在设置对应的目录，如果请求到字体
      // 图片的时候，这个web服务在下面baseDir数组里面，从前往后找。数组的每一项代表一个目录。
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

// useref这个插件主要用于把第三方库的文件根据构建注释，打包到注释中的文件下。
// 下面的例子是未使用useref，打包后出现的情况：多个第三库不能合并到一个文件夹中，浪费空间。
// useref会根据注释中的路径，把两个script标签中引入的第三方库统一放到assets/scripts/vendor.js下面
// <!-- build:js assets/scripts/vendor.js -->
// <script src="/node_modules/jquery/dist/jquery.js"></script>
// <script src="/node_modules/popper.js/dist/umd/popper.js"></script>
// <!-- endbuild -->
const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // 这里要判断多个文件，所以要引入gulp-if插件
    // 这里的操作是压缩js，css，html文件
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true, // 压缩行内样式
      minifyJS: true, // 压缩html中 script标签的代码
    })))
    .pipe(dest(config.build.dist))
}

// 编译任务：因为style, script, page三个任务没有关联，所以使用parallel
const compile = parallel(script, style, page)

// 先清除文件，然后再执行其它任务。上线之前执行的任务。这里特别要注意的是编译任务必须放在useref的前面。
const build = series(clean, parallel(series(compile, useref), extra, image, font))

// 开发阶段的任务：先编译再开启一个web服务。这里不需要useref任务，因为useref主要是压缩体积，开发时省去这个环节提高打包效率
const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop,
}