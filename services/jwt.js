// not used we created a library for jwt-simple

var crypto = require('crypto');

exports.encode = function (payload , secret) {

  algorithm = 'HS256';

  var header = {
    typ : 'JWT',
    alg : algorithm
  };

  var jwt = base64Encode(JSON.stringify(header)) + '.' + base64Encode(JSON.stringify(payload));

  return jwt + '.' + sign(jwt,secret);
};

exports.decode = function (token , secret) {
  var segment = token.split('.');

  if(segment.length !== 3)
    throw new Error("Token structure invalid");

  var header = JSON.parse(base64Decode(segment[0]));
  var payload = JSON.parse(base64Decode(segment[1]));

  var rawSignature =  segment[0] + '.' + segment[1];

  if(!verify(rawSignature, secret , segment[2]))
    throw new Error("Verification failed");

  return payload;
}

function verify(raw , secret , signature) {
    return signature === sign(raw , secret)
}

function sign(str, key) {
  return crypto.createHmac('sha256', key).update(str).digest('base64');
}

function base64Encode(str) {
  return new Buffer(str).toString('base64');
}

function base64Decode(str) {
  return new Buffer(str, 'base64').toString();
}
