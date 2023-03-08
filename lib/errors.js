var util = require('util');

function BadRequestError (message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);
	this.message = message;
	this.name = 'BadRequestError';	
};

BadRequestError.prototype.__proto__ = Error.prototype;

exports.BadRequestError = BadRequestError;