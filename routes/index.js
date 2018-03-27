const express = require('express');
const db = require('../db/db')
const router = express.Router();

router.get('/', async function(req, res, next) {
  const ret = await db.query('select * from tasks where active = 1 order by task_id desc limit 5')
  const r = await db.query('select * from feeds order by since desc limit 50')
  let rt = {}
  if(req.session.user) {
    rt = await db.query('select array_agg(feed_id) as array from feed_stars where user_id = $1 limit 50', [req.session.user])
    const arr = rt.rows[0].array || []
    for(let i in r.rows){
      r.rows[i].ust = arr.includes(r.rows[i].feed_id);
    }
  }
  res.view('index', {tasks: await db.formUserState(ret, req), feeds: r.rows });
});

module.exports = router;
