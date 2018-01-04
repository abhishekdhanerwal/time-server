var _ = require('lodash');
var jwt = require('jwt-simple');
var randomstring = require('randomstring');

var Coupon = require('../models/Coupon');
var Dietitian = require('../models/Dietitian');
var Product = require('../models/Product');
var ProductCategory = require('../models/ProductCategory');
var ProductSubCategory = require('../models/ProductSubCategory');

module.exports = function (app) {

    app.get('/coupon/generate', function (req, res) {
        if(verifyUser(req,res)){
            var dietitian = req.body;
             generateCouponCode(function(couponCode){
                    res.status(200).send({
                        message:'Coupon generated successfully',
                        code:couponCode
                    })
                })
        }
    });

    function generateCouponCode(callback) {
        var couponCode = randomstring.generate(7);

        Coupon.findOne({couponCode:couponCode}, function (err, coupon) {
            if (err)
                res.status(401).send({
                    message: 'E-mail is wrong',
                    error: err
                });
            // throw err;

            if (coupon)
                generateCouponCode();
            else
                callback(couponCode);
        })
    }

    app.get('/coupon/list' , function (req ,res) {
        if(verifyUser(req,res)) {
            Coupon.find({active: req.query.status}, function (err, coupons) {
                if (err) {
                    res.json({message: 'error during finding coupons', error: err});
                }
                ;
                res.json({message: 'Coupons found successfully', data: coupons});
            })
        }
    })

    app.put('/coupon/status/:id', function (req, res) {
        if(verifyUser(req,res)){
            Coupon.findById(req.params.id , function (err , coupon) {
                if (err) {
                    res.json({message: 'error during finding coupons', error: err});
                }
                else if(coupon){
                    coupon.active = !coupon.active;
                    coupon.save(function (err) {
                        if (err) {
                            res.json({message: 'error during product coupon', error: err});
                        };
                        res.json({message: 'Coupon status changed successfully'});
                    })
                }
                else
                    res.json({info: 'Coupon not found'});
            })
        }
    })

    app.put('/coupon/create', function (req, res) {

        if(verifyUser(req , res)){
            var newCoupon = req.body;

            if(req.query.type == 'dietitian'){
                Dietitian.findById(newCoupon.dietitian._id, function(err, dietitian) {
                    if (err) {
                        res.json({message: 'error during find dietitian', error: err});
                    };
                    if (dietitian) {
                        var createCoupon = new Coupon({
                            couponCode:newCoupon.coupon.couponCode,
                            maxTimesApplicable:newCoupon.coupon.maxTimesApplicable,
                            dietitianId:newCoupon.dietitian._id,
                            active:true,
                        })
                        createCoupon.save(function (err) {
                            if(err)
                                res.status(400).send({
                                    message: 'Server not responding',
                                    error: err
                                });
                            //throw err;
                            updateDietitian(dietitian, newCoupon, createCoupon, res);
                        })
                    } else {
                        res.json({info: 'Dietitian not found'});
                    }

                });
            }
            else {
                if(req.query.type == 'productCategory') {
                    ProductCategory.findById(newCoupon.productCategory._id, function (err, productCategory) {
                        if (err) {
                            res.json({message: 'error during find product category', error: err});
                        };
                        if (productCategory) {
                            var createCoupon = new Coupon({
                                couponCode: newCoupon.coupon.couponCode,
                                maxTimesApplicable: newCoupon.coupon.maxTimesApplicable,
                                productCategoryId: newCoupon.productCategory._id,
                                active: true,
                            })
                            createCoupon.save(function (err) {
                                if (err)
                                    res.status(400).send({
                                        message: 'Server not responding',
                                        error: err
                                    });
                                //throw err;

                                productCategory.couponId.push(createCoupon._id);
                                productCategory.save(function (err) {
                                    if (err)
                                        res.status(400).send({
                                            message: 'Server not responding',
                                            error: err
                                        });
                                    ProductSubCategory.find({category: newCoupon.productCategory._id} , function (err , subCategory) {
                                        if (err)
                                            res.status(400).send({
                                                message: 'Server not responding',
                                                error: err
                                            });
                                        if(subCategory){
                                            _.each(subCategory , function (value , key) {
                                                value.couponId.push(createCoupon._id);
                                                value.save(function (err) {
                                                    if (err)
                                                        res.status(400).send({
                                                            message: 'Server not responding',
                                                            error: err
                                                        });
                                                    Product.find({subCategory : value._id} , function (err , products) {
                                                        if (err)
                                                            res.status(400).send({
                                                                message: 'Server not responding',
                                                                error: err
                                                            });
                                                        if(products){
                                                            _.each(products , function (valueProduct , keyProduct) {
                                                                var discount =  {};
                                                                if(newCoupon.discount.discountPercentage){
                                                                    discount.discountPercentage = newCoupon.discount.discountPercentage;
                                                                    discount.discountPrice = valueProduct.price - (discount.discountPercentage * valueProduct.price/100);
                                                                }
                                                                if(newCoupon.discount.discountFixed){
                                                                    discount.discountFixed = newCoupon.discount.discountFixed;
                                                                    discount.discountPrice = valueProduct.price - discount.discountFixed;
                                                                }
                                                                discount.couponId = createCoupon._id;
                                                                if(discount.discountPrice >= 0)
                                                                    valueProduct.discount.push(discount);

                                                                valueProduct.save(function (err) {
                                                                    if (err)
                                                                        res.status(400).send({
                                                                            message: 'Server not responding',
                                                                            error: err
                                                                        });
                                                                });
                                                            })
                                                        }
                                                    })
                                                });
                                            })
                                            res.status(200).send({message: 'Coupon created'});
                                        }
                                    })
                                });

                            })
                        } else {
                            res.json({info: 'Dietitian not found'});
                        }

                    });
                }
                else {
                    ProductSubCategory.findById(newCoupon.productSubCategory._id , function (err , subCategory) {
                        if (err)
                            res.status(400).send({
                                message: 'Server not responding',
                                error: err
                            });
                        if(subCategory){
                            var createCoupon = new Coupon({
                                couponCode: newCoupon.coupon.couponCode,
                                maxTimesApplicable: newCoupon.coupon.maxTimesApplicable,
                                productSubCategoryId: newCoupon.productSubCategory._id
                            })
                            createCoupon.save(function (err) {
                                if (err)
                                    res.status(400).send({
                                        message: 'Server not responding',
                                        error: err
                                    });

                                Product.find({subCategory: newCoupon.productSubCategory._id}, function (err, products) {
                                            if (err)
                                                res.status(400).send({
                                                    message: 'Server not responding',
                                                    error: err
                                                });
                                            if (products) {
                                                _.each(products, function (valueProduct, keyProduct) {
                                                    var discount = {};
                                                    if (newCoupon.discount.discountPercentage) {
                                                        discount.discountPercentage = newCoupon.discount.discountPercentage;
                                                        discount.discountPrice = valueProduct.price - (discount.discountPercentage * valueProduct.price / 100);
                                                    }
                                                    if (newCoupon.discount.discountFixed) {
                                                        discount.discountFixed = newCoupon.discount.discountFixed;
                                                        discount.discountPrice = valueProduct.price - discount.discountFixed;
                                                    }
                                                    discount.couponId = createCoupon._id;
                                                    if (discount.discountPrice >= 0)
                                                        valueProduct.discount.push(discount);

                                                    valueProduct.save(function (err) {
                                                        if (err)
                                                            res.status(400).send({
                                                                message: 'Server not responding',
                                                                error: err
                                                            });
                                                    });
                                                })
                                            }
                                })
                                subCategory.couponId.push(createCoupon._id)
                                subCategory.save(function (err) {
                                    if (err)
                                        res.status(400).send({
                                            message: 'Server not responding',
                                            error: err
                                        });
                                    res.status(200).send({message: 'Coupon created'});
                                });
                            })

                        }
                    })
                }
            }
        };
    });

    function updateDietitian(dietitian, newCoupon, createdCoupon, res) {
        newCoupon.dietitian.discount[newCoupon.dietitian.discount.length-1].couponId = createdCoupon._id;
        _.merge(dietitian, newCoupon.dietitian);

        dietitian.save(function (err) {
            if(err)
                res.status(400).send({
                    message: 'Server not responding',
                    error: err
                });

            res.status(200).send({message: 'Coupon created'});
        })
    }

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
}