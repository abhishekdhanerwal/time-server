var mongoose = require('mongoose');
var ProductSubCategory = require('../models/ProductSubCategory')

var CategorySchema = new mongoose.Schema({
    name:{
        type:String,
        uppercase:true
    },
    couponId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    }]
});

module.exports = mongoose.model('ProductCategory', CategorySchema);