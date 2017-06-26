const Koa = require('koa')
const app = new Koa()

// trust proxy
app.proxy = true

// sessions
const session = require('koa-session')
app.keys = ['your-session-secret']
app.use(session({}, app))

// body parser
const bodyParser = require('koa-bodyparser')
app.use(bodyParser())

// authentication
require('./auth')
const passport = require('koa-passport')
app.use(passport.initialize())
app.use(passport.session())

// routes
const fs    = require('fs')
const route = require('koa-route')

app.use(route.get('/', function(ctx) {
  ctx.type = 'html'
  ctx.body = fs.createReadStream('views/login.html')
}))

app.use(route.post('/custom', function(ctx) {
  return passport.authenticate('local', function(err, user, info, status) {
    if (user === false) {
      ctx.body = { success: false }
      ctx.throw(401)
    } else {
      ctx.body = { success: true }
      return ctx.login(user)
    }
  })(ctx)
}))

// POST /login
app.use(route.post('/login',
  passport.authenticate('local', {
    successRedirect: '/app',
    failureRedirect: '/'
  })
))

app.use(route.get('/logout', function(ctx) {
  ctx.logout()
  ctx.redirect('/')
}))

app.use(route.get('/auth/facebook',
  passport.authenticate('facebook')
))

app.use(route.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/app',
    failureRedirect: '/'
  })
))

app.use(route.get('/auth/twitter',
  passport.authenticate('twitter')
))

app.use(route.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/app',
    failureRedirect: '/'
  })
))

app.use(route.get('/auth/google',
  passport.authenticate('google')
))

app.use(route.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/app',
    failureRedirect: '/'
  })
))

// Require authentication for now
app.use(function(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next()
  } else {
    ctx.redirect('/')
  }
})

app.use(route.get('/app', function(ctx) {
  ctx.type = 'html'
  ctx.body = fs.createReadStream('views/app.html')
}))

// start server
const port = process.env.PORT || 3000
app.listen(port, () => console.log('Server listening on', port))
