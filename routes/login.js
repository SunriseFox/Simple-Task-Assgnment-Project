const router = require('express').Router()
const check = require('../lib/form-check')
const db = require('../db/db')

router.get('/', db.checkNotLoggedIn(), function(req, res) {
  res.modal('login')
});

router.post('/', async (req, res) => {
  const keys = ['student_id', 'password']
  const values = [req.body.student_id, req.body.password]
  const form = {}
  let ret = check(keys, values, undefined, form)
  if(ret) return res.fail(ret)

  try {
    ret = await db.query('select * from users where student_id = $1 and password = md5($2)', [form.student_id, form.password])
  } catch(err) {
    return res.fail(err)
  }
  if(ret.rows.length === 0)
    return res.fail()
  req.session.user = ret.rows[0].uid
  req.session.perm = ret.rows[0].perm
  req.session.nickname = ret.rows[0].nickname
  res.ok()
})

module.exports = router;
