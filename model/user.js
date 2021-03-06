/**
 * User model
 */
var log = require('loglevel');
var Validator = require('../util/validator.js');
var validator = new Validator();

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
	
//	var _showLocation = function(id,callback){
//		_model.update({_id: id},{visible: true},callback);
//	};
//	
//	var _hideLocation = function(id,callback){
//		log.debug("HIDE LOCATION[id]: "+id);
//		_model.update({_id: id},{visible: false},callback);
//	};
	
// CLOSE CONNECTION	
//	function done (err) {
//	    if (err) console.error(err.stack);
//	      mongoose.connection.db.dropDatabase(function () {
//	              mongoose.connection.close();
//	                });
//	}
	   var _add = function(name, number, long, lat, contacts, callback){
		   log.debug("[name]: "+name+" [number]: "+number+" [long]: "+long+" [lat]: "+lat+" [contacts]: "+contacts);
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
		   if(!validator.isValidUsername(name)){
			   var error = "Invalid Username";
			   log.error("ERROR: "+error);
			   callback({ error : error});
		   }else if(!validator.isValidNumer(number)){
			   var error = "Invalid phone number";
			   log.error("ERROR: "+error);
			   callback({ error : error});
		   }else{
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
		   }		   
	   };
	   
//	   var _findContacts = function(user, contacts, callback){
//		    _model.find({ number : { $in: JSON.parse(contacts) } },callback);
//	   };
//	   
//	   
//	   var _updateContacts = function(newUser,userContacts,callback){
//		   _model.update({_id: {$in: userContacts}}, {$push: {contacts:newUser._id}}, { multi: true }, callback);
//	   };
	   
	   
	   var _findNearContacts = function(id, long, lat, dist, visible, callback){
		    _model.findById(id, function(error, retrievedUser) {		  
		    	if(error) {
			    	 log.error("findNearContacts: (ERROR)> "+error);
			    	 callback({error : error});
			     }else if(retrievedUser){			    	
			    	 if(parseFloat(long) && parseFloat(lat)){
			    		 retrievedUser.loc.coordinates = [parseFloat(long), parseFloat(lat)];
//				    	 TODO Uncomment
//				    	 retrievedUser.online = true;
				    	 retrievedUser.visible = visible;				    	
				    	 retrievedUser.save();
				    	 var distance = dist * 1000;				    	 				    	 				    	 
				    	 _model.find( { _id: { $in : retrievedUser.contacts}, loc : { $near :
	                     { $geometry :
	                         { type : "Point" ,
	                           coordinates:  [parseFloat(long), parseFloat(lat)]
	                         } 
				    	 },
	                           $maxDistance : distance
				    	 }
				    	 , visible : {$ne:false}
				    	 }, 'number loc -_id', function(error,nearContacts){
				    		 callback(error, {number: retrievedUser.number, contacts: nearContacts});
				    	 });
			    	 }else{
			    		 var error = "Invalid location coordinates";
			    		 log.error("findNearContacts: (ERROR)> "+error);
				    	 callback({error : error});
			    	 }			    	 
			     }else{
			    	 var error = "User doesn't exist"
			    	 log.debug("findNearContacts: (ERROR)> "+error);
			    	 callback({error : error});
			     }
		    });
	   };
	   
	   var _getNumber = function(id, callback){
		   _model.findById(id, function(error, retrievedUser) {
	      	if(error) {
	      		callback({error : error});
         	} else {
         		callback({number : retrievedUser.number});
         	}
		  });
	   };
	   
	   var _getLastCheckInLoc = function(id, callback){		   
		   _model.findById(id, function(error, retrievedUser) {			   
	      	if(error) {	      		
	      		callback({error : error});
         	} else if(retrievedUser) {         		
         		callback({long : retrievedUser.loc.coordinates[0], lat : retrievedUser.loc.coordinates[1]});
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
//	    showLocation: _showLocation,
//	    hideLocation: _hideLocation,
	    getNumber: _getNumber,
	    getLastCheckInLoc: _getLastCheckInLoc,
	    //findContacts: _findContacts,
	    findNearContacts: _findNearContacts//,
	    //updateContacts: _updateContacts
	  }
	
}();

module.exports = User;