"use strict";
var db = require(process.cwd() + '/middleware/db');
var sqlMapping = require('./sqlMapping');
module.exports = {
    findById: function (uid) {
        return db.query(sqlMapping.user.findById, uid);
    },
    findByIdWithProfile: function (uid) {
        return db.query(sqlMapping.user.findByIdWithProfile, uid);
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
    },
    updatePwd: function (pwd, mobile) {
        return db.query(sqlMapping.user.updatePwd, [pwd, mobile]);
    },

    search: function (keyWords) {
        return db.query(sqlMapping.user.search, ['%' + keyWords + '%', '%' + keyWords + '%']);
    }
}