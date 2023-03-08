var request = require('request');
var logger = require('winston');
var url = require('url');
var merge = require('merge');
var errors = require('./errors');
var RestMapper = require('./rest-mapper');

/**
 * @class RestService
 * 
 * An interface to a mapped REST API
 * @param {RestMapper} restMapper Mapper to convert from method calls to
 *         http request options
 * 
 * @author Ricardo Massa
 */
function RestService (baseUrl, mapping, translationMap, options) {
	if (!(this instanceof RestService))
		return new RestService(baseUrl, mapping, translationMap, options);

	this._restMapper = new RestMapper(baseUrl, mapping, translationMap);

	// Normalizing options
	options = options || {};
	options.request = options.request || {};
	this._options = options;
}

/**
 * Performs an insert operation of the underlying REST service
 * @param  {string}   path   Type of insert
 * @param  {object}   entity Entity to insert
 * @param  {Function} cb     Callback
 * @return {void}          
 */
RestService.prototype.insert = function (path, entity, cb) {
	var reqOpts = this._restMapper.translateInsert(path, entity);
	this._doRequest(reqOpts, cb);
}

/**
 * Performs an update operation of the underlying REST service
 * @param  {string}   path   Type of update
 * @param  {object}   entity Entity to update
 * @param  {Function} cb     Callback
 * @return {void}          
 */
RestService.prototype.update = function (path, entity, cb) {
	var reqOpts = this._restMapper.translateUpdate(path, entity);
	this._doRequest(reqOpts, cb);
}

/**
 * Performs an delete operation of the underlying REST service
 * @param  {string}   path   Type of delete
 * @param  {object}   entity Entity to delete
 * @param  {Function} cb     Callback
 * @return {void}          
 */
RestService.prototype['delete'] = function (path, entity, cb) {
	var reqOpts = this._restMapper.translateDelete(path, entity);
	this._doRequest(reqOpts, cb);
}

/**
 * Performs a get operation of the underlying REST service
 * @param  {string}   path   Type of get
 * @param  {object}   entity Entity to retrieve
 * @param  {Function} cb     Callback
 * @return {void}          
 */
RestService.prototype.get = function (path, entity, cb) {
	var reqOpts = this._restMapper.translateGet(path, entity);
	this._doRequest(reqOpts, cb);
}

/**
 * Performs a list operation of the underlying REST service
 * @param  {string}   path   Type of list
 * @param  {object}   filter Filters to list
 * @param  {Function} cb     Callback
 * @return {void}          
 */
RestService.prototype.list = function (path, filter, cb) {
	var reqOpts = this._restMapper.translateList(path, filter);
	this._doRequest(reqOpts, cb);
}

/**
 * Performs an assoc operation of the underlying REST service
 * @param  {string}   path   	Type of assoc
 * @param  {object}   entities 	Entities to assoc
 * @param  {Function} cb     	Callback
 * @return {void}          
 */
RestService.prototype.assoc = function (path, entities, cb) {
	var reqOpts = this._restMapper.translateAssoc(path, entities);
	this._doRequest(reqOpts, cb);
}

/**
 * Performs the actual request on REST service and translate the http
 * response to callback parameters to client
 * @param  {object}   reqOpts Options object for request
 * @param  {Function} cb      Client callback
 * @return {void}           
 */
RestService.prototype._doRequest = function (reqOpts, cb) {
	/**
	 * @todo make this block work
	 */
	if (!reqOpts) {
		logger.error('Undefined rest mapping for opts', reqOpts);
		process.nextTick(function () {
			cb(new Error('Undefined rest mapping for opts=' + reqOpts))
		});
		return;
	}

	reqOpts = merge(true, reqOpts, this._options.request);

	request(reqOpts, function (err, res, body) {
		if (err) {
			cb(err);
			return;
		}

		var code = res.statusCode;

		var bodyObj;

		try {
			bodyObj = JSON.parse(body);	
		} catch (e) {
			var msg = 'Unknown REST response format: ' + body; 
			logger.error(msg)
			cb(new Error(msg), null);
			return;
		}

		if (code >= 500) {
			cb(bodyObj, null);

		} else if (code == 404) {	// "Not found" is not an error
			cb(new Error('Not found'), null);

		} else if (code >= 400) {
			if (bodyObj.message) {
				cb(new errors.BadRequestError(bodyObj.message), null);
				return;
			}
			cb(bodyObj, null);

		} else if (code >= 200 && code < 300) {
			cb(null, bodyObj);
		}
	});
}

RestService.errors = errors;

module.exports = RestService;