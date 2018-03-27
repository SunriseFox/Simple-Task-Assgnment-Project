const db = require('../db/db')
const router = require('express').Router()

router.get('/:i/:what', async (req, res) => {
  'use strict'
  const feed_id = Number(req.params.i)
  const what = req.params.what
  if(!Number.isInteger(feed_id)) res.fail()
  let ret
  try {
    switch (what) {
      case 'star' :
        ret = await db.query('insert into feed_stars (user_id, feed_id) values ($1, $2)', [req.session.user, feed_id])
        break
      case 'unstar':
        ret = await db.query('delete from feed_stars where user_id = $1 and feed_id = $2', [req.session.user, feed_id])
        break
      default:
        return res.fail()
    }
  } catch (e){
    return res.fail()
  }
  res.ok()
})

module.exports = router
