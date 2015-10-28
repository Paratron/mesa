/**
 * restapi
 * ===========
 * description
 */
'use strict';

define([], function (){
	var apiBase = 'api',
		apiToken = localStorage.getItem('cmsUserToken');

	function request(method, target, data){
		var d = Q.defer();

		$.ajax({
			contentType: 'text/json',
			data: JSON.stringify(data),
			dataType: 'json',
			url: request.base + target + (apiToken ? '?token=' + apiToken : ''),
			method: method,
			error: function (xhr){
				var result = $.parseJSON(xhr.responseText);

				if(result.error.message === 'Token expired' || result.error.message === 'Invalid token'){
					if(window.logout){
						return;
					}
					modo
						.alert(lang.misc.tokenExpired)
						.then(function (){
							location.href = location.href;
						});
				}

				d.reject(result.error);
			},
			success: function (data){
				d.resolve(data);
			}
		});

		return d.promise;
	}

	request.base = apiBase;
	request.token = apiToken;

	return request;
});