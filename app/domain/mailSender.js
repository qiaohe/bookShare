var nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport")
var transport = nodemailer.createTransport(smtpTransport({
    host: "smtp.exmail.qq.com",
    port: 465,
    secure: true,
    auth: {
        user: "ben.wang@goodoong.com",
        pass: "null08"
    }
}));
var mailList = 'idgvc@idgvc.com;chenhao@legendcapital.com.cn;helen.chiu@intel.com;info@wiharper.com.cn;vincent.chan@jafcoasia.com;jzhou@sbaif.com;julius@newmargin.com;master@szvc.com.cn;sshen@waldenintl.com;contact@acervc.com.cn;contact@sbcvc.com;george.zhao@morningside.com.cn;contact@tdfcapital.com;info@orchidasia.com;cvcc@c-vcc.com;maggieyi@vertexmgt.com;info@leaguer.com.cn;info@ggvc.com;ding@gsrventures.com;iris.ding@nlightvc.com;ventures@fidelityventures.com;royfan@hqap.com.cn;mayliu@hqap.com.cn;michael@gobi.cn;biz@jovanventures.com;cywang@chinaequity.net;bizplan@tigervc.com partner@tigervc.com;jiaozhen@cdhfund.com;williamhsu@gic.com.sg;enquiry@sihl.com.hk;info@br-china.com;ccp@cdcgroup.com;info@dragon-groove.com;info@hustvc.com.cn hustvc@public.wh.hb.cn;qianhui@bvcc.com.cn;ventures@qualcomm.com;Fortune@fortunevc.com;webmaster@cefund.com;contact@cybernaut.com.cn;gtvc@gtvc.com;jolin@sii.com.cn;info@hinagroup.com;info@sierraventures.com;info@dtcap.com;general@asimco.com.cn;hanxd58@sina.com;zhangw@siic.com;suiljin@public3.sta.net.cn;dingcheng01@163.com;iervc@iervc.com.cn;webmaster@genesis-cap.com;Steven.lou@263.net;USContact@harbingervc.com;asb.vc@alcatel-sbell.com.cn;beijingcapital@beijingcapital.com.cn';

transport.sendMail({
    from: "ben.wang@goodoong.com",
    to: "tusc_heqiao@163.com",
    subject: "图书分享 逼格社交",
    html: "您好!<p>我们的目标：成为中国人晒书、图书分享的高逼格社交平台。</p><p>App现已上线，可以通过我们公司主页的链接下载：www.goodoong.com。</p><p>CEO+CTO+COO都已经到位。</p>",
    attachments: [
        {   // utf-8 string as an attachment
            filename: 'D:/Shou Juan 2016.pdf',
            content: '手绢商业计划书'
        }]
}, function (error, response) {
    if (error) {
        console.log(error);
    } else {
        console.log("Message sent: " + response.message);
    }
    transport.close();
});