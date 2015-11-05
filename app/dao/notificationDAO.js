"use strict";
var db = require(process.cwd() + '/middleware/db');
var sqlMapping = require('./sqlMapping');
module.exports = {
    insert: function (notification) {
        return db.query(sqlMapping.notification.insert, notification);
    }
}