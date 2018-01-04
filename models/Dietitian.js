var mongoose = require('mongoose');
var userRole = require('../enums/user_role');

var Coupon = require('../models/Coupon');

var DietitianSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    profilePic:String,
    email:{
        type:String,
        lowercase: true,
        required:true
    },
    mobile:{
        type:String,
        maxlength:10,
        minlength:10,
        required:true
    },
    role:{
        type:String,
        enum:userRole.module.role,
        required:true
    },
    description:{
        type:String
    },
    state:{
        type:String,
        uppercase: true
    },
    city:{
        type:String,
        lowercase: true
    },
    pinCode:{
        type:Number
    },
    price:{
        type:Number
    },
    active:{
        type:Boolean
    },
    discount: [{
        discountPercentage: Number,
        discountFixed: Number,
        discountPrice: Number,
        couponId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon'
        }
    }]
});

DietitianSchema.methods.toJson = function () {
    var user = this.toObject();
    delete user.password;

    return user;
};

module.exports = mongoose.model('Dietitian', DietitianSchema);