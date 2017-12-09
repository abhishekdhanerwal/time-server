var _ = require('lodash');
var jwt = require('jwt-simple');
var moment = require('moment');
var User = require('../models/User');

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

    User.findOne({email: userFromUi.email}, function (err, user) {
      if (err)
        throw err;

      if (user)
        return res.status(401).send({message: 'Email already used'});

      var newUser = new User({
        name: userFromUi.name,
        email: userFromUi.email,
        mobile: userFromUi.mobile,
        password: userFromUi.password
      });

      newUser.save(function (err) {
        if (err)
          throw err;

        createSendToken(newUser, res)
      })

    });

  });

  app.post('/login', function (req, res) {

    req.user = req.body;

    User.findOne({email: req.user.email}, function (err, user) {
      if (err)
        throw err;

      if (!user)
        return res.status(401).send({message: 'Wrong email'});

      user.comparePassword(req.user.password, function (err, isMatch) {
        if (err)
          throw err;

        if (!isMatch)
          return res.status(401).send({message: 'Wrong password'});

        createSendToken(user, res);
      });
    })
  });

  app.get('/auth/verifyEmail', emailVerification.handler);

  function createSendToken(user, res) {

    var payload = {
      sub: user.id,
      exp: moment().add(10,'days').unix()
    };
    var token = jwt.encode(payload, "secret");

    res.status(200).send({user: user.toJson(), token: token});
  }

};
