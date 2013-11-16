/**
 * User model
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name:  String,
  number: String,
  contacts:{number: String},
  loc: []
});

userSchema.index({ loc: '2d' });