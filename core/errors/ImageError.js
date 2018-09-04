'use strict'

module.exports =class ImageError extends Error{
    constructor(code,...args) {
        super(...args)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ImageError);
        }
        this.code = code;
    }

     render(ctx){
        const images = require('../images')
        let buffer =   images.sendDefault()
        ctx.type='image/png'
        ctx.response.status=this.code
        ctx.body = buffer
    }
}


