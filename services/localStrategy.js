var User = require('../models/User');
var LocalStrategy = require('passport-local').Strategy;

exports.login = new LocalStrategy({
  usernameField: 'email'
}, function (email , password, done) {

  User.findOne({email: email}, function (err, user) {
    if(err)
      throw done(err);

    if(!user)
      return done(null,false ,{
        message:'Wrong email'
      });

    user.comparePassword(password , function (err, isMatch) {
      if(err)
        throw done(err);

      if(!isMatch)
        return done(null,false ,{
          message:'Wrong password'
        });

      return done(null , user);
    });
  })
});

exports.register = new LocalStrategy({
  usernameField : 'email',
  passReqToCallback: true
}, function (req, email,password, done) {

  User.findOne({email: email}, function (err, user) {
    if(err)
      throw done(err);

    if(user)
      return done(null,false ,{
        message:'Email already used'
      });

    var newUser = new User({
      name: req.body.name,
      email: email,
      mobile:req.body.mobile,
      password: password
    });

    newUser.save(function (err) {
      done(null, newUser);
    });

  });
});