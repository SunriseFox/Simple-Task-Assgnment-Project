const router = require('express').Router()
const check = require('../lib/form-check')
const db = require('../db/db')

router.get('/', db.checkNotLoggedIn(), function(req, res) {
  res.modal('register')
});

router.post('/', async function (req, res) {
  const keys = ['student_id', 'nickname', 'realname', 'password']
  const values = [req.body.student_id, req.body.nickname, req.body.realname, req.body.password]
  const form = {}
  let ret = check(keys, values, [], form)
  if(ret) return res.fail(ret)

  try {
    ret = await db.query('insert into _users (student_id, nickname, realname, password) values ($1, $2, $3, $4) returning id'
      , [form.student_id, form.nickname, form.realname, form.password])
  } catch (err) {
    if(err.constraint && err.constraint.indexOf('student_id') !== -1) {
      return res.fail({student_id: '已经存在了'})
    } if(err.constraint && err.constraint.indexOf('nickname') !== -1) {
      return res.fail({nickname: '已经存在了'})
    } else res.fail(err)
  }

  if(ret.rows.length) {
    req.session.user = ret.rows[0].id
    req.session.nickname = form.nickname
    return res.ok()
  }
  res.fail()
})

module.exports = router;
