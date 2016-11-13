'use strict';

const bs = require('browser-sync');
const reload = () => isWatch && isServer && bs.reload();

let isWatch = 0;
let isServer = 0;

const tar = 'dist';
const rel = 'release';
const node = 'node_modules';
const bower = 'bower_components';

const src = {
  copy: 'src/*.{html,json}',
  css: 'src/styles/**/*.sass',
  js: 'src/scripts/**/*.js',
  img: 'src/images/**/*.{jpg,png,gif},
  tag: 'src/tags/*.tag',
  vendor: [
	  `${node}/riot/riot.min.js`
  ]
};

export default async function () {
  isWatch = 1;
  await this.clear([tar, rel]);
  await this.watch(src.js, 'scripts');
  await this.watch(src.vendor, 'vendor');
  await this.watch(src.copy, 'copies');
  await this.watch(src.img, 'images');
  await this.watch(src.css, 'styles');
  await this.watch(src.tag, 'tags');
  await this.start('serve');
}

export async function build() {
  await this.clear([tar, rel]);
	await this.serial(['copies', 'tags', 'images', 'vendor', 'scripts', 'styles', 'uglify']);
}

export async function release() {
	await this.start('build');
	await this.source(`${tar}/**/*`)
		.rev({ignores: ['.html', '.png', 'jpg', '.jpeg', '.svg', '.gif']})
		.revManifest({dest: rel, trim: tar}).revReplace().target(rel);
}

export async function scripts(o) {
  await this.source(o.src || src.js).xo().browserify({
    entries: 'src/scripts/app.js'
  }).target(`${tar}/js`);
  reload();
}

export async function vendor() {
  await this.source(src.vendor).concat('vendor.js').target(`${tar}/js`);
  reload();
}

export async function copies(o) {
  await this.source(o.src || src.copy).target(tar);
  reload();
}

export async function images(o) {
	await this.source(o.src || src.img).target(`${tar}/img`);
  reload();
}

export async function styles() {
  await this.source('src/styles/app.sass').sass({
    outputStyle: 'compressed',
    includePaths: [bower]
  }).autoprefixer().target(`${tar}/css`);
  reload();
}

export async function tags() {
  await this.source(src.tag).riot().concat({
  	output: 'views.js',
  	base: 'src/tags'
  }).target(`${tar}/js`);
  reload();
}

export async function uglify() {
  await this.source(`${tar}/js/*.js`).uglify({
    compress: {
      conditionals: 1,
      drop_console: 1,
      comparisons: 1,
      join_vars: 1,
      booleans: 1,
      loops: 1
    }
  }).target(`${tar}/js`);
}

export async function serve() {
  isServer = 1;
  bs({server: tar});
};
