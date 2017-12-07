var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var emailVerification = require('./services/emailVerification');

var app = express();

app.use(bodyParser.json());

// emailVerification.sendEmail('abhishekdhanerwal@gmail.com');

var user = require('./routes/userRoute')(app);
var channel = require('./routes/channelRoute')(app);
var google = require('./services/googleAuth')(app);

// mongoose.connect('mongodb://127.0.0.1/psjwt');
mongoose.connect('mongodb://abhishekDhanerwal:Abhi123!@ds127938.mlab.com:27938/video_channel_db');

var port = process.env.PORT || 8080;

var server = app.listen(port , function () {
  console.log('server listening on '  + server.address().port);
});
