
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
//    io.set('transports', ['xhr-polling']);
//});

var socketMap = {};
var msgMap = {};
var grpMap = {};
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
	//TODO Notify friends in region with his location 
	User.findNearContacts(req.params.id, req.params.long, req.params.lat, req.params.dist, false, function(error, nearContacts){
	     if(error) {
	    	 log.error("ERROR: "+error);
	    	 res.json(500, { error: result.error });
	     }else{
	    	 //console.log("NEAR CONTACTS: "+nearContacts+"\n\n");
	    	 res.json({contacts : nearContacts});
	     }
	 });
});

io.sockets.on('connection', function (socket) {
  log.debug('[ -------------- CLIENT CONNECTED ----------- ]');
  socket.on('register', function(user){
	  User.getNumber(user.id, function(result) {
      			if(result.error) {
      				log.error("CHAT GET USER ERROR: "+error);
	         	} else {
	         	    //delete socketMap[chatter.number];
	         	    //delete userMap[socket.id];
	         		log.debug(result.number+" REGISTERED FOR CHAT");
	         		socketMap[result.number] = socket;
	         		userMap[socket.id] = result.number;
	         		if(msgMap[result.number]){
	         			msgMap[result.number].forEach(function(msg){
	         				socket.emit('message', msg);
	         				log.debug("GOING TO SEND: "+msg.txt);
	         			});
	         			msgMap[result.number] = [];
	         		}
	         		if(grpMap[result.number]){
	         			grpMap[result.number].forEach(function(group){
	         				socket.join(group);
	         				log.debug(result.number+" HAS JOINED GROUP "+group);
	         			});
	         			grpMap[result.number] = [];
	         		}
	         	}
	  });
  });
  
  socket.on('message', function(msg){
    fwMsg = {from:userMap[socket.id], txt:msg.txt}
    log.debug("CHAT SEND MSG msg: "+msg);
    log.debug("CHAT SEND MSG msg.to: "+msg.to);
    log.debug("CHAT SEND MSG socketMap[msg.to]: "+socketMap[msg.to]);
    //if(!socketMap[msg.to]){
    if(msg.to !== undefined && socketMap[msg.to] !== undefined){
    	socketMap[msg.to].emit('message', fwMsg);
    }else{
    	log.debug("CHAT SEND MSG: SOCKET IS NULL ");
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
  
  socket.on('create-group', function(group){
    log.debug("CREATE GROUP: '"+group+"'");
    socket.join(group);
    
  });
  
  socket.on('add-to-group', function(data){
	    log.debug("ADD TO GROUP: '"+data.numbers+"'");
	    numbers.forEach(function(data){
	    	if(socketMap[data.number]){
	    		socketMap[data.number].join(data.group);
	    	}else{
	    		if(!grpMap[data.number]){
	        		log.debug("ADD TO GROUP: SOCKET IS NULL --> CREATE GROUP ARRAY");
	        		grMap[data.number] = [];
	        	}
	    		grMap[data.number].push(data.group);
	        	log.debug("GROUP "+data.group+" ADDED TO BE JOINED");
	    	}
		});
  });
  
  
  socket.on('remove-from-group', function(data){
	    log.debug("REMOVE FROM GROUP: '"+data.numbers+"'");
	    numbers.forEach(function(data){
	    	if(socketMap[data.number]){
	    		socketMap[data.number].leave(data.group);
	    	}
		});
 });
 
  socket.on('leave-group', function(data){
	  User.getNumber(data.user.id, function(result) {
      			if(result.error) {
      				log.error("LEAVE GROUP GET USER ERROR: "+error);
	         	} else {
	         		socketMap[result.number].leave(data.group)
	         	}
	  });
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