var CronJob = require('cron').CronJob;
var Token = require('../models/Token');
var User = require('../models/User');
var Winner = require('../models/Winner');
var _ = require('lodash');
var https = require('https');

var scheduleMorningReminderJob = new CronJob({
    cronTime: '00 00 10 * * *',
    onTick: function () {
        reminderNotification("Hurry !! Play Now and Win Big");
    },
    start: true,
    timeZone: 'Asia/Kolkata'
})

var morningResultReminder  = new CronJob({
    cronTime: '00 05 13 * * *',
    onTick: function () {
        reminderNotification("Check Morning Session Result");
    },
    start: true,
    timeZone: 'Asia/Kolkata'
})

var scheduleEveningReminderJob = new CronJob({
    cronTime: '00 00 18 * * *',
    onTick: function () {
        reminderNotification("Hurry !! Play Now and Win Big");
    },
    start: true,
    timeZone: 'Asia/Kolkata'
})

var eveningResultReminder  = new CronJob({
    cronTime: '00 05 20 * * *',
    onTick: function () {
        reminderNotification("Check Evening Session Result");
    },
    start: true,
    timeZone: 'Asia/Kolkata'
})

function reminderNotification(type) {
    var sendNotification = function(data) {
        var headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Basic NGUyNTQwMzktNmZmNC00ODQ0LTkwYzctMDUyNjA5ZWVhN2Uz"
        };

        var options = {
            host: "onesignal.com",
            port: 443,
            path: "/api/v1/notifications",
            method: "POST",
            headers: headers
        };
        var req = https.request(options, function(res) {
            res.on('data', function(data) {
                // console.log("Response:");
                // console.log(JSON.parse(data));
            });
        });

        req.on('error', function(e) {
            // console.log("ERROR:");
            // console.log(e);
        });

        req.write(JSON.stringify(data));
        req.end();
    };

    var message = {
        app_id: "2d4b5211-c0c3-4c99-b3d9-30393f62545e",
        contents: {"en": type},
        included_segments: ["All"]
    };

    sendNotification(message);
}

var jobMorning = new CronJob({
    cronTime: '00 00 13 * * *',
    onTick: function() {
        console.log('In First Scheduler');
        generateWinner('morning');
    },
    start: true,
    timeZone: 'Asia/Kolkata'
});
// jobMorning.start();

var jobEvening = new CronJob({
    cronTime: '00 00 20 * * *',
    onTick: function() {
        console.log('In Second Scheduler');
        generateWinner('evening');
    },
    start: true,
    timeZone: 'Asia/Kolkata'
});
// jobEvening.start();

function generateWinner(time) {
    var tokenList = [];

    Token.find(function (err, tokens) {
        if (err) {
            console.log({
                message: 'Error in finding tokens',
                error: err
            });
        };

        _.each(tokens , function (value , key) {
            if(value.date.getDate() == new Date().getDate() && value.date.getMonth() == new Date().getMonth() && value.date.getFullYear() == new Date().getFullYear() && value.checkPoint == time)
                tokenList.push(value);
        });

        console.log('Token Length - ' + tokenList.length)

        if(tokenList.length > 0){
            console.log('First lucky draw - ' + new Date());

            var winner = [];

            var totalWinners = Math.floor(0.4*(tokenList.length+1));
            if(totalWinners == 0)
                totalWinners = 1;

            for(var index=0; index<totalWinners ; index++){
                var indexArray = Math.floor(Math.random()*(tokenList.length));
                winner.push(tokenList[indexArray]);
                tokenList.splice(indexArray, 1);
            }
            console.log('total Winner - ' + totalWinners);
            // var winner = tokenList[Math.floor(Math.random()*tokenList.length)];
            _.each(winner , function (valueWinner, keyWinner) {
                User.findById(valueWinner.userId , function (err , user) {
                    if (err)
                        console.log({
                            message: 'Error in finding mobile',
                            error: err
                        });
                    // throw err;

                    if (user) {
                        var newWinner  = new Winner({
                            userId:user._id,
                            wonByToken:valueWinner.token,
                            date:valueWinner.date,
                            checkPoint:valueWinner.checkPoint
                        });

                        _.each(user.history , function (value, key) {
                            if(value.token == valueWinner.token)
                                value.won = true;
                        });

                        user.points = user.points+50;

                        user.save(function (err) {
                            if (err)
                                console.log({
                                    message: 'Error in saving user',
                                    error: err
                                });

                            newWinner.save(function (err) {
                                if (err)
                                    console.log({
                                        message: 'Error in saving winner',
                                        error: err
                                    });

                                console.log({
                                    message:'Winner information saved'
                                })
                            });
                        })
                    }
                })
            });
        }
    })
}
