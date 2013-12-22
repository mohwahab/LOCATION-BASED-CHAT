var log = require('loglevel');

function GroupDB() {
    this.groups = {};	//{phone-number : group-object[]}
};

GroupDB.prototype.add = function(phoneNumer, notification) {
	if(!this.groups[phoneNumer]){
		log.debug("GroupDB::add >> CREATE GROUP ARRAY");
		this.groups[phoneNumer] = [];
	}
	this.groups[phoneNumer].push(notification);
	log.debug("GroupDB::add >> GROUP "+notification+" ADDED TO ("+phoneNumer+") WAITING GROUPS");
};

GroupDB.prototype.get = function(phoneNumer) {
	return this.groups[phoneNumer];
};

GroupDB.prototype.clear = function(phoneNumer) {
	this.groups[phoneNumer] = [];
};

module.exports = GroupDB;