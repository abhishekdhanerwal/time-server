var mongoose = require('mongoose');
var User = require('../models/User');
var paymentType = require('../enums/payment_type');
var paymentStatus = require('../enums/payment_status');

var PaymentSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount:{
        type:Number
    },
    date:{
        type:Date
    },
    type:{
        type:String,
        enum:paymentType.module.payment
    },
    paymentStatus:{
        type: String,
        enum:paymentStatus.module.request
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);
