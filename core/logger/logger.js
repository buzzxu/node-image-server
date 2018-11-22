const log4js = require('log4js');
const path = require('path');
log4js.configure(path.resolve(__dirname, 'log4j.json'));

module.exports ={
        access: log4js.getLogger('access'),
        image: log4js.getLogger('image'),
        error: log4js.getLogger('error'),
        express: log4js.connectLogger(log4js.getLogger('access'), {level: 'info'})
};
