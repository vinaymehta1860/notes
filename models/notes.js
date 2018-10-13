var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var userNotes = new Schema({
  desc: {type: String},
  timeStamp: {type: Date, default: Date.now},
  user: {type: Schema.Types.ObjectId, ref: 'userTable'}
});

module.exports = mongoose.model('userNotes', userNotes);