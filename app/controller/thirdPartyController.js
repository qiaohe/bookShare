"use strict";
var config = require('../../config');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var redis = require('../../middleware/redisClient');
var _ = require('lodash');
var i18n = require('../../i18n/localeMessage');
var qiniu = require('qiniu');
module.exports = {
    sendSMS: function (req, res, next) {
        var smsConfig = config.sms;
        var code = _.random(1000, 9999);
        var content = smsConfig.template.replace('#code#', code);
        var option = {mobile: req.params.mobile, text: content, apikey: config.sms.apikey};
        request.postAsync({url: smsConfig.providerUrl, form: option}).then(function (response, body) {
            console.log(response);
        }).then(function () {
            return redis.set(option.mobile, code);
        }).then(function () {
            return redis.expireAsync(option.mobile, smsConfig.expireTime);
        }).then(function (reply) {
            res.send({ret: 0, message: i18n.get('sms.send.success')});
        });
        return next();
    },
    getToken: function (req, res, next) {
        rongcloudSDK.user.getToken(req.body.uid, req.body.nickName, req.body.headPic, function (err, resultText) {
            if (err) throw err;
            res.send({ret: 0, data: JSON.parse(resultText)})
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
    },
    getQiniuToken: function (req, res, next) {
        qiniu.conf.ACCESS_KEY = 'ZNrhKtanGiBCTOPg4XRD9SMOAbLzy8iREzQzUP5T';
        qiniu.conf.SECRET_KEY = 'L6VfXirR55Gk6mQ67Jn4pg7bksMpc-F5mghT0GK4';
        var bucket = 'shoujuan';
        var putPolicy = new qiniu.rs.PutPolicy(bucket);
        putPolicy.expires = 3600;
        res.send({
            token: putPolicy.token()
        });
        return next();
    }
}
