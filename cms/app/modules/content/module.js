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
], function (mLang, central, Struct, Template, Node) {

	central.getModuleCSS('content/content.css');
	central.getModuleCSS('content/flags.css');

	central.set('structs', new Struct.Collection(central.get('structs')));
	central.set('templates', new Template.Collection(central.get('templates')));
	central.set('nodes', new Node.Collection(central.get('nodes')));
	central.set('parentNode', 0);

	return {
		getUI: function () {

			var struct = {
				left: modo.generate(
						{
							type: 'FlexContainer',
							params: {
								className: 'contentPages',
								direction: modo.FlexContainer.VERTICAL
							},
							children: [
								{
									type: 'Container',
									params: {
										className: 'lightBar'
									},
									children: [
										{
											type: 'Button',
											params: {
												className: 'material-icons md-dark md-24',
												label: 'language',
												tooltip: mLang.left.btnLanguage
											}
										},
										{
											type: 'Label',
											params: {
												className: 'selectedLanguage',
												value: '<span class="mdC-_unknown"></span> ' + mLang.left.defaultLanguage
											}
										}
									]
								},
								{
									type: 'List',
									flexible: true,
									ref: 'lstPages',
									params: {
										className: 'lstPages',
										data: central.get('nodes'),
										collector: function(c){
											var pid = central.get('parentNode');
											return c.filter(function(node){
												return node.get('parentId') === pid;
											});
										},
										emptyRender: function () {
											return '<div>' + mLang.left.noPages + '</div>';
										},
										itemRender: function(d){
											var className;

											if(d.structKey){
												className = 'page';
											} else {
												className = 'folder';
											}

											return '<div class="' + className + '">' + d.title + '</div>';
										}
									}
								},
								{
									type: 'Button',
									params: {
										className: 'material-icons cta',
										label: 'add',
										tooltip: mLang.left.btnAdd
									},
									on: {
										click: function(){
											require(['modules/content/dialog-newNode'], function(dialog){
												dialog.open();
											});
										}
									}
								},
								{
									type: 'Menu',
									params: {}
								}
							]
						}
				)
			};

			return struct;
		}
	}
});