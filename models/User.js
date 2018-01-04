var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Dietitian = require('../models/Dietitian');

var userRole = require('../enums/user_role');

var UserSchema = new mongoose.Schema({
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
  password: {
    type:String,
    required:true
  },
  role:{
    type:String,
    enum:userRole.module.role,
    required:true
  },
  customerInfo :{
    state:String,
    city:String,
    pinCode:Number,
    age:Number,
    height:Number,
    weight:Number,
    waistSize:Number,
    hipSize:Number,
    gender:String,
    dailyActivity:String,
    goal:String,
    medicalCondition:Boolean,
    disease:String,
    foodAllergies:Array,
    dietaryPrefernce:String
  }
});

UserSchema.pre('save', function (next) {

  var user = this;
  //check if password is modified
  if(!user.isModified('password'))
    return next();

  bcrypt.genSalt(10, function (err, salt) {
    if(err)
      return next(err);

    bcrypt.hash(user.password, salt, null, function (err, hash) {
      if(err)
        return next(err);

      user.password = hash;
      next();
    })
  })
});

UserSchema.methods.toJson = function () {
  var user = this.toObject();
  delete user.password;

  return user;
};

UserSchema.methods.comparePassword = function (password , callback) {
  console.log(password)
  console.log(this.password)
  bcrypt.compare(password , this.password, callback)
};

module.exports = mongoose.model('User', UserSchema);
