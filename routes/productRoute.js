var _ = require('lodash');
var jwt = require('jwt-simple');
var multer = require('multer');
var Product = require('../models/Product');

module.exports = function(app) {

    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type, Authorization');
        next();
    });

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/product')
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
    app.post('/upload', function(req, res) {
        upload(req,res,function(err){
            if(err){
                res.json({error_code:1,err_desc:err});
                return;
            }
            // console.log(req.file.path)
            res.json({error_code:0,err_desc:null,file:req.file});
        })
    });

    app.post('/product/save', function (req,res) {
        try {
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, "secret");
        } catch (err) {
            return res.status(401).send({
                message: 'Token expired login again',
                error: err
            })
        }
        //payload.sub contains current user id
        if (!payload.sub) {
            res.status(401).send({
                message: 'You are not Authorized'
            })
        }

        var product = req.body;
        var errs = [];

        if(!product.name)
                errs.push('Product name is required');
        if(!product.price)
                errs.push('Product price is required');

        if(errs.length > 0)
            return res.status(400).send({message: 'Validation error', error:errs});


        var newProduct = new Product({
            name:product.name,
            price:product.price,
            description:product.description,
            image:product.image
        });

        newProduct.save(function (err) {
            if(err)
                throw err;

            res.status(200).send({message: 'Product saved'});
        })

    });
    
    app.get('/product/list', function (req, res) {

        try {
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, "secret");
        } catch (err) {
            return res.status(401).send({
                message: 'Token expired login again',
                error: err
            })
        }
        //payload.sub contains current user id
        if (!payload.sub) {
            res.status(401).send({
                message: 'You are not Authorized'
            })
        }

        Product.find(function(err, products) {
            if (err) {
                res.json({message: 'error during finding products', error: err});
            };
            res.json({message: 'Products found successfully', data: products});
        });
    });

    app.get('/product/:id', function (req, res) {
        try {
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, "secret");
        } catch (err) {
            return res.status(401).send({
                message: 'Token expired login again',
                error: err
            })
        }
        //payload.sub contains current user id
        if (!payload.sub) {
            res.status(401).send({
                message: 'You are not Authorized'
            })
        }
        Product.findById(req.params.id, function(err, product) {
            if (err) {
                res.json({message: 'error during find Product', error: err});
            };
            if (product) {
                res.json({message: 'Product found successfully', data: product});
            } else {
                res.json({info: 'Product not found'});
            }
        });
    });

    app.delete('/product/:id', function (req, res) {
        try {
            var token = req.headers.authorization.split(' ')[1];
            var payload = jwt.decode(token, "secret");
        } catch (err) {
            return res.status(401).send({
                message: 'Token expired login again',
                error: err
            })
        }
        //payload.sub contains current user id
        if (!payload.sub) {
            res.status(401).send({
                message: 'You are not Authorized'
            })
        }
          Product.findByIdAndRemove(req.params.id, function(err) {
            if (err) {
              res.json({message: 'error during remove product', error: err});
            };
            res.json({message: 'Product removed successfully'});
          });
    });
}