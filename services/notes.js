const express = require("express"),
      bodyParser = require("body-parser"),
      crypto = require('crypto'),
      router = express.Router();

router.use(bodyParser.json());

const usersModel = require('../models/users');
const notesModel = require('../models/notes');

// Request URI -> http://localhost:3000/notes
router.get('/', (req, res) => {
  res.send({success: true, message: "Request handled successfully."});
});

//Route for adding a new note
// Params required sessionToken -> type: String
//                 username -> type: String
//                 note: { title       -> type: String, 
//                         desc        -> type: String,
//                         dateCreated -> type: Date,
//                         lastUpdated -> type: String }
// Request URI -> http://localhost:3000/notes/newnote
router.post('/newnote', (req, res) => {
  usersModel.find({username: req.body.username, sessionToken: req.body.sessionToken})
    .then((response) => {
      var newNote = new notesModel(req.body.note);
      newNote.owner = response[0]._id;

      // Generating unique id for the note
      const hash = crypto.createHash('sha256')
                      .update(Math.random().toString())
                      .digest('hex');

      newNote.note_id = hash.toString();
      
      newNote.save()
      .then((resp) => {
        res.send({success: true, message: "Note successfully added. Note added -> " + req.body.note});
      })
      .catch((err) => {
        res.send({success: false, message: "There was an error while storing the note in database. Please check with the server."});
      })
    })
    .catch((err) => {
      res.send({success: false, message: "There's something wrong with the username and/or sessionToken provided."});
    })
});

// Route for editing a note
// Params required: sessionToken  : type -> String
//                  username      : type -> String
//                  note_id       : type -> String
//                  title         : type -> String
//                  desc          : type -> String
//                  lastUpdated   : type -> String
// Request URI: http://localhost:3000/notes/edit
router.post('/edit', (req, res) => {
  console.log("Route for editing the note hit.");
  console.log("Note_id --> " + req.body.note_id);
  
  // First of all, check if the current user who is requesting to edit the note is signed in or not.
  //  This will be done by checking the provided username and sessionToken from userModel
  usersModel.find({username: req.body.username, sessionToken: req.body.sessionToken})
  .then((response) => {
    // Once the user is found appropriate, get the note that he wants to edit from notesModel
    notesModel.find({note_id: req.body.note_id})
    .then((resp) => {
      // Now check if the user is owner of the note or not
      if(resp[0].owner.toString() === response[0]._id.toString()) {
        // Proceed with saving the new note provided in the request body
        notesModel.updateOne({note_id: req.body.note_id}, {title: req.body.title, desc: req.body.desc, lastUpdated: req.body.lastUpdated})
        .then((resp1) => {
          res.send({success: true, message: "Note was successfully edited."});
        })
        .catch((err) => {
          res.send({success: false, message: "There was an error while performing the update query for the provided note_id."});
        })
      }
      else {
        // Check if the user is a shared user and if the note is allowed to be edited by shared user
        const canEdit = resp[0].canEdit;
        
        var isSharedUser = false;
        
        resp[0].sharedWith.foreach((user) => {
          if (req.body.username === user)
            isSharedUser = true;
        });
        
        if(canEdit === true && isSharedUser === true)
          res.send({success: true, message: "Note was successfully edited by the shared user."});
        else
          res.send({success: false, message: "This note cannot be edited by the user. Reason can be anyone of the following. "
          + "1) There's something wrong with the provided username, sessionToken, note_id. "
          + "2) Current user is not a shared user for the current note. "
          + "3) This note is not allowed to be edited."});
      }
    })
    .catch((err) => {
      res.send({success: false, message: "There is something wrong with the provided note_id. We were not able to find any note with the provided note_id."});
    });
  })
  .catch((err) => {
    res.send({success: false, message: "There's something wrong with the provided username and/or sessionToken."});
  });
});

// Route for deleting a note
// Required params: username: type -> username
//                  note_id : type -> username
// Request URI: http://localhost:3000/notes/delete
router.post('/delete', (req, res) => {
  notesModel.find({note_id: req.body.note_id})
  .then((response) => {
    // Get the username from userTable from the owner of the current note
    usersModel.find({_id: response[0].owner})
    .then((resp) => {
      notesModel.deleteOne({note_id: req.body.note_id, owner: resp[0]._id.toString()})
      .then((resp1) => {
        res.send({success: true, message: "Note successfully deleted."});
      })
      .catch((err) => {
        res.send({success: false, message: "There was an error while performing the delete operation for the requested note."});
      })
    })
    .catch((err) => {
      res.send({success: false, message: "There was an error with comparing the _id field. Figure out another way of getting the user from _id field"});
    })
  })
  .catch((err) => {
    res.send({success: false, message: "We couldn't find any note with the provided note_id."});
  });
});

module.exports = router;