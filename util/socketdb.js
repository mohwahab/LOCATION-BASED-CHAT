function SocketDB() {
    this.sockets = {};	//{phone-number : socket-object}
};

SocketDB.prototype.add = function(phoneNumer,userSocket) {
	this.sockets[phoneNumer] = userSocket;
};

SocketDB.prototype.get = function(phoneNumer) {
	return this.sockets[phoneNumer];
};

SocketDB.prototype.remove = function(phoneNumer) {
	delete this.sockets[phoneNumer];
};

module.exports = SocketDB;