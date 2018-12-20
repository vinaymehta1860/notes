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

// Params required sessionToken -> type: String
//                 username -> type: String
//                 note: { title       -> type: String, 
//                         desc        -> type: String,
//                         dateCreated -> type: Date,
//                         lastUpdated -> type: String }
// Request URI -> http://localhost:3000/notes/owner/newnote
router.post('/owner/newnote', (req, res) => {
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

// Route for editing a note as an owner
// Params required: sessionToken, username, note_id, title, desc (Everything should be in proper format)
// Request URI: http://localhost:3000/notes/owner/edit/note
router.post('/owner/edit/note', (req, res) => {
  console.log("Route for editing the note hit.");
  console.log("Note_id --> " + req.body.note_id);
  // Find the note with provided note_id
  usersModel.find({"notes.owner.note_id": req.body.note_id}, function(err, response){
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