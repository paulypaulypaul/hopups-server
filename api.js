var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

// define the home page route
router.post('/syncuser', function(req, res) {
  var payloadUser = req.body.user;
  var siteId = req.body.siteId;

  

  res.json(payloadUser);
});

module.exports = router;
