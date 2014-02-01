function Groups() {
    this.groups = {};	//{group-id : group-object}
};

Groups.prototype.add = function(id,group) {
	console.log(">>>>>>>>>>>> GROUPS:add-->("+id+") ("+group.name+")");
	this.groups[id] = group;
};

Groups.prototype.get = function(id) {
	console.log(">>>>>>>>>>>> GROUPS:get-KEYID -->("+id+")");
	console.log(">>>>>>>>>>>> GROUPS:get-NAME -->("+this.groups[id].name+")");
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