"use strict";
var config = require('../../config');
var redis = require('../../middleware/redisClient');
var memberDAO = require('../dao/memberDAO');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var i18n = require('../../i18n/localeMessage');
var _ = require('lodash');
module.exports = {
    getFriends: function (req, res, next) {
        var uid = req.user.id;
        var from = +req.query.from;
        var to = +req.query.from + (+req.query.size) - 1;
        redis.zrangeAsync([`uid:${uid}:friends`, from, to]).then(function (friendIdList) {
            return friendIdList.length ? memberDAO.findByIds(friendIdList.join(',')) : [];
        }).then(function (friends) {
            return res.send({ret: 0, data: friends})
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
                redis.zaddAsync([`uid:${uid}:friends`, new Date().getTime(), friendUid]);
                return redis.zaddAsync([`uid:${friendUid}:friends`, new Date().getTime(), uid]);
            } else {
                var smsConfig = config.sms;
                var option = _.assign(smsConfig.option, {
                    mobile: req.params.mobile,
                    content: config.app.inviteTemplate
                });
                request.postAsync({url: smsConfig.providerUrl, form: option});
                return redis.zaddAsync([`${mobile}:inviters`, new Date().getTime(), uid]);
            }
        }).then(function () {
            res.send({ret: 0, message: i18n.get('friend.add.success')});
        });
        return next();
    },
    getFriend: function (req, res, next) {
        var friendId = req.params.friendId;
        memberDAO.findByIds(friendId).then(function (members) {
            if (!members.length) return res.send({ret: 0, data: []});
            return res.send({ret: 0, data: members[0]});
        });
        return next();
    }
}