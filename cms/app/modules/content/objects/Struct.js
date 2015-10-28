/**
 * Struct
 * ===========
 * Structs are definitions for the document content model - a struct defines how
 * the CMS builds a input mask (form) for a specific node in the system.
 *
 * The bootstrap brings only names, descriptions - meta information - of the structs. To
 * access the structs definition content, it has to be completely fetched from the server.
 */
'use strict';

define([], function () {
	var Struct = Backbone.Model.extend({
		defaults: {
			title: '',              //Title of the Struct
			description: '',        //Description what information the Struct can keep
			key: '',                //Key that identifies the struct
			definition: null,       //JSON definition object of the struct
			fetched: false          //Has the full struct been fetched from the server so far?
		},
		idAttribute: 'key'
	});

	var StructCollection = Backbone.Collection.extend({
		model: Struct
	});

	return {
		Model: Struct,
		Collection: StructCollection
	};
});