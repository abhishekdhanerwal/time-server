var _ = require('lodash');
var jwt = require('jwt-simple');
var moment = require('moment');
var User = require('../models/User');
var userRole = require('../enums/user_role');

var multer = require('multer');

var randomstring = require('randomstring');


var Hired = require('../models/HiredData');

var mongoose = require('mongoose');

var Dietitian = require('../models/Dietitian');

var emailVerification = require('../services/emailVerification');


module.exports = function(app) {

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/user')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        }
    });
    var upload = multer({ //multer settings
        storage: storage
    }).single('file');

    /** API path that will upload the files */
    app.post('/user/upload', function(req, res) {

        if(verifyUser(req , res)){
            upload(req,res,function(err){
                if(err){
                    res.json({error_code:1,err_desc:err});
                    return;
                }
                // console.log(req.file.path)
                res.json({error_code:0,err_desc:null,file:req.file});
            })
        };
    });

  app.post('/register', function (req, res) {

    var userFromUi = req.body;

    if(verifyUserObject(userFromUi , res)){

        console.log(req.query)

        if(req.query.dietitian == 'true'){

            Dietitian.findOne({email: userFromUi.email}, function (err, user) {
                if (err)
                    res.status(400).send({
                        message: 'E-mail is wrong',
                        error: err
                    });
                // throw err;

                if (user)
                    return res.status(400).send({message: 'Email already used'});

                generateCouponCode(function (newCouponCode) {
                    var newDietitian = new Dietitian({
                        name: userFromUi.name,
                        email: userFromUi.email,
                        mobile: userFromUi.mobile,
                        password: userFromUi.password,
                        role:userFromUi.role,
                        active:true,
                        couponCode:newCouponCode
                    });
                    newDietitian.save(function (err) {
                        if (err)
                        res.status(400).send({
                            message: 'Number or email already registered',
                            error: err
                        });
                        // throw err;
                        else
                        createSendToken(newDietitian, res)
                    })
                })
            });
        }
        else {
            User.findOne({email: userFromUi.email}, function (err, user) {
                if (err)
                    res.status(400).send({
                        message: 'E-mail is wrong',
                        error: err
                    });
                // throw err;

                if (user)
                    return res.status(400).send({message: 'Email already used'});

                var newUser = new User({
                    name: userFromUi.name,
                    email: userFromUi.email,
                    mobile: userFromUi.mobile,
                    password: userFromUi.password,
                    role:userFromUi.role
                });

                newUser.save(function (err) {
                    if (err)
                        res.status(400).send({
                            message: 'Number or email already registered',
                            error: err
                        });
                    // throw err;
                    else
                        createSendToken(newUser, res)
                })
            });
        }

    };
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

    if(!req.user.email)
      errs.push('Email is required');
    if(!req.user.password)
      errs.push('Password is required');

    if(errs.length > 0)
      res.status(400).send({message: 'Validation error', error:errs});
    else {

      User.findOne({email: req.user.email}, function (err, user) {
          if (err)
              res.status(400).send({
                  message: 'Error in finding e-mail',
                  error: err
              });
          // throw err;

          if (!user) {
              Dietitian.findOne({email: req.user.email}, function (err, dietitian) {
                  if (err)
                      res.status(400).send({
                          message: 'Error in finding e-mail',
                          error: err
                      })
                  if (!dietitian)
                      return res.status(400).send({message: 'Wrong email'});
                  else
                      dietitian.comparePassword(req.user.password, function (err, isMatch) {
                          if (err)
                              res.status(400).send({
                                  message: 'Error in comparing password',
                                  error: err
                              });
                          // throw err;

                          if (!isMatch)
                              return res.status(400).send({message: 'Wrong password'});

                          createSendToken(dietitian, res);
                      });
              })

          }
          else {
              user.comparePassword(req.user.password, function (err, isMatch) {
                  if (err)
                      res.status(400).send({
                          message: 'Error in comparing password',
                          error: err
                      });
                  // throw err;

                  if (!isMatch)
                      return res.status(400).send({message: 'Wrong password'});

                  createSendToken(user, res);
              });
          }
      })
    }
  });

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

  app.put('/user/update', function (req, res) {
    if(verifyUser(req , res)){
      var customerInfo = req.body;
        User.findById(customerInfo.id, function (err, user) {
          if (err) {
            res.json({message: 'error during find user', error: err});
          };
          if (user) {
            _.merge(user.customerInfo, customerInfo);
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
  });

    app.put('/user/addDietitian/:id', function (req, res) {
        if(verifyUser(req , res)){
            var dietitianToAdd = req.body;
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    res.json({message: 'error during find user', error: err});
                };
                if (user) {
                    Dietitian.findById(dietitianToAdd.dietitianId, function (err, dietitian) {
                        if (err) {
                            res.json({message: 'error during find dietitian', error: err});
                        }

                        if(dietitian){

                            Hired.find(function(err, hiredList) {
                                if (err) {
                                    res.json({message: 'error during finding data', error: err});
                                };

                                if(!_.find(hiredList, {userId:mongoose.Types.ObjectId(req.params.id)})) {

                                    var newHired = new Hired({
                                        userId : req.params.id,
                                        hiredDietitians:{
                                            dietitianId:dietitianToAdd.dietitianId,
                                            active:false,
                                            couponApplied:false,
                                            feesSchedule:[]
                                        }
                                    })

                                    newHired.save(function (err) {
                                        if (err) {
                                            res.json({message: 'error during user update', error: err});
                                        };
                                        res.json({message: 'User updated successfully'});
                                    })
                                    // user.customerInfo.hiredDietitians.push(dietitianToAdd);
                                }
                                else {
                                    var hiredPresent = _.find(hiredList, {userId: mongoose.Types.ObjectId(req.params.id)});

                                    if(!_.find(hiredPresent.hiredDietitians,{dietitianId:mongoose.Types.ObjectId(dietitianToAdd.dietitianId)})){
                                        hiredPresent.hiredDietitians.push(dietitianToAdd);

                                        hiredPresent.save(function (err) {
                                            if (err) {
                                                res.json({message: 'error during hired update', error: err});
                                            };
                                            res.json({message: 'Hiring data updated successfully'});
                                        })
                                    }
                                    else {
                                        res.status(200).send({message:'Dietitian already hired'})
                                    }

                                }
                            });

                            // _.merge(user.customerInfo.hiredDietitians, dietitianToAdd);
                            // if (user.customerInfo.hiredDietitians.indexOf(dietitanId[dietitian._id]) === -1) {
                            //     user.customerInfo.hiredDietitians.push(dietitian._id);
                            // }
                            // user.customerInfo.hiredDietitians.push(dietitian._id);
                            // user.save(function(err) {
                            //     if (err) {
                            //         res.json({message: 'error during user update', error: err});
                            //     };
                            //     // res.json({message: 'User updated successfully'});
                            //     dietitian.save(function(err) {
                            //         if (err) {
                            //             res.json({message: 'error during dietitian update', error: err});
                            //         };
                            //         res.json({message: 'User & Dietitian updated successfully'});
                            //     });
                            // });

                        }
                        else {
                            res.json({info: 'Dietitan not found'});
                        }
                    })

                } else {
                    res.json({info: 'User not found'});
                }
            })
        }
    });

    app.put('/user/dietitianPayment/:id', function (req, res) {
        if(verifyUser(req , res)){
            var paymentDetails = req.body;
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    res.json({message: 'error during find user', error: err});
                };
                if (user) {

                    Dietitian.findById(paymentDetails.dietitianId, function (err, dietitian) {
                        if (err) {
                            res.json({message: 'error during find dietitian', error: err});
                        }

                        if(dietitian){

                            Hired.find(function(err, hiredList) {
                                if (err) {
                                    res.json({message: 'error during finding data', error: err});
                                };

                                if(_.find(hiredList, {userId:mongoose.Types.ObjectId(req.params.id)})) {

                                    var hiredPresent = _.find(hiredList, {userId: mongoose.Types.ObjectId(req.params.id)});

                                    _.merge(_.find(hiredPresent.hiredDietitians, {dietitianId: mongoose.Types.ObjectId(paymentDetails.dietitianId)}), paymentDetails);

                                        hiredPresent.save(function (err) {
                                            if (err) {
                                                res.json({message: 'error during hired update', error: err});
                                            };
                                            res.json({message: 'Hiring data updated successfully'});
                                        })
                                    }
                                    else {
                                        res.status(400).send({message:'Dietitian not added to user'})
                                    }
                            });
                        }
                        else {
                            res.json({info: 'Dietitan not found'});
                        }
                    })

                } else {
                    res.json({info: 'User not found'});
                }
            })
        }
    });

    app.get('/user/dietitianRequestlist',function (req, res) {
           Hired.find().populate('userId').populate('hiredDietitians.dietitianId'). // only works if we pushed refs to children
           exec(function (err, users) {
               if (err) {
                   res.json({message: 'error during finding users', error: err});
               };
               res.json({message: 'Consumers found successfully', data: users});
           });
    });

    app.get('/user/hiredDietitian/:id', function (req, res) {
        Hired.findOne({userId:req.params.id}).populate('hiredDietitians.dietitianId').
            exec(function (err, dietitians) {
            if (err) {
                res.json({message: 'error during finding dietitians', error: err});
            };
            res.json({message: 'Dietitians found successfully', data: dietitians});

        })
    });

    app.get('/user/dietitian/list/:id', function (req, res) {

        if(verifyUser(req , res)){
            Dietitian.find({active:req.query.status},function(err, dietitians) {
                if (err) {
                    res.json({message: 'error during finding dietitians', error: err});
                };

                Hired.findOne({userId:req.params.id}, function (err, userDietitians) {
                    if (err) {
                        res.json({message: 'error during finding dietitians', error: err});
                    };
                    _.each(userDietitians.hiredDietitians, function (value, key) {
                        _.remove(dietitians, function(currentObject) {
                            return currentObject._id.toString() == value.dietitianId.toString();
                        });
                    });

                    res.json({message: 'Dietitians found successfully', data: dietitians});

                });
            });
        };
    });


    app.get('/auth/verifyEmail', emailVerification.handler);

  function verifyUser(req, res) {
    var returnBoolean;
    try {
      var token = req.headers.authorization.split(' ')[1];
      var payload = jwt.decode(token, "secret");
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
    var token = jwt.encode(payload, "secret");

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
    if(!user.password)
      errs.push('Password is required')
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
