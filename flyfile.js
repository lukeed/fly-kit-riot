'use strict';

const bs = require('browser-sync');

let isWatch = 0;

const tar = 'dist';
const rel = 'release';
const node = 'node_modules';

const src = {
	js: 'src/scripts/**/*.js',
	css: 'src/styles/**/*.*',
	tag: 'src/tags/**/*.*',
	copy: [
		'src/static/**/*.*',
		'src/*.html'
	],
	vendor: [
		`${node}/riot/riot.min.js`
	]
};

export async function clean(fly) {
	await fly.clear([tar, rel]);
}

export async function copies(fly, o) {
	await fly.source(o.src || src.copy).target(tar);
}

export async function scripts(fly, o) {
	await fly.source(o.src || src.js).xo().browserify({
		entries: 'src/scripts/app.js'
	}).target(`${tar}/js`);
}

export async function vendors(fly) {
	await fly.source(src.vendor).concat('vendor.js').target(`${tar}/js`);
}

export async function styles(fly) {
	await fly.source('src/styles/app.sass').sass({
		includePaths: [`${node}/md-colors/src`],
		outputStyle: 'compressed'
	}).autoprefixer().target(`${tar}/css`);
}

export async function tags(fly, o) {
	await fly.source(o.src || src.tag).riot().concat({
		base: 'src/tags',
		output: 'views.js'
	}).target(`${tar}/js`);
}

export async function build(fly) {
	await fly.start('clean').parallel(['tags', 'copies', 'vendors', 'scripts', 'styles']);
}

export async function release(fly) {
	// minify html
	await fly.source(`${tar}/*.html`).htmlmin().target(tar);
	// minify js
	await fly.source(`${tar}/js/*`).uglify({ compress:true }).target(`${tar}/js`);
	// version assets
	await fly.source(`${tar}/**/*`).rev().revManifest({ dest:rel, trim:tar }).revReplace().target(rel);
	// remove 'dist' dir; redundant
	await fly.clear(tar);
}

export async function watch(fly) {
	isWatch = 1;
	await fly.watch(src.js, ['scripts', 'reload']);
	await fly.watch(src.css, ['styles', 'reload']);
	await fly.watch(src.copy, ['copies', 'reload']);
	await fly.watch(src.tag, ['tags', 'reload']);
	// start server
	bs({
		server: tar,
		logPrefix: 'Fly',
		port: process.env.PORT || 3000,
		middleware: [
			require('connect-history-api-fallback')()
		]
	});
}

export async function reload() {
	isWatch && bs.reload();
}
