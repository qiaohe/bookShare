"use strict";
var md5 = require('md5');
var jwt = require("jsonwebtoken");
var config = require('../../config');
var redis = require('../../middleware/redisClient');
var memberDAO = require('../dao/memberDAO');
var i18n = require('../../i18n/localeMessage');
module.exports = {
    getMemberInfo: function (req, res, next) {
        var uid = req.user.id;
        memberDAO.findById(uid).then(function (members) {
            res.send({ret: 0, data: members[0]});
        });
        return next();
    },

    register: function (req, res, next) {
        var user = req.body;
        redis.getAsync(user.mobile).then(function (reply) {
            if (!(reply && reply == user.certCode)) {
                res.send({ret: 0, message: i18n.get('sms.code.invalid')});
                Promise.rejected();
            }
            delete user.certCode;
            user.createDate = new Date();
            user.password = md5(req.body.password);
        }).then(function () {
            return memberDAO.findByUserName(user.mobile);
        }).then(function (result) {
            if (result.length) {
                res.send({ret: 0, message: i18n.get('user.mobile.exists')});
                Promise.rejected();
            }
            return memberDAO.insert(user);
        }).then(function (result) {
            user.id = result.insertId;
            return redis.zrangeAsync([`${user.mobile}:inviters`, 0, -1]);
        }).then(function (inviters) {
            inviters && inviters.forEach(function (inviter) {
                redis.zaddAsync([`uid:${user.id}:friends`, new Date().getTime(), inviter]);
                redis.zaddAsync([`uid:${inviter}:friends`, new Date().getTime(), user.id]);
            });
            var token = jwt.sign(user, config.app.tokenSecret, {expiresInMinutes: config.app.tokenExpire});
            redis.set(token, JSON.stringify(user));
            res.send({uid: user.id, token: token});
        });
        return next();
    },

    login: function (req, res, next) {
        var userName = (req.body && req.body.username) || (req.query && req.query.username);
        var password = (req.body && req.body.password) || (req.query && req.query.password);
        memberDAO.findByUserName(userName).then(function (members) {
            if (!members || !members.length) return res.send({ret: 0, message: i18n.get('member.not.exists')});
            var member = members[0];
            if (member.password != md5(password)) return res.send({
                ret: 0, message: i18n.get('member.password.error')
            });
            var token = jwt.sign(member, config.app.tokenSecret, {expiresInMinutes: config.app.tokenExpire});
            redis.set(token, JSON.stringify(member));
            member.token = token;
            res.send({ret: 0, data: member});
        });
        return next();
    },
    logout: function (req, res, next) {
        var token = req.body.token || req.query.token || req.headers['token'];
        if (!token) return res.send(401, i18n.get('token.not.provided'));
        redis.delAsync(token).then(function () {
            res.send({ret: 0, message: i18n.get('logout.success')});
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
        });
        return next();
    }

}