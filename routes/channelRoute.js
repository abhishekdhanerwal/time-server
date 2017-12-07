var _ = require('lodash');
var jwt = require('jwt-simple');
// var Channel = require('./models/User');


module.exports = function(app) {

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization');
    next();
  });

  var jobs = [
    'asf',
    'afs',
    'sdvfsd'
  ];

  app.get('/channelList', function (req, res) {

    // if(!req.headers.authorization)
    //   return res.status(401).send({
    //     message:'You are not authorized'
    //   });

    // separating token from bearer


    try {
      // var decoded = jwt.decode(token, app.get('jwtTokenSecret'));

      // handle token here
      var token = req.headers.authorization.split(' ')[1];
      var payload = jwt.decode(token, "secret");

    } catch (err) {
      return res.status(401).send({
        message: 'Token expired login again',
        error: err
      })
    }

    // var token = req.headers.authorization.split(' ')[1];
    // var payload = jwt.decode(token , "secret");

    //
    // console.log(payload.exp)
    // if(payload.exp > moment().unix()){
    //   res.status(401).send({
    //     message : 'Token expired login again'
    //   })
    // }

    //payload.sub contains current user id
    if (!payload.sub) {
      res.status(401).send({
        message: 'You are not Authorized'
      })
    }

    res.send(jobs);

  });
}
