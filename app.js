var createError = require('http-errors');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
let logger = require('./core/logger');
let ImageError = require('./core/errors/ImageError');
let JsonEror = require('./core/errors/JsonError');
var app = express();

process.app = app;

require('./config/config').choose(__dirname);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger.express);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/images',express.static(path.join(__dirname, 'public')));
app.use('/images/index', require('./routes/index'));
app.use('/images', require('./routes/picture'));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    if(err instanceof ImageError || err instanceof JsonEror){
        err.render(res);
    }else{
        if (err.name === 'UnauthorizedError') {
            res.status(401).send('invalid token...');
        }else{
            // render the error page
            res.status(err.status || 500);
            res.render('error');
        }
    }

});


module.exports = app;
