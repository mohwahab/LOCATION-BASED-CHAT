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
var Validator = require('./util/validator.js');
var validator = new Validator();

var defaultDist = 10; //default nearby search distance.

//io.configure('development', function(){
//    io.set('transports', ['xhr-polling']);
//});

//var socketMap = {}; 	//{phone-number : socket-object}
//var msgMap = {};		//{phone-number : message-object[]}
//var grpMap = {};		//{phone-number : group-id[]}
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


var notifyNearBy = function(user, event, callback){
	User.findNearContacts(user.id, user.long, user.lat, user.dist, user.visible, function(error, result){
	     if(error) {	    	 
	    	 callback({ error : error});
	     }else{	    	  	    	 
	    	 var userSocket = null;
	    	 var notification = {event:event,contact:result.number,loc:[user.long,user.lat]};	
	    	 log.debug("-------------------------------[NOTIFICATION]----------------------------------");
	    	 log.debug(JSON.stringify(notification));
	    	 log.debug("--------------------------------------------------------------------------------");
	    	 log.debug("----------------------------------[CONTACTS]------------------------------------");
	    	 log.debug(result.contacts);
	    	 log.debug("--------------------------------------------------------------------------------");
	    	 result.contacts.forEach(function(contact){	    		 
	    		 userSocket = socketDB.get(contact.number);
	    		 if(userSocket){	    			 
	    			 userSocket.emit('notification',notification);
	    		 }
	    	 });
	    	 callback({contacts : result.contacts});
	     }
	 });
};


app.get('/register/:name/:number/:long/:lat/:contacts?', function(req, res) {
	log.info("[ "+req.method+" /register/"+req.params.name+"/"+req.params.number+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.contacts+" ]");
	User.register(req.params.name, req.params.number, req.params.long, req.params.lat, req.params.contacts, function(result){
		if(result.error) {
			log.error("ERROR register: "+result.error);
			res.json(500, result);
        } else {
        	res.json({id:result.id});
        }
	});
});

app.post('/hide/:id', function(req, res) {
	log.info("[ "+req.method+" /hide/"+req.params.id+" ]");
	User.getLastCheckInLoc(req.params.id, function(result){    		
		if(result.error){    			
			log.error("HIDE ERROR: "+result.error);
			res.json(500, result);
		}else{    			
			notifyNearBy({id:req.params.id, long:result.long, lat:result.lat, dist:defaultDist, visible:false}, "off-line", function(result){
        		if(result.error) {
        	    	 log.error("(HIDE) NOTIFY NEARBY ERROR: "+JSON.stringify(result.error));
        	    	 res.json(500, result);
        	    }else{
        	    	res.send(200);
        	    }
        	});
		}
	});
//	User.hideLocation(req.params.id, function(error){
//		if(error) {
//			log.error("ERROR hide: "+error);
//       	 	res.json(500, { error: error });
//        } else {
//        	res.send(200);
//        }
//	});
});

app.post('/show/:id', function(req, res) {
	log.info("[ "+req.method+" /show/"+req.params.id+" ]");
	User.getLastCheckInLoc(req.params.id, function(result){    		
		if(result.error){    			
			log.error("SHOW ERROR: "+result.error);
			res.json(500, result);
		}else{    			
			notifyNearBy({id:req.params.id, long:result.long, lat:result.lat, dist:defaultDist, visible:true}, "on-line", function(result){
        		if(result.error) {
        	    	 log.error("(SHOW) NOTIFY NEARBY ERROR: "+JSON.stringify(result.error));
        	    	 res.json(500, result);
        	    }else{
        	    	res.send(200);
        	    }
        	});
		}
	});
//	User.showLocation(req.params.id, function(error){
//		if(error) {
//			log.error("ERROR show: "+error);
//			res.json(500, { error: error });
//        } else {
//        	res.send(200);
//        }
//	});
});


app.get('/near/:id/:long/:lat/:dist?', function(req, res) {
	log.info("[ "+req.method+" /near/"+req.params.id+"/"+req.params.long+"/"+req.params.lat+"/"+req.params.dist+" ]");
	req.params.visible = true;
	notifyNearBy(req.params, "near-by", function(result){
		if(result.error) {
	    	 log.error("ERROR: "+JSON.stringify(result.error));
	    	 res.json(500, result.error);
	     }else{
	    	 res.json({contacts : result.contacts});
	     }
	});
//	User.findNearContacts(req.params.id, req.params.long, req.params.lat, req.params.dist, function(error, user){
//	     if(error) {
//	    	 log.error("ERROR: "+error);
//	    	 res.json(500, { error: result.error });
//	     }else{
//	    	 //console.log("NEAR CONTACTS: "+nearContacts+"\n\n");
//	    	 //TODO Notify friends in region with his location 
//	    	 var userSocket = null;
//	    	 var notification = {event:"near-by",contact:user.number,loc:[req.params.long,req.params.lat]};	
//	    	 log.debug("**************** [NOTIFICATION]: "+JSON.stringify(notification)+" ****************");
//	    	 user.contacts.forEach(function(contact){	    		 
//	    		 userSocket = socketDB.get(contact.number);
//	    		 if(userSocket){	    			 
//	    			 userSocket.emit('notification',notification);
//	    		 }
//	    	 });
//	    	 res.json({contacts : user.contacts});
//	     }
//	 });
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
	         		socket.userId = user.id;
	         		log.debug('Socket of User('+socket.phone+') Is set value('+socket.userId+')');
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
    	msg.from = socket.phone;
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
	    var id = socket.userId;
	    log.debug('Socket User Id -->('+id+')');
	    log.debug("User ["+socket.phone+"] is Hidden");
    	User.getLastCheckInLoc(id, function(result){    		
    		if(result.error){    			
    			log.error("DISCONNECT ERROR: "+result.error);
    		}else{    			
    			notifyNearBy({id:id, long:result.long, lat:result.lat, dist:defaultDist, visible:false}, "off-line", function(result){
	        		if(result.error) {
	        	    	 log.error("NOTIFY NEARBY ERROR: "+JSON.stringify(result.error));	        	    	 
	        	    }
	        	});
    		}
    	});
//	    User.hideLocation(id, function(error){
//			if(error) {
//				log.error("ERROR hide: "+error);	
//	        }else{
//	        	log.debug("User ["+socket.phone+"] is Hidden");
//	        	User.getLastCheckInLoc(id, function(result){
//	        		if(result.error){
//	        			log.error("DISCONNECT ERROR: "+result.error);
//	        		}else{
//	        			notifyNearBy({id:id, long:result.long, lat:result.lat, dist:defaultDist}, "off-line", function(result){
//	    	        		if(result.error) {
//	    	        	    	 log.error("NOTIFY NEARBY ERROR: "+result.error);	        	    	 
//	    	        	    }
//	    	        	});
//	        		}
//	        	});
//	        }
//		});
	    delete socketDB.remove(socket.phone);
  });
  
  socket.on('create-group', function(data,callback){	  
	  if(validator.isValidGroupname(data.groupName)){
		  User.getNumber(data.userId, function(result) {
				if(result.error) {
					log.error("CHAT GET USER ERROR: "+result.error);
				} else {
					var groupId = uuid.v4();
				  	log.debug("NEW GROUP CREATOR: '"+result.number+"'");
					log.debug("NEW GROUP CREATED: '"+groupId+"'");
					socket.phone = result.number;
					socket.userId = data.userId;
					userSocket = socketDB.getOrCreate(result.number, socket);
					userSocket.group = groupId;
					userSocket.join(groupId);
					var newGroup = new Group(groupId, data.groupName, userSocket.phone);
					newGroup.add(result.number);
					groups.add(groupId, newGroup);
			      	callback(groupId);
				}
		  }); 
	  }else{
		  var error = "Invalid group name";
		  log.error("CREATE GROUP(ERROR): "+error);
		  callback({error:error});
	  }
  });
  
  socket.on('add-to-group', function(data){
	    log.debug("ADD TO GROUP: ["+data.members+"]");
	    var members = null;
	    var userSocket = null;
	    var notification = null;
	    var group = groups.get(data.groupId);
	    if(group){
	    	data.members.forEach(function(member){
		    	notification = {event:"new-member",group:data.groupId,by:socket.phone,member:member};
		    	socket.broadcast.to(data.groupId).emit('notification', notification);
		    	userSocket = socketDB.get(member);
		    	members = group.getMembers().slice(0);
		    	notification = {event:"add-to-group",groupId:data.groupId,groupName:group.name,by:socket.phone,members:members};
		    	log.debug("ADD TO GROUP USER NOTIFICATION EVENT: ["+notification.event+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION GROUP-ID: ["+notification.groupId+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION GROUP-NAME: ["+notification.groupName+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION BY: ["+notification.by+"]");
	    		log.debug("ADD TO GROUP USER NOTIFICATION MEMBERS: ["+notification.members+"]");
	    		group.add(member);
		    	if(userSocket){
		    		log.debug("ADD TO GROUP USER: '"+member+"' ADDED");
		    		userSocket.group = data.groupId;
		    		userSocket.join(data.groupId);
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
	  log.debug("[LEAVE-GROUP]: "+JSON.stringify(data));
	  if(group){
		  var notification = {event:"leave-group",group:data.group,by:socket.phone}; //TODO "by" to be "member"
		  socket.broadcast.to(group.id).emit('notification', notification);
		  socket.leave(group.id);
		  group.remove(socket.phone);
	  }
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