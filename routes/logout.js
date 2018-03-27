const router = require('express').Router()

router.get('/', function(req, res) {
  delete req.session
  res.send('<script>history.replaceState({path: "/"}, "", "/");location.reload()</script>')
});

module.exports = router;
