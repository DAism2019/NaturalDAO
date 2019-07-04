const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const cors = require('koa2-cors');
// const logger = require('koa-logger')  不使用自带LOG，显示信息太多了

const index = require('./routes/index')
const users = require('./routes/users')

//custome service
const schedule = require('./service/schedule');

// error handler
onerror(app)

// middlewares
app.use(cors()); //  解决跨域问题
//解决如果恶意使用“//”会报错的问题
app.use(async (ctx, next) => {
    let path = ctx.path;
    if (path.charAt(1) == "/") {
        const clientIP = ctx.request.ip;
        ctx.body = "WRONG URL! " + clientIP;
        let str = ' \x1b[31m';
        console.log(`${ctx.method} ${ctx.url}` + ' - 1ms ' + ' \x1b[32m' + `${ctx.status}` + str + 'WRONG URL \x1b[0m');
        return;
    }
    await next();
});
app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())
// app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {extension: 'pug'}))

// logger
app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start;
    let str = ctx.status == 200
        ? ' \x1b[32m'
        : ' \x1b[31m';
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms` + str + `${ctx.status}` + ' \x1b[0m');
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

schedule();

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
});

module.exports = app
