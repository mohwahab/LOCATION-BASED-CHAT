
/**
 * Module dependencies.
 */
//var schema = 'users';
var log = require('loglevel');
var express = require('express');
var app = express();
app.use(express.bodyParser());
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//io.configure('development', function(){
    io.set('transports', ['xhr-polling']);
//});

var socketMap = {};
var msgMap = {};
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

var common = require('./util/common');
var config = common.config();

//var dbUrl = 'mongodb://localhost/location_based_chat';
//var dbUrl = 'mongodb://mwahab:mwahab123@paulo.mongohq.com:10075/location_based_chat';

log.setLevel(config.log_level);

var dbUrl = config.db_url;
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
	log.info("[ "+req.method+" /register/"+req.params.name+"/"+req.params.number+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.contacts+" ]");
	User.register(req.params.name, req.params.number, req.params.long, req.params.lat, function(error,newUser){
		if(error) {
			log.error("ERROR register: "+error);
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
	       			 log.error("ERROR: "+error);
			         res.status(500);
			       	 res.send(error);
		         } else {
		        	 //console.log("User Contacts: "+userContacts);
		        	 newUser.contacts = userContacts;
		 			 newUser.save();
		 			 User.updateContacts(newUser,userContacts, function(error){
		 			     if(error) {
		 			    	 log.error("ERROR: "+error);
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
	log.info("[ "+req.method+" /near/"+req.params.id+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.dist+" ]");
	//TODO Notify friends in region with his location 
	User.findNearContacts(req.params.id, req.params.long, req.params.lat, req.params.dist, function(error, nearContacts){
	     if(error) {
	    	 log.error("ERROR: "+error);
	    	 res.status(500);
       	 	 res.send(error);
	     }else{
	    	 //console.log("NEAR CONTACTS: "+nearContacts+"\n\n");
	    	 res.json({contacts : nearContacts});
	     }
	 });
});

io.sockets.on('connection', function (socket) {
  log.debug('[ -------------- CLIENT CONNECTED ----------- ]');
  socket.on('chat', function(user){
	  User.model.findById(user.id, function(error, chatter) {
      	if(error) {
      			log.error("\nCHAT GET USER ERROR: "+error);
	         	} else {
	         	    //delete socketMap[chatter.number];
	         	    //delete userMap[socket.id];
	         		log.debug(chatter.number+" REGISTERED FOR CHAT");
	         		socketMap[chatter.number] = socket;
	         		userMap[socket.id] = chatter.number;
	         		if(msgMap[chatter.number]!== undefined){
	         			msgMap[chatter.number].forEach(function(msg){
	         				socket.emit('message', msg);
	         				log.debug("GOING TO SEND: "+msg.txt);
	         			});
	         			msgMap[chatter.number] = [];
	         		}
	         	}
	  });
  });
  socket.on('message', function(msg){
    fwMsg = {from:userMap[socket.id], txt:msg.txt}
    log.debug("\nCHAT SEND MSG msg: "+msg);
    log.debug("\nCHAT SEND MSG msg.to: "+msg.to);
    log.debug("\nCHAT SEND MSG socketMap[msg.to]: "+socketMap[msg.to]);
    //if(!socketMap[msg.to]){
    if(msg.to !== undefined && socketMap[msg.to] !== undefined){
    	socketMap[msg.to].emit('message', fwMsg);
    }else{
    	log.debug("\nCHAT SEND MSG: SOCKET IS NULL ");
    	if(msgMap[msg.to] === undefined){
    		log.debug("CHAT SEND MSG: SOCKET IS NULL --> CREATE MSG ARRAY");
    		msgMap[msg.to] = [];
    	}
    	msgMap[msg.to].push(fwMsg);
    	log.debug("MSG FROM "+fwMsg.from+" ADDED TO BE FORWARDED");
    }
  });
  socket.on('disconnect', function(){
    log.debug('[ -------------- CLIENT DISCONNECTED ----------- ]');
    delete socketMap[userMap[socket.id]];
    delete userMap[socket.id];
  });
});

server.listen(app.get('port'), function(){
	log.debug('Chat server listening on port ' + app.get('port'));
});