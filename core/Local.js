'use strict'
const Image = require('./Image')
const _ = require('lodash')
const etag = require('etag')
const util = require('util')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const fse = require('fs-extra')
const gm = require('gm').subClass({imageMagick: true})
const config = require('./config')
const $util = require('./util')
const ImageError = require('./errors/ImageError')
const JsonError = require('./errors/JsonError')
const resizeTag = ['!',"%",'^','>','<']
const Redis = require('ioredis')
const redis = new Redis({
    host: config.redis.host,
    port:config.redis.port,
    password: config.redis.password != 'xux' ? config.redis.password : null,
    db:config.redis.db
})
/**
 * 本地存储
 * @type {module.Local}
 */
module.exports = class Local extends Image{

    KEY_NOTFOUND = "notfound"

    constructor(...args){
        super(...args)
    }

    /**
     * 检查
     * @param uploadDir
     */
    check(uploadDir){
        if( _.isNull( config.DIR_UPLOAD)){
            config.DIR_UPLOAD = uploadDir
        }else {
            if(!fs.existsSync(config.DIR_UPLOAD)){
                mkdirp(config.DIR_UPLOAD)
            }
        }
    }


    /**
     * 写图片
     * @param files      文件
     * @param params    参数 folder
     * @returns {Promise<*>}
     */
    async write(files,params){
        let pathArgs = params.folder.replace(/\n/g, '')
        if (pathArgs) {
            pathArgs = pathArgs.substr(1).split('/')
        }
        else{
            pathArgs = ['']
        }
        createDir(pathArgs)
        pathArgs.push('')

        if(_.isArray(files) && files.length >1){
            if(!_.isEmpty(params.gif)){
                return await image2Gif(params,pathArgs,files)
            }else{
                //多张图片写入
                let paths = new Array()
                for(let file of files){
                    paths.push(await this.writeImage(pathArgs,file,params))
                }
                return paths
            }
        }else{
            return this.writeImage(pathArgs,files[0],params)
        }
    }


    /**
     * 单张图片上传
     * @param paths
     * @param file
     * @param params
     * @returns {Promise<string|*>}
     */
    async writeImage(paths,file,params){
        if(_.isArray(file)) throw new JsonError(500,"当前function只接受单个file")
        if (!$util.isSupportCT(file.type)){
            throw new JsonError( 406,`不支持${file.type}上传`)
        }else{
            let ext = _.toLower(file.name.substring(file.name.length,file.name.indexOf('.')+1))
            if(!_.isNil(params.webp) && _.isEqual(params.webp,"convert")){
                //转换为webp格式
                ext = 'webp'
            }
            let filePath = createNewImage(paths, ext)
            // config.contentType.
            await gmWrite(file.path,filePath,true)
            let result = util.format('/%s.%s', paths.join('/'), ext)
            if(!_.isNil(params.webp) && _.isEqual(params.webp,"add")){
                //多生成一张webp格式
                let filePath = createNewImage(paths, "webp",false)
                await gmWrite(file.path,filePath,false)
            }

            return result
        }
    }

    /**
     * 发送文件
     * @param params     设置参数
     * @param folders    文件目录 Array
     * @param filename   文件名
     * @param fileExt    文件扩展名
     * @returns {Promise<{buffer: *, ext: *}>}
     */
    async send(ctx,params,folders, filename,fileExt){
        if(!fileExt){
            fileExt = path.extname(filename).substr(1)
        }
        if(!config.contentType.has(fileExt)){
            let error = new Error(`不支持的${fileExt}`)
            error.code = 406
            throw error
        }else{
            let key = `${folders.join(':')}:${ctx.request.originalUrl}`
            let key$notfound = `${this.KEY_NOTFOUND}:${key}`
            //防止缓存穿透
            if (await redis.exists(key$notfound)) {
                throw new ImageError(404)
            }
            let buffer =  await redis.getBuffer(key)
            if (buffer == null) {
                folders.push(filename)
                let targetPath = getUploadDir(path.join.apply(path,folders))
                let exists = fs.existsSync(targetPath)
                if(exists){
                    let stat = fs.statSync(targetPath)
                    let $etag = etag(stat)
                    ctx.status=200
                    ctx.etag = $etag
                    ctx.lastModified=stat.mtime.toUTCString()
                    if(ctx.fresh){
                        return {status:304}
                    }
                    if(Object.keys(params).length === 0){
                        //此处返回的是fs.ReadStream
                        buffer = await $util.streamToBuffer(fs.createReadStream(targetPath,{
                            highWaterMark: 64 * 1024
                        }))
                    } else if(Object.keys(params).length === 1 && !_.isNil(params.base64)){
                        buffer = fs.readFileSync(targetPath)
                    }else{
                        let size = params.size
                        let $gm = gm(targetPath).strip()
                        if(!_.isEmpty(params.w) || ! _.isEmpty(params.h)){
                            $gm.resize(_.toNumber(params.w),_.toNumber(params.h));
                        }else if(!_.isEmpty(size)){
                            let tag = size.charAt(size.length-1);
                            let $size
                            if(_.includes(resizeTag,tag)){
                                $size = _.split(size.substr(0,size.length-1),'*',2)
                            }else{
                                tag = undefined
                                $size = _.split(size,'*',2)
                            }
                            let width,height
                            if(_.isEmpty($size[0])){
                                width = null
                            }else{
                                width = _.toInteger($size[0]);
                            }
                            if(_.isEmpty($size[1])){
                                height = null
                            }else{
                                height = _.toInteger($size[1]);
                            }
                            if (!_.isEmpty(tag)){
                                // ! 表示强制width/height, resize(70, 70, '%')表示输出图片尺寸70x70，图片可能变形 即不考虑原始图宽高的比例
                                // % 表示强制width/height, resize(70, 70, '%')表示输出图片尺寸70x70，图片可能变形 即不考虑原始图宽高的比例
                                // ^ 表示最小width/height, resize(70,70,'^')表示width/height最小不能小于70px
                                // > 表示只有源图片的width or height超过指定的width/height时，图片尺寸才会变。
                                // < 表示只有源图片的width or height小于指定的width/height时，图片尺寸才会变
                                $gm.resize(width, height,tag);
                            }else{
                                $gm.resize(width, height);
                            }
                        }
                        if(!_.isEmpty(params.quality)){
                            var quality = _.toInteger(params.quality);
                            if (quality > 0 && quality <= 100){
                                $gm.quality(quality)
                            }
                        }
                        if(!_.isNil(params.line)){
                            $gm.interlace('Line')
                        }
                        if(!_.isNil(params.webp)){
                            fileExt = 'webp'
                        }
                        if(!_.isEmpty(params.format)){
                            if(config.contentType.has(params.format)){
                                fileExt = params.format
                            }else{
                                throw new ImageError(406)
                            }
                        }
                        buffer = await gmBuffer($gm,fileExt)
                    }
                    await redis.set(key,buffer,'EX',config.redis.expire)
                }else{
                    await redis.set(key$notfound,null,'EX',86400) //图片已经删除的需要做处理
                    throw new ImageError(404)
                }
            }
            /*else{
                redis.expire(key,config.redis.expire)
            }*/
            if(!_.isNil(params.base64)){
                return {status:200,buffer:buffer.toString("base64"),contextType:'text/plan'}
            }
            return {status:200,buffer:buffer,contextType:config.contentType.get(fileExt)}
        }
    }

    /**
     *  删除文件
     * @param params
     * @param file
     * @returns {Promise<boolean>}
     */
    async delete(params,files){
        if(_.isArray(files) && files.length > 0){
            for(let file of files){
                await this.$delete(params,file)
            }
            return true
        }else {
            return await this.$delete(params,files)
        }
    }


    async $delete(params,file){
        let $file = getUploadDir(file)
        if(fs.existsSync($file)){
            try{
                await fse.remove($file)
                //如果需要删除web格式的文件
                if(_.has(params,'webp')){
                    let ext = path.extname($file).substr(1);
                    let dir = path.dirname($file);
                    let fileName = path.basename($file,ext);
                    let webpFile = path.join(dir,fileName+"webp");
                    if(fs.existsSync(webpFile)){
                        await fse.remove(webpFile)
                    }
                }
                return true
            }catch (err){
                throw new JsonError(500,err.message)
            }
        }else{
            throw new JsonError(404,'图片地址有误或此图片已被删除')
        }
    }
}
/**
 * 多张图片转gif
 * @param params    参数
 * @param pathArgs  目录
 * @param files     文件
 * @returns {Promise<string|*>}
 */
const image2Gif = async (params,pathArgs,files)=>{
    let seconds = _.toInteger(params.gif)
    if(seconds <=0){
        throw new JsonError(400,'gif value must > 0')
    }
    //合并多张图片
    let $gm = gm().in('-delay',seconds)
    if(!_.isEmpty(params.loop)){
        let loop = _.toInteger(params.loop)
        if(loop <=0){
            throw new JsonError(400,'loop value must > 0')
        }
        $gm.in('-loop',loop)
    }

    let filePath = createNewImage(pathArgs, "gif")
    await gmMoreWrite($gm,files,filePath,true)
    return util.format('/%s.%s', pathArgs.join('/'), 'gif')
}

/**
 * 获取buffer
 * @param gm
 * @param fileExt
 * @returns {Promise<any>}
 */
const gmBuffer = (gm,fileExt)=> {
    return new Promise((resolve, reject) => {
        gm.autoOrient().sharpen(3).toBuffer(fileExt,(err, buffer)=> {
            if (err){
                reject(err)
            }else{
                resolve(buffer)
            }
        })
    })
}
/**
 * 生成一个文件
 * @param source
 * @param target
 * @param isDel
 * @returns {Promise<any>}
 */
const gmWrite = (source,target,isDel)=> {
    return new Promise((resolve, reject)=>{
        gm(source).write(target, error=>{
            if (error){
                reject(error)
            }else{
                if(!_.isEmpty(isDel) && isDel){
                    fse.remove(source).then(resolve(target)).catch(reject)
                }else{
                    resolve(target)
                }

            }
        });
    })
}
/**
 * 删除多个图片
 * @param gm
 * @param files
 * @param target
 * @param isDel
 * @returns {Promise<any>}
 */
const gmMoreWrite = ($gm,files,target,isDel)=>{
    return new Promise((resolve, reject) => {
        for(let file of files){
            $gm.in(file.path)
        }
        $gm.write(target, error=>{
            if (error){
                reject(error)
            }else{
                if(!_.isEmpty(isDel) && isDel){
                    for(let file of files){
                        fse.removeSync(file.path)
                    }
                }
                resolve(target)
            }
        });
    })
}
const getUploadDir = (filename)=> {
    return path.join(config.DIR_UPLOAD, filename || config.defaultImg)
}

const base64_encode = (file) =>{
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

const createDir=(pathArgs)=> {
    if (pathArgs[0]) {
        var dir = path.join(config.DIR_UPLOAD, path.join.apply(path, pathArgs))
        var exists = fs.existsSync(dir);
        if (!exists)
        // fs.mkdirSync(dir)
            mkdirp(dir)
    }
}
/**
 * 创建新文件路
 * @param pathArgs
 * @param ext
 * @param change    是否改变文件名
 * @returns {string}
 */
const createNewImage =(pathArgs, ext,change)=> {
    let args = [config.DIR_UPLOAD]
    let filePath
    if(_.isNil(change) || change){
        pathArgs[pathArgs.length - 1] = $util.genName()
    }
    args.push.apply(args, pathArgs)
    filePath = path.join.apply(path, args) + '.' + ext
    return fs.existsSync(filePath) ? createNewImage(pathArgs, ext,change) : filePath
}