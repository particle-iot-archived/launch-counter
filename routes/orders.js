var express = require('express');
var router = express.Router();
var database = require('../lib/mongo.js');


/* Get data about the orders. */
router.get('/', function(req, res) {
  getCount("photons", function(photonCount) {
    getCount("orders", function(orderCount) {
      res.send({photons: photonCount, order: orderCount});
    });
  })
});

router.post('/', function(req, res) {
  if (!req.body) return res.sendStatus(400);
  if (!req.body.photons && req.body.photons !== 0) return res.sendStatus(400);

  incrCount("photons", req.body.photons, function(photons) {
    incrCount("orders", 1, function(orders) {
      res.send({photons: photons.count, order: orders.count});
    });
  });
});

function getCount(record, callback) {
 database.query("counts", { name: record }, function(err, arr) {
  var hasData = (arr && (arr.length > 0));
  var count = (hasData && arr[0].count) ? arr[0].count : 0;
  if (callback) { callback(count); }
 });
}


function incrCount(record, val, callback) {
  var filter = {name: record};
  database.findAndModify("counts", filter, {count: val}, function(err, obj) {
      if (err){
          console.warn(err.message);  // returns error if no matching object found
      } else {
          if (callback) {
            callback(obj);
          }
      }
  });
}

module.exports = router;
