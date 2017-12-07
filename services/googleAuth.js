var config = require('../services/configSocialMedia');
var request = require('request');
var jwt = require('jwt-simple');

var moment = require('moment');

var User = require('../models/User');

module.exports = function(app) {

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization');
    next();
  });


  app.post('/auth/google', function (req, res) {

    var responseFromUI = res;

    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: config.GOOGLE_SECRET,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, {json: true, form: params}, function (err, response, token) {
      var accessToken = token.access_token;
      var headers = {Authorization: 'Bearer ' + accessToken};

      // Step 2. Retrieve profile information about the current user.
      request.get({url: peopleApiUrl, headers: headers, json: true}, function (err, response, profile) {
        // console.log(profile)
        if (profile.error) {
          return response.status(500).send({message: profile.error.message});
        }
        // Step 3a. Link user accounts.
        // if (req.header('Authorization'))

        else {

          User.findOne({email: profile.email}, function (err, user) {
            // console.log(user)
            if (err)
              throw err;

            if (user) {
              // response.status(409).send({ message: 'There is already a Google account that belongs to you' });
              createSendToken(user, responseFromUI);
            }
            else {

              var newUser = new User({
                name: profile.name,
                email: profile.email,
                mobile: '9999999999',
                password: profile.sub
              });

              newUser.save(function (err) {
                if (err)
                  throw err;

                createSendToken(newUser, responseFromUI);
              })

            }
          });

          // User.findOne({ google: profile.sub }, function(err, existingUser) {
          //   if (existingUser) {
          //     return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
          //   }
          //   var token = req.header('Authorization').split(' ')[1];
          //   var payload = jwt.decode(token, config.TOKEN_SECRET);
          //   User.findById(payload.sub, function(err, user) {
          //     if (!user) {
          //       return res.status(400).send({ message: 'User not found' });
          //     }
          //     user.google = profile.sub;
          //     user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
          //     user.displayName = user.displayName || profile.name;
          //     user.save(function() {
          //       var token = createJWT(user);
          //       res.send({ token: token });
          //     });
          //   });
          // });
        }

        // else {
        //   console.log(profile)
        //   // Step 3b. Create a new user account or return an existing one.
        //   // User.findOne({ google: profile.sub }, function(err, existingUser) {
        //   //   if (existingUser) {
        //   //     return res.send({ token: createJWT(existingUser) });
        //   //   }
        //   //   var user = new User();
        //   //   user.google = profile.sub;
        //   //   user.picture = profile.picture.replace('sz=50', 'sz=200');
        //   //   user.displayName = profile.name;
        //   //   user.save(function(err) {
        //   //     var token = createJWT(user);
        //   //     res.send({ token: token });
        //   //   });
        //   // });
        // }

      });
    });
  });

  function createSendToken(user, res) {

    var payload = {
      sub: user.id,
      exp: moment().add(10, 'days').unix()
    };
    var token = jwt.encode(payload, "secret");

    res.status(200).send({user: user.toJson(), token: token});
  }

}
