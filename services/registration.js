const express = require("express"),
  bodyParser = require("body-parser"),
  crypto = require("crypto"),
  router = express.Router();

const securityUtils = require("../utils/securityUtils");

router.use(bodyParser.json());

// MongoDB User Object to use in file
var users = require("../models/users");

//Sample test route
router.get("/", function(req, res) {
  console.log("Test route for registration");
  return res.send("Hello from Node App.");
});

/*
 * Route for sign up
 * Params required: firstname   -> type: String
 *                  lastname    -> type: String
 *                  Password    -> type: String
 *                  Email       -> type: String
 * Req URI: http://localhost:4000/registration/signup
 */
router.post("/signup", function(req, res) {
  console.log("Route for signup hit.");
  // Every user is supposed to have unique email address for registration.
  // Hence we'll first of all check if any user has the email that the current user is trying to use.
  users.find({ email: req.body.email }, function(err, response) {
    if (err) {
      // There's something wrong with your query for database access
      res.send({
        success: false,
        message:
          "Error while accessing database. Please check your backend query."
      });
    }

    // Handling the case if no user with the provided email is there.
    // Creating a new user with the provided information
    if (!response.length) {
      // Generate the sessionToken, salt and passwordHash for this user
      const newSessionToken = crypto
        .createHmac("sha256", req.body.email)
        .update(Date.now().toString())
        .digest("hex");
      const result = securityUtils.getPasswordHash(req.body.password);

      // Create an object of this new user to store his info into the database
      const userToStore = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        salt: result.salt,
        passwordHash: result.hash,
        sessionToken: newSessionToken
      };

      var newUser = new users(userToStore);
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
              firstname: req.body.firstname,
              email: req.body.email,
              sessionToken: newSessionToken
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

/*
 * Route for sign in
 * Params required: Email    -> type: String
 *                  Password -> type: String
 * Req URI: http://localhost:4000/registration/signin
 */
router.post("/signin", function(req, res) {
  console.log("Route for signin hit.");
  users.findOne({ email: req.body.email }, (error, response) => {
    // Check for any errors
    if (error) {
      res.send({
        success: false,
        message:
          "There's some error while accessing the database. Please check your db query.",
        payload: {
          error: error
        }
      });
    }

    // If there is an user with the provided email address, verify his identity
    if (response) {
      const signedIn = securityUtils.verifyPassword(
        req.body.password,
        response.passwordHash,
        response.salt
      );

      // If user's identity is successfully verified, then proceed to sign him in.
      if (signedIn) {
        // This case shouldn't happen anytime, but still we're performing this check to see if
        //  user already has a sessionToken assigned to him.
        if (response.sessionToken === null) {
          // Generate a sessionToken and update the lastLoggedIn entry into the database.
          const hash = crypto
            .createHmac("sha256", req.body.email)
            .update(Date.now().toString())
            .digest("hex");

          users.updateOne(
            { email: response.email },
            { sessionToken: hash },
            (err, resp) => {
              if (err) {
                res.send({
                  success: false,
                  message:
                    "There was an error while generating and storing the sessionToken for the user. Please try again.",
                  payload: {
                    error: err
                  }
                });
              }

              if (resp) {
                let currentUser = response;
                const currentTime = new Date();
                currentUser.loginHistory.push(currentTime.toString());
                currentUser
                  .save()
                  .then(resp => {
                    res.send({
                      success: true,
                      message: "User successfully logged in.",
                      payload: {
                        firstname: resp.firstname,
                        email: resp.email,
                        sessionToken: hash
                      }
                    });
                  })
                  .catch(error => {
                    res.send({
                      success: false,
                      message:
                        "There was an error while updating the user's information into the db.",
                      payload: {
                        error: error
                      }
                    });
                  });
              }
            }
          );
        } else {
          res.send({
            success: true,
            message: "User is already logged in.",
            payload: {
              firstname: response.firstname,
              email: response.email,
              sessionToken: response.sessionToken
            }
          });
        }
      } else {
        res.send({
          success: false,
          message: "Incorrect email/password combination."
        });
      }
    } else {
      res.send({
        success: false,
        message:
          "There's been some weird error at the server side. Please check the server console."
      });
    }
  });
});

/*
 * Route to check if sessionToken is valid or not
 * Params required:  sessionToken  -> type: String
 * Req URI: http://localhost:4000/registration/verifyLoggedInUser
 */
router.post("/verifyLoggedInUser", (req, res) => {
  console.log("Route for verification hit.");
  users.findOne({ sessionToken: req.body.sessionToken }, (err, response) => {
    if (err) {
      res.send({
        success: false,
        message:
          "Error while accessing database. Please check your backend query."
      });
    }

    if (!response) {
      res.send({
        success: false,
        message: "Invalid Email/sessionToken."
      });
    } else {
      // This user is already signed in. Send a success response.
      res.send({
        success: true,
        message: "User already logged in.",
        payload: {
          firstname: response.firstname,
          email: response.email,
          sessionToken: response.sessionToken
        }
      });
    }
  });
});

/*
 * Route for logout
 * Params required: Email         -> type: String
 *                  sessionToken  -> type: String
 * Req URI: http://localhost:4000/registration/logout
 */
router.post("/logout", function(req, res) {
  console.log("Route for logout hit.");
  users.find(
    { email: req.body.email, sessionToken: req.body.sessionToken },
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
        // Error with the email that is being sent
        res.send({
          success: false,
          message:
            "There's something wrong in the frontend with email for all the users. Check and send the request again."
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
