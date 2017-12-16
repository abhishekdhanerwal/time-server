var mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
   name:{
       type:String,
       required:true
   },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String
    },
    image:{
        type:String
    },
    discount:{
        type:Number
    },
    discountPrice:{
        type:Number,
        required:true
    }
});

module.exports = mongoose.model('Product', ProductSchema);