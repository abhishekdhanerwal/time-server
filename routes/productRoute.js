var _ = require('lodash');
var jwt = require('jwt-simple');
var multer = require('multer');
var Product = require('../models/Product');
var ProductSubCategory = require('../models/ProductSubCategory');
var ProductCategory = require('../models/ProductCategory');

var mongoose = require('mongoose');

module.exports = function(app) {

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
    app.post('/product/upload', function(req, res) {

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

    app.post('/product/addCategory', function (req, res) {
        if(verifyUser(req , res)){
            ProductCategory.find({name:req.body.name.toUpperCase()}, function (err , category) {
                if(err)
                    res.status(400).send({
                        message: 'Server not responding',
                        error: err
                    });

                if(category.length == 0){
                    var newCategory = new ProductCategory({
                        name:req.body.name
                    })

                    newCategory.save(function (err) {
                        if(err)
                            res.status(400).send({
                                message: 'Server not responding',
                                error: err
                            });
                        // throw err;
                        res.status(200).send({message: 'Category saved'});
                    })
                }
                else {
                    res.status(400).send({
                        message: 'Category already present',
                    });
                }
            })
        }
    });

    app.get('/product/categoryList', function (req, res) {
        if(verifyUser(req , res)){
            ProductCategory.find(function(err, category) {
                if (err) {
                    res.json({message: 'error during finding category', error: err});
                };
                res.json({message: 'Category found successfully', data: category});
            });
        }
    });

    app.post('/product/addSubCategory/:id', function (req, res) {
        if(verifyUser(req , res)){
            ProductSubCategory.find({category: mongoose.Types.ObjectId(req.params.id)}, function (err , subCategory) {
                if(err)
                    res.status(400).send({
                        message: 'Server not responding',
                        error: err
                    });

                if(subCategory){
                    var subCategoryPresent = _.find(subCategory, function(obj) {
                        return obj.name === req.body.name.toUpperCase();
                    })

                    if(!subCategoryPresent){
                      var newSubcategory = new ProductSubCategory({
                          category:req.params.id,
                          name:req.body.name
                      })

                        newSubcategory.save(function (err) {
                            if(err)
                                res.status(400).send({
                                    message: 'Server not responding',
                                    error: err
                                });
                            // throw err;
                            res.status(200).send({message: 'SubCategory saved'});
                        })
                    }
                    else
                        res.status(400).send({
                            message: 'Sub Category already present'
                        });
                }
                else {
                    res.status(400).send({
                        message: 'Category not present',
                    });
                }
            })
        }
    });

    app.get('/product/subCategoryList/:id', function (req, res) {
        if(verifyUser(req , res)){
            ProductSubCategory.find({category:mongoose.Types.ObjectId(req.params.id)},function(err, subCategory) {
                if (err) {
                    res.json({message: 'error during finding sub category', error: err});
                };
                res.json({message: 'Category found successfully', data: subCategory});
            });
        }
    });

    app.post('/product/save/:id', function (req,res) {

        if(verifyUser(req , res)){
            var product = req.body;

            Product.find({subCategory: mongoose.Types.ObjectId(req.params.id)}, function (err , productFromDb) {
                if(err)
                    res.status(400).send({
                        message: 'Server not responding',
                        error: err
                    });

                if(productFromDb){
                    var productPresent = _.find(productFromDb, function(obj) {
                        return obj.name.toUpperCase() === req.body.name.toUpperCase();
                    })

                    if(!productPresent){
                        if(verifyProductObject(product, res)){
                            var newProduct = new Product({
                                subCategory:req.params.id,
                                name:product.name,
                                price:product.price,
                                shortDescription:product.shortDescription,
                                longDescription:product.longDescription,
                                image:product.image,
                                inStock:product.inStock,
                                stockLeft:product.stockLeft,
                                quantity:product.quantity,
                                pieceInPacket:product.pieceInPacket
                            });
                            newProduct.save(function (err) {
                                if(err)
                                    res.status(400).send({
                                        message: 'Server not responding',
                                        error: err
                                    });
                                // throw err;

                                res.status(200).send({message: 'Product saved'});
                            })
                        };
                    }
                    else
                        res.status(400).send({
                            message: 'Product already present'
                        });
                }
                else {
                    res.status(400).send({
                        message: 'Sub category not valid',
                    });
                }
            })
        };
    });
    
    app.get('/product/list', function (req, res) {

        if(verifyUser(req , res)){
            Product.find(function(err, products) {
                if (err) {
                    res.json({message: 'error during finding products', error: err});
                };
                res.json({message: 'Products found successfully', data: products});
            });
        };
    });

    app.get('/product/:id', function (req, res) {

        if(verifyUser(req , res)){
            Product.findById(req.params.id).populate({
                path: 'subCategory',
                model: 'ProductSubCategory',
                populate: {
                    path: 'category',
                    model: 'ProductCategory'
                }
            }).
                // .populate('subCategory').populate('subCategory.category').
            exec(function(err, product) {
                if (err) {
                    res.json({message: 'error during find Product', error: err});
                };
                if (product) {
                    res.json({message: 'Product found successfully', data: product});
                } else {
                    res.json({info: 'Product not found'});
                }
            });
        };
    });

    app.put('/product/:id', function (req, res) {

        if(verifyUser(req , res)){
            var product = req.body;
            if(verifyProductObject(product, res)){
                Product.findById(req.params.id, function(err, product) {
                    if (err) {
                        res.json({message: 'error during find product', error: err});
                    };
                    if (product) {
                        _.merge(product, req.body);
                        console.log(product)
                        product.save(function(err) {
                            if (err) {
                                res.json({message: 'error during product update', error: err});
                            };
                            res.json({message: 'Product updated successfully'});
                        });
                    } else {
                        res.json({info: 'Product not found'});
                    }

                });
            };
        };
    });
    app.delete('/product/:id', function (req, res) {

        if(verifyUser(req , res)){
            Product.findByIdAndRemove(req.params.id, function(err) {
                if (err) {
                    res.json({message: 'error during remove product', error: err});
                };
                res.json({message: 'Product removed successfully'});
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

    function verifyProductObject(product , res) {
        var errs = [];

        if(!product.name)
            errs.push('Product name is required');
        if(!product.price)
            errs.push('Product price is required');

        if(errs.length > 0)
            res.status(400).send({message: 'Validation error', error:errs});
        else
            return true;
    }
};