
/**
 * Module dependencies.
 */
var schema = 'users';

var express = require('express')
, http = require('http');

//var express = require('express')
//, routes = require('./routes')
//, user = require('./routes/user')
//, http = require('http')
//, path = require('path');

var app = express();
var mongoose = require ("mongoose");

var app = express();
app.use(express.bodyParser());

var User = require('./model/user.js');


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

app.get('/near/:numer/:lon/:lat/:dist?', function(req, res) {
	console.log("<----"+req.method+" "+req.params.lon+" "+req.params.lat+" "+req.params.dist+"----->");
//	User.find({loc: { $near : [req.params.lon, req.params.lat], $maxDistance : req.params.dist/68.91}}, function(err, result) {
//	    if (err) {
//	      res.status(500);
//	      res.send(err);
//	    } else {
//	      res.send({result: result});
//	    }
//	});
	var result = { 
					contacts :[
						          {
				                	   name : 'Ahmed Alaa', position : [30.018571,31.102711]
				                  },
				                  {	  
				                	  name : 'Karim Fahmy', position : [30.073254,31.027054]
				                  },
				                  {	  
				                	  name : 'Abdullah zaki', position : [30.121395, 32.099865]
				                  },
				                  {	  
				                	  name : 'Mohamed Abd El Wahab', position : [30.021395,31.099865]
				                  }
				              ]
	};
	res.json(result);
	
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
