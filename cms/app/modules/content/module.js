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
	central.set('parentNode', central.get('nodes').find(function (node) {
		return node.get('parentId') === 0
	}));
	central.set('selectedSite', central.get('parentNode'));
	central.set('navigationPath', 0);
	central.set('selectedNode', null);

	/**
	 * The fragmentizer can turn strings into url compatible fragments.
	 */
	central.fragmentize = function(inputString){
		return inputString
			.toLowerCase()
			.replace(/ /g, '-')
			.replace(/[!.:,;]/g, '')
			.replace(/---/g, '-');
	};

	return {
		getUI: function () {

			var sidebarUI = modo.generate([
					{
						type: 'FlexContainer',
						ref: 'root',
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
											tooltip: mLang.left.btnSites
										},
										on: {
											click: function () {
												sidebarUI.siteMenu.attach(this, 'rb').open();
											}
										}
									},
									{
										type: 'PopUpBubble',
										ref: 'siteMenu',
										params: {
											className: ''
										},
										children: [
											{
												type: 'List',
												params: {
													data: central.get('nodes'),
													collector: function (c) {
														return c.where({parentId: 0});
													},
													itemRender: function (d) {
														return d.title;
													}
												}
											},
											{
											    type: 'Button',
											    params: {
												    className: 'tme-addbutton',
											        label: mLang.left.btnNewSite
											    }
											}
										]
									},
									{
										type: 'Label',
										ref: 'lblSelectedSite',
										params: {
											className: 'selectedSite'
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
									collector: function (c) {
										var pid = central.get('parentNode');
										return c.filter(function (node) {
											return node.get('parentNode') === pid;
										});
									},
									emptyRender: function () {
										return '<div>' + mLang.left.noPages + '</div>';
									},
									itemRender: function (d) {
										var className;

										if (d.structKey) {
											className = 'page';
										} else {
											className = 'folder';
										}

										return '<div class="node-' + d.id + ' ' + className + '">' + d.title + '</div>';
									},
									itemEvents: {
										click: function (e, i, d) {
											central.set('selectedNode', d.id);
											sidebarUI.lstPages.el.find('.selected').removeClass('selected');
											sidebarUI.lstPages.el.find('.node-' + d.id).addClass('selected');
										}
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
									click: function () {
										require(['modules/content/dialog-newNode'], function (dialog) {
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
					}]
			);

			function updateSelectedSite() {
				var value = central.get('selectedSite').get('title');

				if (central.get('selectedSite').get('langKey')) {
					value += '<span class="mdC-_unknown"></span>';
				}

				sidebarUI.lblSelectedSite.set(value);
			}

			central.on('change:selectedSite', updateSelectedSite);
			updateSelectedSite();

			var struct = {
				left: sidebarUI.root
			};

			return struct;
		}
	}
});