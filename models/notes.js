var mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var userNotes = new Schema({
  title: { type: String },
  desc: { type: String },
  group: { type: String, default: null },
  note_id: { type: String, unique: true },
  dateCreated: { type: String, default: new Date().toString() },
  lastUpdated: { type: String },
  sharedWith: [String],
  canEdit: { type: Boolean },
  owner: { type: Schema.Types.ObjectId, ref: "userTable" },
  ownerName: { type: String }
});

module.exports = mongoose.model("userNotes", userNotes);
