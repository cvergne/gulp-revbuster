import path from 'path';
import test from 'ava';
import pEvent from 'p-event';
import revbuster from '..';
import createFile from './helpers';

test('revs files', async t => {
	const stream = revbuster();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'unicorn.css'
	}));

	const file = await data;
	t.is(file.revHash, 'd41d8cd98f');
});

test.cb('handles sourcemaps transparently', t => {
	const stream = revbuster();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, path.normalize('maps/pastissada-d41d8cd98f.css.map'));
			t.end();
		}
	});

	stream.write(createFile({
		path: 'pastissada.css'
	}));

	stream.end(createFile({
		path: 'maps/pastissada.css.map',
		contents: JSON.stringify({file: 'pastissada.css'})
	}));
});

test.cb('handles unparseable sourcemaps correctly', t => {
	const stream = revbuster();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, 'pastissada-d41d8cd98f.css.map');
			t.end();
		}
	});

	stream.write(createFile({
		path: 'pastissada.css'
	}));

	stream.end(createFile({
		path: 'pastissada.css.map',
		contents: 'Wait a minute, this is invalid JSON!'
	}));
});

test.cb('okay when the optional sourcemap.file is not defined', t => {
	const stream = revbuster();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			t.is(file.path, 'pastissada-d41d8cd98f.css.map');
			t.end();
		}
	});

	stream.write(createFile({
		path: 'pastissada.css'
	}));

	stream.end(createFile({
		path: 'pastissada.css.map',
		contents: JSON.stringify({})
	}));
});

test('handles a `.` in the folder name', async t => {
	const stream = revbuster();
	const data = pEvent(stream, 'data');

	stream.end(createFile({
		path: 'mysite.io/unicorn.css'
	}));

	const file = await data;
	t.is(file.revHash, 'd41d8cd98f');
});
