const fs = require('fs');
const path = require('path');

/**
 * A simple storage helper - kind of like a very basic database.
 *
 * Make sure to call `initialize()` after object creation.
 * @param {object} options
 * @param {array} [options.index] Define index keys to have unique values and fast selection through `getByIndex(index, value)`.
 * @param {array} [options.groups] Define groups to query all items with a given value in the key through `getByGroup(groupName, value)`
 * @param {string} [options.backup] Pass a filename here, to save data to and initialize from. Does not need to exist, only needs write access.
 */
class SimpleStore {
	constructor(options = {}) {
		/**
		 * This finally creates your indexes, groups and restores data
		 * from the backup file (if existent)
		 * @returns {Promise<any>}
		 */
		this.initialize = (doBackup = true) => new Promise((resolve) => {
			this.elements = {};
			this.subscribers = {};
			this.autoId = 1;
			this.indexes = {};
			this.indexList = [];
			this.groups = {};
			this.groupList = [];

			if (options.index) {
				options.index.forEach(index => {
					this.indexes[index] = {};
					this.indexList.push(index);
				});
			}

			if (options.groups) {
				options.groups.forEach(groupName => {
					this.groups[groupName] = {};
					this.groupList.push(groupName);
				});
			}

			if (options.backup && doBackup) {
				const backupFile = path.resolve(options.backup + '.json');

				console.log(`SimpleStore backup file ${backupFile} used.`);

				fs.readFile(backupFile, 'utf8', (err, data) => {
					if (!err) {
						try {
							const backupData = JSON.parse(data);
							this.bootstrap(backupData);
							console.log(`${backupData.length} records loaded from ${backupFile}.`);
							resolve();
						} catch (e) {
							throw e;
						}
					}

					let wait = false;
					this.on('*', () => {
						if (wait) {
							return;
						}

						wait = true;
						setTimeout(() => {
							fs.writeFile(backupFile, JSON.stringify(Object.values(this.elements)), (err) => {
								if (err) throw err;
								wait = false;
							});
						}, 5000);
					});
				});
			}
		});
	}

	/**
	 * Will add several items to the element collection, will also
	 * index and group them. This is used by `initialize()` to load
	 * backup data.
	 * @param {array} inputArray
	 */
	bootstrap(inputArray) {
		this.indexList.forEach(key => this.indexes[key] = {});

		inputArray.forEach(element => {
			this.elements[element.id] = element;
			this.indexList.forEach(key => {
				this.indexes[key][element[key]] = element.id;
			});
			this.groupList.forEach(key => {
				const subKey = element[key];
				if (!subKey) {
					return;
				}
				this.groups[key][subKey] = this.groups[key][subKey] || [];

				this.groups[key][subKey].push(element.id);
			});
			const numericId = parseInt(element.id, 10);
			if (numericId) {
				this.autoId = numericId + 1;
			}
		});
	}

	/**
	 * Adds a new item to the collection. If you omit an `id` property
	 * on the object, and `autoId = true`, the id will be generated.
	 * The object is automatically added to any indexes and groups.
	 * @param {object} inObject The object to be added to the collection.
	 * @param {boolean} [autoId=true]
	 * @throws On invalid id or if object already exists in any index.
	 * @event add(newObject) The new object will be forwarded to listeners
	 */
	add(inObject, autoId = true) {
		let {
			id
		} = inObject;

		if (!id) {
			if (!autoId) {
				throw new Error('Invalid id');
			}

			id = `${this.autoId}`;
			inObject.id = id;
			this.autoId += 1;
		}

		if (this.elements[id]) {
			throw new Error(`There is already an object with id ${id}`);
		}

		this.elements[id] = inObject;

		this.indexList.forEach(index => {
			const objectIndexValue = inObject[index];

			if (objectIndexValue) {
				const currentIndexValue = this.indexes[index][objectIndexValue];

				if (currentIndexValue && this.indexes[index][currentIndexValue] !== id) {
					throw new Error(`There is already and object with ${index} value "${objectIndexValue}"`);
				}

				this.indexes[index][objectIndexValue] = id;
			}
		});

		this.groupList.forEach(key => {
			const subKey = inObject[key];
			if (!subKey) {
				return;
			}
			this.groups[key][subKey] = this.groups[key][subKey] || [];

			this.groups[key][subKey].push(id);
		});

		const objCopy = Object.assign({}, this.elements[id]);

		this.trigger('add', objCopy);
		this.trigger('*');

		return objCopy;
	}

	/**
	 * Updates an object thats already in the collection. Will be determined
	 * by its id. Indexes and groups will be updated as well. The new object
	 * will be merged into the old one, unless you set `replace=true`.
	 * All updates result in a new object reference (immutable objects).
	 * @param {string} id Id of the object to be updated
	 * @param {object} newObject New data to be stored.
	 * @param {boolean} [replace=false] Set to `true` to replace, rather than merge
	 * @throws Will throw an Error if the id is unknown or has been changed in the new object. Also on index collision.
	 * @event update(oldObject, newObject) Will pass the data from before and after the update operation to any listeners.
	 */
	update(id, newObject, replace = false) {
		if (!this.elements[id]) {
			throw new Error(`Object with id ${id} does not exist`);
		}

		if (newObject.id !== id) {
			throw new Error(`ID has been changed from ${id} to ${newObject.id} in the object`);
		}

		const oldObject = Object.assign({}, this.elements[id]);

		this.indexList.forEach(index => {
			if (newObject[index] !== undefined) {
				const currentValue = this.indexes[index][newObject[index]];
				if (currentValue && currentValue !== id) {
					throw new Error(`Cannot set value "${index}" to "${newObject[index]}`);
				}
				delete this.indexes[index][oldObject[index]];
				this.indexes[index][newObject[index]] = id;
			}
		});

		this.groupList.forEach(key => {
			const oldSubKey = oldObject[key];
			const subKey = newObject[key];

			if (oldSubKey && oldSubKey !== subKey) {
				const index = this.groups[key][oldSubKey].indexOf(id);
				if (index !== -1) {
					this.groups[key][oldSubKey].splice(index, 1);
					if (this.groups[key][oldSubKey].length === 0) {
						delete this.groups[key][oldSubKey];
					}
				}
			}

			if (subKey) {
				this.groups[key][subKey] = this.groups[key][subKey] || [];
				this.groups[key][subKey].push(id);
			}
		});

		if (replace) {
			this.elements[id] = newObject;
			this.trigger('update', {oldObject, newObject});
		} else {
			const newNewObject = Object.assign({}, oldObject, newObject);
			this.elements[id] = newNewObject;
			this.trigger('update', {oldObject, newObject: newNewObject});
		}

		const outNew = Object.assign({}, this.elements[id]);

		const diff = Object.keys(oldObject).reduce((acc, val) => {
			if (oldObject[val] !== outNew[val]) {
				acc[val] = outNew[val];
			}
			return acc;
		}, {});

		this.trigger('update', {oldObject, newObject: outNew, diff});
		this.trigger('*');

		return outNew;
	}

	/**
	 * Removes the element with the given id from the store, also
	 * removes it from any index and group.
	 * @param {string} id Id of the element to be removed
	 * @throws An error if no object with the given id exists.
	 * @event delete(oldObject) Forwards the object that has been removed to all listeners.
	 */
	remove(id) {
		if (!this.elements[id]) {
			throw new Error(`Object with id ${id} does not exist`);
		}

		const oldObject = Object.assign({}, this.elements[id]);
		this.indexList.forEach(index => {
			const indexValue = oldObject[index];
			if (indexValue) {
				this.indexes[index][indexValue] = undefined;
				delete this.indexes[index][indexValue];
			}
		});

		this.groupList.forEach(key => {
			const subKey = oldObject[key];
			if (subKey) {
				const index = this.groups[key][subKey].indexOf(id);
				if (index !== -1) {
					this.groups[key][subKey].splice(index, 1);
					if (this.groups[key][subKey].length === 0) {
						delete this.groups[key][subKey];
					}
				}
			}
		});

		this.elements[id] = undefined;
		delete this.elements[id];

		this.trigger('delete', oldObject);
		this.trigger('*');
	}

	/**
	 * Will return the copy of an object from the elements list.
	 * Always returns a new copy.
	 * @param {string} id
	 * @returns {*}
	 */
	get(id) {
		if (!this.elements[id]) {
			return undefined;
		}
		return Object.assign({}, this.elements[id]);
	}

	/**
	 * Will return a boolean that states if the item with the given
	 * id exists in the store.
	 * @param {string} id
	 */
	exists(id) {
		return !!this.elements[id];
	}

	/**
	 * Returns an object with the given index value.
	 * There can always be one object with a given value in an index.
	 * @param {string} indexName
	 * @param {string} value
	 * @returns {*}
	 */
	getByIndex(indexName, value) {
		if (this.indexes[indexName] === undefined) {
			throw new Error('Unknown index');
		}

		const id = this.indexes[indexName][value];

		return this.get(id);
	}

	/**
	 * Fetches objects with the same value from a group.
	 * @param {string} groupName
	 * @param {string} value
	 * @returns (any[])
	 */
	getByGroup(groupName, value) {
		if (this.groups[groupName] === undefined) {
			throw new Error('Unknown group');
		}

		if (this.groups[groupName][value] === undefined) {
			return [];
		}

		return this.groups[groupName][value].map(id => this.get(id));
	}

	/**
	 * Returns how many items are there in a group.
	 * @param {string} groupName
	 * @param {string} value
	 * @returns {number}
	 */
	getCountByGroup(groupName, value) {
		if (this.groups[groupName] === undefined) {
			throw new Error('Unknown group');
		}

		if (this.groups[groupName][value] === undefined) {
			return 0;
		}

		return this.groups[groupName][value].length;
	}

	/**
	 * Pass a filter function here to perform a find operation
	 * on the elements collection. Will then return a copy of the
	 * found object.
	 * @param {function} filterFunc
	 * @returns {*}|undefined
	 */
	find(filterFunc) {
		const result = Object.values(this.elements).find(filterFunc);

		if (result) {
			return Object.assign({}, result);
		}

		return undefined;
	}

	/**
	 * Will return a copy of all objects in the collection. Pass
	 * a filter function, to limit the output.
	 * @param {function} [filterFunc] A filter function like for `Array.filter()`
	 * @returns {object[]}
	 */
	getList(filterFunc) {
		const elements = filterFunc
			? Object.values(this.elements).filter(filterFunc)
			: Object.values(this.elements);

		return elements.map(o => Object.assign({}, o));
	}

	/**
	 * Like above, but will pass _all_ elements to filterFunc.
	 * This is much faster, but should _only_ be used for reading
	 * access since it might mess up the store!
	 * @param {function} filterFunc
	 */
	getListFlatFiltered(filterFunc){
		return filterFunc(Object.values(this.elements));
	}

	/**
	 * Returns the count of items a call to `getList()` would return
	 * without actually copying and returning items.
	 * @param {function} filterFunc A filter function like for `Array.filter()`
	 * @returns {number}
	 */
	getCount(filterFunc) {
		const elements = filterFunc
			? Object.values(this.elements).filter(filterFunc)
			: Object.values(this.elements);

		return elements.length;
	}

	/**
	 * Internal function used to trigger events.
	 * @private
	 * @param {string} event
	 * @param {*} [data]
	 */
	trigger(event, data) {
		if (!this.subscribers[event]) {
			return;
		}

		this.subscribers[event].forEach(cb => cb(data));
	}

	/**
	 * Can be used to attach an callback to any event name.
	 * @param {string} event
	 * @param {function} callback
	 */
	on(event, callback) {
		if (!this.subscribers[event]) {
			this.subscribers[event] = [];
		}

		this.subscribers[event].push(callback);
	}

	/**
	 * Removes a previously callback from an event.
	 * @param {string} event
	 * @param {function} callback
	 */
	off(event, callback) {
		if (!this.subscribers[event]) {
			return;
		}
		const index = this.subscribers[event].indexOf(callback);
		if (index !== -1) {
			this.subscribers[event].splice(index, 1);
		}
	}
}

module.exports = SimpleStore;
