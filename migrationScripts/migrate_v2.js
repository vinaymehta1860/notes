/*
    This script was used to add the ownerName field in notes object model for each of the note.
 */
const mongoose = require("mongoose"),
  usersModel = require("../models/users"),
  notesModel = require("../models/notes");
securityUtils = require("../utils/securityUtils");

mongoose.set("useCreateIndex", true);
const db = mongoose
  .connect("mongodb://localhost/notes-backend", { useNewUrlParser: true })
  .then(
    function() {
      //Successfull connection to mongoDB database.
      console.log("Successfully connected to MongoDB Database.");
    },
    function(err) {
      //Error while connecting to MongoDB database.
      console.log(err);
    }
  );

/* Go through all the notes from response object and then add the firstname field
 *  if it's not present. Follow these steps to achieve this.
 * 1) For each of the note, check if the ownerName field is defined or not.
 * 2a) If yes, then no need to do anything.
 * 2b) If not, then get the first and last name of the owner from usersModel and save it.
 */
function migrate() {
  notesModel.find({}).then(response => {
    response.forEach(note => {
      if (note.ownerName === undefined) {
        usersModel
          .findOne({ _id: note.owner })
          .then(resp => {
            let fullName = resp.firstname + " " + resp.lastname;
            notesModel
              .updateOne({ note_id: note.note_id }, { ownerName: fullName })
              .then(res => {
                console.log(
                  "Note was successfully updated with owner name -> " + fullName
                );
              });
          })
          .catch(error => {
            console.log(
              "There was an error while finding the owner of this note with title: " +
                note.title +
                ". Error -> " +
                error
            );
          });
      } else {
        console.log(note.ownerName + "'s note.");
      }
    });
  });
}

migrate();
