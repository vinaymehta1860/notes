var express = require('express'),
    cors = require('cors'),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose");

mongoose.set('useCreateIndex', true);
var db = mongoose.connect('mongodb://localhost/notes-backend', { useNewUrlParser: true } ).then(
  function(){
    //Successfull connection to mongoDB database.
    console.log("Successfully connected to MongoDB Database.");
  },
  function(err){
    //Error while connecting to MongoDB database.
    console.log(err);
  }
);

var apiHandler = require('./services/api');

var app = express();

app.use(bodyParser.json());

app.use(cors());

app.use('/', apiHandler);

app.listen(3000, function(){
  console.log("Server running on port 3000");
});