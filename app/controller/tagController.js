"use strict";
var redis = require('../../middleware/redisClient');
var i18n = require('../../i18n/localeMessage');
module.exports = {
    addTag: function (req, res, next) {
        var uid = req.user.id;
        var options = [`uid:${uid}:tags`];
        req.params.tags.forEach(function (tag) {
            options.push(new Date().getTime(), tag);
        });
        redis.zaddAsync(options).then(function () {
            res.send({ret: 0, message: i18n.get('tag.add.success')});
        });
        return next();
    },

    getTags: function (req, res, next) {
        var uid = req.user.id;
        redis.zrangeAsync([`uid:${uid}:tags`, 0, -1]).then(function(tags){
            return res.send({ret: 0, data: tags});
        });
        return next();
    },
    addTagForBook(req, res, next) {
        var bookId = req.params.bookId;
        var options = [`book:${bookId}:tags`];
        req.params.tags.forEach(function (tag) {
            options.push(new Date().getTime(), tag);
        });
        redis.zaddAsync(options).then(function () {
            res.send({ret: 0, message: i18n.get('tag.add.success')});
        });
        return next();
    },
    getTagsForBook(req, res, next){
        var bookId = req.params.bookId;
        redis.zrangeAsync([`book:${bookId}:tags`, 0, -1]).then(function(tags){
           return res.send({ret: 0, data: tags});
        });
        return next();
    }
}