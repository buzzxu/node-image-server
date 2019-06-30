const config = require('./config')
const path = require('path')
const uuidv4 = require('uuid/v4')
const Duplex = require('stream').Duplex
const fs = require('fs')
//是否支持图片
module.exports.isSupportCT = (val) =>{
    for (let value of config.contentType.values()) {
        if(value === val){
            return true
        }
    }
    return false
}

/**
 * 生成图片
 * @param val
 * @returns {string|void|never}
 */
module.exports.genName = () =>{
    return uuidv4().replace(/-/g, '')
}
module.exports.pathName = (folder,file)=>{
    return path.format({dir:folder,name:this.genName(),ext:path.extname(file.name)})
}
/**
 * base64编码转图片
 * @param base64
 * @returns {File}
 */
module.exports.base64ToStream = (base64) =>{
    let data = this.base64Info(base64)
    let buffer = Buffer.from(data.base64, 'base64')
    let stream = new Duplex()
    stream.push(buffer)
    stream.push(null)
    return {
        extname:data.extname,
        data: stream
    };
}

module.exports.base64Info = (base64) =>{
    let reg = /^data:image\/([\w+]+);base64,([\s\S]+)/;
    let match = base64.match(reg);
    let baseType = {
        jpeg: 'jpg'
    };
    baseType['svg+xml'] = 'svg'
    if (!match) {
        throw new Error('image base64 data error');
    }
    let extname = baseType[match[1]] ? baseType[match[1]] : match[1];
    return {
        extname: '.' + extname,
        base64: match[2]
    };
}

/**
 * 是否是图片
 * @param path
 * @returns {boolean}
 */
module.exports.ifImage = (path)=>{
    let buffer = new Buffer(8)
    let fd = fs.openSync(path, 'r')
    fs.readSync(fd, buffer, 0, 8, 0)
    let newBuf = buffer.slice(0, 4)
    let head_1 = newBuf[0].toString(16)
    let head_2 = newBuf[1].toString(16)
    let head_3 = newBuf[2].toString(16)
    let head_4 = newBuf[3].toString(16)
    let typeCode = head_1 + head_2 + head_3 + head_4
    let flag = false
    switch (typeCode){
        case 'ffd8ffe1': //jpg
        case '47494638': //gif
        case '89504e47': //png
        case '52494646': //webp
        case '57415645': //wav
        case '41564920': //avi
        case '000001ba': //mpg
        case '000001b3': //mpg
        case '2e524d46': //Real Media (rm)
            flag =  true
            break
        default:
            flag = false
            break
    }
    fs.closeSync(fd);
    return flag
}