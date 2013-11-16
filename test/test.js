/**
 * Test file
 */
var request = require('superagent');
var agent = require('should');
var url = 'http://localhost:3000';

//var User = require('../model/user.js');


describe('Getting Nearby Friends', function(){
    
    it("/near should return nearby friends  ", function(done){
        //this.timeout(100000);
        request
            .get(url+'/near/01001953010/2.33739/48.89364/100?')
            .end(function(res){
            	console.log("<----"+JSON.stringify(res.body)+"----->");
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