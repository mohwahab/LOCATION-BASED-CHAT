function Validator() {
};

Validator.prototype.isValidNumer = function(phoneNmber) {
	var regex = /^\+{0,1}\d{11}$/;
	return regex.test(phoneNmber);
};

Validator.prototype.isValidUsername = function(username) {
	//var legalChars = /([a-zA-Z0-9.]+_){0,1}([a-zA-Z0-9.])+/;
	var legalChars = /^\w/;
	return (username.length>0 && username.length<=50 && legalChars.test(username));
};

Validator.prototype.isValidGroupname = function(groupname) {
	//var legalChars = /[a-zA-Z0-9.]+_{0,1}[a-zA-Z0-9.]+/;
	var legalChars = /^\w/;
	return ((groupname) && (groupname.length>0) && (groupname.length<=50) && (legalChars.test(groupname)));
};


module.exports = Validator;
