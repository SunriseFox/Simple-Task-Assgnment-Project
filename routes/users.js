const router = require('express').Router()
const check = require('../lib/form-check')
const db = require('../db/db')

router.get('/', db.checkLoggedIn(), async function (req, res) {
  const ret = await db.query('select * from users left outer join user_brief on users.uid = user_brief.user_id where uid = $1', [req.session.user || 1])
  res.view('users', {info: ret.rows[0]})
})

router.post('/', async function (req, res) {
  const form = {}
  check(['password'], [req.body.password], undefined, form)
  if (form.password) {
    const ret = await db.query('update _users set password = $1 where id = $2 returning id', [form.password, req.session.user])
    if (ret.rows.length) {
      delete req.session
      res.redirect('/login')
    }
  }
  res.fail()
})

router.get('/:studentID', async function (req, res, next) {
  const student_id = req.params.studentID
  const ret = await db.query('SELECT * FROM users left outer join user_brief on users.uid = user_brief.user_id WHERE student_id = $1', [student_id])

  if (ret.rows.length > 0) {
    const r = await db.query('SELECT * FROM user_assignments where user_id = $1 order by since desc', [ret.rows[0].uid])
    return res.view('users', {info: ret.rows[0], data:r.rows})
  }
  next()
})

module.exports = router
