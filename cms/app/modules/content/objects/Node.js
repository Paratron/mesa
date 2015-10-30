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
		initialize: function(){
			if(this.attributes.parentId){
				this.attributes.parentNode = this.collection.get(this.attributes.parentId);
			}
		},
		/**
		 * Returns the URL path to this node.
		 */
		getPath: function(){
			if(this.attributes.parentNode){
				return this.attributes.parentNode.getPath() + '/' + this.attributes.urlFragment;
			}
			return this.attributes.urlFragment;
		}
	});

	var NodeCollection = Backbone.Collection.extend({
		model: Node
	});

	return {
		Model: Node,
		Collection: NodeCollection
	}
});