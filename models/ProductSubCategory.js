var mongoose = require('mongoose');
var ProductCategory = require('../models/ProductCategory');

var SubCategorySchema = new mongoose.Schema({
    category:{type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory'},
    name:{
        type:String,
        uppercase:true
    },
    couponId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    }]
});

module.exports = mongoose.model('ProductSubCategory', SubCategorySchema);