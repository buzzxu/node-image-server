"use strict";
var log4js = require('log4js');

log4js.configure({
    appenders: {
        access: { type: 'dateFile', filename: '/data/logs/access.log', pattern: ".yyyy-MM-dd",maxLogSize:10485760,backups: 3,compress:true},
        image: { type: 'dateFile', filename: '/data/logs/image.log', pattern: ".yyyy-MM-dd",maxLogSize:10485760,backups: 3,compress:true},
        error: { type: 'dateFile', filename: '/data/logs/error.log', pattern: ".yyyy-MM-dd",maxLogSize:10485760,backups: 3,compress:true},
        console: { type: "console"}
    },
    replaceConsole: true,
    categories:{
        default: { appenders: ['console','access'], level: 'info' },
        access: { appenders: ['access'], level: 'all' },
        image: { appenders: ['image'], level: 'info' },
        error: { appenders: ['error'], level: 'error' },
    }
});

module.exports ={
        conosle:log4js.getLogger('default'),
        image: log4js.getLogger('image'),
        error: log4js.getLogger('error'),
        express: log4js.connectLogger(log4js.getLogger('default'), {level: 'info'})
};
