const express = require("express"),
  bodyParser = require("body-parser"),
  crypto = require("crypto"),
  router = express.Router();

router.use(bodyParser.json());

// MongoDB User Object to use in file
var users = require("../models/users");

//Sample test route
router.get("/", function(req, res) {
  console.log("Test route for registration");
  return res.send("Hello from Node App.");
});

// Route for sign up
// Params required: Username    -> type: String
//                  Password    -> type: String
//                  Email       -> type: String
//                  dateCreated -> type: String
// Req URI: http://localhost:4000/registration/signup
router.post("/signup", function(req, res) {
  console.log("Route for signup hit.");
  users.find({ email: req.body.email }, function(err, response) {
    if (err) {
      // There's something wrong with your query for database access
      res.send({
        success: false,
        message:
          "Error while accessing database. Please check your backend query."
      });
    }

    if (!response.length) {
      // Handling the case if no user with the provided email is there
      // Creating a new user with the provided username and password

      //Generating sessionToken for the user
      var hash = crypto
        .createHmac("sha256", req.body.username)
        .update(Date.now().toString())
        .digest("hex");

      req.body.sessionToken = hash;

      var newUser = new users(req.body);
      const currentTime = new Date();
      newUser.loginHistory.push(currentTime.toString());
      //Good use of promises to know if save was actually successfull or not
      newUser
        .save()
        .then(() => {
          res.send({
            success: true,
            message: "User successfully created.",
            payload: {
              username: req.body.username,
              email: req.body.email,
              sessionToken: hash
            }
          });
        })
        .catch(err => {
          console.log("Error while performing save -> " + err);
          res.send({
            success: false,
            message:
              "Error while performing save function. Please see the console log on the server side."
          });
        });
    } else {
      // Handling the case where user already exists in database.
      // Throw an error
      res.send({
        success: false,
        message:
          "ERROR.! Email already registered. Please provide a different email.!"
      });
    }
  });
});

//Route for sign in
//Params required: Username -> type: String
//                 Password -> type: String
// Req URI: http://localhost:4000/registration/signin
router.post("/signin", function(req, res) {
  console.log("Route for signin hit.");
  users.find(
    { username: req.body.username, password: req.body.password },
    function(err, response) {
      if (err) {
        // There's something wrong with your query for database access
        res.send({
          success: false,
          message:
            "Error while accessing database. Please check your backend query."
        });
      }

      if (response.length) {
        // Generate a sessionToken for the current user and update database table
        users.find({ username: req.body.username }, (err, response) => {
          if (err) {
            // There's something wrong with your query for database access
            res.send({
              success: false,
              message:
                "Error while accessing database. Please check your backend query."
            });
          }

          // Check if there already is a sessionToken
          // If there is, return the same or else create a new one
          if (response[0].sessionToken !== null) {
            res.send({
              success: true,
              message: "User already logged in.",
              payload: {
                username: req.body.username,
                sessionToken: response[0].sessionToken
              }
            });
          } else {
            // Generating sessionToken for the user
            var hash = crypto
              .createHmac("sha256", req.body.username)
              .update(Date.now().toString())
              .digest("hex");

            // Updating the database to reflect new sessionToken
            // TODO: Update the callback function to be a promise
            users.updateOne(
              { _id: response[0]._id },
              { sessionToken: hash },
              (err, resp) => {
                if (err) {
                  res.send({
                    success: false,
                    message: "Error while performing update query."
                  });
                }
                if (resp) {
                  var updateLoginHistory = response[0];
                  const currentTime = new Date();
                  updateLoginHistory.loginHistory.push(currentTime.toString());
                  updateLoginHistory.save();
                  // FUTURE WORK: May be use promises for the save operation to handle sending back responses
                  res.send({
                    success: true,
                    message:
                      "User successfully logged in. Username: " +
                      req.body.username +
                      ". Hash: " +
                      hash
                  });
                }
              }
            );
          }
        });
      } else {
        res.send({
          success: false,
          message: "ERROR. Invalid username/password."
        });
      }
    }
  );
});

// Route for logout
// Params required: Username      -> type: String
//                  sessionToken  -> type: String
// Req URI: http://localhost:4000/registration/logout
router.post("/logout", function(req, res) {
  console.log("Route for logout hit.");
  users.find(
    { username: req.body.username, sessionToken: req.body.sessionToken },
    (err, response) => {
      if (err) {
        // There's something wrong with your query for database access
        res.send({
          success: false,
          message:
            "Error while accessing database. Please check your backend query."
        });
      }

      if (!response.length) {
        // Error with the username that is being sent
        res.send({
          success: false,
          message:
            "There's something wrong in the frontend with usernames for all the users. Check and send the request again."
        });
      } else {
        // Updating the sessionToken when a user logs out
        // TODO: Update the callback function to be a promise
        users.updateOne(
          { _id: response[0]._id },
          { sessionToken: null },
          (err, resp) => {
            if (err) {
              console.log("Error -> " + err);
              res.send({
                success: false,
                message: "Error while performing update query. Error -> " + err
              });
            } else if (resp) {
              res.send({ success: true, message: "Update successfull" });
            }
          }
        );
      }
    }
  );
});

module.exports = router;
