'use strict';
console.log(new Date().getTime());
var restify = require('restify');
var config = require('./config');
var router = require('./middleware/route');
var auth = require('./middleware/auth');
var logger = require('./middleware/logger');
var server = restify.createServer(config.server);
restify.CORS.ALLOW_HEADERS.push('Access-Control-Allow-Origin');
server.use(restify.CORS());
server.opts(/.*/, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
    res.send(200);
    return next();
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.dateParser());
server.use(restify.queryParser({
    mapParams: false
}));
server.use(restify.gzipResponse());
server.use(restify.bodyParser());
server.use(logger());
server.use(auth());
router.route(server);
process.on('uncaughtException', function (err) {
    console.log(err);
});
server.listen(config.server.port, config.server.host, function () {
    console.log('%s listening at %s', server.name, server.url);
});
