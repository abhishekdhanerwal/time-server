var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Dietitian = require('../models/Dietitian');
var User = require('../models/User');

var userRole = require('../enums/user_role');

var HiredSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hiredDietitians:[{
        _id: false,
        id: false,
        dietitianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dietitian'
        },
        active:Boolean,
        couponApplied:Boolean,
        feesSchedule:[{
            _id: false,
            id: false,
            paymentSuccessOn:Date,
            lastDateOfWork:Date
        }]
    }]
});


module.exports = mongoose.model('Hired', HiredSchema);
