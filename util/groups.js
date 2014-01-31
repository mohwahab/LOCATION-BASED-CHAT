function Groups() {
    this.groups = {};	//{group-id : group-object}
};

Groups.prototype.add = function(id,group) {
	this.groups[id] = group;
};

Groups.prototype.get = function(id) {
	return this.groups[id];
};


Groups.prototype.remove = function(id) {
	delete this.groups[id];
};

Groups.prototype.removeGroups = function(phoneNumer) {
	this.groups.forEach(function(group){
		if(this.isGroupOwner(phoneNumer, group.id)){
			delete this.groups[group.id];
		}
	});
};

Groups.prototype.isGroupOwner = function(phoneNumer, id) {
	return (this.groups[id].owner === phoneNumer);
};


module.exports = Groups;