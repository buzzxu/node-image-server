const Image = require('./Image')
const _ = require('lodash')
const OSS = require('ali-oss')
const config = require('./config')
const util = require('./util')
const fs = require('fs');
const url = require('url')
const store = OSS(config.oss)
module.exports = class Aliyun extends Image{

    constructor(...args){
        super(...args)
    }

    /**
     * 上传图片
     * @param files
     * @param params
     * @returns {Promise<any[]|*>}
     */
    async write(files,params){
        let folder = params.folder;
        folder = folder.startsWith("/") ? folder.substring(1,folder.length) : folder
        //base64 编码转 file
        if(files.length == 0 && !_.isUndefined(params.base64) && !_.isEmpty(params.base64)){
            let base64 = util.base64ToStream(params.base64)
            return await this.putStream(util.pathName(folder,util.genName(),base64.extname),base64.data)
        }
        if(files.length >1){
            let paths = new Array()
            for(let file of files){
                paths.push(await this.putStream(util.pathName(folder,file),fs.createReadStream(file.path)))
            }
            return paths
        }else{
            return await this.putStream(util.pathName(folder,files[0]),fs.createReadStream(files[0].path))
        }
        throw new JsonError(400,'参数有误,上传图片失败')
    }

    /**
     * 流式上传
     * @param objectName
     * @param stream
     * @returns {Promise<*>}
     */
    async putStream(objectName,stream){
        let result = await store.putStream(objectName, stream);
        if(result.res.statusCode == 200){
            return result.url
        }else{
            throw new JsonError(result.res.status,result.res.statusMessage)
        }
    }


    /**
     * 删除
     * @param params
     * @param files
     * @returns {Promise<*>}
     */
    async delete(params,files){
        if(_.isArray(files) && files.length > 0){
            let objectNames = []
            for(let file of files){
                let pathname = url.parse(file).pathname
                objectNames.push(pathname.startsWith("/") ? pathname.substring(1,pathname.length) : pathname)
            }
            return store.deleteMulti(objectNames)
        }else{
            let pathname = url.parse(files).pathname
            let objectName = pathname.startsWith("/") ? pathname.substring(1,pathname.length) : pathname
            store.get(objectName).then((result) => {
                if (result.res.status == 200) {
                    return this.deleteObject(objectName)
                }
            }).catch((e)=> {
                if (e.code == 'NoSuchKey') {
                    throw new JsonError(404,'图片地址有误或此图片已被删除')
                }
            })
        }

    }

    async deleteObject(objectName){
        try {
            let result =  await store.delete(objectName)
            return result
        }catch (err) {
            throw new JsonError(500,err.message)
        }

    }

}