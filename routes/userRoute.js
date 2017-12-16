var _ = require('lodash');
var jwt = require('jwt-simple');
var moment = require('moment');
var User = require('../models/User');
var userRole = require('../enums/user_role');

var emailVerification = require('../services/emailVerification');


module.exports = function(app) {

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization');
    next();
  });

  app.post('/register', function (req, res) {

    var userFromUi = req.body;

    if(verifyUserObject(userFromUi , res)){
      User.findOne({email: userFromUi.email}, function (err, user) {
        if (err)
          res.status(401).send({
            message: 'E-mail is wrong',
            error: err
          });
          // throw err;

        if (user)
          return res.status(401).send({message: 'Email already used'});

        var newUser = new User({
          name: userFromUi.name,
          email: userFromUi.email,
          mobile: userFromUi.mobile,
          password: userFromUi.password,
          role:userFromUi.role
        });

        newUser.save(function (err) {
          if (err)
            res.status(401).send({
              message: 'Number or email already registered',
              error: err
            });
            // throw err;
          else
            createSendToken(newUser, res)
        })
      });
    };
  });

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
          res.status(401).send({
            message: 'Error in finding e-mail',
            error: err
          });
          // throw err;

        if (!user)
          return res.status(401).send({message: 'Wrong email'});

        user.comparePassword(req.user.password, function (err, isMatch) {
          if (err)
            res.status(401).send({
              message: 'Error in comparing password',
              error: err
            });
            // throw err;

          if (!isMatch)
            return res.status(401).send({message: 'Wrong password'});

          createSendToken(user, res);
        });
      })
    }
  });

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
