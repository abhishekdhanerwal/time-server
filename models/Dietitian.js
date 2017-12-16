var mongoose = require('mongoose');
var userRole = require('../enums/user_role');

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
    address:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    discount:{
        type:Number
    },
    discountPrice:{
        type:Number,
        required:true
    },
    couponCode:{
        type:String,
        required:true
    },
    active:{
        type:Boolean
    }
});

module.exports = mongoose.model('Dietitan', DietitianSchema);