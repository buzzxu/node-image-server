var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/upload.html', function(req, res, next) {
  res.render('upload');
});

module.exports = router;
