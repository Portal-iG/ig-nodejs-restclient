var async = require('async');
var nock = require('nock');
var logging = require('./logging');
var RestMapper = require('../lib/rest-mapper');
var RestService = require('../lib/rest');

/**
 * Test suite for rest module
 *
 * @author Ricardo Massa
 */

describe("rest module test suite", function () {

nock.disableNetConnect();

/**
 * @todo assert the entity is being forwarded as the body of http request
 */
nock('http://foo.sub.com')
		// Inserts
		.post('/rest/v1/video/success').reply(200, { id: 100 })
		.post('/rest/v1/video/badinput').reply(400, { required: 'name' })
		.post('/rest/v1/video/servererr').reply(500, { message: 'server down' })
		.post('/rest/v1/video/badoutput').reply(200, 'this is a non-json response!')

		// Updates
		.put('/rest/v1/video/1').reply(200, { id: 1 })
		.put('/rest/v1/video/2').reply(400, { required: 'name' })
		.put('/rest/v1/video/3').reply(500, { message: 'server down' })

		// Deletes
		['delete']('/rest/v1/video/1').reply(200, { id: 1 })
		['delete']('/rest/v1/video/2').reply(400, { message: 'bad id' })
		['delete']('/rest/v1/video/3').reply(500, { message: 'server down' })

		// Gets
		.get('/rest/v1/video/1').reply(200, { id: 1 })
		.get('/rest/v1/video/2').reply(404, { })
		.get('/rest/v1/video/x').reply(400, { message: 'bad id' })
		.get('/rest/v1/video/3').reply(500, { message: 'server down' })

		// Lists
		.get('/rest/v1/category/10/videos').reply(200, [ 1, 2, 3 ])
		.get('/rest/v1/category/x/videos').reply(400, { message: 'bad id' })
		.get('/rest/v1/category/12/videos').reply(500, { message: 'server down' })

		// Assocs
		.post('/rest/v1/video/10/addAuthor').reply(200, { message: 'ok' })
		.post('/rest/v1/video/11/addAuthor').reply(400, { message: 'bad id' })
		.post('/rest/v1/video/12/addAuthor').reply(500, { message: 'server down' })

var mapper = new RestMapper('http://foo.sub.com/rest/v1',
	{
		insert: {
			'video/success': {},
			'video/badinput': {},
			'video/servererr': {},
			'video/badoutput': {},
		},
		update: {
			'video': {}
		},
		'delete': {
			'video': {}
		},
		get: {
			'video': {}
		},
		list: {
			'category/videos': { insert: 'category' }
		},
		assoc: {
			'video/addAuthor': { insert: 'video' }
		}						
	});

var rest = new RestService(mapper);

it("should handle inserts", function (done) {
	var paths = [ 
		'video/success', 
		'video/badinput', 
		'video/servererr',
		'video/badoutput' 
	];

	async.map(paths,
		function (it, cb) {
			rest.insert(it, {}, function (err, entity) {
				cb(null, {err: err, entity: entity});
			})
		},
		function (err, results) {
			expect(err).toBe(null);
			expect(results[0].err).toBe(null);
			expect(results[1].err.required).toEqual('name');
			expect(results[2].err.message).toEqual('server down');
			expect(results[3].err).not.toBe(null);
			expect(results[0].entity.id).toEqual(100);
			expect(results[1].entity).toBe(null);
			expect(results[2].entity).toBe(null);
			expect(results[3].entity).toBe(null);
			done();
		});
});

it("should handle updates", function (done) {
	var ids = [ 
		1, 2, 3
	];

	async.map(ids,
		function (id, cb) {
			rest.update('video', { id: id }, function (err, entity) {
				cb(null, {err: err, entity: entity});
			})
		},
		function (err, results) {
			expect(err).toBe(null);
			expect(results[0].err).toBe(null);
			expect(results[1].err.required).toEqual('name');
			expect(results[2].err.message).toEqual('server down');
			expect(results[0].entity.id).toEqual(1);
			expect(results[1].entity).toBe(null);
			expect(results[2].entity).toBe(null);
			done();
		});
});

it("should handle updates", function (done) {
	var ids = [ 
		1, 2, 3
	];

	async.map(ids,
		function (id, cb) {
			rest['delete']('video', { id: id }, function (err, entity) {
				cb(null, {err: err, entity: entity});
			})
		},
		function (err, results) {
			expect(err).toBe(null);
			expect(results[0].err).toBe(null);
			expect(results[1].err.message).toEqual('bad id');
			expect(results[2].err.message).toEqual('server down');
			expect(results[0].entity.id).toEqual(1);
			expect(results[1].entity).toBe(null);
			expect(results[2].entity).toBe(null);
			done();
		});
});

it("should handle gets", function (done) {
	var ids = [ 
		1, 2, 'x', 3
	];

	async.map(ids,
		function (id, cb) {
			rest.get('video', { id: id }, function (err, entity) {
				cb(null, {err: err, entity: entity});
			})
		},
		function (err, results) {
			expect(err).toBe(null);
			expect(results[0].err).toBe(null);
			expect(results[1].err.message).toEqual('Not found');
			expect(results[2].err.message).toEqual('bad id');
			expect(results[3].err.message).toEqual('server down');
			expect(results[0].entity.id).toEqual(1);
			expect(results[1].entity).toBe(null);
			expect(results[2].entity).toBe(null);
			expect(results[3].entity).toBe(null);
			done();
		});
});

it("should handle lists", function (done) {
	var ids = [ 
		10, 'x', 12
	];

	async.map(ids,
		function (id, cb) {
			rest.list('category/videos', { category: id }, function (err, entity) {
				cb(null, {err: err, entity: entity});
			})
		},
		function (err, results) {
			expect(err).toBe(null);
			expect(results[0].err).toBe(null);
			expect(results[1].err.message).toEqual('bad id');
			expect(results[2].err.message).toEqual('server down');
			expect(results[0].entity.length).toEqual(3);
			expect(results[1].entity).toBe(null);
			expect(results[2].entity).toBe(null);
			done();
		});
});

it("should handle assocs", function (done) {
	var ids = [ 
		10, 11, 12
	];

	async.map(ids,
		function (id, cb) {
			rest.assoc('video/addAuthor', { video: id }, function (err, entity) {
				cb(null, {err: err, entity: entity});
			})
		},
		function (err, results) {
			expect(err).toBe(null);
			expect(results[0].err).toBe(null);
			expect(results[1].err.message).toEqual('bad id');
			expect(results[2].err.message).toEqual('server down');
			expect(results[0].entity.message).toEqual('ok');
			expect(results[1].entity).toBe(null);
			expect(results[2].entity).toBe(null);
			done();
		});
});

});