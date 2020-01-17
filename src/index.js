//import express
var express = require('express');
//connect mongoose to database
require('./db/mongoose');
//import user router
var userRouter = require('./routers/user-router');
//import task router
var taskRouter = require('./routers/task-router');

var app = express();
var port = process.env.PORT;

app.use(express.json()); //Parse incoming json
app.use(userRouter); //Register user router
app.use(taskRouter); //Register task router

app.listen(port, ()=> {
  console.log("Now listening at port " + port);
});
