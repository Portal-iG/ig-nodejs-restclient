var request = require('request');
var path = require('path');
var url = require('url');
var logger = require('winston');

/**
 * @class RestMapper
 *
 * Provides standartized traslation of API method calls to REST requests
 *
 * @param {string} baseUrl Base url for all requests
 * @param {string} productId 
 * @param {object=} mapping REST mapping instructions - see tests for this
 *         module for preferences for each mapping type
 *     @param {object=} insert 	Mappings for insert operations
 *     @param {object=} update 	Mappings for update operations
 *     @param {object=} delete 	Mappings for delete operations
 *     @param {object=} get 	Mappings for retrieve operations
 *     @param {object=} list 	Mappings for listing operations
 *     @param {object=} assoc 	Mappings for association operations
 *
 * @author Ricardo Massa
 */
function RestMapper (baseUrl, mapping, translationMap) {
	if (!(this instanceof RestMapper))
		return new RestMapper(baseUrl, mapping, translationMap);

	/**
	 * Base URL
	 * @todo support for base URL containing a query string
	 * @type {URL}
	 */
	this._translationMap = translationMap;
	this._baseUrl = url.parse(baseUrl);
	this._mapping = RestMapper._normalizeMapping(mapping);
	this._defaultHeaders = { 'Content-Type': 'application/json' };
}

/**
 * Fills optional entries on mapping object with default values
 * @param  {object=} mapping REST mappings
 * @return {object}          Normalized mappings
 */
RestMapper._normalizeMapping = function (mapping) {
	mapping = mapping || {};
	mapping.insert = mapping.insert || {};
	mapping.update = mapping.update || {};
	mapping['delete'] = mapping['delete'] || {};
	mapping.get = mapping.get || {};
	mapping.list = mapping.list || {};
	mapping.assoc = mapping.assoc || {};

	return mapping;
}

/**
 * Translates the params of a insert method call to a request
 * options object according to the current mappings
 * @param  {string}   type   insert type
 * @param  {object}   entity entity to insert
 * @param  {Function} cb     request callback
 * @return {object}          request options for this insert operation
 */
RestMapper.prototype.translateInsert = function (type, entity) {
	var mapping = this._mapping.insert[type];
	if (!mapping)
		return null;

	var rewritten = RestMapper._getRewrittenStr(mapping.rewriteUrl, type);
	var translated = RestMapper._translateUrl(rewritten, this._translationMap);

	var restUrl = Object.create(this._baseUrl);
	restUrl.pathname = path.join(restUrl.pathname, translated);

	var opts = {
		url: url.format(restUrl),
		method: mapping.method || 'POST',
		headers: this._defaultHeaders,
		body: JSON.stringify(entity)
	};

	logger.debug('Translated', type, entity, 'to', opts);

	return opts;
}

/**
 * Translates the params of a update method call to a request
 * options object according to the current mappings
 * @param  {string}   type   update type
 * @param  {object}   entity entity to update
 * @param  {Function} cb     request callback
 * @return {object}          request options for this update operation
 */
RestMapper.prototype.translateUpdate = function (type, entity) {
	var mapping = this._mapping.update[type];
	if (!mapping)
		return null;

	var append = RestMapper._getAppendStr(mapping.append, entity);
	var rewritten = RestMapper._getRewrittenStr(mapping.rewriteUrl, type);
	var translated = RestMapper._translateUrl(rewritten, this._translationMap);

	var restUrl = Object.create(this._baseUrl);
	restUrl.pathname = path.join(restUrl.pathname, translated, append);

	var opts = {
		url: url.format(restUrl),
		method: mapping.method || 'PUT',
		headers: this._defaultHeaders,
		body: JSON.stringify(entity)
	};

	logger.debug('Translated', type, entity, 'to', opts);

	return opts;
}

/**
 * Translates the params of a delete method call to a request
 * options object according to the current mappings
 * @param  {string}   type   delete type
 * @param  {object}   entity entity to delete
 * @param  {Function} cb     request callback
 * @return {object}          request options for this delete operation
 */
RestMapper.prototype.translateDelete = function (type, entity) {
	var mapping = this._mapping['delete'][type];
	if (!mapping)
		return null;

	var append = RestMapper._getAppendStr(mapping.append, entity);
	var rewritten = RestMapper._getRewrittenStr(mapping.rewriteUrl, type);
	var translated = RestMapper._translateUrl(rewritten, this._translationMap);

	var restUrl = Object.create(this._baseUrl);
	restUrl.pathname = path.join(restUrl.pathname, translated, append);

	var opts = {
		url: url.format(restUrl),
		method: mapping.method || 'DELETE',
		headers: this._defaultHeaders
	};

	logger.debug('Translated', type, entity, 'to', opts);

	return opts;
}

/**
 * Translates the params of a get method call to a request
 * options object according to the current mappings
 * @param  {string}   type   get type
 * @param  {object}   entity entity to retrieve
 * @param  {Function} cb     request callback
 * @return {object}          request options for this get operation
 */
RestMapper.prototype.translateGet = function (type, entity) {
	var mapping = this._mapping.get[type];
	if (!mapping)
		return null;

	var append = RestMapper._getAppendStr(mapping.append, entity);
	var rewritten = RestMapper._getRewrittenStr(mapping.rewriteUrl, type);
	var inserted = RestMapper._getInsertedStr(mapping.insert, rewritten, entity);
	var translated = RestMapper._translateUrl(inserted, this._translationMap);
	var query = RestMapper._getQueryParams(mapping.query, entity);

	var restUrl = Object.create(this._baseUrl);
	restUrl.pathname = path.join(restUrl.pathname, translated, append);
	restUrl.query = query;

	var opts = {
		url: url.format(restUrl),
		method: mapping.method || 'GET',
		headers: this._defaultHeaders
	};

	logger.debug('Translated', type, entity, 'to', opts);

	return opts;
}

/**
 * Translates the params of a listing method call to a request
 * options object according to the current mappings
 * @param  {string}   type   list type
 * @param  {object}   entity entity to list
 * @param  {Function} cb     request callback
 * @return {object}          request options for this listing operation
 */
RestMapper.prototype.translateList = function (type, entity) {
	var mapping = this._mapping.list[type];
	if (!mapping)
		return null;

	var rewritten = RestMapper._getRewrittenStr(mapping.rewriteUrl, type);
	var inserted = RestMapper._getInsertedStr(mapping.insert, rewritten, entity);
	var translated = RestMapper._translateUrl(inserted, this._translationMap);
	var query = RestMapper._getQueryParams(mapping.query, entity);

	var restUrl = Object.create(this._baseUrl);
	var restUrl = Object.create(this._baseUrl);
	
	restUrl.pathname = path.join(restUrl.pathname, translated);
	restUrl.query = query;

	var opts = {
		url: url.format(restUrl),
		method: mapping.method || 'GET',
		headers: this._defaultHeaders
	};

	logger.debug('Translated', type, entity, 'to', opts);

	return opts;
}

/**
 * Translates the params of a associating method call to a request
 * options object according to the current mappings
 * @param  {string}   type   association type
 * @param  {object}   entity entities to associate
 * @param  {Function} cb     request callback
 * @return {object}          request options for this associating operation
 */
RestMapper.prototype.translateAssoc = function (type, entity) {
	var mapping = this._mapping.assoc[type];
	if (!mapping)
		return null;

	var rewritten = RestMapper._getRewrittenStr(mapping.rewriteUrl, type);
	var inserted = RestMapper._getInsertedStr(mapping.insert, rewritten, entity);
	var translated = RestMapper._translateUrl(inserted, this._translationMap);

	var body = null;
	if (mapping.data) {
		body = JSON.stringify(entity[mapping.data]);
	}

	var restUrl = Object.create(this._baseUrl);
	restUrl.pathname = path.join(restUrl.pathname, translated);

	var opts = {
		url: url.format(restUrl),
		method: mapping.method || 'POST',
		headers: this._defaultHeaders,
		body: body
	};

	logger.debug('Translated', type, entity, 'to', opts);

	return opts;
}

/**
 * Determines the string to be appended to the url
 * @param  {string} appendConf Append preferences on mapping (may be null)
 * @param  {object} entity     Object being operated
 * @param  {string} [defaultField=id] Field to append if `appendConf` is 
 *     explicitly null
 * @return {string}            String to be appended to the url
 */
RestMapper._getAppendStr = function (appendConf, entity, defaultField) {
	defaultField = defaultField || 'id';

	var fieldtoAppend = null;
	if (appendConf !== null) {
		fieldtoAppend = appendConf || defaultField;
	}

	var append = '';
	if (fieldtoAppend !== null)
		append = entity[fieldtoAppend];

	return append + '';
}

RestMapper._getQueryParams = function (queryParamsConf, entity) {
	var query = {};

	if (queryParamsConf) {
		for (var i = 0; i < queryParamsConf.length; i++) {
			var paramName = queryParamsConf[i];
			if (typeof entity[paramName] != 'undefined')
				query[paramName] = entity[paramName];
		}
	}

	return query;
}

/**
 * Returns the passed string but with the value of a field from the given entity
 * inserted right after the field name.
 * For instance, _getInsertedStr('profile', '/profile/media', { profile: 10 }) 
 * returns '/profile/10/media'
 * @param  {string} insertConf field name to insert (may be null)
 * @param  {string} baseStr    String where to insert into
 * @param  {object} entity     Object to get the field value from
 * @return {string}            The transformed string
 */
RestMapper._getInsertedStr = function (insertConf, baseStr, entity) {
	if (!insertConf)
		return baseStr;

	var slashed = '/' + insertConf + '/';
	baseStr = baseStr.replace(insertConf, slashed + entity[insertConf] + '/');

	return baseStr;
}

RestMapper._translateUrl = function (url, translation) {
	for(var prop in translation){
		url = url.replace('$'+ prop, translation[prop]);
	}
	return url;
}

RestMapper._getRewrittenStr = function (rewriteUrl, originalUrl) {
	return rewriteUrl ? rewriteUrl : originalUrl;
}

module.exports = RestMapper;