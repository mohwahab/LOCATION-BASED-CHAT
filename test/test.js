/**
 * Test file
 */
var request = require('superagent');
//var agent = require('should');
var io = require('socket.io-client');
var mongoose = require("mongoose");  
var User = require("../model/user.js"); 
var async = require("async");


var svrUrl = 'http://localhost:3000';
//var url = 'http://location-based-chat.herokuapp.com';

var dbUrl = 'mongodb://localhost/location_based_chat';
mongoose.connect(dbUrl); 


var options ={
  transports: ['websocket'],
  'force new connection': true
}; 

describe('User', function(){
    
//	beforeEach(function(done){    
//	    //Add some test data
//		var Users = [
//		             	{ name: 'Ahmed Alaa', number: '01001252010', loc: [ parseFloat(30.018571), parseFloat(31.102711)] }, 	//In contacts & near 
//		             	{ name: 'Karim Fahmy', number: '01208993983', loc: [ parseFloat(30.073254), parseFloat(31.027054)] },	//In contacts & near
//		             	{ name: 'Abdullah zaki', number: '01108993983', loc: [ parseFloat(30.121395), parseFloat(32.099865)] },	//In contacts & Far
//		             	{ name: 'Sarah Ahmed', number: '01008993983', loc: [ parseFloat(2.33739), parseFloat(48.89364)] }		//Out of contacts
//		            ];
//		Users.forEach(function(user){
//			User.model.create(user,function(error,newUser){
//				if(error) {
//			         console.log("\nADD USER ERROR: "+error);
//				} else {
//					console.log("\nNEW USER ADDED: \n"+newUser+"\n");
//				}
//		    });
//		});
//		done();
//	  });  

	beforeEach(function(done){    
	    //Add some test data
		var Users = [
		             	{ name: 'Ahmed Alaa', number: '01001252010', loc: [ parseFloat(30.018571), parseFloat(31.102711)] }, 	//In contacts & near 
		             	{ name: 'Karim Fahmy', number: '01208993983', loc: [ parseFloat(30.073254), parseFloat(31.027054)] },	//In contacts & near
		             	{ name: 'Abdullah zaki', number: '01108993983', loc: [ parseFloat(30.121395), parseFloat(32.099865)] },	//In contacts & Far
		             	{ name: 'Sarah Ahmed', number: '01008993983', loc: [ parseFloat(2.33739), parseFloat(48.89364)] }		//Out of contacts
		            ];
		async.forEach(Users , function (user, done){ 
			User.model.create(user,function(error,newUser){
				if(error) {
			         console.log("\nADD USER ERROR: "+error);
				} else {
					console.log("\nNEW USER ADDED: \n"+newUser+"\n");
					done();
				}
		    });

		}, function(error) {
			done();
		}); 
	  });  
	
	  afterEach(function(done){   
		  //Clear Database
		  User.model.remove({}, function() {
			  console.log("\nDATABASE CLEARED");
			  done();    
	    });  
	  });		
		
//	it("Should register a new user", function(done){    
//	    user.register("Mohamed Abd El Wahab", "01001252010", 2.33739, 48.89364, function(doc){      
//	      doc.name.should.equal("Mohamed Abd El Wahab");      
//	      doc.number.should.equal("01001252010");      
//	      doc.loc.should.include(2.33739);
//	      doc.loc.should.include(48.89364);
//	      done();    
//	    }, function(message){      
//	      message.should.equal(null);      
//	      done();    
//	    }); 
//	  }); 
//	
//    it("Should return nearby friends  ", function(done){
//        //this.timeout(100000);
//        request
//            .get(svrUrl+'/near/01001953010/2.33739/48.89364/100?')
//            .end(function(res){
//            	//console.log("<----"+JSON.stringify(res.body)+"----->");
//                res.should.be.json;
//                //res.body.result.should.eql(["demo", "temperature"]);
//                done();
//            });
//    });
    it("Should be able to register a new user", function(done){
        //this.timeout(100000);
        request
            .get(svrUrl+'/register/Abd El Wahab Mohamed/01001953010/30.021395/31.099865/["01001252010","01208993983","01108993983"]?')
            .end(function(res){
            	console.log("<----"+JSON.stringify(res.body)+"----->");
            	console.log("<--ID--"+res.body.id+"---ID-->");
                res.should.be.json;
                User.model.findById(res.body.id, function(error, newUser) {
                	console.log("<--XX--"+newUser+"---XX-->");
                	newUser.name.should.equal("Abd El Wahab Mohamed");    
                	newUser.number.should.equal("01001953010");
                	newUser.loc.should.include(30.021395);
                	newUser.loc.should.include(31.099865);
                	User.model.findOne({'number':'01001252010'},function(error,retrievedUser){ 
                		if(error) {
       			         	console.log("\nGET USER ERROR: "+error);
       		         	} else {
       		         		console.log("\nGET USER: \n"+retrievedUser+"\n");
       		         		newUser.contacts.should.include(retrievedUser._id);
       		         		retrievedUser.contacts.should.include(newUser._id);
       		         	}
                	});
                	User.model.findOne({'number':'01208993983'},function(error,retrievedUser){ 
                		if(error) {
       			         	console.log("\nGET USER ERROR: "+error);
       		         	} else {
       		         		console.log("\nGET USER: \n"+retrievedUser+"\n");
       		         		newUser.contacts.should.include(retrievedUser._id);
       		         		retrievedUser.contacts.should.include(newUser._id);
       		         	}
                	});
                	User.model.findOne({'number':'01108993983'},function(error,retrievedUser){ 
                		if(error) {
       			         	console.log("\nGET USER ERROR: "+error);
       		         	} else {
       		         		console.log("\nGET USER: \n"+retrievedUser+"\n");
       		         		newUser.contacts.should.include(retrievedUser._id);
       		         		retrievedUser.contacts.should.include(newUser._id);
       		         	}
                	});
                	User.model.findOne({'number':'01008993983'},function(error,retrievedUser){ 
                		if(error) {
       			         	console.log("\nGET USER ERROR: "+error);
       		         	} else {
       		         		console.log("\nGET USER: \n"+retrievedUser+"\n");
       		         		newUser.contacts.should.not.include(retrievedUser._id);
       		         		retrievedUser.contacts.should.not.include(newUser._id);
       		         	}
                	});
                    done();
                 });
            });
    });
});

// Routes
//app.get(url+'/near/:lon/:lat/:dist?', function(req, res) {
//	User.find({loc: { $near : [req.params.lon, req.params.lat], $maxDistance : req.params.dist/68.91}}, function(err, result) {
//    if (err) {
//      res.status(500);
//      res.send(err);
//    } else {
//      res.send({result: result});
//    }
//  });
//});

//startup server
//port = process.env.PORT || 3000;
//app.listen(port, function() {
//  console.log("Listening on port number: ", port);
//});
//
//module.exports = app;


//describe("Chat Server",function(){
//  it('Should be able to send receive and forward messages', function(done){
//	  this.timeout(300000);  
//	  var message = {from: 'Mohamed Abd El Wahab', txt:'Hello Back'};
//	  var messages = 0;
//
//	  var completeTest = function(client){
//		  messages.should.equal(1);
//		  client.disconnect();
//		  done();
//	  };
//
//	  var checkMessage = function(client){
//		  client.on('message', function(msg){
//			  message.txt.should.equal(msg.txt);
//			  msg.from.should.equal(message.from);
//			  messages++;
//			  completeTest(client);
//		  });
//	  };
//
//	  client = io.connect(svrUrl, options);
//
//	  client.on('connect', function(socket){
//		  client.emit('message', "Hello Server");
//		  checkMessage(client);
//	  });
//  });
//});
