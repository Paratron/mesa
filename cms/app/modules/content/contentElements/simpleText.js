/**
 * simpleText
 * ===========
 * A simpleText is used to collect simple, unformatted text input from a user.
 * The text can be one-lined, or multilined - configure it with the options parameter.
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