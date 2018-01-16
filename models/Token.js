var mongoose = require('mongoose');
var User = require('../models/User');
var checkPointType = require('../enums/checkPoint');

var TokenSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    token:{
        type:String
    },
    date:{
        type:Date
    },
    checkPoint:{
        type:String,
        enum:checkPointType.module.checkPoint
    }
});

module.exports = mongoose.model('Token', TokenSchema);
