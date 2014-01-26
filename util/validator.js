function Validator() {
};

Validator.prototype.isValidNumer = function(phoneNmber) {
	return /^\d{11}$/.test(phoneNmber);
};

Validator.prototype.isValidUsername = function(username) {
	var legalChars = /([a-zA-Z0-9.]+_){0,1}([a-zA-Z0-9.])+/;
	return (username.length>0 && username.length<50 && legalChars.test(username));
};

module.exports = Validator;
