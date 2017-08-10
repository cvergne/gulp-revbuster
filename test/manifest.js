import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import revbuster from '..';
import createFile from './helpers';

const manifestFixture = './helpers/test.manifest-fixture.json';
const manifestFixturePath = path.join(__dirname, manifestFixture);
const manifestFixtureRelative = path.join('test', manifestFixture);

test('builds a rev manifest file', async t => {
	const stream = revbuster.manifest();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css',
		revHash: 'd41d8cd98f'
	}));

	const file = await data;
	t.is(file.relative, 'revbuster-manifest.json');
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{'unicorn.css': 'd41d8cd98f'}
	);
});

test('allows naming the manifest file', async t => {
	const path = 'manifest.json';
	const stream = revbuster.manifest({path});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css',
		revHash: 'd41d8cd98f'
	}));

	const file = await data;
	t.is(file.relative, path);
});

test('appends to an existing rev manifest file', async t => {
	const stream = revbuster.manifest({
		path: manifestFixturePath,
		merge: true
	});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css',
		revHash: 'd41d8cd98f'
	}));

	const file = await data;
	t.is(file.relative, manifestFixtureRelative);
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{
			'app.js': 'a41d8cd1',
			'unicorn.css': 'd41d8cd98f'
		}
	);
});

test('does not append to an existing rev manifest by default', async t => {
	const stream = revbuster.manifest({path: manifestFixturePath});
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css',
		revHash: 'd41d8cd98f'
	}));

	const file = await data;
	t.is(file.relative, manifestFixtureRelative);
	t.deepEqual(
		JSON.parse(file.contents.toString()),
		{'unicorn.css': 'd41d8cd98f'}
	);
});

test('sorts the rev manifest keys', async t => {
	const stream = revbuster.manifest({
		path: manifestFixturePath,
		merge: true
	});
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		path: 'unicorn.css',
		revHash: 'd41d8cd98f'
	}));
	stream.end(createFile({
		path: 'pony.css',
		revHash: 'd41d8cd98f'
	}));

	const file = await data;
	t.deepEqual(
		Object.keys(JSON.parse(file.contents.toString())),
		['app.js', 'pony.css', 'unicorn.css']
	);
});

test('respects directories', async t => {
	const stream = revbuster.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'foo', 'unicorn.css'),
		revOrigBase: __dirname,
		origName: 'unicorn.css',
		revHash: 'd41d8cd98f'
	}));
	stream.end(createFile({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'bar', 'pony.css'),
		revOrigBase: __dirname,
		origName: 'pony.css',
		revHash: 'd41d8cd98f'
	}));

	const MANIFEST = {};
	MANIFEST['foo/unicorn.css'] = 'd41d8cd98f';
	MANIFEST['bar/pony.css'] = 'd41d8cd98f';

	const file = await data;
	t.is(file.relative, 'revbuster-manifest.json');
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});

test('respects files coming from directories with different bases', async t => {
	const stream = revbuster.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'foo', 'scriptfoo.js'),
		contents: Buffer.from(''),
		revOrigBase: path.join(__dirname, 'vendor1'),
		origName: 'scriptfoo.js',
		revHash: 'd41d8cd98f'
	}));
	stream.end(createFile({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'bar', 'scriptbar.js'),
		revOrigBase: path.join(__dirname, 'vendor2'),
		origName: 'scriptfoo.js',
		revHash: 'd41d8cd98f'
	}));

	const MANIFEST = {};
	MANIFEST['foo/scriptfoo.js'] = 'd41d8cd98f';
	MANIFEST['bar/scriptbar.js'] = 'd41d8cd98f';

	const file = await data;
	t.is(file.relative, 'revbuster-manifest.json');
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});

test('uses correct base path for each file', async t => {
	const stream = revbuster.manifest();
	const data = pEvent(stream, 'data');

	stream.write(createFile({
		cwd: 'app/',
		base: 'app/',
		path: path.join('app', 'foo', 'scriptfoo.js'),
		revHash: 'd41d8cd98f'
	}));
	stream.end(createFile({
		cwd: 'assets/',
		base: 'assets/',
		path: path.join('assets', 'bar', 'scriptbar.js'),
		revHash: 'd41d8cd98f'
	}));

	const MANIFEST = {};
	MANIFEST['foo/scriptfoo.js'] = 'd41d8cd98f';
	MANIFEST['bar/scriptbar.js'] = 'd41d8cd98f';

	const file = await data;
	t.deepEqual(JSON.parse(file.contents.toString()), MANIFEST);
});
