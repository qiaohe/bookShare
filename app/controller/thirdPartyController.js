var config = require('../../config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var redis = require('../../middleware/redisClient');
var _ = require('lodash');
var i18n = require('../../i18n/localeMessage');

module.exports = {
    sendSMS: function (req, res, next) {
        var smsConfig = config.sms;
        var code = _.random(1000, 9999);
        var content = smsConfig.template.replace(':code', code);
        var option = _.assign(smsConfig.option, {mobile: req.params.mobile, content: content});
        request.postAsync({url: smsConfig.providerUrl, form: option}).then(function (response, body) {
        }).then(function () {
            return redis.set(option.mobile, code);
        }).then(function () {
            return redis.expireAsync(option.mobile, smsConfig.expireTime);
        }).then(function (reply) {
            res.send({ret: 0, message: i18n.get('sms.send.success')});
        });
        return next();
    }
}