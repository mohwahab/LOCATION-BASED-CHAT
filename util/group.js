function Group(id, name, owner) {
	this.id = id;
	this.name = name;
	this.owner = owner;
	this.members = [];
};

Group.prototype.add = function(phoneNmber) {
  //if (this.status === "available") {
    this.members.push(phoneNmber);
  //}
};

Group.prototype.remove = function(phoneNmber) {
  var memberIndex = -1;
  var memberIndex = this.members.indexOf(phoneNmber);
  if (memberIndex > -1) {
	  this.members.splice(memberIndex, 1);
  }
};

Group.prototype.get = function(phoneNmber) {
  var memberIndex = this.members.indexOf(phoneNmber);
  return this.members[memberIndex];
};

Group.prototype.getMembers = function() {
	return this.members;
};

//Room.prototype.isAvailable = function() {
//  if (this.available === "available") {
//    return true;
//  } else {
//    return false;
//  }
//};
//
//Room.prototype.isPrivate = function() {
//  if (this.private) {
//    return true;
//  } else {
//    return false;
//  }
//};

module.exports = Group;