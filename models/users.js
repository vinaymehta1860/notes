
var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userTable = new Schema({
  username: {type: String, unique: true},
  password: {type: String},
  dateCreated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('userTable', userTable);