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
}else{
	var dbUrl = config.db_url;
	console.log("\n CONNECTING TO DB@("+dbUrl+")\n");
	mongoose.connect(dbUrl);
}

beforeEach(function(done){
	this.timeout(300000);
	User.model.remove({}, function() {
		//console.log("\nDATABASE CLEARED");
		//Add some test data
		var Users = [
		             	{ name: 'Ahmed Alaa', number: '01001252010', loc: { type: 'Point', coordinates:[ parseFloat(31.102711), parseFloat(30.018571)] }}, 	//In contacts & near 
		             	{ name: 'Karim Fahmy', number: '01208993983', loc: { type: 'Point', coordinates: [ parseFloat(31.027054), parseFloat(30.073254)] }},	//In contacts & near
		             	{ name: 'Abdullah zaki', number: '01108993983', loc: { type: 'Point', coordinates: [ parseFloat(32.099865), parseFloat(30.121395)] }},	//In contacts & Far
		             	{ name: 'Sarah Ahmed', number: '01008993983', loc: { type: 'Point', coordinates: [ parseFloat(32.099865), parseFloat(30.121395)] }}		//Out of contacts
		            ];
		async.forEach(Users , function (user, done){ 
			User.model.create(user,function(error,newUser){
				if(error) {
			         console.log("\nADD USER ERROR: "+error);
				} else {
					//console.log("\nNEW USER ADDED: \n"+newUser+"\n");
					newUser.visible = true;
					newUser.save();
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

describe('User Location', function(){
	
	it("Should be able to return error 500 as nearby response if location is invalid", function(done){
		var testNumber = '01001252010';
		User.model.findOne({'number': testNumber},function(error,retrievedUser){
        	if(error) {
		         	console.log("GET RETRIEVED USER ERROR: "+error);
	         	} else {	         	
	        		var userLoc = ['null','null']; // [long,lat]
	        		request
	                .get(svrUrl+'/near/'+retrievedUser._id+'/'+userLoc[0]+'/'+userLoc[1]+'/10?')
	                .end(function(res){	                	
	                    res.should.be.json;
	                    res.statusCode.should.equal(500);
	                    res.body.error.should.equal("Invalid location coordinates");
	                    done();
	                });
	         	}
	        });		
	});
	
	it("Should be able to return error 500 as nearby response if user doesn't exist", function(done){
		var fakeId = "52e2cf49dbbcc4441f00003c";
		var userLoc = [31.102711,30.018571]; // [long,lat]
		request
        .get(svrUrl+'/near/'+fakeId+'/'+userLoc[0]+'/'+userLoc[1]+'/10?')
        .end(function(res){        	
            res.should.be.json;
            res.statusCode.should.equal(500);
            res.body.error.should.equal("User doesn't exist");
            done();
        });
	});
	
	it("Should be able to return error 500 as nearby response if user Id is invalid", function(done){
		var fakeId = "-1";
		var userLoc = [31.102711,30.018571]; // [long,lat]
		request
        .get(svrUrl+'/near/'+fakeId+'/'+userLoc[0]+'/'+userLoc[1]+'/10?')
        .end(function(res){        	
            res.should.be.json;
            res.statusCode.should.equal(500);
            res.body.error.message.should.equal("Cast to ObjectId failed for value \"-1\" at path \"_id\"");
            done();
        });
	});
	
    it("Should be able to return nearby friends  ", function(done){
    	this.timeout(600000);
    	var testUserId = null;
    	var testUserNumber = '01001953010';
    	var userLoc = [31.102711,30.018571]; // [long,lat]
    	var testUser = { name: 'Mohamed Abd El Wahab', number: testUserNumber, loc: { type: 'Point', coordinates: [ parseFloat(41.102711), parseFloat(40.018571)] }};
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
							var diconnectedCount = 0 ;
							var registeredCount = 0 ;
							var contact1 = io.connect(svrUrl, options);
     	     	     	    var contact2 = io.connect(svrUrl, options);
     	     	     	    
     	     	     	    var checkRegister = function(){	     	     	        	
     	     	     	    	registeredCount++;
	     	     	            if(registeredCount == 2){
	     	     	            	request
						            .get(svrUrl+'/near/'+testUserId+'/'+userLoc[0]+'/'+userLoc[1]+'/10?')
						            .end(function(res){
						            	//console.log("\n RESPONSE BODY: "+JSON.stringify(res.body));
						                res.should.be.json;
						                res.body.contacts.should.eql([   { number: '01001252010', loc: { type: 'Point', coordinates: [ 31.102711, 30.018571 ] }},
						                                                 { number: '01208993983', loc: { type: 'Point', coordinates: [ 31.027054, 30.073254 ] }}//,
						                                                 //{ number: '01108993983', loc: [ 32.099865, 30.121395 ] }
						                                             ]);
						                User.model.findById(testUserId, function(error, retrievedUser) {
						                	if(error) {
						   			         	console.log("\nGET RETRIEVED USER ERROR: "+error);
						   		         	} else {						   		         		
//						   		         		TODO Uncomment
						   		         		retrievedUser.visible.should.equal(true);
//						   		         		retrievedUser.online.should.equal(true);
						   		         		retrievedUser.loc.coordinates.should.include(userLoc[0]);
						   		         		retrievedUser.loc.coordinates.should.include(userLoc[1]);						   		         
						   		         	}
						   		        });					    
						            });
	     	     	            }
	     	     	        };
     	     	     	    var chatRegister = function(contact,id){
     	     	     	    	contact.on('connect', function(data){
     	     	     	    		contact.emit('register',{id:id}, checkRegister);			          	     			
		          	     		});
	     	     	        };
	     	     	        var disconnetUser = function(contact){
	     	     	        	contact.disconnect();
	     	     	        	diconnectedCount++;
	     	     	            if(diconnectedCount == 2){
	     	     	            	done();
	     	     	            }
	     	     	        };
	     	     	        var checkNotification = function(contact){
	     	     	        	contact.on("notification",function(notification){
	     	     	        		//console.log(">>>>>>>>>>>>>>>>>>>> [NOTIFICATION]: "+JSON.stringify(notification));
	     	     	        		notification.event.should.equal("near-by");
	     	     	     			notification.contact.should.equal(testUserNumber);
	     	     	     			notification.loc.should.include(userLoc[0].toString());
	     	     	     			notification.loc.should.include(userLoc[1].toString());
	     	     	     			disconnetUser(contact);
	     	     	        	});
	     	     	        };
	     	     	        chatRegister(contact1,testUsers['01001252010']);
	     	     	        chatRegister(contact2,testUsers['01208993983']);
	     	     	        checkNotification(contact1);
	     	     	        checkNotification(contact2);
						}
					});
			}
    	});
    });
    
    it("Should be able to register a new user", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/Abd El Wahab Mohamed/01001953010/31.099865/30.021395/["01001252010","01208993983","01108993983"]')
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
    
    it("Should be able to return the id of registered user", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/Ahmed Alaa/01001252010/32.099865/30.121395/["01001252010","01208993983","01108993983"]')
            .end(function(res){
                res.should.be.json;
                res.body.id.should.equal(testUsers['01001252010'].toString());
                done();
            });
    });
    
    it("Should be able to return error if username contains invalid characters", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/$********/01001252011/32.099865/30.121395/["01001252010","01208993983","01108993983"]')
            .end(function(res){            	
                res.should.be.json;
                res.statusCode.should.equal(500);
                res.body.error.should.equal("Invalid Username");
                done();
            });
    });
    
    it("Should be able to return error if phone number contains invalid characters", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/Test user/Test number/32.099865/30.121395/["01001252010","01208993983","01108993983"]')
            .end(function(res){            	
                res.should.be.json;
                res.statusCode.should.equal(500);
                res.body.error.should.equal("Invalid phone number");
                done();
            });
    });
    
    it("Should be able to return error if username has invalid length", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/01001252011/32.099865/30.121395/["01001252010","01208993983","01108993983"]')
            .end(function(res){            	
                res.should.be.json;
                res.statusCode.should.equal(500);
                res.body.error.should.equal("Invalid Username");
                done();
            });
    });
        
    it("Should be able to hide the user's location", function(done){
        //this.timeout(100000);
    	var id = testUsers['01001252010'];
        request
            .post(svrUrl+'/hide/'+id)
            .end(function(res){
            	res.statusCode.should.equal(200);
            	User.model.findById(id, function(error, retrievedUser) {
                	if(error) {
   			         	console.log("\nHide::GET RETRIEVED USER ERROR: "+error);
   		         	} else {
   		         		retrievedUser.visible.should.equal(false);
   		         	}
                	done();
   		        });
            });
    });
    
    it("Should be able to show the user's location", function(done){
        //this.timeout(100000);
    	var id = testUsers['01001252010'];
        request
            .post(svrUrl+'/show/'+id)
            .end(function(res){
                res.statusCode.should.equal(200);
                User.model.findById(id, function(error, retrievedUser) {
                	if(error) {
   			         	console.log("\nShow::GET RETRIEVED USER ERROR: "+error);
   		         	} else {
   		         		retrievedUser.visible.should.equal(true);
   		         	}
                	done();
   		        });
            });
    });
    
});

describe("Chat Server",function(){  
	
  it('Should be able to create group chat', function(done){
	  User.model.findOne({'number':'01008993983'},function(error,retrievedUser){ 
	  		if(error) {
			    console.log("\nGET CHAT USER ERROR: "+error);
	     	} else {
	     		var user = io.connect(svrUrl, options);
	     		var id = {id:retrievedUser._id};
	     		user.on('connect', function(data){
	     			  //user.emit('register',{id:retrievedUser._id});
	     			  user.emit('create-group', id, function(group){
	     				  //user.group.should.equal(group);
	     				  group.length.should.equal(36);
	     				  user.disconnect();
	     			  });
	     			  done();
	     		});
	     	}
	  });
  });
  
  it('Should be able to update user status to offline on disconnect', function(done){
	  this.timeout(600000);	  
	  User.model.findOne({'number':'01008993983'},function(error,retrievedUser){ 		  
	  		if(error) {	  			
			    console.log("\nGET CHAT USER ERROR: "+error);
	     	} else {	     		
	     		var user = io.connect(svrUrl, options);
	     		var id = {id:retrievedUser._id};
	     		user.on('connect', function(data){	     			
	     			user.emit('register',id, function(){	     				
	     				user.disconnect();
	     			});	     				     			 	     	
	     		});
	     		setTimeout(function(){
	     			User.model.findOne({'number':'01008993983'},function(error,retrievedUser){      					
	     		  		if(error) {
	     		  			console.log("\nGET CHAT USER ERROR: "+error);
	     		  		} else {	     		  			
	     		  			retrievedUser.visible.should.equal(false);	     		  			
	     		  		}
	     		  		done();
	     		  	 });
	     		}, 50);
	     	}
	  });
  });
  
  describe("Group Chat",function(){
		
		var user1;
		var user2;
		var user3;
		var retrievedUser1;
		var retrievedUser2;
		var retrievedUser3;
		var testUser = '01001252010';
		var testContacts = ["01008993983","01108993983"];
		
		var registerCallback = function(){};
		
		var diconnectedCount = 0;
	    var disconnetUser = function(user, done){
	    	user.disconnect();
	    	diconnectedCount++;
	        if(diconnectedCount == 3){
	        	diconnectedCount = 0;
	        	done();
	        };
	    };
		
		beforeEach(function(done){
			  User.model.findOne({'number':testUser},function(error,retrievedUser){ 
		  		if(error) {
				    console.log("\nGET CHAT USER ERROR: "+error);
		     	} else {
		     		retrievedUser1 = retrievedUser;
		     		User.model.findOne({'number': testContacts[0]},function(error,retrievedUser){ 
		     	  		if(error) {
		     			    console.log("\nGET CHAT USER ERROR: "+error);
		     	     	} else {
		     	     		retrievedUser2 = retrievedUser;
		     	     		User.model.findOne({'number': testContacts[1]},function(error,retrievedUser){ 
		     	     	  		if(error) {
		     	     			    console.log("\nGET CHAT USER ERROR: "+error);
		     	     	     	} else {
		     	     	     		retrievedUser3 = retrievedUser;
		     	     	     		
		     	     	     		user1 = io.connect(svrUrl, options);
		     	     	     		user1.number = testUser;
		     	     	     				     	     	     		
		     	     	     	    user2 = io.connect(svrUrl, options);
		     	     	     	    user2.number = testContacts[0];	
		     	     	     	    
		     	     	     	    user3 = io.connect(svrUrl, options);
		     	     	     	    user3.number = testContacts[1];		     	     	     	    		     	     	     	
		     	     	     	   
		     	     	     	    done();
		     	     	     	}		     	     	  		
		     	     	  	});
		     	     	}
		     	  	});
		     	}
		  	  });
			  //done();
		});
		
		it('Should be able to receive and forward messages', function(done){
				user1.on('connect', function(data){
	    			user1.emit('register',{id:retrievedUser1._id}, registerCallback);
	    			user1.emit('message', {to:testContacts[0], txt:'Hello Sarah ;)'});
	    		});
	    		user1.on('message', function(msg){
	    			msg.should.eql({from:testContacts[0], txt:'Hello Ahmed :)'});
	    			user1.disconnect();
	    			user2.disconnect();
	    			user3.disconnect();
	    			done();
	    		});
	    		user2.on('connect', function(data){
	    			user2.emit('register',{id:retrievedUser2._id}, registerCallback); 
	    		});
	    		user2.on('message', function(msg){
	    			user2.emit('message', {to:testUser, txt:'Hello Ahmed :)'});
	    		});
		  });
		
		
		  it('Should be able to add members to group', function(done){
				this.timeout(600000);  
				var groupName = null;
		 		user1.on('connect', function(data){
		 			user1.emit('create-group', {id:retrievedUser1._id}, function(group){
		 				groupName = group;
		 				user1.emit('add-to-group',{'group':groupName, 'members':testContacts});
		 				//user1.disconnect();
		 				disconnetUser(user1, done);
		 			});     	     
		 		});
		 		user2.on('connect', function(data){
		 			user2.emit('register',{id:retrievedUser2._id}, registerCallback);
		 			//checkNotification(user2);
		 		});
		 		user2.on('notification', function(notification){
		 			//console.log("****************** [USER 2("+user2.number+") NOTIFICATION]: "+JSON.stringify(notification));
	        		if(notification.event === "add-to-group"){        			
	        			notification.group.should.equal(groupName);
	         			notification.by.should.equal(user1.number);
	        			notification.members.should.include(user1.number);
	        		}else if(notification.event === "new-member"){        			
	        			notification.group.should.equal(groupName);
	         			notification.by.should.equal(user1.number);
	         			notification.member.should.equal(user3.number);
	         			disconnetUser(user2, done);
	        		}     			
	        	});
		 		user3.on('connect', function(data){
		 			user3.emit('register',{id:retrievedUser3._id}, registerCallback); 
		 			//checkNotification(user3);
		 		});
		 		user3.on('notification', function(notification){
		 			//console.log("****************** [USER 3("+user3.number+") NOTIFICATION]: "+JSON.stringify(notification));
	        		notification.event.should.equal("add-to-group");        		
	    			notification.group.should.equal(groupName);
	     			notification.by.should.equal(testUser);
	    			notification.members.should.include(user1.number);
	    			notification.members.should.include(user2.number);
	    			disconnetUser(user3, done);     			
	        	});
			  
		});
		  	  
		it('Should be able to leave group', function(done){
			var groupName = null;
	   		user1.on('connect', function(data){
	   			user1.emit('create-group', {id:retrievedUser1._id}, function(group){
	   				groupName = group;
	   				user1.emit('add-to-group',{'group':groupName, 'members':testContacts});
	   			});
	   		});
	   		user1.on('notification', function(notification){
						notification.event.should.equal("leave-group");
						notification.group.should.equal(groupName);
						notification.by.should.equal(user2.number);
						disconnetUser(user1, done);
				});
	   		user2.on('connect', function(data){
	   			user2.emit('register',{id:retrievedUser2._id}, registerCallback);
	   		});
	   		user2.on('notification', function(notification){
	      		if(notification.event === 'add-to-group'){
	      			user2.emit('leave-group',{group:groupName});
	      			disconnetUser(user2, done);
	      		}
	   		});
	   		user3.on('connect', function(data){
	   			user3.emit('register',{id:retrievedUser3._id}, registerCallback); 
	   		});
	   		user3.on('notification', function(notification){
	      		if(notification.event === 'leave-group'){
	      			notification.event.should.equal("leave-group");
		     			notification.group.should.equal(groupName);
		     			notification.by.should.equal(user2.number);
		     			disconnetUser(user3, done);
	      		}
	   		});

		});

	  it('Should be able to remove members from group', function(done){
		    this.timeout(600000);
		    var groupName = null;
	   	    var addedMembers = 0;
	   	    var checkNotification = function(user,notification){
	      		if(notification.event === 'add-to-group'){
	      			addedMembers++;     	     	        			
	      			if(addedMembers == 2){
	      				user1.emit('remove-from-group',{'group':groupName, 'members':testContacts});
	      				disconnetUser(user1, done);
	      			}
	      		}else if(notification.event === 'remove-from-group'){
	      				//notification.event.should.equal("remove-from-group");
		     			notification.group.should.equal(groupName);
		     			notification.by.should.equal(testUser);
		     			disconnetUser(user, done);
	      		}else if(notification.event === 'remove-member'){
	      			notification.group.should.equal(groupName);
	     			notification.by.should.equal(testUser);
	     			notification.member.should.equal(user2.number);
	      		}
	   	    };
	   		user1.on('connect', function(data){
	   			user1.emit('create-group', {id:retrievedUser1._id}, function(group){
	   				groupName = group;
	   				user1.emit('add-to-group',{'group':groupName, 'members':testContacts});
	   			});
	   		});
	   		user2.on('connect', function(data){
	   			user2.emit('register',{id:retrievedUser2._id}, registerCallback);
	   		});
	   		user2.on('notification', function(notification){
	   			checkNotification(user2,notification);
	   		});
	   		user3.on('connect', function(data){
	   			user3.emit('register',{id:retrievedUser3._id}, registerCallback); 
	   		});
	   		user3.on('notification', function(notification){
	   			checkNotification(user3,notification);
	   		});

	  });
		
	  it('Should be able to message group members', function(done){
		  	this.timeout(600000);
		  	var groupName = null;
	 	    var message = "Hi all :)"
	 	    var addedMembers = 0;
	 	    var checkNotification = function(user,notification){
	    		if(notification.event === 'add-to-group'){
	    			addedMembers++;     	     	        			
	    			if(addedMembers == 2){
	    				user1.emit('message',{'group':groupName, 'txt':message});
	    				disconnetUser(user1, done);
	    			}
	    		}
	 	  };
	      var checkMessage = function(user){
	        	user.on('message', function(msg){
	        		msg.should.eql({group:groupName, txt:message});
	        		disconnetUser(user, done);
	        	});
	      };
	      user1.on('connect', function(data){
			user1.emit('create-group', {id:retrievedUser1._id}, function(group){
				groupName = group;
				user1.emit('add-to-group',{'group':groupName, 'members':testContacts});
			});
	      });
	      user2.on('connect', function(data){
			user2.emit('register',{id:retrievedUser2._id}, registerCallback);
			checkMessage(user2);
	      });
	      user2.on('notification', function(notification){
			checkNotification(user2,notification);
	      });
	      user3.on('connect', function(data){
			user3.emit('register',{id:retrievedUser3._id}, registerCallback); 
			checkMessage(user3);
	      });
	      user3.on('notification', function(notification){
			checkNotification(user3,notification);
	      });

	  });
	  
	  it('Should be able to notify nearby friends on user departure', function(done){
		  var newUser = '01101252010';
		  var testUserLoc = [32.099865,30.121395];
		  request
          .get(svrUrl+'/register/Test User/'+newUser+'/'+testUserLoc[0]+'/'+testUserLoc[1]+'/["'+testContacts[0]+'","'+testContacts[1]+'"]')
          .end(function(res){
        	    var user0 = io.connect(svrUrl, options);
	     		user0.number = newUser;
	     		
        	  	user0.on('connect', function(data){
        	  		user0.emit('register',{id:res.body.id}, function(){
        	  			disconnetUser(user0, done);
        	  		});   	   	    		
	  	   	    });
        	  	
        	  	user1.on('connect', function(data){
        	  		user1.disconnect();
	  	   	    });
        	  	
	  	   	    user2.on('connect', function(data){
	  	   	    	user2.emit('register',{id:retrievedUser2._id}, registerCallback); 
	  	   	    });
	  	   	    
	  	   	    user2.on('notification', function(notification){
	  				checkNotification(user2,user0.number,testUserLoc[0],testUserLoc[1],notification);
	  		    });
	  	   	    
	  	   	    user3.disconnect();
	  	   	    user3 = io.connect(svrUrl, options);
	     	    user3.number = testContacts[1];
	  	   	    user3.on('connect', function(data){	  	   	    	
	  	   	    	user3.emit('register',{id:retrievedUser3._id}, registerCallback); 
	  	   	    });
	  	   	    
	  	   	    user3.on('notification', function(notification){	  	   	    	
	  				checkNotification(user3,user0.number,testUserLoc[0],testUserLoc[1],notification);
	  		    });
          });
		  
		  var checkNotification = function(user,number,long,lat,notification){			 
				notification.event.should.equal("off-line");
	   			notification.contact.should.equal(number);
	   			notification.loc.should.include(long);
	   			notification.loc.should.include(lat);
	   			disconnetUser(user, done);
	   	    };
	  });
	  
	});
  
});