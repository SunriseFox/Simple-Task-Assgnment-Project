const router = require('express').Router()
const db = require('../db/db')

router.get('/', db.checkLoggedIn(), async (req, res) => {
  const ret = await db.query('select feeds.* from feed_stars inner join feeds on feed_stars.feed_id = feeds.feed_id where user_id = $1', [req.session.user])
  res.view('stars', {data: ret.rows})
})

module.exports = router
