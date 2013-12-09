/**
 * Test file
 */

var common = require('../util/common');
var config = common.config();
var request = require('superagent');
var io = require('socket.io-client');
var mongoose = require("mongoose");  
var User = require("../model/user.js"); 
var async = require("async");


//var svrUrl = 'http://localhost:3000';
//var svrUrl = 'http://location-based-chat.herokuapp.com';
var svrUrl = config.svr_url;

//var dbUrl = 'mongodb://localhost/location_based_chat';
//var dbUrl = 'mongodb://mwahab:mwahab123@paulo.mongohq.com:10075/location_based_chat';

//var dbUrl = config.db_url;
//mongoose.connect(dbUrl); 


var options ={
  transports: ['websocket'],
  'force new connection': true
}; 


var testUsers = {};

console.log("\n RUNNING TESTS ON "+config.env+" ENV \n");

if(config.env === 'development'){
	var app = require('../app');

	before(function(done) {
	  app.start(done);
	})

	after(function(done) {
	  app.close(done);
	})
}

beforeEach(function(done){
	this.timeout(600000);
	User.model.remove({}, function() {
		//console.log("\nDATABASE CLEARED");
		//Add some test data
		var Users = [
		             	{ name: 'Ahmed Alaa', number: '01001252010', loc: { type: 'Point', coordinates:[ parseFloat(31.102711), parseFloat(30.018571)] }}, 	//In contacts & near 
		             	{ name: 'Karim Fahmy', number: '01208993983', loc: { type: 'Point', coordinates: [ parseFloat(31.027054), parseFloat(30.073254)] }},	//In contacts & near
		             	{ name: 'Abdullah zaki', number: '01108993983', loc: { type: 'Point', coordinates: [ parseFloat(32.099865), parseFloat(30.121395)] }},	//In contacts & Far
		             	{ name: 'Sarah Ahmed', number: '01008993983', loc: { type: 'Point', coordinates: [ parseFloat(48.89364), parseFloat(2.33739)] }}		//Out of contacts
		            ];
		async.forEach(Users , function (user, done){ 
			User.model.create(user,function(error,newUser){
				if(error) {
			         console.log("\nADD USER ERROR: "+error);
				} else {
					//console.log("\nNEW USER ADDED: \n"+newUser+"\n");
					testUsers[newUser.number] = newUser._id;
					done();
				}
		    });

		}, function(error) {
			done();
		}); 

    });  
});  

afterEach(function(done){
	this.timeout(600000);
    //Clear Database
    User.model.remove({}, function() {
	    //console.log("\nDATABASE CLEARED");
	    done();    
   });  
});		

describe('User', function(){
			
    it("Should be able to return nearby friends  ", function(done){
    	var testUserId = null;
    	var testUser = { name: 'Mohamed Abd El Wahab', number: '01001953010', loc: { type: 'Point', coordinates: [ parseFloat(41.102711), parseFloat(40.018571)] }};
    	User.model.create(testUser,function(error,user){
				if(error) {
			         console.log("\nADD USER ERROR: "+error);
				} else {
					testUserId = user._id;
					//this.timeout(100000);
					User.model.update({_id: user._id}, {$pushAll: {contacts:[testUsers['01001252010'],testUsers['01208993983'],testUsers['01108993983']]}}, function(error,user){
						if(error) {
					         console.log("\nADD USER CONTACTS ERROR: "+error);
						} else {
					        request
					            .get(svrUrl+'/near/'+testUserId+'/31.102711/30.018571/10?')
					            .end(function(res){
					            	//console.log("\n RESPONSE BODY: "+res.body);
					                res.should.be.json;
					                res.body.contacts.should.eql([   { number: '01001252010', loc: { type: 'Point', coordinates: [ 31.102711, 30.018571 ] }},
					                                                 { number: '01208993983', loc: { type: 'Point', coordinates: [ 31.027054, 30.073254 ] }}//,
					                                                 //{ number: '01108993983', loc: [ 32.099865, 30.121395 ] }
					                                             ]);
					                User.model.findById(testUserId, function(error, retrievedUser) {
					                	if(error) {
					   			         	console.log("\nGET RETRIEVED USER ERROR: "+error);
					   		         	} else {
					   		         		//console.log("\nGET RETRIEVED USER: \n"+retrievedUser+"\n");
					   		         		retrievedUser.loc.coordinates.should.include(31.102711);
					   		         		retrievedUser.loc.coordinates.should.include(30.018571);
					   		         	}
					   		        });
					                done();
					            });
						}
					});
			}
    	});
    });
    
    it("Should be able to register a new user", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/Abd El Wahab Mohamed/01001953010/31.099865/30.021395/["01001252010","01208993983","01108993983"]?')
            .end(function(res){
                res.should.be.json;
                User.model.findById(res.body.id, function(error, newUser) {
                	if(error) {
   			         	console.log("\nGET NEW USER ERROR: "+error);
   		         	} else {
   		         		//console.log("\nGET NEW USER: \n"+newUser+"\n");
	                	newUser.name.should.equal("Abd El Wahab Mohamed");    
	                	newUser.number.should.equal("01001953010");
	                	newUser.loc.coordinates.should.include(31.099865);
	                	newUser.loc.coordinates.should.include(30.021395);
	                	res.body.id.should.equal(newUser._id.toString());
	                	User.model.findOne({'number':'01001252010'},function(error,retrievedUser){ 
	                		if(error) {
	       			         	console.log("\nGET USER ERROR: "+error);
	       		         	} else {
	       		         		//console.log("\nGET USER: \n"+retrievedUser+"\n");
	       		         		newUser.contacts.should.include(retrievedUser._id);
	       		         		retrievedUser.contacts.should.include(newUser._id);
	       		         	}
	                	});
	                	User.model.findOne({'number':'01208993983'},function(error,retrievedUser){ 
	                		if(error) {
	       			         	console.log("\nGET USER ERROR: "+error);
	       		         	} else {
	       		         		//console.log("\nGET USER: \n"+retrievedUser+"\n");
	       		         		newUser.contacts.should.include(retrievedUser._id);
	       		         		retrievedUser.contacts.should.include(newUser._id);
	       		         	}
	                	});
	                	User.model.findOne({'number':'01108993983'},function(error,retrievedUser){ 
	                		if(error) {
	       			         	console.log("\nGET USER ERROR: "+error);
	       		         	} else {
	       		         		//console.log("\nGET USER: \n"+retrievedUser+"\n");
	       		         		newUser.contacts.should.include(retrievedUser._id);
	       		         		retrievedUser.contacts.should.include(newUser._id);
	       		         	}
	                	});
	                	User.model.findOne({'number':'01008993983'},function(error,retrievedUser){ 
	                		if(error) {
	       			         	console.log("\nGET USER ERROR: "+error);
	       		         	} else {
	       		         		//console.log("\nGET USER: \n"+retrievedUser+"\n");
	       		         		newUser.contacts.should.not.include(retrievedUser._id);
	       		         		retrievedUser.contacts.should.not.include(newUser._id);
	       		         	}
	                	});
   		         	}
                    done();
                 });
            });
    });
});

describe("Chat Server",function(){
  it('Should be able to receive and forward messages', function(done){
	  this.timeout(600000);  
	  var user1;
	  var user2;
	  
	  User.model.findOne({'number':'01001252010'},function(error,retrievedUser1){ 
  		if(error) {
		    console.log("\nGET CHAT USER ERROR: "+error);
     	} else {
     		User.model.findOne({'number':'01008993983'},function(error,retrievedUser2){ 
     	  		if(error) {
     			    console.log("\nGET CHAT USER ERROR: "+error);
     	     	} else {
     	     		user1 = io.connect(svrUrl, options);
     	     	    user2 = io.connect(svrUrl, options);
     	     		user1.on('connect', function(data){
     	     			user1.emit('chat',{id:retrievedUser1._id});
     	     			user1.emit('message', {to:'01008993983', txt:'Hello Sarah ;)'});
     	     		});
     	     		user1.on('message', function(msg){
     	     			msg.should.eql({from:'01008993983', txt:'Hello Ahmed :)'});
     	     			user1.disconnect();
     	     			user2.disconnect();
     	     			done();
     	     		});
     	     		user2.on('connect', function(data){
     	     			user2.emit('chat',{id:retrievedUser2._id}); 
     	     		});
     	     		user2.on('message', function(msg){
     	     			user2.emit('message', {to:'01001252010', txt:'Hello Ahmed :)'});
     	     		});
     	     	}
     	  	});
     	}
  	  });
  });
});