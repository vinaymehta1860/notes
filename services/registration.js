const bodyParser = require('body-parser'),
  crypto = require('crypto'),
  cors = require('cors'),
  cookieParser = require('cookie-parser'),
  express = require('express'),
  router = express.Router();

// External files/modules
const securityUtils = require('../utils/securityUtils');

router.use(
  cors({ credentials: true, origin: 'http://localhost:3001' }),
  bodyParser.json(),
  cookieParser('82e4e438a0705fabf61f9854e3b575af')
);

// MongoDB User Object to use in file
var users = require('../models/users');

//Sample test route
router.get('/', function(req, res) {
  console.log('Test route for registration');
  return res.send('Hello from Node App.');
});

/*
 * Route for sign up
 * Params required: firstname   -> type: String
 *                  lastname    -> type: String
 *                  Password    -> type: String
 *                  Email       -> type: String
 * Req URI: http://localhost:4000/registration/signup
 */
router.post('/signup', function(req, res) {
  console.log('Route for signup hit.');
  // Every user is supposed to have unique email address for registration.
  // Hence we'll first check if any user has the email that the current user is trying to use.
  users.find({ email: req.body.email }, function(err, response) {
    if (err) {
      // There's something wrong with your query for database access
      res.send({
        success: false,
        message:
          'Error while accessing database. Please check your backend query.'
      });
    }

    // Handling the case if no user with the provided email is there.
    // Creating a new user with the provided information
    if (!response.length) {
      // Generate the sessionToken, salt and passwordHash for this user
      const newSessionToken = crypto
        .createHmac('sha256', req.body.email)
        .update(Date.now().toString())
        .digest('hex');
      securityUtils.getPasswordHash(req.body.password).then(result => {
        // Create an object of this new user to store his info into the database
        const userToStore = {
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          // TODO: Groups are currently hardcoded. Would like to find a way to setup mongoose model
          //  to populate this list by default with following values
          groups: ['Work', 'Finance', 'Personal', 'College', 'Errands', 'Misc'],
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
            res
              .cookie('email', req.body.email, {
                signed: true,
                httpOnly: true
              })
              .cookie('sessionToken', newSessionToken, {
                httpOnly: true,
                signed: true
              })
              .send({
                success: true,
                message: 'User successfully created.',
                payload: {
                  firstname: req.body.firstname,
                  lastname: req.body.lastname,
                  email: req.body.email,
                  groups: [
                    'Work',
                    'Finance',
                    'Personal',
                    'College',
                    'Errands',
                    'Misc'
                  ],
                  sessionToken: newSessionToken
                }
              });
          })
          .catch(err => {
            console.log('Error while performing save -> ' + err);
            res.send({
              success: false,
              message:
                'Error while performing save function. Please see the console log on the server side.'
            });
          });
      });
    } else {
      // Handling the case where user already exists in database.
      // Throw an error
      res.send({
        success: false,
        message:
          'ERROR.! Email already registered. Please provide a different email.!'
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
router.post('/signin', function(req, res) {
  console.log('Route for signin hit.');
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
      securityUtils
        .verifyPassword(req.body.password, response.passwordHash, response.salt)
        .then(result => {
          if (response.sessionToken === null) {
            // Generate a sessionToken and update the lastLoggedIn entry into the database.
            const hash = crypto
              .createHmac('sha256', req.body.email)
              .update(Date.now().toString())
              .digest('hex');

            users.updateOne(
              { email: response.email },
              { sessionToken: hash },
              (err, resp) => {
                if (err) {
                  res.send({
                    success: false,
                    message:
                      'There was an error while generating and storing the sessionToken for the user. Please try again.',
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
                      res
                        .cookie('email', resp.email, {
                          signed: true,
                          httpOnly: true
                        })
                        .cookie('sessionToken', hash, {
                          httpOnly: true,
                          signed: true
                        })
                        .send({
                          success: true,
                          message: 'User successfully logged in.',
                          payload: {
                            firstname: resp.firstname,
                            lastname: resp.lastname,
                            email: resp.email,
                            groups: resp.groups,
                            sessionToken: hash
                          }
                        });
                    })
                    .catch(error => {
                      res.send({
                        success: false,
                        message:
                          "There was an error while updating the user's information into the database.",
                        payload: {
                          error: error
                        }
                      });
                    });
                }
              }
            );
          } else {
            res
              .cookie('email', response.email, {
                signed: true,
                httpOnly: true
              })
              .cookie('sessionToken', response.sessionToken, {
                httpOnly: true,
                signed: true
              })
              .send({
                success: true,
                message: 'User is already logged in.',
                payload: {
                  firstname: response.firstname,
                  email: response.email,
                  groups: response.groups,
                  sessionToken: response.sessionToken
                }
              });
          }
        })
        .catch(result => {
          res.send({
            success: false,
            message: 'Incorrect email/password combination.'
          });
        });
    } else {
      res.send({
        success: false,
        message: 'Incorrect email/password combination.'
      });
    }
  });
});

/*
 * Route to check if user is already logged in
 * Verification is performed via cookie that is received in request
 * Req URI: http://localhost:4000/registration/verifyLoggedInUser
 */
router.post('/verifyLoggedInUser', (req, res) => {
  console.log('Route for verification hit.');
  users.findOne(
    { sessionToken: req.signedCookies.sessionToken },
    (err, response) => {
      if (err) {
        res.send({
          success: false,
          message:
            'Error while accessing database. Please check your backend query.'
        });
      }

      if (!response) {
        res.send({
          success: false,
          message: 'Invalid Email/sessionToken.'
        });
      } else {
        // This user is already signed in. Send a success response.
        res
          .cookie('email', response.email, {
            signed: true,
            httpOnly: true
          })
          .cookie('sessionToken', response.sessionToken, {
            signed: true,
            httpOnly: true
          })
          .send({
            success: true,
            message: 'User already logged in.',
            payload: {
              firstname: response.firstname,
              lastname: response.lastname,
              email: response.email,
              groups: response.groups,
              sessionToken: response.sessionToken
            }
          });
      }
    }
  );
});

/*
 * Route for logout
 * Req URI: http://localhost:4000/registration/logout
 */
router.post('/logout', function(req, res) {
  console.log('Route for logout hit.');
  users.find(
    {
      email: req.signedCookies.email,
      sessionToken: req.signedCookies.sessionToken
    },
    (err, response) => {
      if (err) {
        // There's something wrong with your query for database access
        res.send({
          success: false,
          message:
            'Error while accessing database. Please check your backend query.'
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
              res.send({
                success: false,
                message: 'Error while performing update query. Error -> ' + err
              });
            } else if (resp) {
              res
                .clearCookie('sessionToken')
                .clearCookie('email')
                .send({ success: true, message: 'Update successfull' });
            }
          }
        );
      }
    }
  );
});

module.exports = router;
