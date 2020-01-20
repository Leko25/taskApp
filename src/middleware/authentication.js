const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HTTPStatuses = require('../routers/HTTPStatus');

var authentication = async (req, res, next)=>{
  try{
    var authToken = req.header('Authorization').replace('Bearer ', '');
    var decodedToken = jwt.verify(authToken, "shazam");
    var user = await User.findOne({_id: decodedToken._id, "authTokens.authToken": authToken});

    if(!user){
      throw new Error();
    }

    req.authToken = authToken;
    req.user = user;
    next();
  }catch(err){
    res.status(HTTPStatuses.notFound).send({error: "Please provide authentication"});
  }
};

module.exports = authentication;
