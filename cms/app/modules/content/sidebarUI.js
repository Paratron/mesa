/**
 * sidebarUI
 * ===========
 * description
 */
'use strict';

define(['json!modules/content/lang/' + lang.key + '.json', 'central'], function (mLang, central) {

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
									central.set('selectedNode', d);
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

	return sidebarUI;
});