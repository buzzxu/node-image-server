/**
 * Created by xux on 15-5-8.
 */
var path = require('path');

var OPTIONS = {
    UploadDir:null,
    choose: function (rootDir) {
        //默认路径
        // this.UploadDir = path.join(rootDir, 'img');
        this.UploadDir = path.join('/data', 'images');
    },
    name: '<<图片服务器(读取)>>',
    port: 3000,
    'default': 'default.png',
    mode: 'read',
    contentTypes: {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'png': 'image/png',
        'webp': 'image/webp'
    },
    jwt:{
        secret:'123456',
        algorithm: 'HS512',
        credentialsRequired: true,
        getToken: function fromHeaderOrQuerystring (req) {
            if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
                return req.headers.authorization.split(' ')[1];
            } else if (req.query && req.query.token) {
                return req.query.token;
            }
            return null;
        }
    }
};

module.exports = OPTIONS;