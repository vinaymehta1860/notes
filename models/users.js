var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userTable = new Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  sessionToken: {type: String, unique: true},
  dateCreated: {type: Date, default: Date.now},
  loginHistory: [String]
});

module.exports = mongoose.model('userTable', userTable);

// Need to update the Schema because now there's no way to ensure that the note_id 
//  in owner and shared object is unique, which is what we want