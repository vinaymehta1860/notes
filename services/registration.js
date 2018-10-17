const express = require("express"),
      bodyParser = require("body-parser"),
      crypto = require("crypto"),
      router = express.Router();

router.use(bodyParser.json());

// MongoDB User Object to use in file
var users = require("../models/users");

//Simple test route
router.get('/', function(req, res){
  return res.send("Hello from Node App.");
});

// Route for sign up
// Params required: Username -> type: String
//                 Password -> type: String
//                 Email    -> type: String
// Req URI: http://localhost:3000/registration/signup 
router.post('/signup', function(req, res){
  users.find({email: req.body.email}, function(err, response){
    if(err){
      // There's something wrong with your query for database access
      res.send("Error while accessing databse. Please check your backend query.");
    }
    
    if(!response.length){
      // Handling the case if no user with the provided email is there
      // Creating a new user with the provided username and password
      
      //Generating sessionToken for the user
      var hash = crypto.createHmac('sha256', req.body.username)
                   .update(Date.now().toString())
                   .digest('hex');

      req.body.sessionToken = hash;

      var newUser = new users(req.body);
      var currentTime = new Date();
      newUser.loginHistory.push(currentTime.toString());
      //Good use of promises to know if save was actually successfull or not
      newUser.save()
              .then(() => {
                res.send("User successfully created. Username: " + req.body.username + ". Password: " + req.body.password
                          + ". Email: " + req.body.email + ". Hash: " + hash);
              })
              .catch((err) => {
                console.log("Error while performing save -> " + err);
                res.send("Error while performing save function. Please see the console log on the server side.");
              })
    }
    else{
      // Handling the case where user already exists in database.
      // Throw an error
      res.send("ERROR.! Email already registered. Please provide a different email.!");
    }
  });
});

//Route for sign in
//Params required: Username -> type: String
//                 Password -> type: String
// Req URI: http://localhost:3000/registration/signin
router.post('/signin', function(req, res){
  users.find({username: req.body.username, password: req.body.password}, function(err, response){
    if(err){
      // There's something wrong with your query for database access
      res.send("Error while accessing databse. Please check your backend query.");
    }

    if(response.length){
      // Generate a sessionToken for the current user and update database table
      users.find({username: req.body.username}, (err, response) => {
        if(err){
          // There's something wrong with your query for database access
          res.send("Error while accessing databse. Please check your backend query.");
        }

        // Check if there already is a sessionToken
        // If there is, return the same or else create a new one
        if(response[0].sessionToken !== null){
          res.send("User already logged in. Username: " + req.body.username + ". Hash: " + response[0].sessionToken);
        }
        else{
          // Generating sessionToken for the user
          var hash = crypto.createHmac('sha256', req.body.username)
                           .update(Date.now().toString())
                           .digest('hex');
          
          // Updating the database to reflect new sessionToken
          // TODO: Update the callback function to be a promise
          users.updateOne({_id: response[0]._id}, {sessionToken: hash}, (err, resp) => {
            if(err){
              res.send("Error while performing update query.");
            }
            if(resp){
              var updateLoginHistory = response[0];
              var currentTime = new Date();
              updateLoginHistory.loginHistory.push(currentTime.toString());
              updateLoginHistory.save();
              res.send("User successfully logged in. Username: " + req.body.username + ". Hash: " + hash);
            }
          });
        }
      });
    }
    else{
      res.send("ERROR. Invalid username/password.");
    }
  });
});

// Route for logout
// Params required: Username -> type: String
// Req URI: http://localhost:3000/registration/logout
router.post('/logout', function(req, res){
  users.find({username: req.body.username}, (err, response) => {
    if(err){
      // There's something wrong with your query for database access
      res.send("Error while accessing databse. Please check your backend query.");
    }

    if(!response.length){
      // Error with the username that is being sent
      res.send("Buddy, there's something seriously wrong in the frontend with usernames for all the users. Check and send the request again.");
    }
    else{
      // Updating the sessionToken when a user logs out
      // TODO: Update the callback function to be a promise
      users.updateOne({_id: response[0]._id}, {sessionToken: null}, (err, resp) => {
        if(err){
          console.log("Error -> " + err);
          res.send("Error while performing update query.");
        }
        else if(resp){
          res.send("Update successfull");
        }
      });
    }
  });
});

module.exports = router;