var mongoose = require('mongoose');

var QuestionSchema = new mongoose.Schema({
    id:{
        type:Number,
        default:1
    },
    morning:{
        type:String
    },
    evening:{
        type:String
    }
});

module.exports = mongoose.model('Question', QuestionSchema);
