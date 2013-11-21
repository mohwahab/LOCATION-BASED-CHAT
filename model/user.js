/**
 * User model
 */
var User = function(){  
	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;
	
	var userSchema = new Schema({
	  name:  String,
	  number: {type: String, unique: true},
	  loc: [],
	  lastUpdated: { type: Date, default: Date.now },
	  contacts: [{ type: Schema.Types.ObjectId, ref: 'User'}]
	});
	userSchema.index({ loc: '2d' });
	
	var _model = mongoose.model('user', userSchema);
	var _register = function(name, number, long, lat, callback){ 
		console.log("HERE: _register");
	    _model.create({ name: name, number: number, loc: [ parseFloat(long), parseFloat(lat)] },callback);
	   };
	   _findContacts = function(user, contacts, callback){
		    //var contactsArr = ["01001252010","01208993983","01108993983"];
		    var contactsArr = JSON.parse(contacts);
		    console.log("HERE:  IT IS: "+contactsArr.constructor);
		    console.log("HERE:  _findContacts <"+contactsArr+">");
		    _model.find({ number : { $in: contactsArr } },callback);
		   //_model.where('number').in(contacts.split()).exec(callback);
	   }; 
	   _updateContacts = function(newUser,userContacts,callback){
		   _model.update({_id: {$in: userContacts}}, {$push: {contacts:newUser._id}}, { multi: true }, callback);
	   };
	return {
		register: _register,
	    schema: userSchema,
	    model: _model,
	    findContacts: _findContacts,
	    updateContacts: _updateContacts
	  }
	
}();

module.exports = User;