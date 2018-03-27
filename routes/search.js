const db = require('../db/db')
const router = require('express').Router()

router.get('/:param', async(req, res) => {
  'use strict'
  const param = req.params.param
  const task_id = Number.isInteger(Number(param)) ? Number(param) : null;


  const ret = await db.query('select CONCAT(\'/tasks/\',task_id) as url, title, description from tasks where task_id = $1 or title LIKE $2 or description like $2', [task_id, `%${param}%`])

  res.json({results: ret.rows})

})

module.exports = router
