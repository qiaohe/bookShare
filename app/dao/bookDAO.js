"use strict";
var db = require(process.cwd() + '/middleware/db');
var sqlMapping = require('./sqlMapping');
module.exports = {
    insert: function (book) {
        return db.query(sqlMapping.book.insert, book);
    },
    findByIsbn: function (isbn) {
        return db.query(sqlMapping.book.findByIsbn, [isbn, isbn]);
    },
    findById: function (bookId) {
        return db.query(sqlMapping.book.findById, bookId);
    },
    findByIds: function (idList) {
        var sql = sqlMapping.book.findByIds.replace(/\?/g, idList);
        return db.query(sql);
    },
    search: function (keyWords) {
        return db.query(sqlMapping.book.search, '%' + keyWords + '%');
    }
}