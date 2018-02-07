var _ = require('lodash');
var jwt = require('jwt-simple');
var Payment = require('../models/Payment');
var User = require('../models/User');

var paymentType = require('../enums/payment_type');

var mongoose = require('mongoose');

module.exports = function (app) {

    app.get('/payment/list', function (req, res) {
        if (verifyUser(req, res)) {
            if(req.query.type){
                Payment.find({type:req.query.type , paymentStatus:req.query.status}).populate('userId').exec
                (function (err , payments) {
                    if (err) {
                        res.json({message: 'error during find payment', error: err});
                    }
                    else {
                        res.status(200).send({
                            message: 'Payment found successfully',
                            data: payments
                        })
                    }
                });
            }
            else {
                Payment.find({paymentStatus:req.query.status}).populate('userId').exec
                (function (err , payments) {
                    if (err) {
                        res.json({message: 'error during find payment', error: err});
                    }
                    else {
                        res.status(200).send({
                            message: 'Payment found successfully',
                            data: payments
                        })
                    }
                });
            }
        }
    });

    app.post('/payment/add', function (req, res) {
        if (verifyUser(req, res)) {

            var newPayment = new Payment({
                userId: req.body.userId,
                amount: req.body.amount,
                date: req.body.date,
                type: req.body.type,
                paymentStatus:'pending'
            });

            newPayment.save(function (err) {
                if (err)
                    res.status(400).send({
                        message: 'Error in requesting payment',
                        error: err
                    });
                // throw err;
                else {
                    console.log(req.body.userId)
                    User.findById(req.body.userId , function (err , user) {
                        console.log(user)
                        if (err)
                            res.status(400).send({
                                message: 'Error in requesting payment',
                                error: err
                            });
                        else {
                            var historyObj = {};
                            historyObj.paymentType = req.body.type;
                            historyObj.date = req.body.date;
                            historyObj.amount = req.body.amount;
                            historyObj.paymentStatus = 'pending';

                            user.history.push(historyObj);

                            if(req.body.accountNumber && req.body.ifsc && req.body.name){
                                user.bankDetails.accountNumber = req.body.accountNumber;
                                user.bankDetails.ifsc = req.body.ifsc;
                                user.bankDetails.name = req.body.name;
                            }

                            user.save(function (err) {
                                if (err) {
                                    res.json({message: 'error during user update', error: err});
                                }
                                else {
                                    res.json({message: 'Payment request made successfully'})
                                }
                            })
                        }
                    })
                }
            })
        }
    });

    app.put('/payment/update/:id' , function (req , res) {
        if (verifyUser(req, res)) {
            Payment.findById(req.params.id , function (err , payment) {
                if (err) {
                    res.json({message: 'error during payment update', error: err});
                }
                else if(payment){
                    payment.paymentStatus = 'done';
                    payment.save(function (err) {
                        if (err) {
                            res.json({message: 'error during payment update', error: err});
                        }
                        else {
                            User.findById(payment.userId , function (err , user) {
                                if (err) {
                                    res.json({message: 'error during user update', error: err});
                                }
                                else if(user){
                                    _.each(user.history , function (value , key) {
                                        if(value.paymentStatus == 'pending')
                                            value.paymentStatus = 'done'
                                    })
                                    user.points = req.body.points;
                                    user.save(function (err) {
                                        if (err) {
                                            res.json({message: 'error during user update', error: err});
                                        }
                                        else {
                                            res.json({message: 'payment updated successfully'})
                                        }
                                    })
                                }
                                else
                                    res.status(400).send({
                                        message: 'User not found'
                                    });
                            })
                        }
                    })
                }
                else
                    res.status(400).send({
                        message: 'Payment not available'
                    });
            })
        }
    })

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
            if (!returnBoolean)
                return true;
        }
    }
};
