"use strict";
var redis = require('../../middleware/redisClient');
var i18n = require('../../i18n/localeMessage');
var memberDAO = require('../dao/memberDAO');
var bookDAO = require('../dao/bookDAO');
var md5 = require('md5');
var Promise = require("bluebird");
module.exports = {
    addTag: function (req, res, next) {
        var type = req.body.type;
        var uid = req.user.id;
        var queue = type == 'book' ? [`book:${req.body.bookId}:tags`] : [`friend:${req.body.friendId}:tags`];
        var uidQueue = type == 'book' ? [`uid:${uid}:book:tags`] : [`uid:${uid}:friend:tags`];
        var options = [];
        req.body.tags.forEach(function (tag) {
            options.push(new Date().getTime(), tag);
            redis.zadd('tags:' + md5(tag) + ':' + type + 's', new Date().getTime(), type == 'book' ? req.body.bookId : req.body.friendId);
        });
        redis.zaddAsync(queue.concat(options)).then(function (reply) {
            return redis.zaddAsync(uidQueue.concat(options));
        }).then(function (reply) {
            res.send({ret: 0, message: i18n.get('tag.add.success')});
        });
        return next();
    },

    removeTag: function (req, res, next) {
        var type = req.body.type;
        var uid = req.user.id;
        var queue = type == 'book' ? [`book:${req.body.bookId}:tags`] : [`friend:${req.body.friendId}:tags`];
        var uidQueue = type == 'book' ? [`uid:${uid}:book:tags`] : [`uid:${uid}:friend:tags`];
        req.body.tags.forEach(function (tag) {
            redis.zrem('tags:' + md5(tag) + ':' + type + 's', type == 'book' ? req.body.bookId : req.body.friendId);
        });
        redis.zremAsync(queue.concat(req.body.tags)).then(function (reply) {
            return res.send({ret: 0, message: i18n.get('tag.remove.success')});
        });
        return next();
    },

    getTags: function (req, res, next) {
        var uid = req.user.id;
        var type = req.params.type;
        redis.zrangeAsync([`uid:${uid}:${type}:tags`, 0, -1]).then(function (tags) {
            return res.send({ret: 0, data: tags});
        });
        return next();
    },

    getTagsOfBook: function (req, res, next) {
        var bookId = req.params.bookId;
        redis.zrangeAsync([`book:${req.params.bookId}:tags`, 0, -1]).then(function (tags) {
            return res.send({ret: 0, data: tags});
        });
        return next();
    },

    removeBookTag: function (req, res, next) {
        var uid = req.user.id;
        var uidQueue = [`uid:${uid}:book:tags`];
        redis.zremAsync(uidQueue.concat(req.body.tags)).then(function (reply) {
            return res.send({ret: 0, message: i18n.get('tag.book.remove.success')});
        });
        return next();
    },

    search: function (req, res, next) {
        var uid = req.user.id;
        var type = req.params.type;
        var keyWords = req.query.q;
        var uidQueue = type == 'book' ? [`uid:${uid}:book:tags`] : [`uid:${uid}:friend:tags`];
        redis.zrangeAsync([`uid:${uid}:${type}:tags`, 0, -1]).then(function (tags) {
            if (tags && tags.indexOf(keyWords, 0) > -1) {
                return redis.zrangeAsync('tags:' + md5(keyWords) + ':' + type + 's', 0, -1).then(function (reply) {
                    if (!reply.length) return res.send({ret: 0, data: []});
                    return type == 'book' ? bookDAO.findByIds(reply.join(',')) : memberDAO.findByIds(reply.join(','));
                });
            } else {
                return type == 'book' ? bookDAO.search(keyWords) : memberDAO.search(keyWords);
            }
        }).then(function (result) {
            Promise.map(result, function (book) {
                if (type == 'book') {
                    return redis.zrangeAsync([`book:${book.id}:owners`, 0, -1]).then(function (ownerIdList) {
                        return memberDAO.findByIds(ownerIdList.join(','));
                    }).then(function (owners) {
                        book.owners = owners;
                    });
                } else {
                    return redis.zrankAsync(`uid:${uid}:friends`, book.id).then(function (reply) {
                        book.isFriends = reply > -1;
                    });
                }
            }).then(function () {
                return res.send({ret: 0, data: result});
            });
        });
        return next();
    }
}