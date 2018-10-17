var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userTable = new Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  sessionToken: {type: String},
  dateCreated: {type: Date, default: Date.now},
  loginHistory: [String],
  notes: {
    owner: [{
      desc: {type: String},
      dataCreated: {type: Date, default: Date.now},
      lastUpdated: {type: String}
    }],
    shared: [{
      desc: {type: String},
      dataCreated: {type: Date, default: Date.now},
      lastUpdated: {type: String}
    }]
  }
});

module.exports = mongoose.model('userTable', userTable);