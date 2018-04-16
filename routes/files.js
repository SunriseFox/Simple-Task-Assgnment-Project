const express = require('express');
const db = require('../db/db')
const router = express.Router();

router.get('/:filename', async function(req, res, next) {
  const ret = await db.query('update uploads set downloaded = downloaded + 1 where stored_name = $1 returning origin_file', [req.params.filename])
  if(ret.rows.length)
    res.download(`/var/www/upload/${req.params.filename}`, ret.rows[0].origin_file)
  else
    res.status(404)
});

router.get('/all/:i', async (req, res, next) => {
  'use strict'
  const ret = await db.query('select student_id, realname, uof, usn from user_state where task_id = $1 order by uap desc, usu desc, uac desc', Number(req.params.i))
  res.json(ret.rows)
})

module.exports = router;
