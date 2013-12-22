var log = require('loglevel');

function MessageDB() {
    this.messages = {};	//{phone-number : message-object[]}
};

MessageDB.prototype.add = function(phoneNumer, message) {
	if(!this.messages[phoneNumer]){
		log.debug("MessageDB::add >> CREATE MSG ARRAY");
		this.messages[phoneNumer] = [];
	}
	this.messages[phoneNumer].push(message);
	log.debug("MessageDB::add >> MESSAGE FROM "+message.from+" ADDED TO BE FORWARDED");
};

MessageDB.prototype.get = function(phoneNumer) {
	return this.messages[phoneNumer];
};

MessageDB.prototype.clear = function(phoneNumer) {
	this.messages[phoneNumer] = [];
};

module.exports = MessageDB;