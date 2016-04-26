"use strict";
var md5 = require('md5');
var jwt = require("jsonwebtoken");
var config = require('../../config');
var redis = require('../../middleware/redisClient');
var memberDAO = require('../dao/memberDAO');
var i18n = require('../../i18n/localeMessage');
var rongcloudSDK = require('rongcloud-sdk');
rongcloudSDK.init(config.rongcloud.appKey, config.rongcloud.appSecret);
var Promise = require('bluebird');
module.exports = {
    getMemberInfo: function (req, res, next) {
        var uid = req.user.id;
        memberDAO.findById(uid).then(function (members) {
            res.send({ret: 0, data: members[0]});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    register: function (req, res, next) {
        var user = req.body;
        redis.getAsync(user.mobile).then(function (reply) {
            if (!(reply && reply == user.certCode)) {
                throw new Error(i18n.get('sms.code.invalid'));
            }
            delete user.certCode;
            user.createDate = new Date();
            user.password = md5(req.body.password);
            user.nickName = user.nickName ? user.nickName : '书友' + user.mobile.substring(user.mobile.length - 4, user.mobile.length)
        }).then(function () {
            return memberDAO.findByUserName(user.mobile);
        }).then(function (result) {
            if (result.length) throw new Error(i18n.get('user.mobile.exists'))
            return memberDAO.insert(user);
        }).then(function (result) {
            user.id = result.insertId;
            return redis.zrangeAsync([`${user.mobile}:inviters`, 0, -1]);
        }).then(function (inviters) {
            inviters && inviters.forEach(function (inviter) {
                redis.zaddAsync([`uid:${user.id}:friends`, new Date().getTime(), inviter]);
                redis.zaddAsync([`uid:${inviter}:friends`, new Date().getTime(), user.id]);
            });
            config.defaultFriends.forEach(function (friend) {
                redis.zaddAsync([`uid:${user.id}:friends`, new Date().getTime(), friend]);
            });
            var token = jwt.sign(user, config.app.tokenSecret, {expiresInMinutes: config.app.tokenExpire});
            redis.set(token, JSON.stringify(user));
            rongcloudSDK.user.getToken(user.id, user.mobile, user.headPic, function (err, resultText) {
                if (err) throw err;
                return res.send({uid: user.id, token: token, rongCloudToken: JSON.parse(resultText).token});
            });
        }).catch(function (err) {
            res.send({ret: 0, message: err.message});
        })
        return next();
    },

    login: function (req, res, next) {
        var userName = (req.body && req.body.username) || (req.query && req.query.username);
        var password = (req.body && req.body.password) || (req.query && req.query.password);
        memberDAO.findByUserName(userName).then(function (members) {
            if (!members || !members.length) return res.send({ret: 1, message: i18n.get('member.not.exists')});
            var member = members[0];
            if (member.password != md5(password)) return res.send({
                ret: 0, message: i18n.get('member.password.error')
            });
            var token = jwt.sign(member, config.app.tokenSecret, {expiresInMinutes: config.app.tokenExpire});
            redis.set(token, JSON.stringify(member));
            member.token = token;
            rongcloudSDK.user.getToken(member.id, member.nickName, member.headPic, function (err, resultText) {
                if (err) throw err;
                member.rongCloudToken = JSON.parse(resultText).token;
                res.send({ret: 0, data: member})
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    logout: function (req, res, next) {
        var token = req.body.token || req.query.token || req.headers['token'];
        if (!token) return res.send(401, i18n.get('token.not.provided'));
        redis.delAsync(token).then(function () {
            res.send({ret: 0, message: i18n.get('logout.success')});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        next();
    },

    update: function (req, res, next) {
        var member = req.body;
        member.id = req.user.id;
        memberDAO.update(member).then(function () {
            return memberDAO.findById(member.id);
        }).then(function (members) {
            return res.send({ret: 0, data: members[0]});
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    },
    resetPwd: function (req, res, next) {
        var mobile = req.body.username;
        var certCode = req.body.certCode;
        var newPwd = req.body.password;
        redis.getAsync(mobile).then(function (reply) {
            if (!(reply && reply == certCode)) return res.send({ret: 0, message: i18n.get('sms.code.invalid')});
            return memberDAO.updatePwd(md5(newPwd), mobile).then(function (result) {
                return memberDAO.findByUserName(mobile);
            }).then(function (users) {
                var token = jwt.sign({
                    name: users[0].name,
                    mobile: users[0].mobile,
                    id: users[0].id
                }, config.app.tokenSecret, {expiresIn: config.app.tokenExpire});
                redis.set(token, JSON.stringify(users[0]));
                res.send({ret: 0, data: {uid: users[0].id, token: token}});
            });
        }).catch(function (err) {
            res.send({ret: 1, message: err.message});
        });
        return next();
    }
}