/**
 * Group
 * =====
 * Groups are used to combine multiple other input elements into one container.
 * Groups can be nested.
 */
'use strict';

define([
	'modules/content/elementContainer'
], function (elementContainer) {
	var element = elementContainer(function (inOptions, definition) {
		var contentElements = inOptions.contentElements,
			container,                              //Modo element to contain the UI elements of all children.
			form = {},                              //Will keep references to the UI elements + their keys
			changeListener = new Backbone.Model(); //Listen for changes in all children.

		function getData() {
			var dta = {};

			for (var key in form) {
				dta[key] = form[key].get();
			}

			return dta;
		}

		container = new modo.Container({
			className: 'groupContainer'
		});

		container.get = function () {
			return getData();
		};

		container.set = function (inData, options) {
			options = options || {};

			for (var key in inData) {
				if(form[key] !== undefined){
					form[key].set(inData[key], options);
				}
			}
		};

		var c = definition.children,
			cDef;

		for (var key in c) {
			cDef = c[key];
			if(cDef.type === undefined){
				cDef.type = 'simpleText';
			}

			if (contentElements[cDef.type] === undefined) {
				container.el.append('<div class="missingContentElementType">[MISSING TYPE: ' + cDef.type + ']</div>');
				continue;
			}

			form[key] = new contentElements[cDef.type](cDef, null, contentElements);
			form[key].key = key;
			container.add(form[key].container);
			/**
			 * We need to capture all childrens events and propagate our own.
			 */
			(function (key, events, cDef) {
				//TODO: This callback will always be called twice, hence the debounce. No idea, why.
				changeListener.listenTo(events, 'change', _.debounce(function (e) {
					container.trigger('change', {
						key: key + (cDef.repeat ? '[' + e.index + ']' : '') + (e.key ? '.' + e.key : ''),
						value: e.value
					});
				}, 10));
				changeListener.listenTo(events, 'remove', function (e) {
					container.trigger('remove', {
						key: key + '[' + e.index + ']' + (e.key ? '.' + e.key : '')
					});
				});
			})(key, form[key].events, cDef);
		}

		return container;
	}, {
		className: 'contentGroup',
		provideContentElements: true
	});

	return element;
});