/**
 * Test file
 */
var request = require('superagent');
var agent = require('should');
var io = require('socket.io-client');

var url = 'http://localhost:3000';
var url = 'http://location-based-chat.herokuapp.com';


var options ={
  transports: ['websocket'],
  'force new connection': true
};

//var User = require('../model/user.js');


describe('Getting Nearby Friends', function(){
    
    it("/near should return nearby friends  ", function(done){
        //this.timeout(100000);
        request
            .get(url+'/near/01001953010/2.33739/48.89364/100?')
            .end(function(res){
            	//console.log("<----"+JSON.stringify(res.body)+"----->");
                res.should.be.json;
                //res.body.result.should.eql(["demo", "temperature"]);
                done();
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


describe("Chat Server",function(){
  it('Should be able to send receive and forward messages', function(done){
    var message = {from: 'Mohamed Abd El Wahab', txt:'Hello Back'};
    var messages = 0;

    var completeTest = function(client){
      messages.should.equal(1);
      client.disconnect();
      done();
    };

    var checkMessage = function(client){
      client.on('message', function(msg){
        message.txt.should.equal(msg.txt);
        msg.from.should.equal(message.from);
        messages++;
        completeTest(client);
      });
    };

    client = io.connect(url, options);

    client.on('connect', function(socket){
      client.emit('message', "Hello Server");
      checkMessage(client);
    });
  });
});
