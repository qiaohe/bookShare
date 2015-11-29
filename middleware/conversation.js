'use strict';
var redis = require('./redisClient');
var Promise = require('bluebird');
function Conversation(sender, receiver) {
    this.sender = sender;
    this.receiver = receiver;
}
Conversation.prototype.myConversationKey = function () {
    return 'uid:' + this.sender + ':cs';
};

Conversation.prototype.receiverConversationKey = function () {
    return 'uid:' + this.receiver + ':cs';
};

Conversation.prototype.getMessageKey = function (callback) {
    var result = 'uid:' + this.sender + ':' + this.receiver;
    var that = this;
    return new Promise(function (fulfill, reject) {
        redis.existsAsync(result).then(function (reply) {
            if (reply) fulfill(result);
            fulfill('uid:' + that.receiver + ':' + that.sender);
        });
    });
};

module.exports = Conversation;