var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var userTable = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  salt: { type: String },
  passwordHash: { type: String },
  email: { type: String, unique: true, required: true },
  sessionToken: { type: String },
  dateCreated: { type: String, default: new Date().toString() },
  loginHistory: [String]
});

module.exports = mongoose.model("userTable", userTable);
