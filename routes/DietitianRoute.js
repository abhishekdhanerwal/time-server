var _ = require('lodash');
var jwt = require('jwt-simple');
var multer = require('multer');
var userRole = require('../enums/user_role');

var Dietitian = require('../models/Dietitian');

module.exports = function (app) {

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/dietitian')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        }
    });
    var upload = multer({ //multer settings
        storage: storage
    }).single('file');

    /** API path that will upload the files */
    app.post('/dietitian/upload', function(req, res) {

        if(verifyUser(req , res)){
            upload(req,res,function(err){
                if(err){
                    res.json({error_code:1,err_desc:err});
                    return;
                }
                // console.log(req.file.path)
                res.json({error_code:0,err_desc:null,file:req.file});
            })
        };
    });

    app.post('/dietitian/save', function (req, res) {
        if(verifyUser(req,res)){
            var dietitian = req.body;

            if(verifyDietitianObject(dietitian,res)){

                    var newDietitian = new Dietitian({
                        name:dietitian.name,
                        email:dietitian.email,
                        mobile:dietitian.mobile,
                        role:dietitian.role,
                        address:dietitian.address,
                        price:dietitian.price,
                        description:dietitian.description,
                        profilePic:dietitian.profilePic,
                        state:dietitian.state,
                        city:dietitian.city,
                        pinCode:dietitian.pinCode,
                        active:true
                    });
                    newDietitian.save(function (err) {
                        if(err)
                            res.status(400).send({
                                message: 'Server not responding',
                                error: err
                            });
                        //throw err;

                        res.status(200).send({message: 'Dietitian saved'});
                    })
            }
        }
    });

    app.get('/dietitian/list', function (req, res) {

        if(verifyUser(req , res)){
            Dietitian.find({active:req.query.status},function(err, dietitians) {
                if (err) {
                    res.json({message: 'error during finding dietitians', error: err});
                };
                res.json({message: 'Dietitians found successfully', data: dietitians});
            });
        };
    });

    app.get('/dietitian/:id', function (req, res) {

        if(verifyUser(req , res)){
            Dietitian.findById(req.params.id, function(err, dietitian) {
                if (err) {
                    res.json({message: 'error during find dietitian', error: err});
                };
                if (dietitian) {
                    res.json({message: 'Dietitian found successfully', data: dietitian});
                } else {
                    res.json({info: 'Dietitian not found'});
                }
            });
        };
    });

    app.put('/dietitian/:id', function (req, res) {

        if(verifyUser(req , res)){
            var dietitian = req.body;
            if(verifyDietitianObject(dietitian, res)){
                Dietitian.findById(req.params.id, function(err, dietitian) {
                    if (err) {
                        res.json({message: 'error during find dietitian', error: err});
                    };
                    if (dietitian) {
                        _.merge(dietitian, req.body);
                        dietitian.save(function(err) {
                            if (err) {
                                res.json({message: 'error during dietitian update', error: err});
                            };
                            res.json({message: 'Dietitian updated successfully'});
                        });
                    } else {
                        res.json({info: 'Dietitian not found'});
                    }

                });
            };
        };
    });

    app.put('/dietitian/status/:id', function (req, res) {

        if(verifyUser(req , res)){
            // var dietitian = req.body;

                Dietitian.findById(req.params.id, function(err, dietitian) {
                    if (err) {
                        res.json({message: 'error during find dietitian', error: err});
                    };
                    if (dietitian) {

                        dietitian.active = !dietitian.active;
                        dietitian.save(function(err) {
                            if (err) {
                                res.json({message: 'error during dietitian status change', error: err});
                            };
                            res.json({message: 'Dietitian status changed'});
                        });
                    } else {
                        res.json({info: 'Dietitian not found'});
                    }

                });
        };
    });

    function verifyUser(req, res) {
        var returnBoolean;
        try {
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, "secret");
        } catch (err) {
            returnBoolean = err;
            res.status(401).send({
                message: 'Token expired login again',
                error: err
            })
        }
        //payload.sub contains current user id
        if (payload && !payload.sub) {
            res.status(401).send({
                message: 'You are not Authorized'
            })
        }
        else {
            if(!returnBoolean)
                return true;
        }
    }

    function verifyDietitianObject(dietitian , res) {
        var errs = [];

        if(!dietitian.name)
            errs.push('Dietitian name is required');
        if(!dietitian.price)
            errs.push('Dietitian price is required');
        if(!dietitian.email)
            errs.push('Email is required');
        if(!dietitian.mobile)
            errs.push('Mobile is required');
        if(!dietitian.state)
            errs.push('State is required');
        if(!dietitian.city)
            errs.push('City is required');
        if(!dietitian.pinCode)
            errs.push('Pin code is required');
        if(!dietitian.role)
            errs.push('Role is not defined');
        else if(_.includes(userRole.module.role, dietitian.role) != true)
            errs.push('Role is not valid');

        if(errs.length > 0)
            res.status(400).send({message: 'Validation error', error:errs});
        else
            return true;
    }
}