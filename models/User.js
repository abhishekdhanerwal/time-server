var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userRole = require('../enums/user_role');
var checkPointType = require('../enums/checkPoint');


var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    profilePic: String,
    email: {
        type: String,
        lowercase: true,
        required: true
    },
    mobile: {
        type: String,
        maxlength: 10,
        minlength: 10,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    newPassword: {
        type: String
    },
    role: {
        type: String,
        enum: userRole.module.role,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    points: {
        type: Number
    },
    fbLogin: {
        type: Boolean
    },
    googleLogin: {
        type: Boolean
    },
    history: [{
        token: {
            type: String
        },
        date: {
            type: Date
        },
        checkPoint: {
            type: String,
            enum: checkPointType.module.checkPoint
        },
        won: {
            type: Boolean
        }
    }]
});

UserSchema.pre('save', function (next) {

    var user = this;
    //check if password is modified
    if (!user.isModified('password') && !user.isModified('newPassword'))
        return next();
    else if(user.isModified('password') && !user.isModified('newPassword'))
        encryptPassword();
    else if(user.isModified('newPassword') && !user.isModified('password'))
        encryptNewPassword();
    else
        encryptBoth();

    function encryptPassword() {
        console.log('change old password')
        bcrypt.genSalt(10, function (err, salt) {
            if (err)
                return next(err);

            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err)
                    return next(err);

                user.password = hash;
                next();
            })
        })
    }

    function encryptNewPassword() {
        console.log('change new password')
        bcrypt.genSalt(10, function (err, salt) {
            if (err)
                return next(err);

            bcrypt.hash(user.newPassword, salt, null, function (err, hash) {
                if (err)
                    return next(err);

                user.newPassword = hash;
                next();
            })
        })
    }

    function encryptBoth() {
        console.log('change both password')
        bcrypt.genSalt(10, function (err, salt) {
            if (err)
                return next(err);

            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err)
                    return next(err);

                user.password = hash;


                bcrypt.hash(user.newPassword, salt, null, function (err, hash) {
                    if (err)
                        return next(err);

                    user.newPassword = hash;
                    next();
                })
            })
        })
    }


});

UserSchema.methods.toJson = function () {
    var user = this.toObject();
    delete user.password;

    return user;
};

UserSchema.methods.comparePassword = function (password, callback) {
    console.log('compare old password')
    console.log(password)
    console.log(this.password)
    bcrypt.compare(password, this.password, callback)
};

UserSchema.methods.compareNewPassword = function (password, callback) {
    console.log('compare new password')
    console.log(password)
    console.log(this.newPassword)
    bcrypt.compare(password, this.newPassword, callback)
};

module.exports = mongoose.model('User', UserSchema);
