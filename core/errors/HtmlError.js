'use strict'

module.exports= class HtmlError extends Error{
    constructor(code,...args) {
        super(...args)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HtmlError);
        }
        this.code = code;
    }

    render(ctx){
        switch(this.code){
            case 404:
                ctx.render('404')
                break;
            default:
                ctx.render('500')
        }
    }
}