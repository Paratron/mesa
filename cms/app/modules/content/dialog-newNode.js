/**
 * New Node Dialog
 * ===============
 * This dialog is opened to create a new content node.
 */
'use strict';

define([
	'json!modules/content/lang/' + lang.key + '.json',
	'central'
], function (mLang, central) {
	var ui;

	mLang = mLang.dlgNewNode;

	ui = modo.generate({
		type: 'PopUp',
		ref: 'window',
		params: {
			modal: true,
			closeOnBackdrop: false
		},
		on: {
			open: function () {
				ui.window.el.removeClass('effect');
			}
		},
		children: [
			{
				type: 'Label',
				params: {
					value: mLang.title,
					className: 'tme-title'
				}
			},
			{
				type: 'FormContainer',
				ref: 'frmData',
				params: {
					className: 'tme-content',
					defaultData: {
						title: '',
						urlFragment: '',
						struct: null,
						template: null
					}
				},
				children: [
					{
						type: 'InputTextPlus',
						ref: 'txtTitle',
						key: 'title',
						params: {
							placeholder: mLang.form.lblTitle
						},
						on: {
							keydown: function(){
								var that = this;
								setTimeout(function(){
									ui.txtFragment.set(central.fragmentize(that.get()));
								}, 1);
							}
						}
					},
					{
						type: 'InputTextPlus',
						ref: 'txtFragment',
						key: 'urlFragment',
						params: {
							placeholder: mLang.form.lblFragment
						}
					},
					{
						type: 'FormSlot',
						params: {
							label: mLang.form.lblStruct
						},
						children: [
							{
								type: 'DropDown',
								ref: 'ddnStruct',
								key: 'structKey',
								params: {
									elements: central.get('structs'),
									placeholder: mLang.form.lblNoStructSelected,
									buttonRender: function (d) {
										if (d.title) {
											return d.title + ' <small>(' + d.key + ')</small>';
										}
										return d;
									},
									emptyRender: function () {
										return '<div>' + mLang.form.lblNoStructs + '</div>';
									},
									itemRender: function (d) {
										return '<div><h3>' + d.title + ' <small>(' + d.key + ')</small></h3><span>' + d.description + '</span></div>';
									}
								}
							},
							{
								type: 'Button',
								params: {
									className: 'reset material-icons',
									label: 'clear',
									tooltip: mLang.form.btnReset
								},
								on: {
									click: function () {
										ui.ddnStruct.set(null);
									}
								}
							},
							{
								type: 'Label',
								params: {
									className: 'errorlabel',
									value: ''
								}
							}
						]
					},
					{
						type: 'FormSlot',
						params: {
							label: mLang.form.lblTemplate
						},
						children: [
							{
								type: 'DropDown',
								ref: 'ddnTemplate',
								key: 'templateKey',
								params: {
									elements: central.get('templates'),
									placeholder: mLang.form.lblNoTemplateSelected,
									buttonRender: function (d) {
										if (d.title) {
											return d.title + ' <small>(' + d.key + ')</small>';
										}
										return d;
									},
									emptyRender: function () {
										return '<div>' + mLang.form.lblNoTemplates + '</div>';
									},
									itemRender: function (d) {
										return '<div><h3>' + d.title + ' <small>(' + d.key + ')</small></h3><span>' + d.description + '</span></div>';
									}
								}
							},
							{
								type: 'Button',
								params: {
									className: 'reset material-icons',
									label: 'clear',
									tooltip: mLang.form.btnReset
								},
								on: {
									click: function () {
										ui.ddnTemplate.set(null);
									}
								}
							},
							{
								type: 'Label',
								params: {
									className: 'errorlabel',
									value: ''
								}
							}
						]
					}
				]
			},
			{
				type: 'Container',
				params: {
					className: 'tme-footer'
				},
				children: [
					{
						type: 'Button',
						params: {
							label: mLang.btnCancel
						},
						on: {
							click: function () {
								ui.window.close();
							}
						}
					},
					{
						type: 'Button',
						params: {
							label: mLang.btnConfirm
						},
						on: {
							click: function(){
								var dta = ui.frmData.get();

								dta.parentId = central.get('parentNode').id;

								require('modules/restapi')('post', '/node', dta)
									.then(function(result){
										central.get('nodes').add(result);
										ui.window.close();
									})
									.catch(function(error){

									}).done();
							}
						}
					}
				]
			}
		]
	});

	return {
		open: function () {
			ui.txtFragment.prependLabel(central.get('parentNode').getPath() + '/');
			ui.ddnStruct.setDataset(central.get('structs'));
			ui.ddnTemplate.setDataset(central.get('templates'));
			ui.frmData.set();
			ui.window.el.addClass('effect');
			ui.window.open();
			ui.txtTitle.focus();

			central.updateDefinitions();
		}
	}
});