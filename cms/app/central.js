/**
 * central
 * ===========
 * description
 */
'use strict';

define([], function () {

	var modules = {};

	window.central = new (Backbone.Model.extend({
		defaults: {
			token: ''
		}
	}));

	/**
	 * Successful login.
	 */
	central.on('change:token', function () {
		require(['ui/base'], function (ui) {
			modo.getRootElement().append(ui.el);
			setTimeout(function () {
				ui.removeClass('hidden', false);
			}, 100);
		});
	});

	/**
	 * Request a new CMS Module, initialize it and fulfill the promise, when its available.
	 * @param moduleName
	 * @returns {d.promise|Function|*|promise|s}
	 */
	central.fetchModule = function (moduleName) {
		var defer;

		if (modules[moduleName]) {
			return Q.resolve(modules[moduleName]);
		}

		defer = Q.defer();

		require(['modules/' + moduleName + '/module'], function (module) {
			modules[moduleName] = module;

			if (module.getUI) {
				central.trigger('injectModuleUI', _.extend(module.getUI(), {moduleKey: moduleName}));
			}

			defer.resolve(module);
		});

		return defer.promise;
	};

	central.getModuleCSS = function (path) {
		var l = document.createElement('link');
		l.href = 'css/modules/' + path;
		l.type = 'text/css';
		l.rel = 'stylesheet';
		document.head.appendChild(l);
	};

	return central;
});