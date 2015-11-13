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

	function makeForm(struct, content) {
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
				form[key] = new contentElements[definition.type](definition, content[key]);
				form[key].key = key;
				contentUI.frmContent.add(form[key].container);
				(function (key, events, definition) {
					//TODO: This callback will always be called twice, hence the debounce. No idea, why.
					changeListener.listenTo(events, 'change', _.debounce(function (e) {
						central.get('selectedNode').updateContent(key + (e.key ? '.' + e.key : ''), (definition.repeat ? e.index : undefined), e.value);
					}, 10));
					changeListener.listenTo(events, 'remove', function(e){
						central.get('selectedNode').updateContent(key + (e.key ? '.' + e.key : ''), e.index, undefined);
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
			n.getContent().then(function(content){
				central.get('structs').get(n.get('structKey')).fetch().then(function(struct){
					makeForm(struct, content);
				}).done();
			});
		}
	}

	central.on('change:selectedNode', updateSelectedNode);

	return contentUI;
});