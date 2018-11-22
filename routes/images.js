'use strict'
const _ = require('lodash')
const router = require('koa-router')({
    prefix:'/images'
})
const jwt = require('koa-jwt')
const path = require('path')
const moment = require('moment')
const core = require('../core/index')
const config = require('../core/config')
const log4js = require('koa-log4')
const logger = log4js.getLogger('image')
const ImageError = require('../core/errors/ImageError')
const JsonError = require('../core/errors/JsonError')
/**
 * 上传
 */
router.post('/upload',jwt(config.jwt),async (ctx, next) => {
    let files = ctx.request.files
    let fields = ctx.request.fields
    if(!files){
        ctx.body = { success: false,message:'no file' }
    }else{
        try {
            let path = await core.IMAGE.write(files,fields)
            ctx.body = { success: true, file: path }
        }catch (err){
            logger.error.error(err.message)
            if(err instanceof JsonError){
                err.render(ctx)
            }else{
                throw new JsonError(500,err.message);
            }
        }

    }

})

/**
 * 删除文件
 */
router.delete('/delete',jwt(config.jwt),async (ctx)=>{
    let file = ctx.query.file
    if (file){
        try{
            ctx.body = { success: await core.IMAGE.delete(ctx.query,file) }
        }catch (err){
           if(err instanceof JsonError){
               err.render(ctx)
           }else{
               throw new JsonError(err.message);
           }
        }
    }else{
        ctx.body = { success: false,message:'请输入删除的文件路径' }
    }

})
/**
 * 无目录
 */
router.get('/:filename',async (ctx)=>{
    await sendImage(ctx,[])
})
/**
 * 多目录
 */
router.get('/:folder+/:filename',async (ctx)=>{
    let folders = _.split(ctx.params.folder,'/')
    await sendImage(ctx,folders)
})

const sendImage = async (ctx,folder)=>{
    let fileExt = path.extname(ctx.params.filename).substr(1)
    try{

        let result = await core.IMAGE.send(ctx,ctx.query,folder,ctx.params.filename,fileExt)
        if(result.status==304){
            ctx.status = 304
            ctx.body = null
            return null
        }
        ctx.set('Cache-Control',`public,max-age=${config.maxAge}`)
        // ctx.set('Expires',moment().add(config.maxAge,'seconds').toDate().toUTCString())
        ctx.set('Vary','Accept-Encoding')
        ctx.type = result.contextType
        ctx.body = result.buffer
    }catch (err){
        if(err instanceof ImageError){
            err.render(ctx);
        }else{
            throw err;
        }

    }

}


module.exports = router