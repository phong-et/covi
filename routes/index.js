let express = require('express'),
  router = express.Router(),
  covi = require('../covi');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
})
router.get('/latest', async function (_, res, next) {
  let data = await covi.fetchLatestData()
  res.send(data)
})
router.get('/yesterday', async function (_, res, next) {
  let data = await covi.fetchYesterdayLatestData()
  res.send(data)
})

module.exports = router;
