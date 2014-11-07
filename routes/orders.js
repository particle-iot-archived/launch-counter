var express = require('express');
var router = express.Router();
var database = require('../lib/mongo.js');


/* Get data about the orders. */
router.get('/', function(req, res) {
  getCount("photons", function(photonCount) {
    getCount("orders", function(orderCount) {
      res.send({photons: photonCount, orders: orderCount});
    });
  })
});


// expects something liek this from segment's webhooks
//   {
//   "sessionId": "1f570c6d-14d3-48d8-a38b-fe5cd510be51",
//   "action": "Track",
//   "options": {
//     "providers": {},
//     "ip": "50.203.238.241",
//     "library": "segment.js",
//     "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
//   },
//   "integrations": {},
//   "version": 2,
//   "projectId": "zBwlcEmulc",
//   "receivedAt": "2014-11-06T22:05:27.325Z",
//   "channel": "client",
//   "properties": {
//     "revenue": null
//   },
//   "event": "Placed Order",
//   "anonymousId": "1f570c6d-14d3-48d8-a38b-fe5cd510be51",
//   "timestamp": "2014-11-06T22:05:27.107Z",
//   "type": "track",
//   "context": {
//     "ip": "50.203.238.241",
//     "library": {
//       "version": "2.4.11",
//       "name": "analytics.js"
//     },
//     "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36"
//   },
//   "userId": null,
//   "messageId": "8e720514-9634-4699-9d19-0add5465062a"
// }

// hit it with this
//curl -H "Content-Type: application/json" -d '{"type": "track", "event": "Placed Order", "properties": {"photonCount": 3}}' http://localhost:5000/orders
router.post('/', function(req, res) {
  if (!req.body) return res.status(400).send('No body specified');
  if (req.body.type === 'track' && req.body.event === 'Placed Order') {
    try {
      var photonCount = req.body.properties.photonCount;
    } catch(err) {
      return res.status(400).send('body.properties.photonCount json key not specified');
    }
    incrCount("photons", photonCount, function(photons) {
      incrCount("orders", 1, function(orders) {
        res.send({photons: photons.count, orders: orders.count});
        req.io.broadcast('countUpdated', {photons: photons.count, orders: orders.count});
      });
    });
  } else {
    return res.status(400).send('IGNORING, this only tracks placed orders');
  }
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
