var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userNotes = new Schema({
  title: {type: String},
  desc: {type: String},
  note_id: {type: String, unique: true},
  dataCreated: {type: Date, default: Date.now},
  lastUpdated: {type: Date},
  sharedWith: [String],
  permissions: [String],
  owner: {type: Schema.Types.ObjectId, ref: 'userTable'}
});

module.exports = mongoose.model('userNotes', userNotes);