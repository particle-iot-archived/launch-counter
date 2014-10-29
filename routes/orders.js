var express = require('express');
var router = express.Router();
var database = require('../lib/mongo.js');


/* Get data about the orders. */
router.get('/', function(req, res) {
  database.query("counts", {name: "photons"}, function(err, arr) {
    var photonCount = 0;
    var orderCount = 0;
    if (arr && (arr.length > 0)) {
      var photons = arr[0];
      photonCount = photons.count;
    }
    database.query("counts", {name: "orders"}, function(err, arr) {
      if (arr && (arr.length > 0)) {
        var orders = arr[0];
        orderCount = orders.count;
      }
      res.send({photons: photonCount, order: orderCount});
    });
  });
});

router.post('/', function(req, res) {
  if (!req.body) return res.sendStatus(400);
  if (!req.body.photons && req.body.photons !== 0) return res.sendStatus(400);

  database.findAndModify("counts", {name: "photons"}, {count: req.body.photons}, function(err, photons) {
      if (err){
          console.warn(err.message);  // returns error if no matching object found
      } else {
        database.findAndModify("counts", {name: "orders"}, {count: 1}, function(err, orders) {
          if (err){
            console.warn(err.message);  // returns error if no matching object found
          } else {
            res.send({photons: photons.count, order: orders.count});
          }
        });
      }
  });

});


module.exports = router;
