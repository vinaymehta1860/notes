var express = require("express"),
    bodyParser = require("body-parser"),
    router = express.Router();

router.use(bodyParser.json());

// MongoDb User Object to use in file
var users = require("../models/users");

//Simple test route
router.get('/', function(req, res){
  return res.send("Hello from Node App.");
});

// Route for sign up
router.post('/signup', function(req, res){
  users.find({username: req.body.username}, function(err, response){
    if(err){
      // There's something wrong with your query for database access
      res.send("Error while accessing databse. Please check your backend query.");
    }
    
    if(!response.length){
      // Handling the case if no user with the provided username is there
      // Creating a new user with the provided username and password
      var newUser = new users(req.body);
      newUser.save();
      
      res.send("User successfully created. Username: " + req.body.username + ". Password: " + req.body.password);
    }
    else{
      // Handling the case where user already exists in database.
      // Throw an error
      res.send("ERROR.! User already exists. Please provide a different username.!");
    }
  });
});

router.post('/signin', function(req, res){
  users.find({username: req.body.username, password: req.body.password}, function(err, response){
    if(err){
      // There's something wrong with your query for database access
      res.send("Error while accessing databse. Please check your backend query.");
    }

    if(response.length){
      res.send("Log In Successfull.");
    }
    else{
      res.send("ERROR. Invalid username/password.");
    }
  })
})

module.exports = router;