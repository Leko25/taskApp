const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./tasks');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Not a valid email");
      }
    }
  },
  age: {
    type: Number,
    default: 1,
    validate(value) {
      if (value <= 0) {
        throw new Error('Age must be positive')
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (value.length < 6) {
        throw new Error("password is not long enough");
      }
      if (value.toLowerCase().includes("password")) {
        throw new Error("user password cannot contain 'password'");
      }
    }
  },
  avatar: {
    type: Buffer
  },
  authTokens: [{
    authToken: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

//Setup virtual property between user and tasks
//foreignField --> This the name of the field on the 'Task', where 'User' is referenced
//localField --> This is where the foreignField is actually store in the db
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'userId'
});

//Send back data about the user that we wish to display
userSchema.methods.toJSON = function(){
  var user = this;
  // var userProfile = {
  //   _id: user._id,
  //   email: user.email,
  //   name: user.name,
  //   age: user.age
  // };

  var userProfile = user.toObject();
  delete userProfile.authTokens;
  delete userProfile.password;
  delete userProfile.avatar;
  return userProfile;
};

//Requires this pointer
//methods: Is generated on a specific instance
userSchema.methods.generateAuthToken = async function(){
  var user = this;
  var authToken = jwt.sign({
    _id: user._id.toString()
  }, process.env.JWT_SECRET);
  user.authTokens = user.authTokens.concat({authToken: authToken});
  //save user again to store authentication
  await user.save();
  return authToken;
};

//Does not require this pointer
//statics: Is generated on the model
userSchema.statics.findByCredentials = async (email, pwd)=>{
  var user = await User.findOne({email:email});
  if(!user){
    throw new Error("Unable to login!");
  }

  var isMatch = await bcrypt.compare(pwd, user.password);

  if(!isMatch){
    throw new Error("Unable to login!");
  }
  return user;
};

//Hash plain text password before saving
userSchema.pre('save', async function(next){
  var user = this;
  if(user.isModified('password')){
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

//Delete tasks after a user has been removed
userSchema.pre('remove', async function(next){
  var user = this;
  await Task.deleteMany({userId: user._id});
  next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;
