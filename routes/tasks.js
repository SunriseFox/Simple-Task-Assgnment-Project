const router = require('express').Router()
const multer = require('multer')
const db = require('../db/db')
const crypto = require('crypto')
const path = require('path')

const md5 = (string) => {
  'use strict'
  return crypto.createHash('md5').update(string).digest('hex')
}
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/var/www/upload')
    },
    filename: (req, file, cb) => {
      cb(null, md5(file.fieldname + '-' + Date.now()) + path.extname(file.originalname))
    }
  }),
  limits: {fileSize: 25825800, files: 1}
})

router.get('/', async function(req, res) {
  'use strict'
  const ret = await db.query('select * from tasks order by active desc, task_id desc')
  res.view('tasks', {tasks: await db.formUserState(ret, req)})
});

router.get('/:i', async (req, res, next) => {
  'use strict'
  const task_id = Number(req.params.i)
  if(!Number.isInteger(task_id)) next()
  const ret = await db.formUserState(await db.query('select * from tasks where task_id = $1', [task_id]), req)
  if(ret.length === 0) return next()
  const r = await db.query('select * from user_state where task_id = $1 order by uap desc, usu desc, uac desc', [task_id])
  const re = await db.query('select * from comments where task_id = $1 order by since desc', [task_id])
  res.view('task', {view:'/tasks/'+task_id, task: ret[0], all: r.rows, comment: re.rows, task_id: task_id})
})

router.post('/:i', db.checkLoggedIn(), async (req, res, next) => {
  'use strict'
  const task_id = Number(req.params.i)
  if(!Number.isInteger(task_id)) next()
  const ret = await db.query('select accepted, submitted, approved from _assignments where user_id = $1 and task_id = $2', [req.session.user, task_id])
  if(ret.rows.length === 0 || !ret.rows[0].accepted || ret.rows[0].approved || ret.rows[0].submitted) return res.fail()
  upload.single('file')(req, res, async () => {
    if(!req.file) return res.fail()
    const ret = await db.query('update assignments set submitted = TRUE, origin_file = $1, stored_name = $2 where user_id = $3 and task_id = $4 returning *'
      , [req.file.originalname, req.file.filename, req.session.user, task_id])
    if(ret.rows.length > 0) {
      res.ok()
      db.addToFeeds(req.session.user, 'submit', task_id, ret.rows[0].upload_id)
    } else res.fail()
  })
})

router.get('/:i/:type', db.checkLoggedIn() , async (req, res, next) => {
  'use strict'
  const task_id = Number(req.params.i)
  const type = req.params.type
  if(!Number.isInteger(task_id)) next()
  let ret
  try {
    switch (type) {
      case 'accept':
        ret = await db.query('insert into assignments(user_id, task_id) values ($1, $2) returning *', [req.session.user, task_id])
        break
      case 'reset':
        ret = await db.query('update assignments set submitted = FALSE where user_id = $1 and task_id = $2 returning *', [req.session.user, task_id])
        break
      case 'abort':
        ret = await db.query('update assignments set accepted = FALSE where user_id = $1 and task_id = $2 returning *', [req.session.user, task_id])
        break
      default:
        return next()
    }
    if (ret.rows.length) {
      res.ok()
      return db.addToFeeds(req.session.user, type, task_id, ret.rows[0].upload_id)
    }
  } catch (err){}
  res.fail()
})

router.get('/:i/approve/:j', db.checkIsAdmin(), async function(req, res) {
  'use strict'
  const task_id = Number(req.params.i)
  const assignment_id = Number(req.params.j)
  if(!Number.isInteger(task_id) || !Number.isInteger(assignment_id)) return res.fail()

  const ret = await db.query('update assignments set approved = TRUE where task_id = $1 and assignment_id = $2 returning *', [task_id, assignment_id])
  if(ret.rows.length) {
    res.ok()
    return db.addToFeeds(ret.rows[0].user_id, 'finish', task_id, ret.rows[0].upload_id)
  }
  res.fail()
});

module.exports = router;
