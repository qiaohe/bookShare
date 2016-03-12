'use strict';
var redis = require('../../middleware/redisClient');
var memberDAO = require('../dao/memberDAO');
var Promise = require("bluebird");
var Conversation = require('../../middleware/conversation');
var _ = require('lodash');
var config = require('../../config');
var moment = require('moment');
function getMessage(uid, message, callback) {
    var result = {date: new Date(), sender: uid, message: message};
    memberDAO.findById(uid).then(function (users) {
        if (!users || !users.length) callback(null);
        if (users && users.length) callback(_.assign(result, {
            nickname: users[0].nickName,
            headPic: users[0].headPic
        }));
    }).catch(function (err) {
        res.send({ret: 1, message: err.message});
    });
}

function getConversationList(uid, conversationUsers, cb) {
    Promise.map(conversationUsers, function (user) {
        var con = new Conversation(uid, user.id);
        return con.getMessageKey().then(function(messageKey) {
           return redis.getAsync(messageKey + ':l').then(function (lastMessage) {
                var m = JSON.parse(lastMessage);
                user.lastMessage = m.message;
                user.date = m.d;
                return redis.getAsync(messageKey + ':u:' + uid);
            }).then(function (unreadCount) {
                user.unreadCount = unreadCount ? unreadCount : 0;
               return user;
            });
        })
    }).then(function (conversationUsers) {
        cb(null, conversationUsers);
    }).catch(function (err) {
        res.send({ret: 1, message: err.message});
    });
}

module.exports = {
    send: function (req, res, next) {
        var uid = req.user.id;
        var receiverId = req.body.receiverId;
        var message = req.body.message;
        var con = new Conversation(uid, receiverId);
        redis.zadd(con.myConversationKey(), new Date().getTime(), receiverId);
        redis.zadd(con.receiverConversationKey(), new Date().getTime(), uid);
        con.getMessageKey().then(function(messageKey) {
            redis.set(messageKey + ':l', JSON.stringify({d: new Date().getTime(), message: message}));
            redis.incr(messageKey + ':u:' + receiverId);
            getMessage(uid, message, function (body) {
                redis.zadd(messageKey, new Date().getTime(), JSON.stringify(body));
                res.send({ret: 0, message: body});
            })
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        next();
    },
    getConversationWithFriendId: function (req, res, next) {
        var uid = req.user.id;
        var con = new Conversation(uid, req.params.friendId);
        con.getMessageKey().then(function(messageKey) {
            redis.set(messageKey + ':u:' + uid, 0);
            var d1 = +req.query.d + 1;
            var d2 = moment(+req.query.d).add(-12, 'M').toDate().getTime();
            redis.zrevrangebyscoreAsync(messageKey, d1, d2, 'LIMIT', 0, 20).then(function (messages) {
                var data = _.forEach(messages, function (message, index) {
                    messages[index] = JSON.parse(message);
                });
                res.send({ret: 0, data: data.reverse()});
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        next();
    },
    getConversationWithFriendIdAfter: function (req, res, next) {
        var uid = req.user.id;
        var con = new Conversation(uid, req.params.friendId);
        con.getMessageKey().then(function(messageKey) {
            redis.set(messageKey + ':u:' + uid, 0);
            var d1 = +req.query.d + 1;
            var d2 = moment(+req.query.d).add(12, 'M').toDate().getTime();
            redis.zrangebyscoreAsync(messageKey, d1, d2, 'LIMIT', 0, 20).then(function (messages) {
                var data = _.forEach(messages, function (message, index) {
                    messages[index] = JSON.parse(message);
                });
                res.send({ret: 0, data: data});
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        next();
    },
    getConversations: function (req, res, next) {
        var uid = req.user.id;
        redis.zrangeAsync(['uid:' + uid + ':cs', 0, -1]).then(function (users) {
            if (!users || !users.length) return res.send({ret: 0, data: {}});
            memberDAO.findByIds(users.join(',')).then(function (conversationUsers) {
                getConversationList(uid, conversationUsers, function (err, data) {
                    if (err) throw err;
                    res.send({ret: 0, data: data});
                });
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        next();
    },

    getUnreadMessageCount: function (req, res, next) {
        var uid = req.user.id;
        var results = [];
        redis.zrangeAsync(['uid:' + uid + ':cs', 0, -1]).then(function (users) {
           return Promise.map(users, function (user) {
                var con = new Conversation(uid, user);
                return con.getMessageKey().then(function(messageKey) {
                   return redis.getAsync(messageKey + ':u:' + uid).then(function (unreadCount) {
                        results.push(unreadCount);
                    });
                }).then(function () {
                    res.send({ret: 0, data: _.sum(results)});
                });
            })
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        next();
    }
}
