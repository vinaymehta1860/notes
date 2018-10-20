const express = require("express"),
      bodyParser = require("body-parser"),
      crypto = require('crypto'),
      router = express.Router();

router.use(bodyParser.json());

const users = require('../models/users');

// Request URI -> http://localhost:3000/notes
router.get('/', (req, res) => {
  res.send("Request handled successfully.");
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
      res.send("Error while performing database query. Please check the console of server for more details.");
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
      res.send("Note added successfully.! HURRAH..!!");
    }
    else{
      // Handling the case where the username and sessionToken doesn't match
      res.send("We couldn't match the username with the provided sessionToken. Please check the provided username and sessionToken in request.");
    }
  });
});

module.exports = router;