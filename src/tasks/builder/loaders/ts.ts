import { gray, yellow } from 'chalk';
import * as webpack from 'webpack';
import * as WebpackSystemRegister from 'webpack-system-register';
import { exec } from 'child_process';
import { statSync, exists, existsSync } from 'fs';
import { join, resolve, isAbsolute } from 'path';
import { database } from '../../../db';
import { Collection } from 'mongodb';

import { Loader } from '../types';

export const ts: Loader = {
	test: {
		main: /\.tsx?$/
	},
	transform: async (foil) => {
		console.log('💙 TypeScript Transformer\n');
		// Get file path
		let file = foil.main;
		if (!isAbsolute(foil.main)) {
			file = join(foil.rootPath, foil.main);
		}
		file.replace(/\\/g, '/');
		let newFile = file.replace(/\.tsx?$/, '.js').replace(/\\/g, '/');
		let newMain = join(foil.rootPermalink, foil.main).replace(/\.tsx?$/, '.js').replace(/\\/g, '/');
		// Check if main file has been updated or never existed.
		let updated = checkUpdated(newFile);

		if (updated) {
			let { dependencies, devDependencies } = require(join(foil.rootPath, 'package.json'));
			if (dependencies || devDependencies) {
				// Update dependencies through `npm i`
				await installDependencies(foil.rootPath);
			}
			// Compile module with Webpack
			await compile(join(newFile, '..'), './main', foil.title, foil.rootPermalink);

			// Update in Database
			await updateInDatabase(newFile, newMain, file);

			//TODO: build foil.files array with all files resolved by webpack...

			let newFoil = {
				...foil,
				main: newMain
			};

			return newFoil;
		} else return foil;
	}
};

/**
 * Checks the database to see if the file exists or has been updated.
 * If it doesn't exist, or its been updated, return true.
 * @param path The absolute path to the file.
 */
async function checkUpdated(path: string) {
	return await database.then(async (client) => {
		let db = client.db('db');
		// Check redirect collection to see if file at path exists.
		let collection = db.collection('redirect');

		let foundItems = await collection
			.find({
				to: path
			})
			.limit(1)
			.toArray();

		if (typeof foundItems !== 'object' || foundItems.length < 1) return true;
		else {
			// Compare dates
			if (!existsSync(path)) {
				return true;
			}
			var { mtime } = statSync(path);
			return mtime.getDate() === new Date(foundItems[0].dateModified).getDate();
		}
	});
}

/**
 * Downloads dependencies with yarn. 
 * @param path absolute path to folder of JavaScript file.
 */
function installDependencies(path: string) {
	// Run yarn, install local node_modules
	return new Promise((res, rej) => {
		exec('yarn', { cwd: path }, (err, stdout, _) => {
			console.log('Installing dependencies at %s', path);
			if (err) rej(err);
			else res(stdout);
		});
	});
}

/**
 * Compile foil module with Webpack.
 */
function compile(root: string, main: string, title: string, permalink: string) {

	let config: webpack.Configuration = {
		context: resolve(root),
		entry: {
			main
		},
		output: {
			path: resolve(root),
			filename: 'main.js'
		},
		resolve: {
			extensions: [ '.ts', '.tsx', '.js' ],
			modules: [ root, join(root, 'node_modules'), 'node_modules', join(__dirname, '../../../../node_modules') ]
		},
		resolveLoader: {
			modules: [root, join(root, 'node_modules'), 'node_modules', join(__dirname, '../../../../node_modules') ]
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'ts-loader',
					exclude: /node_modules/,
					options: {
						transpileOnly: true,
						compilerOptions: {
							module: 'es2015'
						}
					}
				},
				{
					test: /\.wasm$/,
					loaders: [
						{
							loader: 'file-loader',
							options: {
								name: '[name].[ext]',
								publicPath: permalink
							}
						}
					]
				}
			]
		},
		plugins: [
			new WebpackSystemRegister({
				systemjsDeps: [
					'react',
					'react-dom',
					'react-router',
					'react-router-dom',
					'react-redux',
					'redux-thunk',
					'redux',
					'main'
				]
			}),
			new webpack.optimize.UglifyJsPlugin(),
			new webpack.DefinePlugin({
				'process.env': {
					NODE_ENV: JSON.stringify('production')
				}
			}),
			new webpack.optimize.OccurrenceOrderPlugin(true)
		]
	};

	console.log(`  🔨 Building Module '${title}'\n  ... `);

	var compiler: webpack.Compiler = webpack(config);

	//TODO: get imports resolved by webpack, put them in foilfolio post

	return new Promise<any>((res, rej) =>
		compiler.run((err, stats) => {
			if (err) rej(err);
			else res(stats);
		})
	)
		.then((stats: webpack.Stats) => {
			if (stats.compilation.errors.length > 0) {
				console.log(
					yellow(
						`Build Succeeded with ${stats.compilation.errors.length} errors.\n` +
							stats.compilation.errors.reduce((prev, cur) => prev + cur + '\n', '\n')
					)
				);
			}
			console.log('  Done in %s ms!\n', +stats.endTime - +stats.startTime);
		})
		.catch((err) => console.error(err));
}

/**
 * Updates the file in the database.
 * @param file absolute file path of module.
 * @param path website path.
 */
function updateInDatabase(file: string, permalink: string, oldFile: string) {
	//index them according to their folder name.
	return database.then((client) => {
		let db = client.db('db');
		var filesCollection: Collection = db.collection('redirect');

		let query = {
			from: permalink
		};

		let update = {
			from: permalink,
			to: file,
			dateModified: statSync(oldFile).mtime
		};

		let options = {
			upsert: true
		};

		filesCollection.updateOne(query, { $set: update }, options);

		console.log(gray(`    Indexing Build: \n    file: ${file}\n    permalink: ${permalink}\n`));
	});
}
