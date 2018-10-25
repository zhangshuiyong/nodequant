let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

let index = require('./routes/index');

let app = express();

//启动NodeQuant,绑定请求路由
let NodeQuantApp=require("./NodeQuantApp");
let NodeQuantApplication = new NodeQuantApp(app);
global.NodeQuant = NodeQuantApplication;
global.NodeQuant.Start();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


process.on('uncaughtException',function (err) {
    //打印出错误
    console.log("uncaughtException:");
    //打印出错误的调用栈方便调试
    console.log(err.stack);
});

process.on('exit',function (code) {
    console.log(code);
});

process.on('SIGINT', function() {

    //2秒后程序退出,这两秒需要做程序状态记录
    global.NodeQuant.Exit();

    setTimeout(function () {
        console.log('Got SIGINT.  Press Control-D/Control-C to exit.');
        process.exit();
    },2*1000);

});



module.exports = app;
