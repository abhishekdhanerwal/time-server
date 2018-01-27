var CronJob = require('cron').CronJob;
var Token = require('../models/Token');
var User = require('../models/User');
var Winner = require('../models/Winner');
var _ = require('lodash');

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

        console.log(tokens)

        _.each(tokens , function (value , key) {
            if(value.date.getDate() == new Date().getDate() && value.date.getMonth() == new Date().getMonth() && value.date.getFullYear() == new Date().getFullYear() && value.checkPoint == time)
                tokenList.push(value);
        });

        console.log(tokenList.length)

        if(tokenList.length > 0){
            console.log('First lucky draw - ' + new Date());
            var winner = tokenList[Math.floor(Math.random()*tokenList.length)];
            User.findById(winner.userId , function (err , user) {
                if (err)
                    console.log({
                        message: 'Error in finding mobile',
                        error: err
                    });
                // throw err;

                if (user) {
                    console.log(user)
                    var newWinner  = new Winner({
                        userId:user._id,
                        wonByToken:winner.token,
                        date:winner.date,
                        checkPoint:winner.checkPoint
                    });

                    _.each(user.history , function (value, key) {
                        if(value.token == winner.token)
                            value.won = true;
                    })

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
        }
    })
}
