var when = require('when');
var sequence = require('when/sequence');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;


var settings = {
    pool_size: 10,
    connectionString: "mongodb://counter-user:thSI8MDuO4Aa9v0Rq5EbpB3ZP@linus.mongohq.com:10007/spark-store-counter"
}

if (process.env["MONGO_CONNECTION_STRING"]) {
    settings.connectionString = process.env["MONGO_CONNECTION_STRING"]
}


var logger = {
    log: function() {
        console.log.apply(console, arguments);
    },
    error: function() {
        console.error.apply(console, arguments);
    },
};


/**
 * Database implementation, v1
 * @constructor
 */
var Database = function () {

};

Database.prototype = {
    _conn: null,
    _collections: {},

    connect: function (callback) {
        var that = this;
        if (!callback) {
            return;
        }

        //  Really we're just sharing one connection pool for the server.
        if (that._conn) {
            process.nextTick(function () {
                callback(null, that._conn);
            });
        }
        else {
            if (!settings.connectionString) {
                logger.error("connectionString setting is MISSING");
            }

            MongoClient.connect(settings.connectionString, {
                auto_reconnect: true,
                poolSize: settings.pool_size
            }, function (err, db) {
                if (err) {
                    console.error("Database: couldn't connect to Mongo ", err);
                }
                that._conn = db;
                callback(err, that._conn);
            });
        }
    },

    getCollection: function (name, callback) {
        if (!name) {
            logger.log("getCollection called with bad arguments");
            return when.reject("bad arguments");
        }

        var col = this._collections[name];
        if (col) {
            callback(null, col);
            return when.resolve(col);
        }

        var that = this;
        var tmp = when.defer();
        this.connect(function (err, db) {
            if (!db) {
                console.log("Error connecting to database", err);
            }
            else {
                col = db.collection(name);
            }

            that._collections[name] = col;
            if (callback) {
                callback(err, col);
            }

            if (err) {
                tmp.reject(err);
            }
            else {
                tmp.resolve(col);
            }
        });

        return tmp.promise;
    },

    query: function (collection, filter, callback) {
        var tmp = when.defer();
        this.find(collection, filter, function (err, docs) {
            if (docs) {
                docs.toArray(function (err, arr) {
                    if (err) {
                        tmp.reject(err);
                        if (callback) {
                            try { callback(err, null); } catch(ex) { logger.error("query: error in callback ", ex); }
                        }
                        return;
                    }

                    tmp.resolve(arr);
                    if (callback) {
                        try { callback(err, arr); } catch(ex) { logger.error("query: error in callback ", ex); }
                    }
                });
            }
            else {
                tmp.reject(err);

                if (callback) {
                    try { callback(err, null); } catch(ex) { logger.error("query: error in callback ", ex); }
                }
            }
        });

        return tmp.promise;
    },



    update: function (colName, criteria, attrs) {
        var deferred = when.defer();

        this.getCollection(colName, function (err, collection) {
            collection.update(criteria, { $set: attrs }, { safe: true, upsert: true }, function (err) {
                if (err) {
                    deferred.reject(err);
                }
                else {
                    deferred.resolve();
                }
            });
        });
        return deferred.promise;
    },


    delete: function (colName, obj, callback) {
        var defer = when.defer();
        this.getCollection(colName, function (err, collection) {
            if (err || !collection) {
                logger.error("Delete error (couldn't get collection) " + err);
                defer.reject(err);
                return;
            }

            collection.remove(obj, null, function (err, count) {
                if (err) {
                    logger.error("mongodb delete error: ", err);
                    defer.reject(err);
                }
                else {
                    defer.resolve(count);
                }

                if (callback) {
                    try {
                        callback(err, count);
                    }
                    catch (ex) {
                        logger.error("delete callback error: ", ex);
                    }
                }


            });
        });

        return defer.promise;
    },


    upsert: function (colName, obj, callback) {
        var defer = when.defer();
        this.getCollection(colName, function (err, collection) {
            collection.insert(obj, { upsert: true, safe: true },
                function (err, docs) {
                    if (err) {
                        defer.reject(err);
                    }
                    else {
                        defer.resolve(docs);
                    }

                    if (callback) {
                        try {
                            callback(err, docs);
                        }
                        catch (ex) {
                            logger.error("upsert callback error: ", ex);
                        }
                    }
                });
        });
        return defer.promise;
    },
    find: function (collection_name, criteria, callback) {
        if (!callback) {
            logger.error("Database.find called without a callback ");
            return;
        }

        //var that = this;
        this.getCollection(collection_name, function (err, collection) {
            if (!collection) {
                callback(err, null);
            }
            else {
                try {
                    var cursor = collection.find(criteria, function(err, cursor) {
                        callback(err, cursor);
                    });
                    //callback(err, cursor);
                }
                catch (ex) {
                    logger.error("db find error: ", ex);
                }
            }
        });
    },
    insert: function (colName, obj) {
        var defer = when.defer();
        this.connect(function (err, db) {
            db.collection(colName, function (err, collection) {

                collection.insert(obj, { safe: true }, function (err, docs) {
                    defer.resolve(err, docs);
                });
            });
        });

        return defer.promise;
    },
    findAndModify: function(colName, query, obj, callback) {
      this.connect(function(err, db) {
        db.collection(colName, function(err, collection) {
          collection.findAndModify(
            query,
            ['_id','asc'],
            {$inc: obj},
            {new: true, upsert: true},
            callback
          );

        });
      });
    },

    count_properties: function(colName, filter, propName, callback) {
        if (!callback) {
            throw new Error("No You.");
        }

        var sum = 0;
        this.find(colName, filter, function(err, cursor) {
            if (err) { callback(0); }

            cursor.each(function(err, doc) {
                if (doc == null) {
                    callback(sum)
                }
                else {
                    sum += parseInt(doc[propName]);
                }
            });
        });
    },
    count_items: function(colName, callback) {
      var sum = 0;
      this.find(colName, null, function(err, cursor) {
        if (err) { callback(0); }

        cursor.each(function(err, doc) {
            if (doc == null) {
                callback(sum)
            }
            else {
                sum += 1;
            }
        });
      });
    },
    _end: null
};
exports = module.exports = new Database();

