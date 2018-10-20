var express = require('express'),
    cors = require('cors'),
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

const registrationHandler = require('./services/registration');
const notesHandler = require('./services/notes');

var app = express();

app.use(cors());

app.use('/registration', registrationHandler);
app.use('/notes', notesHandler);

app.listen(3000, function(){
  console.log("Server running on port 3000");
});