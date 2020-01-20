//import express
const express = require('express');
//connect mongoose to database
require('./db/mongoose');
//import user router
const userRouter = require('./routers/user-router');
//import task router
const taskRouter = require('./routers/task-router');

const app = express();
const port = process.env.PORT;

app.use(express.json()); //Parse incoming json
app.use(userRouter); //Register user router
app.use(taskRouter); //Register task router

app.listen(port, ()=> {
  console.log("Now listening at port " + port);
});
