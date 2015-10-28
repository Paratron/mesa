/**
 * base
 * ===========
 * description
 */
'use strict';

define(['central'], function (central) {
	var ui, dLang;

	dLang = lang.leftPanel;

	ui = modo.generate({
		type: 'FlexContainer',
		ref: 'root',
		params: {
			className: 'panel mainApp hidden'
		},
		children: [
			{
				type: 'Container',
				params: {
					className: 'leftPanel',
					direction: modo.FlexContainer.VERTICAL
				},
				children: [
					{
						type: 'Container',
						params: {
							className: 'panelHeader'
						},
						children: [
							{
								type: 'Image',
								ref: 'userImage',
								params: {
									className: 'userPic',
									value: 'http://gravatar.com/avatar/' + central.get('user').gravatar + '?s=180'
								}
							},
							{
								type: 'Button',
								params: {
									className: 'menu material-icons md-24 md-dark',
									label: 'apps',
									tooltip: dLang.header.ttMenu
								}
							},
							{
								type: 'PopUpBubble',
								ref: 'userMenu',
								params: {
									className: ''
								},
								children: [
									{
										type: 'List',
										params: {
											data: dLang.header.userMenu,
											itemEvents: {
												'click': function(e, i, d){
													switch(i){
														case 'logout':
															localStorage.removeItem('cmsUserToken');
															localStorage.removeItem('cmsTokenExpires');
															location.href = location.href;
															break;
													}
												}
											}
										}
									}
								]
							}
						]
					},
					{
						type: 'ViewStack',
						ref: 'stkLeft',
						params: {
							className: 'leftPanelStack'
						}
					}
				]
			},
			{
				type: 'ViewStack',
				ref: 'stkMain',
				flexible: true,
				params: {
					className: 'mainPanel'
				},
				children: []
			},
			{
				type: 'ViewStack',
				ref: 'stkRight',
				params: {
					className: 'rightPanel'
				},
				children: []
			}
		]
	});

	ui.userImage.el.on('click', function(){
		ui.userMenu.attach(ui.userImage, 'rb').open();
	});

	/**
	 * A module has been loaded by the central and likes to add UI elements.
	 */
	central.on('injectModuleUI', function (dta) {
		var ins;
		if (dta.left) {
			ins = {};
			ins[dta.moduleKey] = dta.left;
			ui.stkLeft.add(ins);
		}

		if (dta.main) {
			ins = {};
			ins[dta.moduleKey] = dta.main;
			ui.stkMain.add(ins);
		}

		if (dta.right) {
			ins = {};
			ins[dta.moduleKey] = dta.right;
			ui.stkRight.add(ins);
		}
	});

	central.fetchModule('content');

	return ui.root;
});