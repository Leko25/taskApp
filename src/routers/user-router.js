const express = require('express');
const router = new express.Router();

//import user model
const User = require('../models/user');
//import HTTP statuses
const HTTPStatuses = require('./HTTPStatus');
//import authentication middleware
const authentication = require('../middleware/authentication');
//import multer for file uploads
const multer = require('multer');
//image processing sharp
const sharp = require('sharp');
//import email functions from sendgrid
const {sendSignUpEmail, sendCancellationEmail} = require('../emails/account');

const upload = multer({
  limits: {
    fileSize: 1e6
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }
    cb(undefined, true);
  }
});

//Create new user
router.post('/users', async (req, res)=>{
  var newUser = new User(req.body);
  try{
    await newUser.save();
    await sendSignUpEmail(newUser.email, newUser.name);
    var authToken = await newUser.generateAuthToken();
    res.status(HTTPStatuses.created).send({
      user: newUser,
      authToken: authToken
    });
  }catch (err) {
    res.status(HTTPStatuses.badRequest).send(err);
  }
});

//User login
router.post('/users/login', async (req, res)=>{
  try{
    var user = await User.findByCredentials(req.body.email, req.body.password);
    var authToken = await user.generateAuthToken();
    res.status(HTTPStatuses.ok).send({ user: user, authToken: authToken});
  }catch (err) {
    res.status(HTTPStatuses.unAuthorized).send();
  }
});

//User logout
//User must be logged in to logout
router.post('/users/logout', authentication, async (req, res)=>{
  try{
    //filter removes the entries that are false
    req.user.authTokens = req.user.authTokens.filter((authToken)=>{
      return authToken.authToken !== req.authToken;
    });
    //save the user
    await req.user.save();
    res.status(HTTPStatuses.ok).send(req.user);
  }catch (err) {
    res.status(HTTPStatuses.internalServerError).send();
  }
});

//Logout all sessions
router.post('/users/logoutAll', authentication, async (req, res)=>{
  try{
    req.user.authTokens = [];
    await req.user.save();
    res.status(HTTPStatuses.ok).send(req.user);
  }catch (err) {
    console.log(err);
    res.status(HTTPStatuses.internalServerError).send(err);
  }
});

//Create and Upload profile avatar
router.post('/users/me/avatar', authentication, upload.single('avatar'), async (req, res) =>{
  var buffer = await sharp(req.file.buffer)
      .resize({width: 250, height: 250})
      .png({force: true})
      .toBuffer();
  req.user.avatar = buffer;
  await req.user.save();
  res.status(HTTPStatuses.ok).send();
}, (err, req, res, next) => {
  res.status(HTTPStatuses.badRequest).send({error: err.message});
});

//Read users
router.get('/users/me', authentication, async (req, res)=>{
  res.status(HTTPStatuses.ok).send(req.user);
});

//Update user
router.patch('/users/me', authentication, async (req, res)=>{
  var allowedUserUpdates = ["age", "name", "email", "password"];
  var updates = Object.keys(req.body);
  var isValidUpdate = updates.every((update)=>{
    return allowedUserUpdates.includes(update);
  });

  if(!isValidUpdate){
    return res.status(HTTPStatuses.notFound).send({err: "Invalid updates!"});
  }

  try{
    updates.forEach((update)=>{
      req.user[update] = req.body[update]
    });

    await req.user.save();
    // var userUpdate = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true});
    res.status(HTTPStatuses.created).send(req.user);
  }catch (err) {
    res.status(HTTPStatuses.badRequest).send(err);
  }
});

//Delete User
router.delete('/users/me', authentication, async (req, res)=>{
  try{
    await sendCancellationEmail(req.user.email, req.user.name);
    await req.user.remove();
    res.status(HTTPStatuses.ok).send(req.user);
  }catch (err) {
    res.status(HTTPStatuses.internalServerError).send();
  }
});

//Delete User avatar
router.delete('/users/me/avatar', authentication, async (req, res) => {
  try{
    req.user.avatar = undefined;
    await req.user.save();
    res.status(HTTPStatuses.ok).send();
  }catch (err) {
    res.status(HTTPStatuses.internalServerError).send();
  }
});

//Fetching a user avatar
router.get('/users/:id/avatar', async (req, res) => {
  try{
    var user = await User.findById(req.params.id);

    if(!user || !user.avatar){
      throw new Error();
    }
    //Set Response Header
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  }catch (err) {
    res.status(HTTPStatuses.badRequest).send();
  }
});

module.exports = router;
