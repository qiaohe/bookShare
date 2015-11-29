'use strict';
var redis = require('../../middleware/redisClient');
var Conversation = require('../../middleware/conversation');
var memberDAO = require('../dao/memberDAO');
var _ = require('lodash');

function getMessage(uid, message, callback) {
    var result = {date: new Date(), sender: uid, message: message};
    memberDAO.findById(uid).then(function (users) {
        if (!users || !users.length) callback(null);
        if (users && users.length) callback(_.assign(result, {
            nickname: users[0].nickName,
            headPic: users[0].headPic
        }));
    });
}
module.exports = {
    send: function (uid, receiverId, message) {
        var con = new Conversation(uid, receiverId);
        redis.zadd(con.myConversationKey(), new Date().getTime(), receiverId);
        redis.zadd(con.receiverConversationKey(), new Date().getTime(), uid);
        con.getMessageKey().then(function (messageKey) {
            redis.set(messageKey + ':l', JSON.stringify({d: new Date().getTime(), message: message}));
            redis.incr(messageKey + ':u:' + receiverId);
            getMessage(uid, message, function (body) {
                redis.zadd(messageKey, new Date().getTime(), JSON.stringify(body));
            })
        });
    }
}