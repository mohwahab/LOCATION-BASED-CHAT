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
	  //loc: [],
	  //loc: { type: String , coordinates: [] },
	  //loc: { type: { type: String } , coordinates: [Number] },
//	  loc: {
//	      type: { type: String }
//	    , coordinates: [Number]
//	  },
	  //loc: { index: '2dsphere',type: [Number] },
	  lastUpdated: { type: Date, default: Date.now },
	  contacts: [{ type: Schema.Types.ObjectId, ref: 'User'}],
	  loc: {
          type: { type: String }
          , coordinates: []
            }
    });
	//userSchema.index({ loc: '2d' });
	//userSchema.index({ loc: '2dsphere' });
	//db.User.ensureIndex( { loc : "2dsphere" } );
	
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
		
//		_model.create({ name: name, number: number, loc: { type: 'Point', coordinates: [parseFloat(long),parseFloat(lat)] }}, function (err) {
//             if (err) return done(err);
//             _model.find({ loc: { $near: { type: 'Point', coordinates:[-179.0, 0.0] }}}, function (err, docs) {
//	                     if (err) return done(err);
//	                             console.log(docs);
//	                                     done();
//	                                           })
//	               });

		
//		
//		console.log("HERE: _register");
//		//var loc = { type: 'Point', coordinates: [parseFloat(long),parseFloat(lat)] };
//		var loc = {};
//		var coordinates = [parseFloat(long),parseFloat(lat)];
//		console.log("HERE:  coordinates: "+coordinates);
//		loc.type = 'Point';
//		loc.coordinates = coordinates;
//		console.log("HERE:  loc.type: "+Object.prototype.toString.call(loc.type));
//		console.log("HERE:  loc.coordinates: "+Object.prototype.toString.call(loc.coordinates));
//		console.log("HERE:  loc: "+Object.prototype.toString.call(loc));
//	    _model.create({ 'name': name, 'number': number, 'loc': loc },callback);
	    
		_model.create({ name: name, number: number, loc: { type: 'Point', coordinates: [parseFloat(long),parseFloat(lat)] }},callback);
	    
	   };
	   
	   
	   var _findContacts = function(user, contacts, callback){
		    var contactsArr = JSON.parse(contacts);
		    console.log("HERE:  IT IS: "+contactsArr.constructor);
		    console.log("HERE:  _findContacts <"+contactsArr+">");
		    //_model.find({ number : { $in: JSON.parse(contacts) } },callback);
		    _model.find({ number : { $in: contactsArr } },callback);
		   //_model.where('number').in(contacts.split()).exec(callback);
	   };
	   
	   
	   var _updateContacts = function(newUser,userContacts,callback){
		   _model.update({_id: {$in: userContacts}}, {$push: {contacts:newUser._id}}, { multi: true }, callback);
	   };
	   
	   
	   var _findNearContacts = function(id, long, lat, dist, callback){
		    //_model.find({ number : { $in: JSON.parse(contacts) } },callback);
		    _model.findById(id, function(error, retrievedUser) {
		    	if(error) {
			    	 console.log("\nHERE:  _findNearContacts: (ERROR)> "+error);
			     }else{
			    	 retrievedUser.loc.coordinates = [parseFloat(long), parseFloat(lat)];
			    	 retrievedUser.save();
			    	 console.log("\nHERE:  _findNearContacts: (NAME)> "+retrievedUser.name);
			    	 console.log("\nHERE:  _findNearContacts: (CONTACTS)> "+retrievedUser.contacts+"\n\n");
			    	 var distance = dist * 1000;
//			    	 console.log("\nHERE:  _findNearContacts: (DIST)> "+distance);
//			    	 console.log("\nHERE:  _findNearContacts: (FLOOR-DIST)> "+Math.floor(distance));
//			    	 console.log("\nHERE:  _findNearContacts: (CEIL-DIST)> "+Math.ceil(distance));
			    	 //distance = 10;
			    //_model.find({'_id': { $in : retrievedUser.contacts}, 'loc':  { $near: [parseFloat(long), parseFloat(lat)], $maxDistance: dist }}, 'name loc -_id', callback);
			    	 //_model.where('_id').in(retrievedUser.contacts).where('loc').near({ center: [parseFloat(long), parseFloat(lat)],spherical : true, maxDistance: distance }).select('name loc -_id').exec(callback);
			    	 //_model.find({_id: { $in : retrievedUser.contacts}, loc: { $near : [long, lat], $maxDistance : dist/68.91}}, 'name loc', callback);
			    	 //_model.find({_id: { $in : retrievedUser.contacts}, loc: { $near : [long, lat], $maxDistance : dist}}, 'name loc -_id', callback);
			    	 //_model.where('_id').in(retrievedUser.contacts).where('loc').nealr({ type: "Point", coordinates: [parseFloat(long), parseFloat(lat)],spherical : true, maxDistance: dist }).select('name loc -_id').exec(callback);
			    	 //_model.where('_id').in(retrievedUser.contacts).where('loc').near({ center: [parseFloat(long), parseFloat(lat)],spherical : true, distanceMultiplier: 6371, maxDistance: distance }).select('name loc -_id').exec(callback);
			    //_model.find({_id: { $in : retrievedUser.contacts}, loc: { $near : { $geometry : { type : "Point", loc : [parseFloat(long), parseFloat(lat)] } , $maxDistance : dist }}}, 'number loc -_id', callback);
			    	//_model.find({_id: { $in : retrievedUser.contacts}}, 'name loc -_id', callback);
			    	//_model.where('loc').within.geometry({ type: 'Point', coordinates: [parseFloat(long), parseFloat(lat)] }).select('number loc -_id').exec(callback);

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