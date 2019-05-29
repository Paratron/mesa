const SimpleStore = require('./SimpleStore');

let collections = {};

const api = {
	/**
	 * This defines the store type. Can be accessed by other
	 * parts of the system.
	 */
	type: 'simple',
	/**
	 * This defines the store interface type. Auto-generated
	 * procedures only can interact with the simple interface.
	 */
	interface: 'simple',

	/**
	 * Will be called upon system startup.
	 * @param {object} [declarations]
	 * @param {function} log
	 */
	initialize: async ({declarations, log}) => {
		await Object
			.entries(declarations)
			.forEach(
				([name, declaration]) => {

					log(`Creating collection ´b${name} ´m[${Object.keys(declaration.fields).join(', ')}]´w`);
					api.createCollection(
						name,
						declaration.fields,
						declaration.defaults,
						declaration.storeOptions || {}
					);
				}
			);
	},
	/**
	 * Will be called on system shutdown.
	 * @param {object} [declarations]
	 */
	terminate: ({declarations}) => {

	},

	/**
	 * Will create a new collection to store
	 * objects in.
	 * @param {string} collectionName
	 * @param {object} fields
	 * @param {object} defaults
	 * @param {object} [config]
	 */
	createCollection: async (collectionName, fields, defaults, config = {}) => {
		if (collections[collectionName]) {
			throw new Error(`Collection ${collectionName} already exists`);
		}

		config.index = config.index || [];
		config.groups = config.groups || [];

		Object.entries(fields).forEach(([key, typeDef]) => {
			const [, optionString] = typeDef.split('|');
			const options = optionString
				? optionString.split(',').reduce((obj, key) => (obj[key] = true, obj), {})
				: {};

			if(options.unique){
				config.index.push(key);
			}

			if(options.group){
				config.groups.push(key);
			}
		});

		const collection = new SimpleStore(config);
		collection.fields = fields;
		collection.defaults = defaults;

		collections[collectionName] = collection;
		await collection.initialize(config.backup);
	},

	/**
	 * Will return one object from a collection
	 * @param {string} collection
	 * @param {string} id
	 * @return {object|null}
	 */
	getOne: (collection, id) => collections[collection].get(id),

	/**
	 * Just like getOne(), but it does not select an entity by id but by
	 * a predefined index column.
	 * @param {string} collection
	 * @param {string} indexName
	 * @param {*} indexValue
	 * @returns {*}
	 */
	getByIndex: (collection, indexName, indexValue) => collections[collection].getByIndex(indexName, indexValue),

	/**
	 * Will return a list of objects from a collection.
	 * @param {string} collection
	 * @param {function} filter
	 * @return {array}
	 */
	getMany: (collection, filter) => {

	},

	add: (collection, data) => collections[collection].add(data),

	/**
	 * Will update an object in the collection.
	 * Returns the updated object.
	 * @param {string}collection
	 * @param {object} data
	 * @param {boolean} [merge=true] Should the new data be merged with the old?
	 * @return {object}
	 */
	update: (collection, data, merge = true) => collections[collection].update(data.id, data, !merge),

	/**
	 * Will remove an object from the collection.
	 * @param {string} collection
	 * @param {string} id
	 */
	remove: (collection, id) => collections[collection].remove(id),

	validate: (collection, data) => {

	}
};

module.exports = api;
