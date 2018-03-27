const express = require('express');
const db = require('../db/db')
const router = express.Router();
const check = require('../lib/form-check')

router.post('/:i', async function(req, res, next) {
  const task_id = Number(req.params.i)
  if(!Number.isInteger(task_id)) next()

  const form = {}
  const ret = check(['msg'], [req.body.comment], undefined, form)
  if(ret) return res.fail(ret)

  try {
    await db.query('insert into comments(task_id, user_id, nickname, message) values ($1, $2, $3, $4)'
      , [task_id || null, req.session.user, req.session.nickname, form.msg])
  } catch(e) {
    return res.fail(e)
  }
  res.ok()
});

router.get('/delete/:i', async function(req, res, next) {
  const msg_id = Number(req.params.i)
  if(!Number.isInteger(msg_id)) next()
  res.ok()
  await db.query('delete from comments where user_id = $1 and msg_id = $2', [req.session.user, msg_id])
});

module.exports = router;
