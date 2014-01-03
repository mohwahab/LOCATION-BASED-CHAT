function Group(name, owner) {
  this.name = name;
  this.owner = owner;
  this.members = [];
};

//Room.prototype.addPerson = function(personID) {
//  if (this.status === "available") {
//    this.people.push(personID);
//  }
//};
//
//Room.prototype.removePerson = function(person) {
//  var personIndex = -1;
//  for(var i = 0; i < this.people.length; i++){
//    if(this.people[i].id === person.id){
//      playerIndex = i;
//      break;
//    }
//  }
//  this.people.remove(personIndex);
//};
//
//Group.prototype.getMember = function(id) {
//  var member = null;
//  for(var i = 0; i < this.members.length; i++) {
//    if(this.members[i] == id) {
//    	member = this.members[i];
//      break;
//    }
//  }
//  return member;
//};

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