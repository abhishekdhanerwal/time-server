var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var UserModel = require('./models/User');

var emailVerification = require('./services/emailVerification');

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = express();

app.use(bodyParser.json());

app.use(express.static(__dirname + '/uploads'));

// emailVerification.sendEmail('abhishekdhanerwal@gmail.com');

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization');
    next();
});

var user = require('./routes/UserRoute')(app);
var token = require('./routes/TokenRoute')(app);
var google = require('./services/googleAuth')(app);
var scheduler = require('./services/scheduler');


if(env === 'development'){
    mongoose.connect('mongodb://127.0.0.1/matka');
}else {
    mongoose.connect('mongodb://abhishekDhanerwal:Abhi123!@ds127938.mlab.com:27938/video_channel_db');
}

//by default admin
var newUser = new UserModel({
    name: "abhishek",
    email: "abhishek@datiot.com",
    mobile: "9911866043",
    password: "secret",
    role:"admin",
    city:"gurgaon",
    state:"haryana",
    dateOfBirth: new Date(1994,11,23)
});

UserModel.findOne({email:newUser.email}, function (err, user) {
    if (err)
        res.status(401).send({
            message: 'Server not responding',
            error: err
        });
        // throw err;

    if(!user){
        newUser.save(function (err) {
            if (err)
                res.status(401).send({
                    message: 'Server not responding',
                    error: err
                });
                // throw err;
            else
                console.log('default user created');
        })
    }
    else {
        console.log('user already present');
    }
});

var port = process.env.PORT || 8080;

var server = app.listen(port , function () {
  console.log('server listening on '  + server.address().port);
});
