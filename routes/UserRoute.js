var _ = require('lodash');
var jwt = require('jwt-simple');
var moment = require('moment');
var User = require('../models/User');
var userRole = require('../enums/user_role');

var request = require('request');

var multer = require('multer');

var randomstring = require('randomstring');

var mongoose = require('mongoose');

var emailVerification = require('../services/emailVerification');

var nodemailer = require("nodemailer");
var transporter = require('nodemailer-smtp-transport');


module.exports = function(app) {

    var smtpTransport = nodemailer.createTransport(transporter({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'crackthecrock@gmail.com',
            pass: 'Crock989crack'
        },
        tls: {rejectUnauthorized: false},
        debug:true
    }));

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/user')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            // console.log('file upload');
            // console.log(file);
            // console.log(file.fieldname);
            // console.log(file.originalname);
            if(file.originalname.split('%').length > 0){
                cb(null, file.fieldname + '-' + datetimestamp + '.jpg')
            }
            else
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        }
    });
    var upload = multer({ //multer settings
        storage: storage
    }).single('file');

    /** API path that will upload the files */
    app.post('/user/upload', function(req, res) {
        upload(req,res,function(err){
                if(err){
                    res.json({error_code:1,err_desc:err});
                    return;
                }
                // console.log(req.file.path)
                res.json({error_code:0,err_desc:null,file:req.file});
            })
    });

  app.post('/register', function (req, res) {

    var userFromUi = req.body;

    if(verifyUserObject(userFromUi , res)){

            User.findOne({mobile: userFromUi.mobile}, function (err, user) {
                if (err)
                    res.status(400).send({
                        message: 'Server error',
                        error: err
                    });
                // throw err;

                if (user)
                    return res.status(400).send({message: 'Mobile already used'});

                if(userFromUi.name.length>3){
                    var referral = userFromUi.name.substring(0, 3) + userFromUi.mobile.toString().substring(6,10);
                }
                else {
                    var referral = userFromUi.name  + userFromUi.mobile.toString().substring(6,10);
                }

                var newUser = new User({
                    name: userFromUi.name,
                    email: userFromUi.email,
                    mobile: userFromUi.mobile,
                    password: userFromUi.password,
                    newPassword: userFromUi.password,
                    referralCode: referral,
                    state: userFromUi.state,
                    city: userFromUi.city,
                    role:userFromUi.role,
                    dateOfBirth: userFromUi.dateOfBirth,
                    fbLogin:false,
                    googleLogin:false,
                    points:30
                });

                newUser.save(function (err) {
                    if (err)
                        res.status(400).send({
                            message: 'Server error',
                            error: err
                        });
                    // throw err;
                    else {
                        if(userFromUi.referralCode){
                            User.findOne({referralCode:userFromUi.referralCode.toUpperCase()} ,function (err , user) {
                                if (err)
                                    res.status(400).send({
                                        message: 'Server error',
                                        error: err
                                    })
                                else {
                                    if(user){
                                        user.points = user.points + 20;

                                        var historyObj = {};
                                        historyObj.date = new Date();
                                        historyObj.pointsAdded = 'Referral from '+ userFromUi.name;
                                        historyObj.amount = 20;

                                        user.history.push(historyObj);
                                        user.save(function (err) {
                                            if (err)
                                                res.status(400).send({
                                                    message: 'Server error',
                                                    error: err
                                                })
                                            else
                                                createSendToken(newUser, res);
                                        })
                                    }
                                    else
                                        createSendToken(newUser, res);
                                }
                            })
                        }
                        else
                            createSendToken(newUser, res);
                    }


                    // var url = 'https://instantalerts.co/api/web/send/?apikey=69iq54a4m4s4ib0agg135o3y0yfbkbmbu&sender=SEDEMO&to=' + newUser.mobile + '&message= Your password is - secret &format=json';
                    //
                    // console.log(url)
                    // request.post(url, function (error, response, body) {
                    //     console.log('error:', error); // Print the error if one occurred
                    //     console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    //     console.log('body:', body); // Print the HTML for the Google homepage.
                    // });
                })
            })
    };
  });

  app.put('/referral/signup', function (req , res) {
      console.log(req.body)
      if(verifyUser(req , res)) {
          User.findOne({referralCode:req.body.referral.toUpperCase()} ,function (err , user) {
              if (err)
                  res.status(400).send({
                      message: 'Server error',
                      error: err
                  })
              else {
                  if(user){
                      user.points = user.points + 20;

                      var historyObj = {};
                      historyObj.date = new Date();
                      historyObj.pointsAdded = 'Referral from '+ req.body.name;
                      historyObj.amount = 20;

                      user.history.push(historyObj);
                      user.save(function (err) {
                          if (err)
                              res.status(400).send({
                                  message: 'Server error',
                                  error: err
                              })
                          else
                              res.json({message: 'Referral successfully applied'});
                      })
                  }
                  else
                      res.status(400).send({
                          message: 'Wrong referral code'
                      });
              }
          })
      }
  });


    function generateCouponCode(callback) {
        var couponCode = randomstring.generate(7);

        Dietitian.findOne({couponCode:couponCode}, function (err, dietitian) {
            if (err)
                res.status(400).send({
                    message: 'E-mail is wrong',
                    error: err
                });
            // throw err;

            if (dietitian)
                generateCouponCode();
            else
                callback(couponCode);
        })
    }


  app.post('/login', function (req, res) {

    req.user = req.body;

    var errs = [];

    if(!req.user.mobile)
      errs.push('Mobile is required');
    if(!req.user.password)
      errs.push('Password is required');

    if(errs.length > 0)
      res.status(400).send({message: 'Validation error', error:errs});
    else {

      User.findOne({mobile: req.user.mobile}, function (err, user) {
          if (err)
              res.status(400).send({
                  message: 'Error in finding mobile',
                  error: err
              });
          // throw err;

          if (user) {
              user.comparePassword(req.user.password, function (err, isMatch) {
                  if (err)
                      res.status(400).send({
                          message: 'Error in comparing password',
                          error: err
                      });
                  // throw err;

                  if (!isMatch){
                      user.compareNewPassword(req.user.password, function (err, isMatch) {
                          if (err)
                              res.status(400).send({
                                  message: 'Error in comparing password',
                                  error: err
                              });
                          // throw err;

                          if (!isMatch){
                              return res.status(400).send({message: 'Wrong password'});
                          }
                          else {
                              user.password = req.user.password;
                              user.save(function (err) {
                                  if (err)
                                      res.status(400).send({
                                          message: 'Server error',
                                          error: err
                                      });
                                  // throw err;
                                  else
                                      createSendToken(user, res);
                              })
                          }
                      });
                  }
                  else
                   createSendToken(user, res);
              });
          }
          else
              return res.status(400).send({message: 'Wrong mobile number'});
      })
    }
  });

    app.post('/login/fb', function (req , res) {
        var fbLogin = req.body;

        User.findOne({email: fbLogin.email}, function (err , user) {
            if (err) {
                res.json({message: 'error during find user', error: err});
            };
            if (user) {
                createSendToken(user, res);
            }
            else {
                var newUser = new User({
                    name: fbLogin.name,
                    email: fbLogin.email,
                    profilePic: fbLogin.profilePic,
                    mobile: '**********',
                    password: 'secret',
                    state: 'Facebook',
                    city: 'fb',
                    role:fbLogin.role,
                    dateOfBirth: fbLogin.dateOfBirth,
                    fbLogin:true,
                    googleLogin:false,
                    points:30
                });

                newUser.save(function (err) {
                    if (err)
                        res.status(400).send({
                            message: 'Server error',
                            error: err
                        });
                    // throw err;
                    else
                        createSendToken(newUser, res);
                })
            }
        })
    })

    app.post('/login/google', function (req , res) {
        var googleLogin = req.body;

        User.findOne({email: googleLogin.email}, function (err , user) {
            if (err) {
                res.json({message: 'error during find user', error: err});
            };
            if (user) {
                createSendToken(user, res);
            }
            else {
                var newUser = new User({
                    name: googleLogin.name,
                    email: googleLogin.email,
                    profilePic: googleLogin.profilePic,
                    mobile: '**********',
                    password: 'secret',
                    state: 'Google',
                    city: 'google',
                    role:googleLogin.role,
                    dateOfBirth: googleLogin.dateOfBirth,
                    fbLogin:false,
                    googleLogin:true,
                    points:30
                });

                newUser.save(function (err) {
                    if (err)
                        res.status(400).send({
                            message: 'Server error',
                            error: err
                        });
                    // throw err;
                    else
                        createSendToken(newUser, res);
                })
            }
        })
    })

    app.put('/user/updatePassword/:id', function (req, res) {
        if(verifyUser(req , res)) {
            User.findById(req.params.id , function (err , user) {
                if (err) {
                    res.json({message: 'error during find user', error: err});
                };
                if (user) {
                    user.comparePassword(req.body.password, function (err, isMatch) {
                        if (err)
                            res.status(400).send({
                                message: 'Error in comparing password',
                                error: err
                            });
                        // throw err;

                        if (!isMatch)
                            return res.status(400).send({message: 'Current password wrong'});
                        else {
                            user.password = req.body.newPassword;
                            user.save(function (err) {
                                if (err)
                                    res.status(400).send({
                                        message: 'Error in saving new password',
                                        error: err
                                    });
                                // throw err;
                                else
                                    res.json({message:'Password updated successfully'})
                            })
                        }
                })
                }
            })
        }
    });

    app.get('/user/details/:id', function (req, res) {
        if(verifyUser(req , res)) {
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    res.json({message: 'error during find user', error: err});
                };
                if (user) {
                    res.json({message: 'User found successfully', user:user})
                } else {
                    res.json({info: 'User not found'});
                }
            })
        }
    });

    app.put('/user/updateDetails/:id' , function (req, res) {
        if(verifyUser(req , res)) {
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    res.json({message: 'error during find user', error: err});
                };
                if (user) {
                    _.merge(user, req.body);
                    user.save(function(err) {
                        if (err) {
                            res.json({message: 'error during user update', error: err});
                        };
                        res.json({message: 'User updated successfully'});
                    });
                } else {
                    res.json({info: 'User not found'});
                }
            })
        }

    })

    app.post('/user/support/:id', function (req, res) {

        if(verifyUser(req , res)) {
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    res.json({message: 'error during find user', error: err});
                };
                if (user) {
                    var mailOptions = {
                        to: 'crackthecrock@gmail.com',
                        subject: req.body.subject,
                        text: req.body.description + ' via  EMAIL - ' +  user.email
                    }
                    // console.log(mailOptions);
                    smtpTransport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            res.json({message: 'Mail cant be sent', error: error});
                        } else {
                            res.json({message: 'Mail sent'});
                        }
                    });
                }
                else
                    res.json({info: 'User not found'});
            })
        }
    });

    app.post('/forgotPassword' , function (req, res) {
        User.findOne({mobile: req.query.phoneNo},function (err, user) {
            if (err) {
                res.json({message: 'error during find user', error: err});
            };
            if (user) {
                var newPassword = randomstring.generate(7);
                var mailOptions = {
                    to: user.email,
                    subject: 'New Password',
                    text: 'Your new password is - '+ newPassword
                }
                // console.log(mailOptions);
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        res.json({message: 'Mail cant be sent', error: error});
                    } else {
                        user.newPassword = newPassword;
                        user.save(function (err) {
                            if (err)
                                res.status(400).send({
                                    message: 'Server error',
                                    error: err
                                });
                            else
                                res.json({message: 'Mail sent'});
                        })

                    }
                });
            }
            else
                res.status(400).send({message: 'Mobile number incorrect'});
        })
    })

    app.get('/user/list', function (req, res) {
        if(verifyUser(req , res)) {
            User.find(function (err , users) {
                if (err) {
                    res.json({message: 'error during find users', error: err});
                };
                res.json({message:'User list generated successfully', data:users})
            })
        }
    })

    app.get('/auth/verifyEmail', emailVerification.handler);

  function verifyUser(req, res) {
    var returnBoolean;
    try {
      var token = req.headers.authorization.split(' ')[1];
      var payload = jwt.decode(token, "matka");
    } catch (err) {
      returnBoolean = err;
      res.status(401).send({
        message: 'Token expired login again',
        error: err
      })
    }
    //payload.sub contains current user id
    if (payload && !payload.sub) {
      res.status(401).send({
        message: 'You are not Authorized'
      })
    }
    else {
      if(!returnBoolean)
        return true;
    }
  }

  function createSendToken(user, res) {

    var payload = {
      sub: user.id,
      exp: moment().add(10,'days').unix()
    };
    var token = jwt.encode(payload, "matka");

    res.status(200).send({user: user.toJson(), token: token});
  }

  function verifyUserObject(user , res) {
    var errs = [];

    if(!user.name)
      errs.push('Name is required')
    if(!user.email)
      errs.push('Email is required')
    if(!user.mobile)
      errs.push('Mobile is required')
    if(!user.role)
      errs.push('Role is not defined')
    else if(_.includes(userRole.module.role, user.role) != true)
      errs.push('Role is not valid')

    if(errs.length > 0)
      res.status(400).send({message: 'Validation error', error:errs});
    else
      return true;

  }

};
