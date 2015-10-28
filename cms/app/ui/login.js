/**
 * login
 * ===========
 * description
 */
'use strict';

define(['modules/restapi', 'ui/widgets/mdo-InputTextPlus'], function (api) {
	var ui;

	ui = modo.generate(
			{
				type: 'Container',
				ref: 'root',
				params: {
					className: 'panel login'
				},
				children: [
					{
						type: 'InputTextPlus',
						ref: 'login',
						params: {
							type: 'mail',
							placeholder: lang.login.txtLoginMail
						},
						on: {
							'keydown:enter': processLogin
						}
					},
					{
						type: 'InputTextPlus',
						ref: 'password',
						params: {
							type: 'password',
							placeholder: lang.login.txtLoginPass
						},
						on: {
							'keydown:enter': processLogin
						}
					},
					{
						type: 'Button',
						ref: 'btnLogin',
						params: {
							label: lang.login.btnLogin
						},
						on: {
							click: processLogin
						}
					}
				]
			}
	);

	/**
	 * Try to perform the login action.
	 */
	function processLogin() {
		if (ui.btnLogin.disabled) {
			return;
		}

		var dta = {
			user: ui.login.get(),
			pass: ui.password.get()
		};

		if (!dta.user.match(/^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/)) {
			ui.login.error(lang.login.errors.wrongMail).focus().select();
			return;
		}

		if (!dta.pass) {
			ui.password.error(lang.login.errors.noPass).focus();
			return;
		}

		ui.login.normal();
		ui.password.normal();
		ui.btnLogin.disable();

		api('post', '/user/login', dta)
				.then(function (result) {
					require(['central'], function (central) {
						localStorage.setItem('cmsLastLogin', dta.user);
						localStorage.setItem('cmsUserToken', result.token);
						localStorage.setItem('cmsTokenExpires', Date.now() + 28800000);
						ui.root.hide();
						central.set(result.payload);
						central.set('token', result.token);
					});
				})
				.catch(function (error) {
					ui.btnLogin.enable();

					switch (error.code) {
						case 5:
							ui.login.error(lang.login.errors.unknownMail).focus().select();
							break;
						case 6:
							ui.password.error(lang.login.errors.wrongPass).focus().select();
							break;
						case 7:
							loginLocked(error.data.remaining);
							ui.password.error(lang.login.errors.accountLocked.replace(/%t/, error.data.remaining));
					}
				}).done();
		//ui.password.error('Wrong password!').focus().select();
	}

	/**
	 * Called, if the bruteforce protection is active.
	 * @param remaining
	 */
	function loginLocked(remaining) {
		ui.btnLogin.disable();

		var intv = setInterval(function () {
			remaining--;

			if (remaining <= 0) {
				ui.password.normal().focus().select();
				ui.btnLogin.enable();
				clearInterval(intv);
				return;
			}

			ui.password.error(lang.login.errors.accountLocked.replace(/%t/, remaining));
		}, 1000);
	}

	ui.login.focus(100);

	if (localStorage.getItem('cmsLastLogin')) {
		ui.login.set(localStorage.getItem('cmsLastLogin'));
		ui.password.focus(100);
	}

	/**
	 * Try to perform an automatic login because the token isn't expired.
	 */
	if (localStorage.getItem('cmsTokenExpires')) {
		if (localStorage.getItem('cmsTokenExpires') > Date.now() - 28800000) {
			ui.root.addClass('loading material-icons', false);

			api('get', '/user/payload')
					.then(function (result) {
						require(['central'], function (central) {
							ui.root.hide();
							central.set(result.payload);
							central.set('token', localStorage.getItem('cmsUserToken'));
						});
					}).catch(function (error) {
						localStorage.removeItem('cmsUserToken');
						localStorage.removeItem('cmsTokenExpires');
						ui.root.removeClass('loading', false);
					}).done();

		}
	}

	return ui.root;
});