var logging = require('./logging');
var RestMapper = require('../lib/rest-mapper');

/**
 * Test suite for rest-mapper module
 *
 * @author Ricardo Massa
 */

describe("rest-mapper module test suite", function () {

it("should map insert methods", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			insert: {
				'media/video': {},
				'media/audio': { method: 'PUT' }	// overriding default (POST)
			}	
		});

	var reqOpts = {
		video: mapper.translateInsert('media/video', { ext: 'mov' }),
		audio: mapper.translateInsert('media/audio', { ext: 'wav' }),
	}
	expect(reqOpts.video.url).toBe('http://foo.sub.com/rest/v1/media/video');
	expect(reqOpts.audio.url).toBe('http://foo.sub.com/rest/v1/media/audio');
	expect(reqOpts.video.method).toBe('POST');
	expect(reqOpts.audio.method).toBe('PUT');
	expect(reqOpts.video.body).toBe('{"ext":"mov"}');
	expect(reqOpts.audio.body).toBe('{"ext":"wav"}');
});

it("should map update methods", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			update: {
				'media/video': {},
				'media/image': { append: null },	// overriding default (id)
				'media/text': { append: 'name' },	// overriding default (id)
				'media/audio': { method: 'POST' }	// overriding default (PUT)
			}	
		});

	var reqOpts = {
		video: mapper.translateUpdate('media/video', { id: 12, ext: 'mov' }),
		image: mapper.translateUpdate('media/image', { id: 13, ext: 'jpg' }),
		text: mapper.translateUpdate('media/text', { id: 17, ext: 'rtf', name: 'music' }),
		audio: mapper.translateUpdate('media/audio', { id: 45, ext: 'wav' }),
	}
	expect(reqOpts.video.url).toBe('http://foo.sub.com/rest/v1/media/video/12');
	expect(reqOpts.image.url).toBe('http://foo.sub.com/rest/v1/media/image');
	expect(reqOpts.text.url).toBe('http://foo.sub.com/rest/v1/media/text/music');
	expect(reqOpts.audio.url).toBe('http://foo.sub.com/rest/v1/media/audio/45');
	expect(reqOpts.video.method).toBe('PUT');
	expect(reqOpts.image.method).toBe('PUT');
	expect(reqOpts.text.method).toBe('PUT');
	expect(reqOpts.audio.method).toBe('POST');
	expect(reqOpts.video.body).toBe('{"id":12,"ext":"mov"}');
	expect(reqOpts.image.body).toBe('{"id":13,"ext":"jpg"}');
	expect(reqOpts.text.body).toBe('{"id":17,"ext":"rtf","name":"music"}');
	expect(reqOpts.audio.body).toBe('{"id":45,"ext":"wav"}');
});

it("should map delete methods", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			'delete': {
				'media/video': {},
				'media/image': { append: null },	// overriding default (id)
				'media/text': { append: 'name' },	// overriding default (id)
				'media/audio': { method: 'POST' }	// overriding default (PUT)
			}	
		});

	var reqOpts = {
		video: mapper.translateDelete('media/video', { id: 12 }),
		image: mapper.translateDelete('media/image', { id: 13 }),
		text: mapper.translateDelete('media/text', { id: 17, ext: 'rtf', name: 'music' }),
		audio: mapper.translateDelete('media/audio', { id: 45, ext: 'wav' }),
	}
	expect(reqOpts.video.url).toBe('http://foo.sub.com/rest/v1/media/video/12');
	expect(reqOpts.image.url).toBe('http://foo.sub.com/rest/v1/media/image');
	expect(reqOpts.text.url).toBe('http://foo.sub.com/rest/v1/media/text/music');
	expect(reqOpts.audio.url).toBe('http://foo.sub.com/rest/v1/media/audio/45');
	expect(reqOpts.video.method).toBe('DELETE');
	expect(reqOpts.image.method).toBe('DELETE');
	expect(reqOpts.text.method).toBe('DELETE');
	expect(reqOpts.audio.method).toBe('POST');
	expect(reqOpts.video.body).not.toBeDefined();
	expect(reqOpts.image.body).not.toBeDefined();
	expect(reqOpts.text.body).not.toBeDefined();
	expect(reqOpts.audio.body).not.toBeDefined();
});

it("should map get methods", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			get: {
				'media/video': {},
				'media/image': { append: null },	// overriding default (id)
				'media/text': { append: 'name' },	// overriding default (id)

				// inserting text property in the middle of string
				'media/text/words': { insert: 'text' },	
				'media/text/images': { insert: 'text', append: null },	
				'media/text/titles': { insert: 'text', append: 'name' },	

				'media/audio': { method: 'HEAD' }	// overriding default (GET)
			}	
		});

	var reqOpts = {
		video: mapper.translateGet('media/video', { id: 12 }),
		image: mapper.translateGet('media/image', { id: 13, ext: 'jpg' }),
		text: mapper.translateGet('media/text', { id: 17, text: '10', name: 'music' }),
		'text/words': mapper.translateGet('media/text/words', { id: 17, text: '10', name: 'music' }),
		'text/images': mapper.translateGet('media/text/images', { id: 17, text: '10', name: 'music' }),
		'text/titles': mapper.translateGet('media/text/titles', { id: 17, text: '10', name: 'music' }),
		audio: mapper.translateGet('media/audio', { id: 45, ext: 'wav' }),
	}
	expect(reqOpts.video.url).toBe('http://foo.sub.com/rest/v1/media/video/12');
	expect(reqOpts.image.url).toBe('http://foo.sub.com/rest/v1/media/image');
	expect(reqOpts.text.url).toBe('http://foo.sub.com/rest/v1/media/text/music');
	expect(reqOpts['text/words'].url).toBe('http://foo.sub.com/rest/v1/media/text/10/words/17');
	expect(reqOpts['text/images'].url).toBe('http://foo.sub.com/rest/v1/media/text/10/images');
	expect(reqOpts['text/titles'].url).toBe('http://foo.sub.com/rest/v1/media/text/10/titles/music');
	expect(reqOpts.audio.url).toBe('http://foo.sub.com/rest/v1/media/audio/45');
	expect(reqOpts.video.method).toBe('GET');
	expect(reqOpts.image.method).toBe('GET');
	expect(reqOpts.text.method).toBe('GET');
	expect(reqOpts['text/words'].method).toBe('GET');
	expect(reqOpts['text/images'].method).toBe('GET');
	expect(reqOpts['text/titles'].method).toBe('GET');
	expect(reqOpts.audio.method).toBe('HEAD');
	expect(reqOpts.video.body).not.toBeDefined();
	expect(reqOpts.image.body).not.toBeDefined();
	expect(reqOpts.text.body).not.toBeDefined();
	expect(reqOpts['text/words'].body).not.toBeDefined();
	expect(reqOpts['text/images'].body).not.toBeDefined();
	expect(reqOpts['text/titles'].body).not.toBeDefined();
	expect(reqOpts.audio.body).not.toBeDefined();
});

it("should map list methods", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			list: {
				'media/video': {},

				// inserting text property in the middle of string
				'media/text/words': { insert: 'text' },	
				'media/audio': { method: 'HEAD' }	// overriding default (GET)
			}	
		});

	var reqOpts = {
		video: mapper.translateList('media/video', { id: 12 }),
		'text/words': mapper.translateList('media/text/words', { id: 17, text: '10', name: 'music' }),
		audio: mapper.translateList('media/audio', { id: 45, ext: 'wav' }),
	}
	expect(reqOpts.video.url).toBe('http://foo.sub.com/rest/v1/media/video');
	expect(reqOpts['text/words'].url).toBe('http://foo.sub.com/rest/v1/media/text/10/words');
	expect(reqOpts.audio.url).toBe('http://foo.sub.com/rest/v1/media/audio');
	expect(reqOpts.video.method).toBe('GET');
	expect(reqOpts['text/words'].method).toBe('GET');
	expect(reqOpts.audio.method).toBe('HEAD');
	expect(reqOpts.video.body).not.toBeDefined();
	expect(reqOpts['text/words'].body).not.toBeDefined();
	expect(reqOpts.audio.body).not.toBeDefined();
});

it("should map assoc methods", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			assoc: {
				'audio/addAuthor': { insert: 'audio', data: 'authors' },
				'audio/removeAuthor': { insert: 'audio', data: null },
			}	
		});

	var reqOpts = {
		add: mapper.translateAssoc('audio/addAuthor', { audio: 12, authors: [10, 11, 12] }),
		remove: mapper.translateAssoc('audio/removeAuthor', { audio: 13, authors: [10, 11, 12] }),
	}
	expect(reqOpts.add.url).toBe('http://foo.sub.com/rest/v1/audio/12/addAuthor');
	expect(reqOpts.remove.url).toBe('http://foo.sub.com/rest/v1/audio/13/removeAuthor');
	expect(reqOpts.add.method).toBe('POST');
	expect(reqOpts.remove.method).toBe('POST');
	expect(reqOpts.add.body).toBe('[10,11,12]');
	expect(reqOpts.remove.body).toBe(null);
});

it("should normalized trailing slashes", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1///',
		{
			insert: { 'media/video': {} },
			update: { 'media/video': {} },
			'delete': { 'media/video': {} },
			get: { 'media/video': {} },
			list: { 'media/video': {} },
			assoc: { 'media/video': { insert: 'media' } },
		});

	var reqOpts = {
		insert: mapper.translateInsert('media/video', {}),
		update: mapper.translateUpdate('media/video', { id: 10 }),
		'delete': mapper.translateDelete('media/video', { id: 12 }),
		get: mapper.translateGet('media/video', { id: 30 }),
		list: mapper.translateList('media/video', {}),
		assoc: mapper.translateAssoc('media/video', { media: 10 })
	}
	expect(reqOpts.insert.url).toBe('http://foo.sub.com/rest/v1/media/video');
	expect(reqOpts.update.url).toBe('http://foo.sub.com/rest/v1/media/video/10');
	expect(reqOpts['delete'].url).toBe('http://foo.sub.com/rest/v1/media/video/12');
	expect(reqOpts.get.url).toBe('http://foo.sub.com/rest/v1/media/video/30');
	expect(reqOpts.list.url).toBe('http://foo.sub.com/rest/v1/media/video');
	expect(reqOpts.assoc.url).toBe('http://foo.sub.com/rest/v1/media/10/video');
});

it("should return null for non-existent mappings", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1///',
		{
			insert: { 'media/video': {} },
			update: { 'media/video': {} },
			'delete': { 'media/video': {} },
			get: { 'media/video': {} },
			list: { 'media/video': {} },
			assoc: { 'media/video': { insert: 'media' } },
		});

	var reqOpts = {
		insert: mapper.translateInsert('media/audio', {}),
		update: mapper.translateUpdate('media/audio', { id: 10 }),
		'delete': mapper.translateDelete('media/audio', { id: 12 }),
		get: mapper.translateGet('media/audio', { id: 30 }),
		list: mapper.translateList('media/audio', {}),
		assoc: mapper.translateAssoc('media/audio', { media: 10 })
	}
	expect(reqOpts.insert).toBe(null);
	expect(reqOpts.update).toBe(null);
	expect(reqOpts['delete']).toBe(null);
	expect(reqOpts.get).toBe(null);
	expect(reqOpts.list).toBe(null);
	expect(reqOpts.assoc).toBe(null);
});

it("should rewrite and translate url's", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			insert: {
				'media/video': {rewriteUrl: '/teste/$productId/teste2/'}
			},
			update: {
				'media/blog': { rewriteUrl: 'media/product/$productId/blog' }
			},
			delete: {
				'media/mediacategory': 	{ rewriteUrl: 'media/product/$productId/mediacategory', append: null }
			},
			get: {
				'media/blog': { rewriteUrl: 'media/product/$productId/blog', append: null }
			},
			list: {
				'profile/blogs': { rewriteUrl: 'profile/media/product/$productId/blog' },
			},
			assoc: {
				'profile/media/followBlog': { rewriteUrl: 'profile/media/product/$productId/followBlog' },
			}
		},
		{
			productId: 2
		});

	var reqOpts = {
		insert: mapper.translateInsert('media/video', { ext: 'mov' }),
		update: mapper.translateUpdate('media/blog', { ext: 'wav', id: 1 }),
		delete: mapper.translateDelete('media/mediacategory', { id: 12 }),
		get: mapper.translateGet('media/blog', { id: 12 }),
		list: mapper.translateList('profile/blogs', { id: 12 }),
		assoc: mapper.translateAssoc('profile/media/followBlog', { })
	}

	expect(reqOpts.insert.url).toBe('http://foo.sub.com/rest/v1/teste/2/teste2/');
	expect(reqOpts.update.url).toBe('http://foo.sub.com/rest/v1/media/product/2/blog/1');
	expect(reqOpts.delete.url).toBe('http://foo.sub.com/rest/v1/media/product/2/mediacategory');
	expect(reqOpts.get.url).toBe('http://foo.sub.com/rest/v1/media/product/2/blog');
	expect(reqOpts.list.url).toBe('http://foo.sub.com/rest/v1/profile/media/product/2/blog');
	expect(reqOpts.assoc.url).toBe('http://foo.sub.com/rest/v1/profile/media/product/2/followBlog');
});

it("should rewrite url's", function () {
	var mapper = new RestMapper('http://foo.sub.com/rest/v1',
		{
			insert: {
				'media/video': {rewriteUrl: '/teste/teste2/'}
			},
			update: {
				'media/blog': { rewriteUrl: 'media/product/blog' }
			},
			delete: {
				'media/mediacategory': 	{ rewriteUrl: 'media/product/mediacategory' }
			},
			get: {
				'media/blog': { rewriteUrl: 'media/product/blog' }
			},
			list: {
				'profile/blogs': { rewriteUrl: 'profile/media/product/blog' },
			},
			assoc: {
				'profile/media/followBlog': { rewriteUrl: 'profile/media/product/followBlog' },
			}
		},
		{
			productId: 2
		});

	var reqOpts = {
		insert: mapper.translateInsert('media/video', { ext: 'mov' }),
		update: mapper.translateUpdate('media/blog', { ext: 'wav', id: 1 }),
		delete: mapper.translateDelete('media/mediacategory', { id: 12 }),
		get: mapper.translateGet('media/blog', { id: 12 }),
		list: mapper.translateList('profile/blogs', { id: 12 }),
		assoc: mapper.translateAssoc('profile/media/followBlog', { })
	}

	expect(reqOpts.insert.url).toBe('http://foo.sub.com/rest/v1/teste/teste2/');
	expect(reqOpts.update.url).toBe('http://foo.sub.com/rest/v1/media/product/blog/1');
	expect(reqOpts.delete.url).toBe('http://foo.sub.com/rest/v1/media/product/mediacategory/12');
	expect(reqOpts.get.url).toBe('http://foo.sub.com/rest/v1/media/product/blog/12');
	expect(reqOpts.list.url).toBe('http://foo.sub.com/rest/v1/profile/media/product/blog');
	expect(reqOpts.assoc.url).toBe('http://foo.sub.com/rest/v1/profile/media/product/followBlog');
});

});