'use strict'
const _ = require('lodash')
const router = require('koa-router')({
    prefix:'/images'
})
const jwt = require('koa-jwt')
const path = require('path')
const core = require('../core/index')
const config = require('../core/config')
const log4js = require('koa-log4')
const logger = log4js.getLogger('image')
const util = require('../core/util')
const ImageError = require('../core/errors/ImageError')
const JsonError = require('../core/errors/JsonError')
/**
 * 上传
 */
router.post('/upload',jwt(config.jwt),async (ctx, next) => {
    let fields = ctx.request.fields
    let files = ctx.request.files
    let base64 = fields.base64
    if(files.length == 0 && _.isUndefined(base64)){
        ctx.body = { success: false,message:'无法在请求中获取图片',code:400}
    }else{
        try {
            if(_.isEmpty(fields.folder)){
                throw new JsonError(400,'必须传入图片文件夹')
            }
            for(let file of files){
                if(!util.ifImage(file.path)){
                    throw new JsonError(400,`${file.name}不是图片,请确认之后再上传`)
                }
            }
            let path = await core.IMAGE.write(files,fields)
            logger.info('Upload success,path:',path)
            ctx.body = { success: true, file: path,code:200}
        }catch (err){
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
               throw new JsonError(500,err.message);
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