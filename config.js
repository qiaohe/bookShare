'use strict';

module.exports = {
    server: {
        name: 'book share ',
        version: '0.0.1',
        host: '121.42.171.213',
        port: 8082
    },
    db: {
        host: '127.0.0.1',
        port: '3306',
        user: 'root',
        password: 'heqiao75518',
        debug: false,
        multipleStatements: true,
        database: 'bookShare'
    },
    app: {
        locale: 'zh_CN',
        tokenSecret: 'ilovescotchyscotch',
        tokenExpire: 1440000,
        crawlerUrl: 'https://api.douban.com/v2/book/isbn/::ISBN',
        inviteTemplate: '【手绢】亲，我在用“手绢”和朋友分享图书。你也来试一试吧：http://www.goodoong.com. :signature'
    },
    redis: {
        host: '127.0.0.1',
        port: 6381
    },
    sms: {
        providerUrl: 'https://sms.yunpian.com/v1/sms/send.json',
        template: '【手 绢】您的短信验证码是:code,在30分钟内输入有效。',
        expireTime: 1800000,
        apikey: '410ac09436843c0270f513a0d84802cc'
    },
    qiniu: {
        ak: "ZNrhKtanGiBCTOPg4XRD9SMOAbLzy8iREzQzUP5T",
        sk: "L6VfXirR55Gk6mQ67Jn4pg7bksMpc-F5mghT0GK4",
        prefix: "http://7xqmlo.com2.z0.glb.qiniucdn.com/"
    },
    jpush: {
        masterSecret: "e77461a38257ec2049387a04",
        appKey: "0fce1f73a7ac164ca3e09dc7"
    },
    template: {
        bookUnavailable: "亲，不好意思，《:title》暂时不能借给你，如需更多信息请留言给我。谢谢！。",
        share: "我分享一本书给您，书名为:\<a href='#/tab/book/:bookId'>:title<br/><img src=\":image\"/\>\<\/a\>"
    },
    rongcloud: {
        appKey: 'pgyu6atqy0lru',
        appSecret: 'VoilfGpj40m'
    },
    defaultFriends: [2, 5, 6]

};

