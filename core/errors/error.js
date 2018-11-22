const HtmlError = require('./HtmlError')
const ImageError = require('./ImageError')
const JsonError = require('./JsonError')
const log4js = require('koa-log4')
const logger = log4js.getLogger('error')

module.exports =  (err,ctx)=>{
    if(err instanceof ImageError){
        err.render(ctx)
    }else if(err instanceof JsonError){
        err.render(ctx)
    }else if(err instanceof HtmlError){
        err.render(ctx)
    }else{
        logger.error('server error', err, ctx)
    }
}

module.exports.errorHandler = async (ctx, next) => {
    try {
        await next().catch((err) => {
            if (401 == err.status) {
                ctx.status = 401;
                ctx.body = '验证失败，服务器拒绝响应'
            } else {
                logger.error(err)
                throw err;
            }
        })
    } catch (err) {
        ctx.app.emit('error', err, ctx)
    }
}