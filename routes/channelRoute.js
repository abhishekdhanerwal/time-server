var _ = require('lodash');
var jwt = require('jwt-simple');
// var Channel = require('./models/User');

var multer = require('multer');


module.exports = function(app) {

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization');
    next();
  });


  // var storage = multer.diskStorage({ //multers disk storage settings
  //   destination: function (req, file, cb) {
  //     cb(null, './uploads/')
  //   },
  //   filename: function (req, file, cb) {
  //     var datetimestamp = Date.now();
  //     cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
  //   }
  // });
  // var upload = multer({ //multer settings
  //   storage: storage
  // }).single('file');

  /** API path that will upload the files */
  // app.post('/upload', function(req, res) {
  //   upload(req,res,function(err){
  //     if(err){
  //       res.json({error_code:1,err_desc:err});
  //       return;
  //     }
  //     // console.log(req.file.path)
  //     res.json({error_code:0,err_desc:null,file:req.file});
  //   })
  // });

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
