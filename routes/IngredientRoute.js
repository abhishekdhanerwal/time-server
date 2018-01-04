var _ = require('lodash');
var jwt = require('jwt-simple');
var multer = require('multer');
var Ingredient = require('../models/Ingredient');

module.exports = function (app) {

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/ingredient')
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
    app.post('/ingredient/upload', function(req, res) {

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
    
    app.post('/ingredient/save', function (req, res) {
        var ingredientObjFrmUi = req.body;
        if(verifyUser(req , res)){
            var newIngredient = new Ingredient({
                name:ingredientObjFrmUi.name,
                image:ingredientObjFrmUi.image,
                energy:ingredientObjFrmUi.energy,
                fat:ingredientObjFrmUi.fat,
                carbohydrate:ingredientObjFrmUi.carbohydrate,
                protein:ingredientObjFrmUi.protein,
                water:ingredientObjFrmUi.water,
                starch:ingredientObjFrmUi.starch,
                fiber:ingredientObjFrmUi.fiber,
                sugars:ingredientObjFrmUi.sugars,
                glucose:ingredientObjFrmUi.glucose,
                fructose:ingredientObjFrmUi.fructose,
                maltose:ingredientObjFrmUi.maltose,
                oligoSaccharide:ingredientObjFrmUi.oligoSaccharide,
                freeSugar:ingredientObjFrmUi.freeSugar,
                nsp:ingredientObjFrmUi.nsp,
                glactose:ingredientObjFrmUi.glactose,
                sucrose:ingredientObjFrmUi.sucrose,
                lactose:ingredientObjFrmUi.lactose,
                saturatedFat:ingredientObjFrmUi.saturatedFat,
                cisMono:ingredientObjFrmUi.cisMono,
                omegaThree:ingredientObjFrmUi.omegaThree,
                cisPoly:ingredientObjFrmUi.cisPoly,
                cholestrol:ingredientObjFrmUi.cholestrol,
                monoSaturatedFat:ingredientObjFrmUi.monoSaturatedFat,
                polySaturatedFat:ingredientObjFrmUi.polySaturatedFat,
                omegaSix:ingredientObjFrmUi.omegaSix,
                transFattyAcids:ingredientObjFrmUi.transFattyAcids,
                sodium:ingredientObjFrmUi.sodium,
                chloride:ingredientObjFrmUi.chloride,
                phosphorus:ingredientObjFrmUi.phosphorus,
                iron:ingredientObjFrmUi.iron,
                copper:ingredientObjFrmUi.copper,
                selenium:ingredientObjFrmUi.selenium,
                potassium:ingredientObjFrmUi.potassium,
                calcium:ingredientObjFrmUi.calcium,
                magnesium:ingredientObjFrmUi.magnesium,
                zinc:ingredientObjFrmUi.zinc,
                manganese:ingredientObjFrmUi.manganese,
                iodine:ingredientObjFrmUi.iodine,
                vitaminA:ingredientObjFrmUi.vitaminA,
                carotene:ingredientObjFrmUi.carotene,
                vitaminE:ingredientObjFrmUi.vitaminE,
                thiaminBOne:ingredientObjFrmUi.thiaminBOne,
                niacinTotalBThree:ingredientObjFrmUi.niacinTotalBThree,
                tryptophan:ingredientObjFrmUi.tryptophan,
                vitaminBSix:ingredientObjFrmUi.vitaminBSix,
                vitaminBTwelve:ingredientObjFrmUi.vitaminBTwelve,
                vitaminC:ingredientObjFrmUi.vitaminC,
                retinol:ingredientObjFrmUi.retinol,
                vitaminD:ingredientObjFrmUi.vitaminD,
                vitaminKOne:ingredientObjFrmUi.vitaminKOne,
                riboflavin:ingredientObjFrmUi.riboflavin,
                niacin:ingredientObjFrmUi.niacin,
                pantothenicAcid:ingredientObjFrmUi.pantothenicAcid,
                folicAcid:ingredientObjFrmUi.folicAcid,
                biotin:ingredientObjFrmUi.biotin,
                gi:ingredientObjFrmUi.gi,
                pral:ingredientObjFrmUi.pral,
                gl:ingredientObjFrmUi.gl,
                caffeine:ingredientObjFrmUi.caffeine
            })

            newIngredient.save(function (err) {
                if(err)
                    res.status(400).send({
                        message: 'Server not responding',
                        error: err
                    });
                //throw err;

                res.status(200).send({message: 'Ingredient saved'});
            })
        }
    });

    app.get('/ingredient/list', function(req, res){
        if(verifyUser(req , res)){
            Ingredient.find(function (err , ingredients) {
                if (err) {
                    res.json({message: 'error during finding ingredients', error: err});
                };
                res.json({message: 'Ingredients found successfully', data: ingredients});
            })
        }
    });

    app.get('/ingredient/:id', function (req, res) {
        if(verifyUser(req , res)){
            Ingredient.findById(req.params.id , function (err , ingredient) {
                if (err) {
                    res.json({message: 'error during finding ingredient', error: err});
                };
                if(ingredient)
                res.json({message: 'Ingredients found successfully', data: ingredient});
                else
                    res.json({info: 'Ingredients not found'});
            })
        }
    });

    app.put('/ingredient/update/:id', function (req, res) {
        if(verifyUser(req , res)){
            Ingredient.findById(req.params.id , function (err , ingredient) {
                if (err) {
                    res.json({message: 'error during finding ingredient', error: err});
                };
                if(ingredient) {
                    _.merge(ingredient, req.body);

                    ingredient.save(function (err) {
                        if (err) {
                            res.json({message: 'error during ingredient update', error: err});
                        };
                        res.json({message: 'Ingredient updated successfully', data: ingredient});
                    })
                }
                else
                    res.json({info: 'Ingredient not found'});
            })
        }
    })

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