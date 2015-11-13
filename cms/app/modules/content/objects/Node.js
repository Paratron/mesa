/**
 * Node
 * ===========
 * Nodes collect information - they are like documents.
 * The document structure is defined by a struct definition, the output (rendering) of the document
 * is defined through a template.
 *
 */
'use strict';

define([], function () {
	var Node = Backbone.Model.extend({
		defaults: {
			title: '',
			urlFragment: '',
			structKey: null,
			templateKey: null,
			groupIndex: null,
			parentId: null,
			langLink: '',
			langKey: '',
			config: {},
			content: null,
			creationTime: 0,
			modificationTime: 0,
			creatorId: 0,
			modificatorId: 0,
			parentNode: null
		},
		initialize: function () {
			if (this.attributes.parentId) {
				this.attributes.parentNode = this.collection.get(this.attributes.parentId);
			}
		},
		/**
		 * Returns the URL path to this node.
		 */
		getPath: function () {
			if (this.attributes.parentNode) {
				return this.attributes.parentNode.getPath() + '/' + this.attributes.urlFragment;
			}
			return this.attributes.urlFragment;
		},
		/**
		 * Will fetch the current content of the node from the server.
		 */
		getContent: function () {
			if (this.attributes.content !== null) {
				return Q.resolve(this.attributes.content);
			}

			var defer = Q.defer(),
				that = this;

			require(['modules/restapi'], function (api) {
				api('GET', '/node/' + that.id + '/content').then(function (result) {
					if (!result) {
						that.attributes.content = {};
					} else {
						that.attributes.content = result;
					}
					defer.resolve(that.attributes.content);
				}).done();
			});

			return defer.promise;
		},
		/**
		 * Will update certain parts of the content on the server.
		 */
		updateContent: function (key, index, value) {
			if (!this.attributes.content) {
				this.attributes.content = {};
			}
			this.attributes.content = recursiveUpdate(this.attributes.content, key.split('.'), index, value);

			var defer = Q.defer(),
				that = this;

			require(['modules/restapi'], function (api) {
				api('PUT', '/node/' + that.id + '/content', {
					key: key,
					index: index,
					value: value === undefined ? -8646543 : JSON.stringify(value)
				}).then(function(){
					defer.resolve();
				});
			});

			return defer.promise;
		}
	});

	/**
	 * Will try to update the content object with a single new value - even when nested.
	 * If value is set to "undefined", the method will remove the given property.
	 * @param object
	 * @param key
	 * @param index
	 * @param value
	 * @returns {*}
	 */
	function recursiveUpdate(object, key, index, value) {
		var currentKey = key.shift();
		var currentObject = object[currentKey];

		if (key.length) { //Need to go deeper?
			object[currentKey] = recursiveUpdate(currentObject, key, index, value);
			return object;
		}

		if (index === undefined && value === undefined) {
			delete object[currentKey];
			return object;
		}

		if (index !== undefined && value === undefined) {
			if (currentObject instanceof Array) {
				currentObject.splice(index, 1);
			}
			object[currentKey] = currentObject;
			return object;
		}

		if (index === undefined) {
			currentObject = value;
			object[currentKey] = currentObject;
			return object;
		}

		if (currentObject === undefined) {
			currentObject = null;
		}

		if (!(currentObject instanceof Array)) {
			currentObject = [currentObject];
		}

		//Fill the array, if it has missing indexes in between.
		if (currentObject.length < index) {
			for (var i = currentObject.length; i < index; i++) {
				currentObject.push(null);
			}
		}

		currentObject[index] = value;

		object[currentKey] = currentObject;
		return object;
	}

	var NodeCollection = Backbone.Collection.extend({
		model: Node
	});

	return {
		Model: Node,
		Collection: NodeCollection
	}
});