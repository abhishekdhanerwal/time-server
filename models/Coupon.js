var mongoose = require('mongoose');

var CouponSchema = new mongoose.Schema({
    couponCode:{
        type:String,
        required:true
    },
    active:{
      type:Boolean
    },
    maxTimesApplicable:{
        type:Number
    },
    productCategoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductCategory'
    },
    productSubCategoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductSubCategory'
    },
    dietitianId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dietitian'
    },
    userDetail:[{
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timesApplied:{
            type:Number
        }
    }]
})

module.exports = mongoose.model('Coupon', CouponSchema);