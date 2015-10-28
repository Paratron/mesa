/**
 * Template
 * ===========
 * A template defines how a document content structure - defined by a struct - should be rendered and sent to
 * the users browser. If there are no limitations given by the template, any struct can be connected to any output
 * template.
 */
'use strict';

define([], function () {
	var Template = Backbone.Model.extend({
		defaults: {
			title: '',          //The template title
			description: '',    //Description what the demplate does
			key: '',            //Key that identifies the template
			date: '',           //Can be any format - just informative
			author: '',         //Can be any format - just informative
			code: '',           //Content Code of the template
			structLimit: null,  //Are there any restrictions what structs can be used with this template? Array of keys.
			fetched: false      //Has the full object been fetched from the server?
		},
		idAttribute: 'key'
	});

	var TemplateCollection = Backbone.Collection.extend({
		model: Template
	});

	return {
		Model: Template,
		Collection: TemplateCollection
	};
});