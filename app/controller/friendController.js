"use strict";
var config = require('../../config');
var redis = require('../../middleware/redisClient');
var memberDAO = require('../dao/memberDAO');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var i18n = require('../../i18n/localeMessage');
var _ = require('lodash');
var messageSender = require('../domain/messageSender');
module.exports = {
    getFriends: function (req, res, next) {
        var uid = req.user.id;
        var from = +req.query.from;
        var to = +req.query.from + (+req.query.size) - 1;
        redis.zrangeAsync([`uid:${uid}:friends`, from, to]).then(function (friendIdList) {
            return friendIdList.length ? memberDAO.findByIds(friendIdList.join(',')) : [];
        }).then(function (friends) {
            return res.send({ret: 0, data: friends})
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    addFriend: function (req, res, next) {
        var uid = req.user.id;
        var mobile = req.body.mobile;
        memberDAO.findByUserName(mobile).then(function (members) {
            if (members.length) {
                var friendUid = members[0].id;
                if (friendUid == uid) return res.send({ret: 0, message: i18n.get('friends.add.same.error')});
                return redis.zaddAsync([`uid:${uid}:friends`, new Date().getTime(), friendUid]).then(function () {
                    messageSender.send(uid, friendUid, '我想和你成为好友，互相晒书或者分享图书，如果可以，点击这条留言，我们可以就可以看见对方的图书了。');
                    return redis.zaddAsync([`uid:${friendUid}:friends`, new Date().getTime(), uid]);
                });
            } else {
                var smsConfig = config.sms;
                var option = _.assign(smsConfig.option, {
                    mobile: req.params.mobile,
                    content: config.app.inviteTemplate.replace(':signature', req.user.mobile + ', ' + req.user.nickName)
                });
                request.postAsync({url: smsConfig.providerUrl, form: option});
                return redis.zaddAsync([`${mobile}:inviters`, new Date().getTime(), uid]);
            }
        }).then(function () {
            res.send({ret: 0, message: i18n.get('friend.add.success')});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },

    //deleteFriend: function (req, res, next) {
    //    var uid = req.user.id;
    //    var friendUid = req.params.id;
    //    redis.zrem(`uid:${uid}:friends`, friendUid);
    //    redis.zrem(`uid:${friendUid}:friends`, uid);
    //    res.send({ret: 0, message: '删除好友成功'});
    //    return next();
    //},

    removeFriend: function (req, res, next) {
        var uid = req.user.id;
        var friendUid = req.params.id;
        redis.zrangeAsync(`uid:${uid}:public.books`, 0, -1).then(function (books) {
            Promise.map(books, function (bookId) {
                return redis.zremAsync(`book:${bookId}:borrowing.users`, friendUid);
            }).then(function () {
                return redis.zremAsync([`uid:${uid}:friends`, friendUid]);
            }).then(function () {
                return redis.zremAsync([`uid:${friendUid}:friends`, uid]);
            }).then(function () {
                return redis.delAsync(`uid:${uid}:cs`);
            }).then(function () {
                return redis.delAsync(`uid:${friendUid}:cs`);
            }).then(function () {
                return redis.delAsync(`uid:${uid}:cs`);
            }).then(function () {
                res.send({ret: 0, message: i18n.get('friend.remove.success')});
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    getFriend: function (req, res, next) {
        var friendId = req.params.friendId;
        memberDAO.findByIds(friendId).then(function (members) {
            if (!members.length) return res.send({ret: 0, data: []});
            return res.send({ret: 0, data: members[0]});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}