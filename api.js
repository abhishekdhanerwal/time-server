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

var user = require('./routes/userRoute')(app);
var channel = require('./routes/channelRoute')(app);
var google = require('./services/googleAuth')(app);
var product = require('./routes/productRoute')(app);


if(env === 'development'){
    mongoose.connect('mongodb://127.0.0.1/psjwt');
}else {
    mongoose.connect('mongodb://abhishekDhanerwal:Abhi123!@ds127938.mlab.com:27938/video_channel_db');
}

//by default admin
var newUser = new UserModel({
    name: "abhishek",
    email: "abhishek@datiot.com",
    mobile: "9911866043",
    password: "secret",
    role:"admin"
});

UserModel.findOne({email:newUser.email}, function (err, user) {
    if (err)
        throw err;

    if(!user){
        newUser.save(function (err) {
            if (err)
                throw err;

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
