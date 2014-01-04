/**
 * Module dependencies.
 */
//var schema = 'users';
var SocketDB = require('./util/socketdb.js');
var MessageDB = require('./util/messagedb.js');
var GroupDB = require('./util/groupdb.js');
var Group = require('./util/group.js');
var Groups = require('./util/groups.js');
var socketDB = new SocketDB();
var messageDB = new MessageDB();
var groupDB = new GroupDB();
var groups = new Groups();
var log = require('loglevel');
var express = require('express');
var app = express();
app.use(express.bodyParser());
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var uuid = require('node-uuid');

//io.configure('development', function(){
//    io.set('transports', ['xhr-polling']);
//});

//var socketMap = {}; 	//{phone-number : socket-object}
//var msgMap = {};		//{phone-number : message-object[]}
//var grpMap = {};		//{phone-number : group-name[]}
//var userMap = {};		//{socket-id : phone-number}
    
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

io.set('log level', config.socketio_log);
io.set('transports', config.socketio_transports);

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
	User.register(req.params.name, req.params.number, req.params.long, req.params.lat, req.params.contacts, function(result){
		if(result.error) {
			log.error("ERROR register: "+result.error);
			res.json(500, { error: result.error });
        } else {
        	res.json({id:result.id});
        }
	});
});

app.post('/hide/:id', function(req, res) {
	log.info("[ "+req.method+" /hide/"+req.params.id+" ]");
	User.hideLocation(req.params.id, function(error){
		if(error) {
			log.error("ERROR hide: "+error);
       	 	res.json(500, { error: error });
        } else {
        	res.send(200);
        }
	});
});

app.post('/show/:id', function(req, res) {
	log.info("[ "+req.method+" /show/"+req.params.id+" ]");
	User.showLocation(req.params.id, function(error){
		if(error) {
			log.error("ERROR show: "+error);
			res.json(500, { error: error });
        } else {
        	res.send(200);
        }
	});
});


app.get('/near/:id/:long/:lat/:dist?', function(req, res) {
	log.info("[ "+req.method+" /near/"+req.params.id+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.dist+" ]");
	User.findNearContacts(req.params.id, req.params.long, req.params.lat, req.params.dist, function(error, user){
	     if(error) {
	    	 log.error("ERROR: "+error);
	    	 res.json(500, { error: result.error });
	     }else{
	    	 //console.log("NEAR CONTACTS: "+nearContacts+"\n\n");
	    	 //TODO Notify friends in region with his location 
	    	 var userSocket = null;
	    	 var notification = {event:"near-by",contact:user.number,loc:[req.params.long,req.params.lat]};	
	    	 //console.log("**************** [NOTIFICATION]: "+JSON.stringify(notification)+" ****************");
	    	 user.contacts.forEach(function(contact){	    		 
	    		 userSocket = socketDB.get(contact.number);
	    		 if(userSocket){	    			 
	    			 userSocket.emit('notification',notification);
	    		 }
	    	 });
	    	 res.json({contacts : user.contacts});
	     }
	 });
});

io.sockets.on('connection', function (socket) {
  log.debug('\n[ -------------- CLIENT CONNECTED ('+socket.id+') ----------- ]');
  socket.on('register', function(user,callback){
	  User.getNumber(user.id, function(result) {
      			if(result.error) {
      				log.error("CHAT GET USER ERROR: "+result.error);
	         	} else {
	         	    //delete socketMap[chatter.number];
	         	    //delete userMap[socket.id];
	         		log.debug(result.number+" REGISTERED FOR CHAT");
	         		//socketMap[result.number] = socket;
	         		socketDB.add(result.number,socket);
	         		//userMap[socket.id] = result.number;
	         		socket.phone = result.number;
	         		var userMessages = messageDB.get(result.number);
	         		if(userMessages){
	         			userMessages.forEach(function(msg){
	         				socket.emit('message', msg);
	         				log.debug("GOING TO SEND: "+msg.txt);
	         			});
	         			messageDB.clear(result.number);
	         		}
	         		var userGroups = groupDB.get(result.number);
	         		if(userGroups){
	         			userGroups.forEach(function(notification){
	         				socket.join(notification.group);
	         				socket.emit('notification',notification);
	         				log.debug(result.number+" HAS JOINED GROUP "+notification.group);
	         			});
	         			userGroups.clear(result.number);
	         		}
	         		callback();
	         	}
	  });
  });
  
  socket.on('message', function(msg){
    if(msg.group){
    	log.debug("GROUP MSG CHAT (GROUP): "+msg.group);
        log.debug("GROUP MSG CHAT (TXT): "+msg.txt);
        socket.broadcast.to(msg.group).emit('message', msg)
    }else{
    	var fwmsg = {from:socket.phone, txt:msg.txt}
        var userSocket = socketDB.get(msg.to);
    	log.debug("CHAT SEND MSG msg.from: "+socket.phone);
        log.debug("CHAT SEND MSG msg: "+msg);
        log.debug("CHAT SEND MSG msg.to: "+msg.to);
        log.debug("CHAT SEND MSG userSocket: "+userSocket);
        if(userSocket){
        	userSocket.emit('message', fwmsg);
        }else{
        	log.debug("CHAT SEND MSG: SOCKET IS NULL ");
        	messageDB.add(msg.to,fwmsg);
        }
    }
  });
  
  socket.on('disconnect', function(){
	    log.debug('\n[ -------------- CLIENT (DIS)CONNECTED ('+socket.id+') ----------- ]');
	    //groups.removeGroups(socket.phone);
	    delete socketDB.remove(socket.phone);
	    //delete userMap[socket.id];
  });
  
  socket.on('create-group', function(user,callback){
	  User.getNumber(user.id, function(result) {
			if(result.error) {
				log.error("CHAT GET USER ERROR: "+result.error);
			} else {
				var groupName = uuid.v4();
			  	log.debug("NEW GROUP CREATOR: '"+result.number+"'");
				log.debug("NEW GROUP CREATED: '"+groupName+"'");
				socket.phone = result.number;
				userSocket = socketDB.getOrCreate(result.number, socket);
				userSocket.group = groupName;
				userSocket.join(groupName);
				var newGroup = new Group(groupName,userSocket.phone);
				newGroup.add(result.number);
				groups.add(groupName, newGroup);
		      	callback(groupName);
			}
	  });
  });
  
  socket.on('add-to-group', function(data){
	    log.debug("ADD TO GROUP: ["+data.members+"]");
	    var members = null;
	    var userSocket = null;
	    var notification = null;
	    var group = groups.get(data.group);
	    if(group){
	    	data.members.forEach(function(member){
		    	notification = {event:"new-member",group:data.group,by:socket.phone,member:member};
		    	socket.broadcast.to(data.group).emit('notification', notification);
		    	userSocket = socketDB.get(member);
		    	members = group.getMembers().slice(0);
		    	notification = {event:"add-to-group",group:data.group,by:socket.phone,members:members};
		    	log.debug("ADD TO GROUP USER NOTIFICATION EVENT: ["+notification.event+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION GROUP: ["+notification.group+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION BY: ["+notification.by+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION MEMBERS: ["+notification.members+"]");
	    		group.add(member);
		    	if(userSocket){
		    		log.debug("ADD TO GROUP USER: '"+member+"' ADDED");
		    		userSocket.group = data.group;
		    		userSocket.join(data.group);
		    		userSocket.emit('notification',notification);
		    	}else{
		    		log.debug("ADD TO GROUP USER: '"+member+"' NOT REGISTERED");
		    		//var userGroups = groupDB.get(result.number);
		    		groupDB.add(member,notification);
		    	}
			});
	    }
  });
  
  
  socket.on('remove-from-group', function(data){
	    log.debug("REMOVE FROM GROUP: ["+data.members+"]");
	    var userSocket = null;
	    var notification = null;
	    var group = groups.get(data.group);
	    if(group){
	    	data.members.forEach(function(member){
		    	userSocket = socketDB.get(member);
		    	var notification = {event:"remove-from-group",group:data.group,by:socket.phone};
		    	log.debug("REMOVE FROM GROUP USER NOTIFICATION EVENT: ["+notification.event+"]");
	    		log.debug("REMOVE FROM GROUP USER NOTIFICATION GROUP: ["+notification.group+"]");
	    		log.debug("REMOVE FROM GROUP USER NOTIFICATION BY: ["+notification.by+"]");
		    	if(userSocket && groups.isGroupOwner(socket.phone,data.group)){
		    		//userSocket.group = null;
		    		userSocket.emit('notification',notification);
		    		userSocket.leave(data.group);
		    		group.remove(userSocket.phone);
		    	}
		    	notification = {event:"remove-member",group:data.group,by:socket.phone,member:member};
		    	socket.broadcast.to(data.group).emit('notification', notification);
			});
	    }	    
  });
 
  socket.on('leave-group', function(data){
	  var group = groups.get(data.group);
	  var notification = {event:"leave-group",group:data.group,by:socket.phone}
	  socket.broadcast.to(group.name).emit('notification', notification);
	  socket.leave(group.name);
	  group.remove(socket.phone);
  }); 
  
});

//server.listen(app.get('port'), function(){
//	log.debug('Chat server listening on port ' + app.get('port'));
//});


exports.start = function(cb) {
	server.listen(app.get('port'), function(){
		log.debug('Chat server listening on port ' + app.get('port'));
		cb && cb()
	});
}

exports.close = function(cb) {
  if (server) server.close(cb)
}

// when app.js is launched directly
if (module.id === require.main.id) {
  exports.start()
}