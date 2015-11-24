/**
 * Content Module
 * ==============
 * This module is responsible for all content/page creation and editing.
 */
'use strict';

define([
	'json!modules/content/lang/' + lang.key + '.json',
	'central',
	'modules/content/objects/Struct',
	'modules/content/objects/Template',
	'modules/content/objects/Node'
], function (mLang, central, Struct, Template, Node, sidebarUI, contentUI) {

	central.getModuleCSS('content/content.css');
	central.getModuleCSS('content/flags.css');

	central.set('structs', new Struct.Collection(central.get('structs')));
	central.set('templates', new Template.Collection(central.get('templates')));
	central.set('nodes', new Node.Collection(central.get('nodes')));
	central.set('parentNode', central.get('nodes').find(function (node) {
		return node.get('parentId') === 0
	}));
	central.set('selectedSite', central.get('parentNode'));
	central.set('navigationPath', 0);
	central.set('selectedNode', null);

	/**
	 * This looks if there have been any changes on the struct and template files.
	 */
	central.updateDefinitions = function(){
		require(['modules/restapi'], function(api){
			api('get', '/struct').then(function(result){
				central.get('structs').reset(result.structs);
				central.get('templates').reset(result.templates);
			});
		});
	};

	/**
	 * The fragmentizer can turn strings into url compatible fragments.
	 */
	central.fragmentize = function (inputString) {
		return inputString
			.toLowerCase()
			.replace(/ /g, '-')
			.replace(/ä/g, 'ae')
			.replace(/ö/g, 'oe')
			.replace(/ü/g, 'ue')
			.replace(/ß/g, 'ss')
			.replace(/é/g, 'e')
			.replace(/á/g, 'a')
			.replace(/ó/g, 'o')
			.replace(/ñ/g, 'n')
			.replace(/---/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	};

	return {
		getContentElements: function(){
			var defer = Q.defer();

			require([
				'modules/content/contentElements/simpleText',
				'modules/content/contentElements/group'
			], function(simpleText, group){
				defer.resolve({
					'simpleText': simpleText,
					'group': group
				});
			});

			return defer.promise;
		},
		getUI: function () {
			var defer = Q.defer();

			require(['modules/content/sidebarUI',
				'modules/content/contentUI'], function (sidebarUI, contentUI) {
				defer.resolve({
					left: sidebarUI.root,
					main: contentUI.root
				});
			});

			return defer.promise;
		}
	}
});