function Groups() {
    this.groups = {};	//{group-name : group-object}
};

Groups.prototype.add = function(name,group) {
	this.groups[name] = group;
};

Groups.prototype.get = function(name) {
	return this.groups[name];
};


Groups.prototype.remove = function(name) {
	delete this.groups[name];
};

Groups.prototype.removeGroups = function(phoneNumer) {
	this.groups.forEach(function(group){
		if(this.isGroupOwner(phoneNumer, group.name)){
			delete this.groups[group.name];
		}
	});
};

Groups.prototype.isGroupOwner = function(phoneNumer, name) {
	return (this.groups[name].owner === phoneNumer);
};


module.exports = Groups;