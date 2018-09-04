'use strict'
const fs = require('fs');
const path = require('path');
const config = require('../../config/config')
module.exports =class ImageError extends Error{
    constructor(code,...args) {
        super(...args)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ImageError);
        }
        this.code = code;
    }

    render(response){
        response.status(this.code||500).sendFile(path.join(config.UploadDir,config.default))
    }
}