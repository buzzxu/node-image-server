/**
 * Created by xux on 15-5-8.
 */
const path = require('path')

module.exports = {
    name:'image-server',
    port:3000,
    DIR_UPLOAD:path.join('/data', 'images'),
    model:'local',
    maxAge: 31536000,//1 year
    contentType: new Map([
        ['jpg','image/jpeg'],
        ['jpeg','image/jpeg'],
        ['gif','image/gif'],
        ['png','image/png'],
        ['webp','image/webp']
    ]),
    defaultImg:'default.png',
    jwt:{
        secret:'123456',
        algorithm: 'HS512',
        credentialsRequired: true
    }
}
