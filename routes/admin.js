const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const check = require('../lib/form-check')
const crypto = require('crypto')
const db = require('../db/db')
const moment = require('moment')

router.get('/task', (req, res) => {
  res.view('admin_task', {view: '/admin/task'})
})

const md5 = (string) => {
  'use strict'
  return crypto.createHash('md5').update(string).digest('hex')
}

const formatts = (string, type) => {
  'use strict'
  const date = moment(string,'YYYY/MM/DD/HH/mm/ss')
  if (!date.isValid()) {
    const date = moment()
    if (type) date.add(7, 'days')
    return date.toISOString()
  }
  return date.toISOString()
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

router.post('/task', upload.single('file'), async (req, res) => {
  const keys = ['task_name', 'task_desc', 'tsstart', 'tsend']
  const values = [req.body.task_name, req.body.task_desc, formatts(req.body.tsstart), formatts(req.body.tsend, 1)]
  const form = {}
  let ret = check(keys, values, undefined, form)
  if (ret) return res.fail(ret)
  const file = req.file || {}

  try {
    ret = await db.query(
      'INSERT INTO tasks (title, description, origin_file, stored_name, during) VALUES ($1, $2, $3, $4, $5) returning task_id',
      [form.task_name, form.task_desc, file.originalname, file.filename, `[${form.tsstart}, ${form.tsend})`]
    )
  } catch (err) {
    return res.fail(err)
  }
  if(req.body.tsstart) req.session.startTime = formatts(req.body.tsstart)
  if(req.body.tsend) req.session.startTime = formatts(req.body.tsend)
  res.ok()

  db.addToFeeds(req.session.user, 'publish', ret.rows[0].task_id, null)

})

router.get('/task/delete/:i', async (req, res) => {
  'use strict'
  req.session.force = req.params.i
  res.fail()
})

router.get('/task/delete/:i/force', async (req, res) => {
  'use strict'
  const i = req.params.i
  if (!Number.isInteger(Number(i))) res.fail()
  if(req.session.force !== i) return res.fail()
  try {
    await db.query('delete from tasks cascade where task_id = $1', [i])
  } catch (e){}
  return res.ok()
})

router.get('/task.json', async (req, res) => {
  'use strict'
  const ret = await db.query('select * from tasks order by since desc')
  res.json({records: ret.rows})
})

router.get('/user', async (req, res) => {
  'use strict'
  res.view('admin_user', {view: '/admin/user'})
})

router.get('/user.json', async (req, res) => {
  'use strict'
  const ret = await db.query('select * from user_brief inner join users on user_brief.user_id = users.uid')
  res.json({records: ret.rows})
})

module.exports = router
