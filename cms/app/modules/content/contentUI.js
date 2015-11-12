/**
 * contentUI
 * ===========
 * description
 */
'use strict';

define(['json!modules/content/lang/' + lang.key + '.json', 'central'], function (mLang, central) {
	var currentForm = null;

	function parseStruct(inStruct) {
		var result = [];

		for (var key in inStruct) {
			var elm = inStruct[key];

			switch (elm.type) {

			}
		}

		return result;
	}

	var contentUI = modo.generate([
		{
			type: 'FlexContainer',
			ref: 'root',
			params: {
				className: 'contentEditor tme-panel',
				direction: modo.FlexContainer.VERTICAL
			},
			children: [
				{
					type: 'Container',
					params: {
						className: 'tme-panel-header'
					},
					children: [
						{
							type: 'Label',
							ref: 'nodeTitle',
							params: {
								className: 'tme-headline',
								value: 'Element title'
							}
						},
						{
							type: 'Label',
							ref: 'nodeInfo',
							params: {
								className: 'tme-subline',
								value: 'Subtitle - maybe URL?'
							}
						},
						{
							type: 'Container',
							params: {
								className: 'tme-actions'
							},
							children: [
								{
									type: 'Button',
									params: {
										className: 'material-icons',
										label: 'mode_edit',
										tooltip: mLang.main.btnEditMeta
									}
								},
								{
									type: 'Button',
									params: {
										className: 'material-icons',
										label: 'cloud_upload',
										tooltip: mLang.main.btnPublish
									},
									on: {
										click: function(){
											console.log(getData());
										}
									}
								},
								{
									type: 'Button',
									params: {
										className: 'material-icons',
										label: 'delete',
										tooltip: mLang.main.btnDelete
									}
								}
							]
						}
					]
				},
				{
					type: 'Container',
					ref: 'frmContent',
					flexible: true,
					params: {
						className: 'tme-panel-content'
					},
					children: []
				}
			]
		}
	]);

	var changeListener = new Backbone.Model();

	function getData(){
		var dta = {};

		for(var key in currentForm){
			dta[key] = currentForm[key].get();
		}

		return dta;
	}

	function makeForm(struct) {
		contentUI.frmContent.el.children('*').remove();
		currentForm = null;
		changeListener.stopListening();

		var dependencies = ['content'],
			dependencyPromises = [],
			contentElements = {};

		//First, fetch all modules we need, to get their content Elements.
		_.each(dependencies, function (moduleName) {
			dependencyPromises.push(central.fetchModule(moduleName));
		});

		Q.all(dependencyPromises).spread(function () {
			dependencyPromises = [];
			_.each(arguments, function (module) {
				dependencyPromises.push(module.getContentElements());
			});
			return dependencyPromises;
		}).spread(function () {
			_.each(arguments, function (elements) {
				_.extend(contentElements, elements);
			});

			//Now we can start to actually create the form.
			var form = {}, definition;
			for (var key in struct) {
				definition = struct[key];
				if(contentElements[definition.type] === undefined){
					contentUI.frmContent.el.append('<div class="missingContentElementType">[MISSING TYPE: ' + definition.type + ']</div>');
					continue;
				}
				form[key] = new contentElements[definition.type](definition, null);
				form[key].key = key;
				contentUI.frmContent.add(form[key].container);
				(function (key, events, definition) {
					changeListener.listenTo(events, 'change', function (e) {
						if (definition.repeat) {
							console.log('Element updated: ', key, e.index, e.value);
						} else {
							console.log('Element updated: ', key, e.value);
						}
					});
				})(key, form[key].events, definition);
			}

			currentForm = form;
		}).done();
	}

	function updateSelectedNode() {
		var n = central.get('selectedNode');

		contentUI.nodeTitle.set(n.get('title'));
		contentUI.nodeInfo.set(n.getPath());

		if (n.get('structKey')) {
			central.get('structs').get(n.get('structKey')).fetch().then(makeForm).done();
		}
	}

	central.on('change:selectedNode', updateSelectedNode);

	return contentUI;
});