var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userTable = new Schema({
  username: {type: String, unique: true, required: true},
  password: {type: String, required: true},
  email: {type: String, required: true},
  sessionToken: {type: String},
  dateCreated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('userTable', userTable);