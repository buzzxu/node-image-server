const _ = require('lodash')
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

/**
 * 写图片
 * @param files      文件
 * @param params    参数 folder
 * @returns {Promise<*>}
 */
exports.write = async (files,params)=> {
    if(_.isArray(files) && files.length >1){
        if(params && params.gif && params.gif === true){
            //合并多张图片
        }else{
            //多张图片写入
        }
        return ''
    }else{
        let file = files[0]
        if (!$util.isSupportCT(file.type)){
            throw new JsonError( 406,`不支持${file.type}上传`)
        }else{
            let ext = _.toLower(file.name.substring(file.name.length,file.name.indexOf('.')+1))
            if(!_.isNil(params.webp)){
                ext = 'webp'
            }
            let pathArgs = params.folder.replace(/\n/g, '')
            if (pathArgs)
                pathArgs = pathArgs.substr(1).split('/')
            else
                pathArgs = ['']
            createDir(pathArgs)
            pathArgs.push('')
            let filePath = createPath(pathArgs, ext)
            // config.contentType.
            await gmWrite(file.path,filePath)
            return util.format('/%s.%s', pathArgs.join('/'), ext)
        }
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
exports.send = async (params,folders, filename,fileExt)=>{
    if(!fileExt){
        fileExt = path.extname(filename).substr(1)
    }
    if(!config.contentType.has(fileExt)){
        let error = new Error(`不支持的${fileExt}`)
        error.code = 406
        throw error
    }else{
        folders.push(filename)
        let targetPath = getUploadDir(path.join.apply(path,folders))
        let exists = fs.existsSync(targetPath)
        if(exists){
            let size = params.size
            let $gm = gm(targetPath).strip()
            if(_.isNil(params.w) || _.isNil(params.h)){
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
                let width = _.toInteger($size[0]);
                let height = _.toNumber($size[1]);
                if(_.isNaN(height) ){
                    height = null;
                }
                if (!_.isNil(tag)){
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
            if(!_.isNil(params.quality)){
                var quality = _.toNumber(params.quality);
                if (quality > 0 || quality <= 100){
                    $gm.quality(quality)
                }
            }
            if(!_.isNil(params.line)){
                $gm.interlace('Line')
            }
            if(params.format){
                fileExt = params.format
            }
            let buffer = await gmBuffer($gm,fileExt)
            return {buffer:buffer,contextType:config.contentType.get(fileExt)}
        }else{
            throw new ImageError(404)
        }
    }
}

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
 *
 * @param source
 * @param target
 * @returns {Promise<any>}
 */
const gmWrite = (source,target)=> {
    return new Promise((resolve, reject)=>{
        gm(source).write(target, error=>{
            if (error){
                reject(error)
            }else{
                fse.remove(source).then(resolve(target)).catch(reject)
            }
        });
    })
}

/**
 * 删除文件
 * @param file
 * @returns {Promise<boolean>}
 */
exports.deleteFile = async (file)=>{
    let $file = getUploadDir(file)
    if(fs.existsSync($file)){
        try{
            await fse.remove($file)
            return true
        }catch (err){
            throw err
        }
    }else{
        let error = new Error('此文件不存在')
        error.code = 404
        throw error
    }
}

exports.sendDefault =  ()=>{
    return  fs.createReadStream(config.DIR_UPLOAD+'/'+config.defaultImg)
}


