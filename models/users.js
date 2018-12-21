var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userTable = new Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  sessionToken: {type: String, unique: true},
  dateCreated: {type: String, default: new Date().toString()},
  loginHistory: [String]
});

module.exports = mongoose.model('userTable', userTable);