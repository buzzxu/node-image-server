const Koa = require('koa')
const app = new Koa()
const conditional = require('koa-conditional-get')
const etag = require('koa-etag');
const convert = require('koa-convert');
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const body = require('koa-better-body')
const logger = require('koa-logger')
const path = require('path')
const Router = require('koa-router')
const core = require('./core/index')
const error = require('./core/errors/error')

const index = require('./routes/index')
const images = require('./routes/images')

core.choose()
core.IMAGE.check(path.join(__dirname, 'img'))
// error handler
// onerror(app)
app.use(conditional());
app.use(etag());
app.use(error.errorHandler)
// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(convert(body()))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'ejs'
}))
// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes '/images'
let router = new Router()
router.use(index.routes(), index.allowedMethods())
router.use(images.routes(), images.allowedMethods())

app.use(router.routes()).use(router.allowedMethods())
// error-handling

app.on('error', (err, ctx) => {
    error(err,ctx)
});

module.exports = app
