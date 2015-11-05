"use strict";
var db = require(process.cwd() + '/middleware/db');
var sqlMapping = require('./sqlMapping');
module.exports = {
    findById: function (uid) {
        return db.query(sqlMapping.user.findById, uid);
    },
    insert: function (member) {
        return db.query(sqlMapping.user.insert, member);
    },
    findByUserName: function (userName) {
        return db.query(sqlMapping.user.findByName, userName);
    },
    findByIds: function (idList) {
        var sql = sqlMapping.user.findByIds.replace(/\?/g, idList);
        return db.query(sql);
    },
    update: function (member) {
        return db.query(sqlMapping.user.update, [member, member.id]);
    }

}