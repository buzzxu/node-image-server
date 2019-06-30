'use strict'
module.exports=class JsonError extends Error{
    constructor(code,...args) {
        super(...args)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, JsonError);
        }
        this.code = code;
    }

    render(ctx){
        ctx.response.status = this.code
        ctx.type="application/json"
        ctx.body = {message:this.message,code:this.code,success:false,stack:this.stack}
    }
}