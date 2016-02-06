'use strict';

module.exports = {
    server: {
        name: 'book share ',
        version: '0.0.1',
        host: '115.29.220.81',
        port: 8081
    },
    db: {
        host: '115.29.220.81',
        port: '3306',
        user: 'root',
        password: 'gybill',
        debug: false,
        multipleStatements: true,
        database: 'bookshare'
    },
    app: {
        locale: 'zh_CN',
        tokenSecret: 'ilovescotchyscotch',
        tokenExpire: 1440000,
        crawlerUrl: 'https://api.douban.com/v2/book/isbn/::ISBN',
        inviteTemplate: '【手绢】亲，我在用“手绢”和朋友分享图书。你也来试一试吧：http://itunes.apple.com/01294. :signature'
    },
    redis: {
        host: '115.29.220.81',
        port: 6380,
        password: "gengyaochina2015"
    },
    sms: {
        providerUrl: 'http://115.29.44.189:8080/sms/smsInterface.do',
        template: '【手绢】您的短信验证码是:code,在60秒内输入有效.',
        expireTime: 600,
        option: {
            username: 'tuning',
            password: '111111'
        }
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
        bookUnavailable: "亲，不好意思啊，暂时不能出借《:title》给你，如需更多信息请留言给我。谢谢！。",
        share: "我分享一本书给您，书名为:\<a href='#/tab/book/:bookId'>:title<br/><img src=\":image\"/\>\<\/a\>"
    },
    rongcloud: {
        appKey: 'pgyu6atqy0lru',
        appSecret: 'VoilfGpj40m'
    }
};

