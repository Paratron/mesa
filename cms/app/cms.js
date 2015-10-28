/**
 * cms
 * ===========
 * description
 */
'use strict';

define([], function () {
	var base = new modo.Container();

	if(!window.authToken){
		require(['ui/login'], function(panel){
			base.add(panel);
		});
	}

	modo.init('body', base);
});