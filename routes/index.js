const router = require('koa-router')({
    prefix:'/images/index'
})

router.get('/upload.html', async (ctx, next) => {
  await ctx.render('upload')
})



module.exports = router
