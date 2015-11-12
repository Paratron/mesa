/**
 * elementContainer
 * ================
 * The element container is the wrapper/base for all content elements.
 * It handles the repetition and data collection.
 */
'use strict';

define([
	'json!modules/content/lang/' + lang.key + '.json'
], function (mLang) {
	/**
	 * Content elements need to take this method and pass their element factory method
	 * as first parameter.
	 * The method will then return the method that can be used by the form generator.
	 * @param function elementFactory Method that returns a get/set enabled modo element.
	 * @param string [className] Optional CSS class to be added to the outer container of the content element.
	 */
	return function (elementFactory, className) {
		if (!className) {
			className = '';
		}

		/**
		 * Counts through the number of content elements inside a content element container and
		 * applies a css class to it, or removes it if only one element is inside.
		 *
		 * It also provides a special CSS class to the very first content element in the container.
		 * @param container
		 */
		function checkCount(container, definition) {
			var elms = container.el.find('.contentElementWrapper').removeClass('firstElement').length;

			container.el.find('.contentElementWrapper').first().addClass('firstElement');

			if (elms <= 1) {
				container.addClass('oneElement');
			} else {
				container.removeClass('oneElement');
			}

			if (definition.maxRepeat) {
				if (elms >= definition.maxRepeat) {
					container.addClass('maxElements');
				} else {
					container.removeClass('maxElements');
				}
			}
		}

		/**
		 * This makes a little wrapper per element and adds a remove and sort button, if necessary.
		 */
		function makeElement(definition, elementsContainer, elementsList, value, slideIn) {
			var wrapper, element, obj, eventProvider;

			eventProvider = definition._eventProvider;

			wrapper = new modo.Container({
				className: 'contentElementWrapper'
			});

			if (definition.repeat) {
				var buttonKeeper = modo.generate({
					type: 'Container',
					params: {
						className: 'buttonKeeper'
					},
					children: [
						{
							type: 'Button',
							params: {
								className: 'material-icons',
								label: 'sort',
								tooltip: mLang.contentElements._all.sort
							}
						},
						{
							type: 'Button',
							params: {
								className: 'material-icons',
								label: 'remove_circle',
								tooltip: mLang.contentElements._all.remove
							},
							on: {
								click: function () {
									var index = elementsList.indexOf(obj);
									elementsList.splice(elementsList.indexOf(obj), 1);
									eventProvider.trigger('remove', index);
									wrapper.el.slideUp('fast', function () {
										elementsContainer.remove(wrapper);
										checkCount(elementsContainer, definition);
									});
								}
							}
						}
					]
				});

				wrapper.add(buttonKeeper);
			}

			element = elementFactory(definition.options || {}, definition);

			if(!definition.repeat){
				wrapper.addClass('firstElement', false);
			}

			wrapper.add(element);

			if (value !== undefined) {
				element.set(value, {silent: true});
			}

			obj = {
				container: wrapper,
				element: element
			};

			if (slideIn) {
				wrapper.el.hide();
			}

			elementsContainer.add(wrapper);

			if (slideIn) {
				wrapper.el.slideDown('fast');
			}

			elementsList.push(obj);

			element.on('change', function () {
				eventProvider.trigger('change', {
					index: elementsList.indexOf(obj),
					value: element.get()
				});
			});
		}

		/**
		 * This is the actual constructor for elements. It can be passed
		 * to the form builder who will create elements for each content field.
		 */
		return function (definition, data) {
			if (!data) {
				data = '';
			}

			var elements = [];

			/**
			 * Since every data entry could be repeatable, we need to create a surrounding
			 * container for all elements.
			 * @type {modo.Container}
			 */
			var container = new modo.Container({
				className: 'contentElement ' + className
			});

			var addButton, eventProvider;

			eventProvider = new Backbone.Model();

			definition._eventProvider = eventProvider;

			if (definition.name) {
				container.add(new modo.Label({
					className: 'contentElementTitle',
					value: definition.name
				}));
			}

			if (definition.description) {
				container.add(new modo.Label({
					className: 'contentElementDescription',
					value: definition.description
				}));
			}

			if (definition.repeat) {
				if (!data) {
					data = [''];
				}

				container.addClass('repeatable');

				addButton = new modo.Button({
					className: 'material-icons btnAddMore',
					label: '<span>add_circle</span>' + mLang.contentElements._all.btnAddMore
				});

				addButton.on('click', function () {
					makeElement(definition, container, elements, null, true);
					checkCount(container, definition);
				});

				container.add(addButton);

				_.each(data, function (value) {
					makeElement(definition, container, elements, value);
				});

				checkCount(container, definition);
			} else {
				makeElement(definition, container, elements, data);
			}

			return {
				container: container,
				events: eventProvider,
				get: function () {
					if (definition.repeat) {
						var data = [];

						_.each(elements, function (elementContainer) {
							data.push(elementContainer.element.get());
						});

						return data;
					}

					return elements[0].element.get();
				},
				set: function (inData) {
					var i;

					if (definition.repeat) {
						for (i = 0; i < inData.length; i++) {
							if (elements[i]) {
								elements[i].set(inData[i]);
							} else {
								makeElement(definition, container, elements, inData[i]);
							}
						}
						return;
					}

					elements[0].set(inData);
				}
			};
		}
	}
});