var express = require('express');
var router = express.Router();
var database = require('../lib/mongo.js');

var orders = 0;
var photons = 0;

/* Get data about the orders. */
router.get('/', function(req, res) {
  database.query("counts", { name: "photons" }, function(err, arr) {
    var photonCount = 0;
    var orderCount = 0;

    if (arr && (arr.length > 0)) {
      var doc = arr[0];
      photonCount = doc.count;
    }
    database.query("counts", { name: "orders"}, function(err, arr) {
      if (arr && (arr.length > 0)) {
        var doc = arr[0];
        orderCount = doc.count;
      }
      res.send({orders: orderCount, photons: photonCount});
    });
  });
});

router.post('/', function(req, res) {
  if (!req.body) return res.sendStatus(400);
  if (!req.body.photons && req.body.photons !== 0) return res.sendStatus(400);
  orders++;
  photons = photons + req.body.photons;
  res.send({orders: orders, photons: photons});
});

module.exports = router;
