'use strict';

module.exports = {
    server: {
        name: 'book share ',
        version: '0.0.1',
        host: 'localhost',
        port: 8081
    },
    db: {
        host: 'mobile.gengyaochina.com',
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
        tokenExpire: 1440,
        crawlerUrl: 'https://api.douban.com/v2/book/isbn/::ISBN',
        inviteTemplate: '【手绢】亲，我在用“手绢”和朋友分享图书。你也来试一试吧：http://itunes.apple.com/01294'
    },
    redis: {
        host: '115.28.181.99',
        port: 6379,
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
        ak: "Q9zN22SLeuoEXwnISamjpj5_EVlrFv9QhLIrA1mb",
        sk: "SdzJd145VGHpyHPjLJHV8DKElvv4usSu6rf4Hj5w",
        prefix: "http://7xlj3g.com1.z0.glb.clouddn.com/"
    },
    jpush: {
        masterSecret: "e77461a38257ec2049387a04",
        appKey: "0fce1f73a7ac164ca3e09dc7"
    }
};

