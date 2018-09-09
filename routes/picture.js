/**
 * Created by xux on 15-5-8.
 */
var express = require('express');
var router = express.Router();
var _ = require('lodash');
var path = require('path');
var util = require('util');
var uuid = require('uuid-js');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var  fs = require('fs'),mkdirp=require('mkdirp')
    ,   gm = require('gm').subClass({imageMagick: true});
var jwt = require('express-jwt');
var etag = require('etag');
var config = require('../config/config')


//默认路径
/*router.get('/:filename', function (req, res) {

    var filePath = path.join( config.UploadDir, req.params.filename);
    fs.exists(filePath, function (exists) {
        res.sendFile(exists ? filePath : path.join(config.UploadDir, config.default));
    });
});*/
router.get('/:filename',function (req, res) {
     sendFile([], req.params.filename, req,res);
});
//
router.get('/:folder/:filename',  function (req, res) {
     sendFile([req.params.folder], req.params.filename, req,res);
});
//
router.get('/:folder1/:folder2/:filename',  function (req, res) {
     sendFile([req.params.folder1, req.params.folder2], req.params.filename, req,res);
});
router.get('/:folder1/:folder2/:folder3/:filename',  function (req, res) {
     sendFile([req.params.folder1, req.params.folder2,req.params.folder3], req.params.filename, req,res);
});
router.get('/:folder1/:folder2/:folder3/:folder4/:filename', function (req, res) {
     sendFile([req.params.folder1, req.params.folder2,req.params.folder3,req.params.folder4], req.params.filename, req,res);
});

/*
 请求包含如下参数：
 @folder 文件夹,格式:/aa/bb
 */
router.post('/upload',jwt(config.jwt),multipartMiddleware,function (req, res) {
    if(!req.files){
        return res.status(500).send({ success: false,message:'no file' });
    }
    var files = req.files;
    writeFile(files,req,res);

});


/**
 * 删除文件
 */
router.delete('/delete',jwt(config.jwt),function (req,res) {
    if(!req.query.file){
        return res.status(500).send({ success: false,message:'请传入文件路径' });
    }
    deleteFile(req,res);
});

function writeFile(files,request,response) {
    if(_.isEmpty(request.body.folder)){
        response.status(400).json({ success: false, message: '必须传入图片文件夹' });
    }else{
        let pathArgs = request.body.folder.replace(/\n/g, '')
        if (pathArgs) {
            pathArgs = pathArgs.substr(1).split('/')
        }
        else{
            pathArgs = ['']
        }
        createDir(pathArgs)
        pathArgs.push('')
        if(_.isArray(files.file) && files.file.length >1){
            if(!_.isEmpty(request.body.gif)){
                image2Gif(request.body,pathArgs,files.file)
                    .then(path=>{
                        response.json({ success: true, file: path });
                    }).catch(err=>{response.status(err.code).json({ success: false, message: err.message });});
            }else{
                //多张图片写入
                let promise = new Array();
                try{
                    files.file.forEach($file=>{
                        promise.push(writeImage(pathArgs,$file,request.body));
                    });
                    Promise.all(promise)
                        .then(urls=>{
                            response.json({ success: true, file: urls });
                        }).catch(err=>{
                            response.status(err.code).json({ success: false, message: err.message });
                        });
                }catch (e) {
                    response.status(500).json({ success: false, message: e.message });
                }

            }
        }else{
            writeImage(pathArgs,files.file,request.body)
                .then(url=>{
                    response.json({ success: true, file: url });
                }).catch(err=>{
                response.status(err.code).json({ success: false, message: err.message });
            })
        }
    }

}
/**
 * 删除文件
 * @param file
 * @param res
 */
function deleteFile(req,res) {
    var $file = getFilePath(req.query.file);
    if (fs.existsSync($file)){

        fs.unlink($file,function (err) {
            if(err){
                res.status(500).send({success: false, message: err.message,error:err});
            }
            if(_.has(req.query,'webp')){
                var ext = path.extname($file).substr(1);
                var dir = path.dirname($file);
                var fileName = path.basename($file,ext);
                var webpFile = path.join(dir,fileName+"webp");
                if(fs.existsSync(webpFile)){
                    fs.unlink(webpFile,function (err) {
                        if(err){
                            res.status(500).send({success: false, message: err.message,error:err});
                        }
                        res.json({ success: true });
                    });
                }
            }else{
                res.json({ success: true });
            }
        })
    }else{
        res.status(404).send({success:true,message:"图片不存在"});
    }
}
function createDir(pathArgs) {
    if (pathArgs[0]) {
        var dir = path.join(config.UploadDir, path.join.apply(path, pathArgs));
        var exists = fs.existsSync(dir);
        if (!exists)
            mkdirp(dir);
    }
}




/**
 * 单张图片上传
 * @param paths
 * @param file
 * @param params
 * @returns {Promise<any>}
 */
const writeImage = (paths,file,params)=>{
    return new Promise((resolve, reject) => {
        if(_.isArray(file)){
            let err = new Error('当前function只接受单个file');
            err.code = 500;
            reject(err);
        }else{
            let ext = _.toLower(file.name.substring(file.name.length,file.name.indexOf('.')+1))
            if (!(ext && config.contentTypes[ext])){
                let err = new Error('不支持'+ext+'类型文件上传');
                err.code = 406;
                reject(err);
            }else{
                if(!_.isNil(params.webp) && _.isEqual(params.webp,"convert")){
                    //转换为webp格式
                    ext = 'webp'
                }
                let pathArgs = paths.slice();
                let filePath = createNewImagePath(pathArgs, ext);
                gmWrite(file.path,filePath,true)
                    .then($path=>{
                        // let result = util.format('/%s.%s', paths.join('/'), ext);
                        let result = _.replace($path,config.UploadDir,'');
                        if(!_.isNil(params.webp) && _.isEqual(params.webp,"add")){
                            //多生成一张webp格式
                            let filePath = createNewImagePath(pathArgs, "webp",false)

                            gmWrite($path,filePath,false)
                                .then($$path=>{
                                    resolve(result);
                                })
                        }else{
                            resolve(result);
                        }
                    }).catch(e=> reject(e));
            }
        }
    });
}

const resizeTag = ['!',"%",'^','>','<'];

module.exports = router;

function sendFile(folders, filename, req,res,fileExt){
    send(req,res,req.query,folders,filename,fileExt).then(result=>{
        if(result.status == 304){
            res.sendStatus(result.status);
            return;
        }
        res.set('Cache-Control',`max-age=${config.maxAge}`)
        if(result.data instanceof fs.ReadStream){
            result.data.on('data',function (chunk) {
                res.write(chunk);
            });
            result.data.on('end',function () {
                res.end();
            })
        }else {
            result.data.then(function (buffer) {
                res.set('Content-Length', buffer.length);
                if(_.has(req.query.base64)){
                    res.set('Content-Type', 'text/plan');
                    res.send(buffer.toString('base64'));
                }else{
                    res.set('Content-Type', result.contextType);
                    res.send(buffer);
                }

            }).catch(error => {
                res.status(500);
                res.send(error.message);
            })
        }
    }).catch(err=>{
        res.status(err.code).sendFile(getFilePath());
    });
}
const send =  (req,res,params,folders, filename,fileExt)=>{
    return new Promise((resolve, reject) => {
        if(_.isNil(fileExt)){
            fileExt = path.extname(filename).substr(1)
        }
        if (!config.contentTypes[fileExt]){
            let err = new Error();
            err.code = 406
            reject(err)
        }else{
            folders.push(filename);
            var filePath = getFilePath(path.join.apply(path, folders));
            let exists =  fs.existsSync(filePath);
            if(exists){
                let stat = fs.statSync(filePath);
                res.set('Last-Modified',stat.mtime.toUTCString());
                res.set('ETag',etag(stat));
                if(req.fresh){
                    resolve({status:304});
                    return;
                }
                let data;
                if(Object.keys(params).length === 0){
                    data = fs.createReadStream(filePath);
                }else if(Object.keys(params).length === 1 && !_.isNil(params.base64)){
                    data = new Promise($resolve => $resolve(fs.readFileSync(filePath)));
                }else{
                    var size = params.size;
                    var $gm = gm(filePath).strip();
                    var width = 0,height =0;
                    if(!_.isEmpty(params.w) ||! _.isEmpty(params.h)){
                        $gm.resize(params.w,params.h);
                    }else if(!_.isEmpty(size)){
                        var tag = size.charAt(size.length-1);
                        let $size;
                        if(_.includes(resizeTag,tag)){
                            $size = _.split(size.substr(0,size.length-1),'*',2);
                        }else{
                            tag = undefined;
                            $size = _.split(size,'*',2);
                        }
                        let width,height;
                        if(_.isEmpty($size[0])){
                            width = null;
                        }else{
                            width = _.toInteger($size[0]);
                        }
                        if(_.isEmpty($size[1])){
                            height = null;
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
                            $gm.quality(quality);
                        }
                    }
                    if(!_.has(params.line)){
                        $gm.interlace('Line');
                    }
                    if(!_.has(params.webp)){
                        fileExt='webp';
                    }
                    if(params.format){
                        fileExt = params.format;
                    }


                    data =  gmBuffer($gm,fileExt)
                }
                resolve({status:200,data:data,contextType:config.contentTypes[fileExt]});

            }else{
                let err = new Error();
                err.code = 404
                reject(err);
            }

        }

    });

}

const image2Gif = (params,pathArgs,files)=>{
    return new Promise((resolve, reject) => {
        let seconds = _.toInteger(params.gif);
        if(seconds <=0){
            let err = new Error('gif value must > 0');
            err.code = 400;
            reject(err);
        }else{
            //合并多张图片
            let $gm = gm().in('-delay',seconds)
            if(!_.isEmpty(params.loop)){
                let loop = _.toInteger(params.loop)
                if(loop <=0){
                    let err = new Error('loop value must > 0');
                    err.code = 400;
                    reject(err);
                }else{
                    $gm.in('-loop',loop)
                }
            }
            let filePath = createNewImagePath(pathArgs, "gif")
            gmMergeWrite($gm,files,filePath,true)
                .then(path=>{
                    resolve(util.format('/%s.%s', pathArgs.join('/'), 'gif'))
                }).catch(err=> reject(err));
        }
    });
}
/**
 *
 * @param gm
 * @param fileExt
 * @returns {Promise<any>}
 */
const gmBuffer = (gm,fileExt)=> {
    return new Promise((resolve, reject) => {
        gm.autoOrient().sharpen(3).toBuffer(fileExt,(err, buffer)=> {
            if (err){
                reject(err);
            }else{
                resolve(buffer);
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
                    fs.unlinkSync(source);
                }else{
                    resolve(target);
                }

            }
        });
    })
}
/**
 * 生成多个图片
 * @param gm
 * @param files
 * @param target
 * @param isDel     删除源文件
 * @returns {Promise<any>}
 */
const gmMergeWrite = ($gm,files,target,isDel)=>{
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
                        fs.unlinkSync(file.path);
                    }
                }
                resolve(target);
            }
        });
    })
}

/**
 *
 * @param pathArgs
 * @param suffix        文件后缀
 * @param change        是否改变文件名
 * @returns {string|*}
 */
const createNewImagePath =(pathArgs, suffix,change)=> {
    let args = [config.UploadDir]
    let filePath
    if(_.isNil(change) || change){
        pathArgs[pathArgs.length - 1] =uuid.create(1).toString().replace(/-/g, '')
    }
    args.push.apply(args, pathArgs)
    filePath = path.join.apply(path, args) + '.' + suffix;
    //如果文件名重复 需要再次更改
    return fs.existsSync(filePath) ? createNewImagePath(pathArgs, suffix,true) : filePath
}


function getFilePath(filename) {
    return path.join(config.UploadDir, filename || config.default);
}