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

module.exports = router;
