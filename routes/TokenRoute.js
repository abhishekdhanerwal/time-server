var _ = require('lodash');
var jwt = require('jwt-simple');
var moment = require('moment');
var User = require('../models/User');
var Token = require('../models/Token');
var Winner = require('../models/Winner');
var randomstring = require('randomstring');

var sha512 = require('js-sha512');

var mongoose = require('mongoose');

module.exports = function(app) {

    app.post('/token/generate/:id', function (req, res) {
        if(verifyUser(req, res)){
            User.findById(req.params.id , function (err , user) {
                if (err) {
                    res.status(400).send({message: 'error during find user', error: err});
                }
                else if (!user) {
                    res.status(400).send({message: 'User not found'});
                } else {
                    generateCouponCode(function(couponCode){
                        var tokenDate = new Date();
                        tokenDate.setHours(0);
                        tokenDate.setMinutes(0);
                        tokenDate.setSeconds(0);
                        tokenDate.setMilliseconds(0);

                        var newToken = new Token({
                            userId:req.params.id,
                            token:couponCode,
                            date:tokenDate,
                            checkPoint:req.query.checkpoint
                        });
                        var historyObj = {};
                        historyObj.token = couponCode;
                        historyObj.date = tokenDate;
                        historyObj.checkPoint = req.query.checkpoint;
                        historyObj.won = false;

                        user.history.push(historyObj);
                        if(user.points < 25){
                            res.status(400).send({
                                message:'You have less tokens'
                            })
                        }
                        else {
                            user.points = user.points - 25;

                            user.save(function (err) {
                                if (err) {
                                    res.status(400).send({message: 'error during user update', error: err});
                                }
                                else {
                                    newToken.save(function (err) {
                                        if (err) {
                                            res.status(400).send({message: 'error during token creation', error: err});
                                        }
                                        else {
                                            res.status(200).send({
                                                message:'Coupon generated successfully',
                                                data:{
                                                    token:couponCode,
                                                    user:user
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
    });

    app.get('/token/winner' , function (req , res) {
        var tokenDate = new Date();
        tokenDate.setHours(0);
        tokenDate.setMinutes(0);
        tokenDate.setSeconds(0);
        tokenDate.setMilliseconds(0);
        Winner.find({date:tokenDate}).populate('userId').exec
        (function (err , winners) {
            if (err) {
                res.status(400).send({message: 'error during find winners', error: err});
            }
            else if(winners){
                var announced = false;
                var newWinner = [];
                _.each(winners, function (value , key) {
                    if(value.checkPoint == req.query.time){
                       announced = true;
                        newWinner.push(value)
                    }
                })
                if(announced)
                    res.status(200).send({
                        message:'Winner is announced',
                        data:newWinner
                    })
                else
                res.status(200).send({
                    message:'Winner is not announced yet'
                })
            }
            else
                res.status(200).send({
                    message:'No winners'
                })
        })
    });

    app.post('/createHash', function (req, res) {
        var salt = '051MPQenTG';
        var hash = sha512(req.body.preHashString + salt);
        // console.log(hash);
        res.send({success : true, hash: hash});
    });

    app.post('/PaymentStatus', function (req, res) {
        // console.log(req.body);
        res.send(req.body.status);
    })


    function generateCouponCode(callback) {
        var couponCode = randomstring.generate(7);

        Token.findOne({token:couponCode}, function (err, token) {
            if (err)
                res.status(400).send({
                    message: 'Server error',
                    error: err
                });
            // throw err;

           else if (token)
                generateCouponCode();
            else
                callback(couponCode);
        })
    }

    function verifyUser(req, res) {
        var returnBoolean;
        try {
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, "matka");
        } catch (err) {
            returnBoolean = err;
            res.status(401).send({
                message: 'Token expired login again',
                error: err
            })
        }
        //payload.sub contains current user id
        if (payload && !payload.sub) {
            res.status(401).send({
                message: 'You are not Authorized'
            })
        }
        else {
            if(!returnBoolean)
                return true;
        }
    }

};
