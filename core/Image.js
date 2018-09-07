module.exports = class Upload {


    static check(params){

    }
    /**
     * 写图片
     * @param files      文件
     * @param params    参数 folder
     * @returns {Promise<*>}
     */
    static write(files,params){

    }

    /**
     * 发送文件
     * @param params     设置参数
     * @param folders    文件目录 Array
     * @param filename   文件名
     * @param fileExt    文件扩展名
     * @returns {Promise<{buffer: *, ext: *}>}
     */
    static send(ctx,params,folders, filename,fileExt){

    }


    /**
     * 删除文件
     * @param params 参数
     * @param file  文件路径
     */
    static delete(params,file){

    }
}