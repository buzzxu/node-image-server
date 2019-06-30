const conifg = require('./config')

const Local = require('./Local')
const OSS = require('./OSS')


module.exports = {
    IMAGE: null,
    choose: function() {
        switch (conifg.model) {
            case 'local':
                this.IMAGE = new Local()
                this.IMAGE.check(conifg.DIR_UPLOAD);
                break;
            case 'oss':
                this.IMAGE = new OSS()
                break;
            default:
                this.IMAGE = new Local()
        }
    }
}


