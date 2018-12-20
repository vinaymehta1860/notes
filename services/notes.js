const express = require("express"),
      bodyParser = require("body-parser"),
      crypto = require('crypto'),
      router = express.Router();

router.use(bodyParser.json());

const users = require('../models/users');

// Request URI -> http://localhost:3000/notes
router.get('/', (req, res) => {
  res.send({success: true, message: "Request handled successfully."});
});

// Route for new note as an owner
// Params required sessionToken -> type: String
//                 username -> type: String
//                 note: { title -> type: String, desc -> type: String }
// Request URI -> http://localhost:3000/notes/owner/newnote
router.post('/owner/newnote', (req, res) => {
  console.log("Route for new note as an owner hit.");
  // Check if the sessionToken is valid or not
  users.find({sessionToken: req.body.sessionToken}, function(err, response){
    if(err){
      // Handling error while performing database query
      console.log("Error while performing database query -> " + err);
      res.send({success: false, message: "Error while performing database query. Please check the console of server for more details."});
    }

    // Check if the username obtained in the req body matches with that of the active user in database related to the sessionToken
    if(response[0].username === req.body.username){
      // Proceed with adding the note into the database as an owner
      var userNote = response[0];
      const currentTime = new Date();
      req.body.note.lastUpdated = currentTime.toString();
      
      // Generating unique id for the note
      const hash = crypto.createHash('sha256')
                      .update(Math.random().toString())
                      .digest('hex');
      
      req.body.note.note_id = hash.toString();
      userNote.notes.owner.push(req.body.note);
      userNote.save();
      res.send({success: true, message: "Note added successfully.! HURRAH..!!"});
    }
    else{
      // Handling the case where the username and sessionToken doesn't match
      res.send({success: false, message: "We couldn't match the username with the provided sessionToken. Please check the provided username and sessionToken in request."});
    }
  });
});

// Route for editing a note as an owner
// Params required: sessionToken, username, note_id, title, desc (Everything should be in proper format)
// Request URI: http://localhost:3000/notes/owner/edit/note
router.post('/owner/edit/note', (req, res) => {
  console.log("Route for editing the note hit.");
  console.log("Note_id --> " + req.body.note_id);
  // Find the note with provided note_id
  users.find({"notes.owner.note_id": req.body.note_id}, function(err, response){
    // Handle error while performing database query
    if(err){
      res.send({success: false, message: "Error while performing database query. Please check the console of server for more details."});
    }
    // Handle the case when there's no such note with the provided note_id
    if(!response.length){
      res.send("No such note was found with the provided note_id.");
    }
    else{
      res.send(response);
    }
  });
});

module.exports = router;