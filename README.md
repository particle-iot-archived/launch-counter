Launch Counter
==============

Launch Counter is a Node/Express mini-app that is responsible for updating and broadcasting the current count of orders and purchased photons on store.spark.io.

### GET Order and Photon Counts
Simply set a GET request to `http://launch-counter.herokuapp.com/orders`. This is a simple REST call that will give you the counts at that point in time. For real-time streaming of data, see Web Sockets below.

Sample response: 
```
{
  "photons": 67,
  "orders": 29
}
```

### Web Sockets
For use on the store and on the Spark Website, creating a web socket to get streaming data of the current photons and orders as they are being made. Launch Counter uses socket.io to power the Web Sockets. To set up the socket on your app:

```
  <script src="http://launch-counter.herokuapp.com/socket.io/socket.io.js"></script>
  <script type="text/javascript">
    io = io.connect('http://launch-counter.herokuapp.com:7076');
    io.emit('ready');
     io.on('currentCount', function(data) {
      // DO STUFF
      // To get the photon count, data.photons
      // To get the orders count, data.orders
     });
     io.on('countUpdated', function(data) {
      // DO STUFF
      // To get the photon count, data.photons
      // To get the orders count, data.orders
     });
  </script>
```
`currentCount` is the event sent as soon as the web socket is created, and will give you the current count of photons and orders at the time of opening the connection. `data.photons` will return the photon count and `data.orders` will return the orders.

`countUpdated` will be sent when there are new orders posted to the store. This will provide the streaming effect, with the values being updated each and every time new orders are placed.

**NOTE: You must use the socket.io.js from the launch-counter app or else it will not work!


### POSTing Data
When a new order is created, you need to send a POST request to the Launch Counter app to update the number of orders and photons in our database.

URL: `http://launch-counter.herokuapp.com/orders`
The POST accepts one param, `photons`, that is an integer with the number of photons purchased. Orders will automatically auto-increment when the photons are added to the database.

Sample request: `curl -H "Content-Type: application/json" -d '{"photons": 2}' http://launch-counter.herokuapp.com/orders`

Sample response: 
```
{
  "photons": 67,
  "orders": 29
}
```

### Authentication
(TBD)

### Resetting the counts
There will likely be the need to reset the counts if we add some test data to the production Heroku Mongo Database. To reset the data, the first step is to log into the database using the command line:
```
mongo dogen.mongohq.com:10020/<DB_NAME> -u <USERNAME> -p <PASSWORD>
```
For security concerns, please log into Compose on Heroku to find the DB_NAME, USERNAME, and PASSWORD.

After logging into the shell, run: `db.counts.drop()`.

