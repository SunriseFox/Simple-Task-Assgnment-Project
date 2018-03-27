const router = require('express').Router()
const check = require('../lib/form-check')
const db = require('../db/db')

router.get('/', async function(req, res) {
  'use strict'
  const ret = await db.query('select * from user_assignments where user_id = $1 order by since desc', [req.session.user])
  res.view('assignments', {tasks: ret.rows})
});

module.exports = router;
