var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new mongoose.Schema({
  name: String,
  email:String,
  mobile:String,
  password: String
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
