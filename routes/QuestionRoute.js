var _ = require('lodash');
var jwt = require('jwt-simple');
var Question = require('../models/Question');

var checkPoint = require('../enums/checkPoint');

var mongoose = require('mongoose');

module.exports = function(app) {

    app.get('/questions/view', function (req, res) {
        if(verifyUser(req, res)){
            Question.findOne({id: 1 }, function (err , question) {
                if (err) {
                    res.status(400).send({message: 'error during find question', error: err});
                }
                else if (!question) {
                    res.status(400).send({message: 'Question not found'});
                } else {
                    res.status(200).send({
                        message:'Questions found successfully',
                        data:{
                            question:question
                        }
                    })
                }
            })
        }
    });

    app.put('/questions/update' , function (req , res) {
        if(verifyUser(req, res)){
            if(req.query.time == checkPoint.module.checkPoint[0]){
                Question.findOne({id:1}, function (err, question) {
                    if (err) {
                        res.status(400).send({message: 'error during find question', error: err});
                    }
                    else if (!question) {
                        res.status(400).send({message: 'Question not found'});
                    } else {
                        question[req.query.time] = req.body.question;
                        question.save(function (err) {
                            if (err)
                                res.status(400).send({
                                    message: 'Error in saving question',
                                    error: err
                                });
                            // throw err;
                            else
                                res.json({message:'Question updated successfully'})
                        })
                    }
                })
            }
        }
    });

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
