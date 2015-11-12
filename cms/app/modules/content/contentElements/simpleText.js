/**
 * simpleText
 * ===========
 * description
 */
'use strict';

define([
	'modules/content/elementContainer',
	'ui/widgets/mdo-InputTextPlus'
], function (elementContainer) {
	var element = elementContainer(function(inOptions, definition){
		if(!inOptions.placeholder){
			inOptions.placeholder = definition.name;
		}

		return new modo.InputTextPlus(inOptions);
	});

	return element;
});