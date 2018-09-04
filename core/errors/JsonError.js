'use strict'
module.exports = class JsonError extends Error{
    constructor(code,...args) {
        super(...args)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, JsonError);
        }
        this.code = code;
    }

    render(response){
        response.status(this.code).json({ success: true, code:this.code,message:this.message})
    }
}