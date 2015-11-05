"use strict";
var Promise = require('bluebird');
var jwt = Promise.promisifyAll(require("jsonwebtoken"));
var i18n = require('../i18n/localeMessage');
var config = require('../config');
var routeConfig = require('../app/route');
var _ = require('lodash');
var redisClient = require('./redisClient');
function authorizedIfNeeded(req) {
    var routeItem = _.findLast(routeConfig, function (item) {
        var n = item.path.indexOf(':');
        var prefix = n > -1 ? item.path.substring(0, n) : item.path;
        return req.method.toLowerCase().indexOf(item.method) > -1 && req.url.indexOf(prefix) > -1;
    });
    return routeItem && routeItem.secured;
}

function auth() {
    function ensureAuthorized(req, res, next) {
        if (!authorizedIfNeeded(req)) return next();
        var token = req.headers['token'] || req.query.token || req.body.token;
        if (!token) return res.send(403, {ret: 0, message: i18n.get("access.not.authorized")});
        jwt.verifyAsync(token, config.app.tokenSecret).then(function (user) {
            if (user.exp * 1000 <= Date.now()) return res.send({ret: 0, message: i18n.get("token.expired")});
            req.user = user;
        }).then(function () {
            return redisClient.getAsync(token);
        }).then(function (reply) {
            if (!reply) return res.send({ret: 0, message: i18n.get("token.invalid")});
            return next();
        }).catch(function (err) {
            res.send({ret: 0, message: i18n.get("token.expired")});
        });
    }

    return (ensureAuthorized);
}
module.exports = auth;