var _ = require('underscore');
var fs = require('fs');
var jwt = require('jwt-simple');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var model = {
  verifyUrl:'http://localhost:8080/auth/verifyEmail?token=',
  title:'psJwt',
  subTitle:'Thanks for signing up !',
  body:'Please verify your email address by clicking the button below'
};

exports.sendEmail = function (email) {
  var payload = {
    sub: email
  };
  var token = jwt.encode(payload, "something");
  console.log('email verfification');
  // console.log(getHtml(token));

  // for local mailing option

  // var transporter = nodemailer.createTransport(smtpTransport({
  //   //this varies
  //   host:'datiot.com',
  //   secure:true,
  //   auth:{
  //       user:'abhishek@datiot.com',
  //       pass:'xxxxxxx'
  //     }
  //   }));

  var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'abhishekdhanerwal@gmail.com',
      pass: 'Abhi12345!'
    },
    tls: {rejectUnauthorized: false},
    debug:true
  }));

  var mailOptions = {
    from:' Accounts <accounts@datiot.com',
    to:email,
    subject: 'My App Account Verification',
    html:getHtml(token)
  };

  transporter.sendMail(mailOptions,function (err, info) {
      if(err)
        return res.status(500, err);

      console.log('email sent', info.response);
  })
};

exports.handler = function(req, res){
    var token = req.query.token;
    var payload = jwt.decode(token, "something");

    var email = payload.sub;

  if(!email)
    return handleError(res)

  return res.redirect('http://localhost:8000');
}

function handleError(res) {
  return res.status(401).send({
    message:'Authentication failed, unable to verify email'
  })
}

function getHtml(token) {

  var path = './views/emailVerification.html';
  var html = fs.readFileSync(path, encoding= 'utf8');

  var template = _.template(html);

  model.verifyUrl = model.verifyUrl + token;

  return template(model);

}

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

