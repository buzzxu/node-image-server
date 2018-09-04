const conifg = require('./config')

const Local = require('./Local')
const Aliyun = require('./oss/Aliyun')


module.exports = {
    IMAGE: null,
    choose: function() {
        switch (conifg.model) {
            case 'local':
                this.IMAGE = new Local()
                this.IMAGE.check('/data/images');
                break;
            case 'aliyun':
                this.IMAGE = new Aliyun()
                break;
            default:
                this.IMAGE = new Local()
        }
    }
}


