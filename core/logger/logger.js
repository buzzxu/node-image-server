const log4js = require('koa-log4')
const path = require('path');
log4js.configure(path.resolve(__dirname,'log4j.json'));


module.exports ={
        default: log4js.getLogger('default'),
        image: log4js.getLogger('image'),
        error: log4js.getLogger('error'),
        koa:log4js.koaLogger(log4js.getLogger('default'), { level: 'INFO' }),
    
};
