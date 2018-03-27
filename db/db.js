const {Pool} = require('pg')
const config = require('../config/db')

const pool = new Pool(config)

pool.query('SELECT NOW() as now', (err, res) => {
  if (err) console.error('Database connected error.', err)
  else console.log(`Database connected at ${res.rows[0].now}`)
})

const db = {}

db.pool = pool

db.query = (text, params) => {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    'use strict'
    const query = pool.query(text, params, (err, res) => {
      'use strict'
      const end = Date.now() - start
      if (err) {
        console.log(`Database query ${text}, ${params} failed in ${end} ms`)
        console.error(err)
        reject(err)
      } else {
        console.log(`Database query ${text}, ${params} finished in ${end} ms`)
        resolve(res)
      }
    })
  })
}

db.formUserState = async (ret, req) => {
  'use strict'
  for(let k in ret.rows) {
    if(!ret.rows.hasOwnProperty(k)) continue
    const v = ret.rows[k]
    const r = await db.query('select * from user_state where task_id = $1 and id = $2', [v.task_id, req.session.user])
    ret.rows[k] = Object.assign(v, r.rows[0] || {})
  }
  return ret.rows
}

db.checkLoggedIn = (fail_silent) => (req, res, next) => {
  'use strict'
  if(req.session.user) return next()
  if(fail_silent) return res.fail()
  res.end('<script>(typeof showModal === \'undefined\') ? (window.location = \'/login\') : showModal($("#main_dimmer"), "/login", true)</script>')
}

db.checkNotLoggedIn = () => (req, res, next) => {
  'use strict'
  if(req.session.user)
    return res.end('<script>(typeof loadView === \'undefined\') ? (window.location = \'/\') : loadView(null, "/index", true)</script>')
  next()
}

db.checkIsAdmin = () => (req, res, next) => {
  'use strict'
  if(req.session.perm >= 9) return next()
  return res.fail()
}

db.addToFeeds = async (user_id, type, task_id, upload_id) => {
  'use strict'
  let type_id = undefined
  switch (type) {
    case 'publish':
      type_id = 1
      break
    case 'accept':
      type_id = 2
      break
    case 'submit':
      type_id = 3
      break
    case 'finish':
      type_id = 4
      break
    case 'reset':
      type_id = 5
      break
    case 'abort':
      type_id = 6
      break
    default: return
  }
  try {
    await db.query('insert into _feeds(user_id, type_id, task_id, upload_id) values ($1, $2, $3, $4)',
      [user_id, type_id, task_id, upload_id])
  }catch (err) {}
}

module.exports = db
