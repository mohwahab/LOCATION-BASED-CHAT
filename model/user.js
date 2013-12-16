/**
 * User model
 */
var log = require('loglevel');

var User = function(){  
	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;
	console.log('    mongoose version: %s', mongoose.version);
	var userSchema = new Schema({
	  name:  String,
	  //socketId: { type: String, unique: true },
	  number: { type: String, unique: true },
	  online: { type: Boolean, default: false},
	  visible: { type: Boolean, default: false},
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
	
	var _showLocation = function(id,callback){
		_model.update({_id: id},{visible: true},callback);
	};
	
	var _hideLocation = function(id,callback){
		_model.update({_id: id},{visible: false},callback);
	};
	
// CLOSE CONNECTION	
//	function done (err) {
//	    if (err) console.error(err.stack);
//	      mongoose.connection.db.dropDatabase(function () {
//	              mongoose.connection.close();
//	                });
//	}
	   var _add = function(name, number, long, lat, contacts, callback){
		   _model.create({ name: name, number: number, loc: { type: 'Point', coordinates: [parseFloat(long),parseFloat(lat)] }},function(error,newUser){
				if(error) {
					log.error("ERROR register: "+error);
					callback({ error : error});
		        } else {
			       	_model.find({ number : { $in: JSON.parse(contacts) } }, function(error, userContacts){
			       		if(error) {
			       			 log.error("ERROR: "+error);					      
			       			 callback({ error : error});
				         } else {
				        	 newUser.contacts = userContacts;
				 			 newUser.save();
				 			 _model.update({_id: {$in: userContacts}}, {$push: {contacts:newUser._id}}, { multi: true }, function(error){
				 			     if(error) {
				 			    	 log.error("ERROR: "+error);
				 			    	 callback({ error : error});
				 			     }else{
				 			    	 log.debug("REGISTER: id = "+newUser._id);
				 			    	 callback({id : newUser._id});
				 			     }
				 			 });
				         }
			 		});
		        }
			});
	   };
	   
	   var _register = function(name, number, long, lat, contacts, callback){
		   _model.findOne({number : number}, function(error,retrievedUser){
			   log.debug("REGISTER(RETRIVED): RETRIVED_USER = "+retrievedUser);
			   if(error){
				   log.error("ERROR register: "+error);
					callback({ error : error});
			   }else if(retrievedUser){
				   log.debug("REGISTER(EXISTS): id = "+retrievedUser._id);
			       callback({id : retrievedUser._id});
			   }else{
				   log.debug("REGISTER(DOESNOT EXISTS): WILL ADD NEW USER");
				   _add(name, number, long, lat, contacts, callback);
			   }
		   });
	   };
	   
//	   var _findContacts = function(user, contacts, callback){
//		    _model.find({ number : { $in: JSON.parse(contacts) } },callback);
//	   };
//	   
//	   
//	   var _updateContacts = function(newUser,userContacts,callback){
//		   _model.update({_id: {$in: userContacts}}, {$push: {contacts:newUser._id}}, { multi: true }, callback);
//	   };
	   
	   
	   var _findNearContacts = function(id, long, lat, dist, hide, callback){
		    _model.findById(id, function(error, retrievedUser) {
		    	if(error) {
			    	 console.log("\nHERE:  _findNearContacts: (ERROR)> "+error);
			     }else{
			    	 retrievedUser.loc.coordinates = [parseFloat(long), parseFloat(lat)];
//			    	 TODO Uncomment
//			    	 retrievedUser.online = true;
//			    	 if(hide){
//			    		 retrievedUser.visible = false;
//			    	 }else{
//			    		 retrievedUser.visible = true;
//			    	 }
			    	 retrievedUser.save();
			    	 var distance = dist * 1000;
			    	 log.debug("[ NEAR CONTACTS:: Long: "+long+"  Lat: "+lat+"  Dist: "+distance+" ]");
			    	 log.debug("[ NEAR CONTACTS:: User:\n[ "+retrievedUser+" ]\n]");
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
	   
//	   var _addUserSocket = function(id, socketId, callback){
//		   _model.findById(user.id, function(error, user) {
//			      	if(error) {
//					         	console.log("\nCHAT GET USER ERROR: "+error);
//				         	} else {
//				         		user.socketId = socketId;
//				         		user.save();
//				         	}
//				  });
//	   };
	return {
		register: _register,
	    schema: userSchema,
	    model: _model,
	    showLocation: _showLocation,
	    hideLocation: _hideLocation,
	    //findContacts: _findContacts,
	    findNearContacts: _findNearContacts//,
	    //updateContacts: _updateContacts
	  }
	
}();

module.exports = User;