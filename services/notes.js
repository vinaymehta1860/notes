const express = require("express"),
  bodyParser = require("body-parser"),
  crypto = require("crypto"),
  router = express.Router();

router.use(bodyParser.json());

const usersModel = require("../models/users");
const notesModel = require("../models/notes");
const helper = require("../utils/helper");

// Request URI -> http://localhost:4000/notes
router.get("/", (req, res) => {
  res.send({ success: true, message: "Request handled successfully." });
});

/* Route for adding a new note
 * Params required: sessionToken -> type: String
 *                  email        -> type: String
 *                  note: {title -> type: String,
 *                         desc  -> type: String }
 * Request URI -> http://localhost:4000/notes/newnote
 */
router.post("/newnote", (req, res) => {
  usersModel
    .findOne({ email: req.body.email, sessionToken: req.body.sessionToken })
    .then(response => {
      var newNote = new notesModel(req.body.note);
      newNote.owner = response._id;

      // Generating unique id for the note
      const hash = crypto
        .createHash("sha256")
        .update(Math.random().toString())
        .digest("hex");
      newNote.note_id = hash.toString();

      // Adding the dateCreated and lastUpdated values of a note on server side instead of asking from front-end
      const currentTime = new Date();
      newNote.dateCreated = currentTime.toString();
      newNote.lastUpdated = currentTime.toString();

      newNote
        .save()
        .then(resp => {
          res.send({
            success: true,
            message: "Note successfully added.",
            payload: {
              note: resp
            }
          });
        })
        .catch(err => {
          res.send({
            success: false,
            message:
              "There was an error while storing the note in database. Please check with the server."
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "There's something wrong with the email and/or sessionToken provided."
      });
    });
});

/* Route for editing a note
 * Params required: sessionToken  : type -> String
 *                  email         : type -> String
 *                  note_id       : type -> String
 *                  title         : type -> String
 *                  desc          : type -> String
 * Request URI: http://localhost:4000/notes/edit
 */
router.post("/edit", (req, res) => {
  console.log("Route for editing the note hit.");

  // First of all, check if the current user who is requesting to edit the note is signed in or not.
  //  This will be done by checking the provided email and sessionToken from userModel
  usersModel
    .findOne({ email: req.body.email, sessionToken: req.body.sessionToken })
    .then(response => {
      // Once the user is found appropriate, get the note that he wants to edit from notesModel
      notesModel
        .findOne({ note_id: req.body.note.note_id })
        .then(resp => {
          // Now check if the user is owner of the note or not
          if (resp.owner.toString() === response._id.toString()) {
            // Generate the lastUpdated field on server rather than relying on front end for it
            let currentTime = new Date();
            currentTime = currentTime.toString();

            // Proceed with saving the new note provided in the request body
            notesModel
              .updateOne({ note_id: req.body.note.note_id }, req.body.note)
              .then(resp1 => {
                res.send({
                  success: true,
                  message: "Note was successfully edited.",
                  payload: {
                    note: req.body.note
                  }
                });
              })
              .catch(err => {
                res.send({
                  success: false,
                  message:
                    "There was an error while performing the update query for the provided note_id."
                });
              });
          } else {
            // Check if the user is a shared user and if the note is allowed to be edited by shared user
            const canEdit = resp.canEdit;

            var isSharedUser = false;

            resp.sharedWith.foreach(user => {
              if (req.body.email === user) isSharedUser = true;
            });

            if (canEdit === true && isSharedUser === true)
              res.send({
                success: true,
                message: "Note was successfully edited by the shared user."
              });
            else
              res.send({
                success: false,
                message:
                  "This note cannot be edited by the user. Reason can be anyone of the following. " +
                  "1) There's something wrong with the provided email, sessionToken, note_id. " +
                  "2) Current user is not a shared user for the current note. " +
                  "3) This note is not allowed to be edited."
              });
          }
        })
        .catch(err => {
          res.send({
            success: false,
            message:
              "There is something wrong with the provided note_id. We were not able to find any note with the provided note_id."
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "There's something wrong with the provided email and/or sessionToken."
      });
    });
});

/* Route for deleting a note
 * Required params: email         : type -> username
 *                  sessionToken  : type -> String
 *                  note_id       : type -> username
 * Request URI: http://localhost:4000/notes/delete
 */
router.post("/delete", (req, res) => {
  usersModel
    .findOne({
      email: req.body.email,
      sessionToken: req.body.sessionToken
    })
    .then(response => {
      // Verify if the user is the owner of the note that he wants to delete or not.
      // If yes, then proceed with deleting the note.
      notesModel
        .deleteOne({ note_id: req.body.note_id, owner: response._id })
        .then(resp => {
          res.send({
            success: true,
            message: "Note successfully deleted.",
            payload: {
              note_id: req.body.note_id
            }
          });
        })
        .catch(err => {
          res.send({
            success: false,
            message:
              "There was an error while deleting the note from database. Error -> " +
              err
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "There was an error while finding the user who wants to delete the note. Error -> " +
          err
      });
    });
});

/* Route for getting all the notes of a user
 * Required params: email         : type -> String
 *                  sessionToken  : type -> String
 * Request URI -> http://localhost:4000/notes/allnotes
 */
router.post("/allnotes", (req, res) => {
  // First get the _id field of the user who is requesting to get all of his notes from usersModel
  usersModel
    .findOne({ email: req.body.email, sessionToken: req.body.sessionToken })
    .then(response => {
      // Now that we've the user object, we can perform a query to get all of the notes where he is the owner and
      //  shared user. Get these notes object seperately so that it can be easier for front end to render them.

      // Creating an empty response object which will have user's notes
      var notes = {};

      // Getting all the notes where the user is owner
      notesModel
        .find({ owner: response._id })
        .then(resp => {
          notes.owner = resp;

          // Now get all the notes that are shared with the current user
          notesModel
            .find({ sharedWith: response.email })
            .then(resp => {
              notes.shared = resp;

              res.send({
                success: true,
                message: "Notes sent.",
                payload: {
                  notes: notes,
                  message:
                    "Successfully retrieved all the notes for current user."
                }
              });
            })
            .catch(err => {
              res.send({
                success: true,
                payload: {
                  notes: notes,
                  message:
                    "There was an error while retrieving all the shared notes with current user. Error -> " +
                    err
                }
              });
            });
        })
        .catch(err => {
          res.send({
            success: false,
            message:
              "There was an error retrieving the notes where the user is owner. Please check your server. Error -> " +
              err
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "We couldn't find any user with the provided username. Error -> " +
          err
      });
    });
});

/* Route for sharing a note with other users
 * Required params: email         : type -> String
 *                  sessionToken  : type -> String
 *                  note_id       : type -> String
 *                  emails        : type -> Array of emails to share a note with
 * Request URI -> http://localhost:4000/notes/share
 */
router.post("/share", (req, res) => {
  /*
   * This is a little complicated step. Below is the explanation.
   * First we'll verify if the current user is the owner of the note that he's trying to share.
   * If yes, then we'll update the sharedWith array to add the specified members.
   * All of this will be done in one update query so might be little complicated to understand
   * if you're looking at the code after a while.
   */
  usersModel
    .findOne({
      email: req.body.email,
      sessionToken: req.body.sessionToken
    })
    .then(response => {
      notesModel
        .findOne({ note_id: req.body.note_id })
        .then(resp => {
          // Check to see if the user who is trying to share the note is owner or not
          if (resp.owner.toString() === response._id.toString()) {
            helper.verifyUsers(req.body.emails).then(usersToAdd => {
              if (usersToAdd.length > 0) {
                notesModel
                  .updateOne(
                    { note_id: req.body.note_id, owner: response._id },
                    {
                      $addToSet: { sharedWith: { $each: usersToAdd } }
                    }
                  )
                  .then(updateResponse => {
                    res.send({
                      success: true,
                      message: "Note shared successfully.",
                      payload: {
                        note_id: req.body.note_id,
                        sharedWith: usersToAdd
                      }
                    });
                  })
                  .catch(err => {
                    res.send({
                      success: false,
                      message:
                        "There was an error while adding the specified users as shared users. Error -> " +
                        err
                    });
                  });
              } else {
                res.send({
                  success: false,
                  message:
                    "No user that you want to share the note with has an account."
                });
              }
            });
          } else {
            res.send({
              success: false,
              message:
                "The user who is trying to share is not the owner of the note."
            });
          }
        })
        .catch(error => {
          res.send({
            success: false,
            message:
              "There was an error while retrieving the note that you want to share.",
            payload: {
              error: error
            }
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "There was an error while finding the user who wants to share this note. Error -> " +
          err
      });
    });
});

// Route for un-sharing a note
// Required params: email         : type -> String
//                  sessionToken  : type -> String
//                  note_id       : type -> String
// Request URI -> http://localhost:4000/notes/unshare
router.post("/unshare", (req, res) => {
  // First find the _id of the user who wants to unshare the note
  usersModel
    .findOne({
      email: req.body.email,
      sessionToken: req.body.sessionToken
    })
    .then(response => {
      // Now verify if the user is owner of the note or not.
      // If yes, then unshare the note with everyone and change the canEdit flag
      notesModel
        .updateOne(
          { note_id: req.body.note_id, owner: response._id },
          { canEdit: false, $set: { sharedWith: [] } }
        )
        .then(resp => {
          res.send({
            success: true,
            message: "Note successfully unshared.",
            payload: { note_id: req.body.note_id }
          });
        })
        .catch(err => {
          res.send({
            success: false,
            message:
              "There was an error while removing the users with whom the note is shared. Error -> " +
              err
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "There was an error while finding the user who wants to unshare this note. Error -> " +
          err
      });
    });
});

// Route for changing notes canEdit flag
// Required params: username      : type -> String
//                  sessionToken  : type -> String
//                  note_id       : type -> String
//                  canEdit       : type -> Boolean
// Request URI -> http://localhost:4000/notes/permissions
router.post("/permissions", (req, res) => {
  usersModel
    .findOne({
      username: req.body.username,
      sessionToken: req.body.sessionToken
    })
    .then(response => {
      // Now verify if the current user is owner of that note or not.
      // If yes, then go ahead and make the change to the permission.
      notesModel
        .updateOne(
          { note_id: req.body.note_id, owner: response._id },
          { canEdit: req.body.canEdit }
        )
        .then(resp => {
          res.send({
            success: true,
            message: "Note's permissions were successfully changed."
          });
        })
        .catch(err => {
          res.send({
            success: false,
            message:
              "There was an error while updating the permissions of this note. Error -> " +
              err
          });
        });
    })
    .catch(err => {
      res.send({
        success: false,
        message:
          "There was an error while finding the user who wants to change the permissions of this note. Error -> " +
          err
      });
    });
});

/*  Route for user to leave the note as a shared user
    Required params: email        --> type: String
                     sessionToken --> type: String
                     note_id      --> type: number
    Route --> http://localhost:4000/notes/leave
 */
router.post("/leave", (req, res) => {
  notesModel
    .findOne({ note_id: req.body.note_id })
    .then(response => {
      // Remove the current user from sharedWith array and save the updated shared users
      let updatedSharedUsers = response.sharedWith;

      let indexofUserToBeRemoved = updatedSharedUsers.indexOf(req.body.note_id);
      updatedSharedUsers.splice(indexofUserToBeRemoved, 1);

      notesModel
        .updateOne(
          { note_id: req.body.note_id },
          { sharedWith: updatedSharedUsers }
        )
        .then(response => {
          res.send({
            success: true,
            message: "Current user removed as a shared user for the note.",
            payload: {
              note_id: req.body.note_id,
              response
            }
          });
        })
        .catch(error => {
          res.send({
            success: false,
            message:
              "There was an error while saving the note with the current user removed. Please check the server logs.",
            payload: {
              error
            }
          });
        });
    })
    .catch(error => {
      res.send({
        success: false,
        message: "No note was found with the given note_id.",
        payload: {
          error
        }
      });
    });
});

// Function to get all the notes where the provided user_id is the owner
function getOwnerNotes(user_id) {
  notesModel
    .find({ owner: user_id })
    .then(response => {
      console.log("Getting owner notes successfull. Response -> " + response);
      console.log(
        "Owner return object -> " + { success: true, message: response }
      );
      return { success: true, message: response };
    })
    .catch(err => {
      console.og(
        "Onwer notes were not retrieved successfully. Error -> " + err
      );
      return {
        success: false,
        message:
          "We had a problem getting all the notes for the specified user where he is the owner."
      };
    });
}

// Function to get all the notes that are shared with the user whose username is provided
function getSharedNotes(username) {
  notesModel
    .find({ sharedWith: username.toString() })
    .then(response => {
      console.log("Getting shared notes successfull. Response -> " + response);
      console.log(
        "Shared return object -> " + { success: true, message: response }
      );
      return { success: true, message: response };
    })
    .catch(err => {
      console.log(
        "Shared notes were not retrieved successfully. Error -> " + err
      );
      return {
        success: false,
        message:
          "We had a problem getting all the notes for the specified user where he is the shared user."
      };
    });
}

module.exports = router;
