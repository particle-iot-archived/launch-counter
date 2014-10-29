var express = require('express');
var router = express.Router();

var orders = 0;
var photons = 0;

/* Get data about the orders. */
router.get('/', function(req, res) {
  res.send('You want some orders? Fine. Here they are.');
});

router.post('/', function(req, res) {
  if (!req.body) return res.sendStatus(400);
  if (!req.body.photons && req.body.photons !== 0) return res.sendStatus(400);
  orders++;
  photons = photons + req.body.photons;
  res.send({orders: orders, photons: photons});
});

module.exports = router;
