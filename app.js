const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const moment = require('moment')
const db = require('./db/db')

const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.locals.title = '项目'
moment.locale('zh-cn')
app.locals.moment = moment
app.locals.stripTag = (str) => str.replace(/<(?:.|\n)*?>/gm, ' ')
app.use(session({
  name: 'oc.sid',
  // DEV: change in production
  secret: 'not production',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  cookie: {maxAge: 36000000},
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    db: 1
  })
}))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use((req, res, next) => {
  if (req.session) {
    res.locals.user = req.session.user
    res.locals.perm = req.session.perm || 0
    res.locals.nickname = req.session.nickname
    res.locals.startTime = req.session.startTime || moment().format('YYYY/MM/DD/HH/mm/ss')
    res.locals.endTime = req.session.endTime || moment().add(7, 'days').format('YYYY/MM/DD/HH/mm/ss')
  }
  res.locals.tasks = {}
  res.locals.info = {}
  res.locals.task = {}
  res.locals.path = req.path
  res.fail = (error) => {
    res.json({success: false, error: error})
  }
  res.ok = (message) => {
    res.json({success: true, message: message})
  }
  res.modal = (url, params) => {
    'use strict'
    if (req.get('X-Requested-With') === 'XMLHttpRequest')
      res.render(url, params)
    else res.render('frame', Object.assign({type: 'modal'}, params))
  }
  res.view = (url, params) => {
    'use strict'
    if (req.get('X-Requested-With') === 'XMLHttpRequest')
      res.render(url, params)
    else res.render('frame', Object.assign({type: 'view'}, params))
  }
  next()
})

app.use('/', require('./routes/index'))
app.use('/index', require('./routes/index'))
app.use('/register', require('./routes/register'))
app.use('/login', db.checkNotLoggedIn(), require('./routes/login'))
app.use('/logout',   require('./routes/logout'))
app.use('/admin', db.checkIsAdmin(), require('./routes/admin'))
app.use('/tasks', require('./routes/tasks'))
app.use('/assignments', db.checkLoggedIn(), require('./routes/assignments'))
app.use('/users', db.checkLoggedIn(), require('./routes/users'))
app.use('/files', require('./routes/files'))
app.use('/star', db.checkLoggedIn(true), require('./routes/star'))
app.use('/stars', db.checkLoggedIn(), require('./routes/stars'))
app.use('/comments', db.checkLoggedIn(), require('./routes/comments'))
app.use('/search', require('./routes/search'))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
