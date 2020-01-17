var express = require('express');
var router = express.Router();
var authentication = require('../middleware/authentication');

//import task model
var Task = require('../models/tasks');

//import HTTP stutuses
var HTTPStatuses  = require('./HTTPStatus');

//Create new task
router.post('/tasks', authentication, async (req, res)=>{
  var newTask = new Task({
    ...req.body,
    userId: req.user._id
  });
  try{
    await newTask.save();
    res.status(HTTPStatuses.created).send(newTask);
  }catch(err){
    res.status(HTTPStatuses.badRequest).send(err);
  }
});


//GET /tasks?status=true||false
//pagination --> limit and skip
//GET /tasks?limit=10&skip=20
//GET /tasks?sortBy=createdAt_asc||createdAt_desc
router.get('/tasks', authentication, async (req, res)=>{
  var match = {};
  var sort = {};
  if(req.query.status){
    match.status = req.query.status === 'true' ? true : false;
  }

  if(req.query.sortBy){
    var items = req.query.sortBy.split("_");
    sort[items[0]] = items[1] === 'asc' ? 1 : -1;
  }
  try{
    var status = req.query.status;
    await req.user.populate({
      path: 'tasks',
      match: match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: sort
      }
    }).execPopulate();
    res.status(HTTPStatuses.ok).send(req.user.tasks);
  }catch(err){
    res.status(HTTPStatuses.internalServerError).send();
  }
});

//Read task with ID
router.get('/tasks/:id', authentication,async (req, res)=>{
  try{
    var task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if(!task){
      res.status(HTTPStatuses.notFound).send();
    }

    res.status(HTTPStatuses.ok).send(task);
  }catch(err){
    res.status(HTTPStatuses.internalServerError).send();
  }
});

//Update task
router.patch('/tasks/:id', authentication, async (req, res)=>{
  var allowedTaskUpdates = ["description", "status"];
  var updates = Object.keys(req.body);
  var isValidUpdate = updates.every((update)=>{
    return allowedTaskUpdates.includes(update);
  });

  if(!isValidUpdate){
    return res.status(HTTPStatuses.notFound).send({error: "invalid updates!"});
  }

  try{
    var taskUpdate = await Task.findOne({_id: req.params.id, userId: req.user._id});

    if(!taskUpdate){
      return res.status(HTTPStatuses.notFound).send();
    }

    updates.forEach((update)=>{
      taskUpdate[update] = req.body[update];
    });

    taskUpdate = await taskUpdate.save();
    res.status(HTTPStatuses.created).send(taskUpdate);
  }catch(err){
    res.status(HTTPStatuses.badRequest).send(err);
  }
});

//Delete task with ID
router.delete('/tasks/:id', authentication, async (req, res)=>{
  try{
    var deletedTask = await Task.findOneAndDelete({_id: req.params.id, userId: req.user._id});

    if(!deletedTask){
      return res.status(HTTPStatuses.notFound).send();
    }

    res.status(HTTPStatuses.ok).send(deletedTask);
  }catch(err){
    res.status(HTTPStatuses.internalServerError).send();
  }
});

//Delete all tasks
router.delete('/tasks', authentication, async (req, res)=>{
  try{
    await Task.deleteMany({userId: req.user._id});
    res.status(HTTPStatuses.ok).send();
  }catch(err){
    res.status(HTTPStatuses.internalServerError).send();
  }
});

module.exports = router;
