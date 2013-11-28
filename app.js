
/**
 * Module dependencies.
 */
//var schema = 'users';

var express = require('express')
var app = express();
app.use(express.bodyParser());
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//io.configure('development', function(){
    io.set('transports', ['xhr-polling']);
//});

var socketMap = {};
var userMap = {};
    
//var express = require('express')
//, routes = require('./routes')
//, user = require('./routes/user')
//, http = require('http')
//, path = require('path');

//var app = express();
var mongoose = require ("mongoose");

//var app = express();
//app.use(express.bodyParser());

var User = require('./model/user.js');
var dbUrl = 'mongodb://localhost/location_based_chat';
var dbUrl = 'mongodb://mwahab:mwahab123@paulo.mongohq.com:10075/location_based_chat';
mongoose.connect(dbUrl); 

//app.configure('development', function() {
//  mongoose.connect('mongodb://localhost/'+schema);
//});
//
//app.configure('test', function() {
//  mongoose.connect('mongodb://'+ process.env.MONGODB_HOST+schema);
//});
//
//app.configure('production', function() {
//  mongoose.connect('mongodb://localhost/'+schema);
//});



// all environments
app.set('port', process.env.PORT || 3000);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(express.methodOverride());
//app.use(app.router);
//app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/register/:name/:number/:long/:lat/:contacts?', function(req, res) {
	console.log("[ "+req.method+" /register/"+req.params.name+"/"+req.params.number+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.contacts+" ]");
	User.register(req.params.name, req.params.number, req.params.long, req.params.lat, function(error,newUser){
		if(error) {
       	 	console.log("ERROR register: "+error);
       	 	res.status(500);
       	 	res.send(error);
        } else {
       	 	//console.log("New User Registered: "+newUser);
//       	 	User.model.find({},function(error,docs){
//       	 	if(error) {
//		         console.log("ERROR: "+error);
//	         } else {
//	        	 console.log("\nDOCS: \n"+docs+"\n");
//	         }
//       	 	});
	       	 User.findContacts(newUser, req.params.contacts, function(error, userContacts){
	       		if(error) {
			         console.log("ERROR: "+error);
			         res.status(500);
			       	 res.send(error);
		         } else {
		        	 //console.log("User Contacts: "+userContacts);
		        	 newUser.contacts = userContacts;
		 			 newUser.save();
		 			 User.updateContacts(newUser,userContacts, function(error){
		 			     if(error) {
		 			    	 console.log("ERROR: "+error);
		 			    	 res.status(500);
		 		       	 	 res.send(error);
		 			     }else{
		 			    	 //console.log("id: "+newUser._id);
		 			    	 res.json({id:newUser._id});
		 			     }
		 			 });
		         }
	 		});
        }
	});
});


app.get('/near/:id/:long/:lat/:dist?', function(req, res) {
	console.log("[ "+req.method+" /near/"+req.params.id+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.dist+" ]");
	//TODO Notify friends in region with his location 
	User.findNearContacts(req.params.id, req.params.long, req.params.lat, req.params.dist, function(error, nearContacts){
	     if(error) {
	    	 console.log("ERROR: "+error);
	    	 res.status(500);
       	 	 res.send(error);
	     }else{
	    	 //console.log("NEAR CONTACTS: "+nearContacts+"\n\n");
	    	 res.json({contacts : nearContacts});
	     }
	 });
});

io.sockets.on('connection', function (socket) {
  console.log('[ -------------- CLIENT CONNECTED ----------- ]');
  socket.on('chat', function(user){
	  User.model.findById(user.id, function(error, chatter) {
      	if(error) {
		         	console.log("\nCHAT GET USER ERROR: "+error);
	         	} else {
	         	    delete socketMap[chatter.number];
	         	    delete userMap[socket.id];
	         		socketMap[chatter.number] = socket;
	         		userMap[socket.id] = chatter.number;
	         	}
	  });
  });
  socket.on('message', function(msg){
    fwMsg = {from:userMap[socket.id], txt:msg.txt}
    socketMap[msg.to].emit('message', fwMsg);
  });
  socket.on('disconnect', function(){
    console.log('[ -------------- CLIENT DISCONNECTED ----------- ]');
    delete socketMap[userMap[socket.id]];
    delete userMap[socket.id];
  });
});

server.listen(app.get('port'), function(){
  console.log('Chat server listening on port ' + app.get('port'));
});
