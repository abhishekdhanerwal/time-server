var mongoose = require('mongoose');
var ProductSubCategory = require('../models/ProductSubCategory');
var Coupon = require('../models/Coupon');

var ProductSchema = new mongoose.Schema({
    subCategory:{type: mongoose.Schema.Types.ObjectId, ref: 'ProductSubCategory'},
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    shortDescription: {
        type: String
    },
    longDescription: {
        type: String
    },
    image: {
        type: String
    },
    inStock: {
        type: Boolean
    },
    stockLeft: {
        type: Number
    },
    quantity:{
        type: String
    },
    pieceInPacket:{
        type: Number
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

module.exports = mongoose.model('Product', ProductSchema);