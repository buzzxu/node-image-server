var log4js = require('log4js');

log4js.configure({
    appenders: {
        access: { type: 'dateFile', filename: '/data/logs/images/access.log', pattern: "_yyyy-MM-dd",maxLogSize:10485760,backups: 3,compress:true},
        image: { type: 'dateFile', filename: '/data/logs/images/image.log', pattern: "_yyyy-MM-dd",maxLogSize:10485760,backups: 3,compress:true},
        error: { type: 'dateFile', filename: '/data/logs/images/error.log', pattern: "_yyyy-MM-dd",maxLogSize:10485760,backups: 3,compress:true},
        console: { type: "console"}
    },
    replaceConsole: true,
    categories:{
        default: { appenders: ['console'], level: 'info' },
        access: { appenders: ['access'], level: 'all' },
        image: { appenders: ['image'], level: 'info' },
        error: { appenders: ['error'], level: 'error' },
    }
});

module.exports ={
        access: log4js.getLogger('access'),
        image: log4js.getLogger('image'),
        error: log4js.getLogger('error'),
        express: log4js.connectLogger(log4js.getLogger('access'), {level: 'info'}),
        isDebug: function(category) {
            return (log4js.levels.DEBUG.level >= category.level.level);
        }
};
