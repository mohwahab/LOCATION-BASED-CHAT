/**
 * User model
 */
var User = function(){  
	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;
	console.log('    mongoose version: %s', mongoose.version);
	var userSchema = new Schema({
	  name:  String,
	  number: { type: String, unique: true },
	  lastUpdated: { type: Date, default: Date.now },
	  contacts: [{ type: Schema.Types.ObjectId, ref: 'User'}],
	  loc: {
          type: { type: String }
          , coordinates: []
            }
    });

//	WORKAROUND FOR EMPTY LOCATION OBJECTS
//	userSchema.pre('save', function (next) {
//		  if (this.isNew && Array.isArray(this.loc.coordinates) && 0 === this.loc.coordinates.length) {
//		    this.loc.coordinates = undefined;
//		  }
//		  next();
//	});
	
	userSchema.index({ loc: '2dsphere' });
	var _model = mongoose.model('User', userSchema);
	
// CLOSE CONNECTION	
//	function done (err) {
//	    if (err) console.error(err.stack);
//	      mongoose.connection.db.dropDatabase(function () {
//	              mongoose.connection.close();
//	                });
//	}
	
	   var _register = function(name, number, long, lat, callback){ 	    
			_model.create({ name: name, number: number, loc: { type: 'Point', coordinates: [parseFloat(long),parseFloat(lat)] }},callback);
	   };
	   
	   var _findContacts = function(user, contacts, callback){
		    _model.find({ number : { $in: JSON.parse(contacts) } },callback);
	   };
	   
	   
	   var _updateContacts = function(newUser,userContacts,callback){
		   _model.update({_id: {$in: userContacts}}, {$push: {contacts:newUser._id}}, { multi: true }, callback);
	   };
	   
	   
	   var _findNearContacts = function(id, long, lat, dist, callback){
		    _model.findById(id, function(error, retrievedUser) {
		    	if(error) {
			    	 console.log("\nHERE:  _findNearContacts: (ERROR)> "+error);
			     }else{
			    	 retrievedUser.loc.coordinates = [parseFloat(long), parseFloat(lat)];
			    	 retrievedUser.save();
			    	 //console.log("\nHERE:  _findNearContacts: (NAME)> "+retrievedUser.name);
			    	 //console.log("\nHERE:  _findNearContacts: (CONTACTS)> "+retrievedUser.contacts+"\n\n");
			    	 var distance = dist * 1000;
			    	 _model.find( { _id: { $in : retrievedUser.contacts}, loc : { $near :
                     { $geometry :
                         { type : "Point" ,
                           coordinates:  [parseFloat(long), parseFloat(lat)]
                         } 
			    	 },
                           $maxDistance : distance
			    	 } 
			    	 }, 'number loc -_id', callback);

			    	 
			     }
		    });
	   };
	   
	return {
		register: _register,
	    schema: userSchema,
	    model: _model,
	    findContacts: _findContacts,
	    findNearContacts: _findNearContacts,
	    updateContacts: _updateContacts
	  }
	
}();

module.exports = User;