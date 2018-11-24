const config = require('./config')

//是否支持图片
module.exports.isSupportCT = (val) =>{
    for (let value of config.contentType.values()) {
        if(value === val){
            return true
        }
    }
    return false
}