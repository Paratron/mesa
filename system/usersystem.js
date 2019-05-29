const mesa = require('./index');
const errors = require('./errors');
const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');

const hashPasssword = (inStr) => new Promise((resolve, reject) => {
	bcrypt.hash(inStr, 10, (err, hash) => {
		if (err) {
			reject(err);
			return;
		}

		resolve(hash);
	});
});

const checkPassword = (hashedPassword, clearPassword) => new Promise((resolve, reject) => {
	bcrypt.compare(clearPassword, hashedPassword, (err, res) => {
		if (err) {
			reject(err);
			return;
		}
		resolve(res);
	});
});

module.exports = {
	/**
	 * The user system is handled by mesa directly. A central entity "user" is created
	 * and methods added to create and update user entities. Another procedure "user.auth"
	 * is also created to authenticate the user with various mechanisms.
	 * @param declarations
	 */
	init: (declarations) => {
		const userDef = declarations.user || {
			fields: {},
			defaults: {}
		};

		const declaration = {
			autoFields: ['id', 'creationTime', 'modificationTime', 'deletionTime'],
			procedures: ['remove', 'read', 'list'],

			title: '%user',
			icon: 'supervised_user_circle',
			store: userDef.store || 'data',

			fields: Object.assign(userDef.fields, {
				mail: 'string|required,unique',
				password: 'string|required',
				token: 'string|unique',
				lastLogin: 'int',
				lastWrongPassword: 'int',
				wrongPasswords: 'int',
				groups: 'string'
			}),

			adminFields: Object.assign(userDef.adminFields || {}, {
				mail: {
					sortable: true
				},
				lastLogin: {
					component: 'Time',
					sortable: true,
				}
			}),

			defaults: Object.assign(userDef.defaults || {}, {
				mail: null,
				password: null,
				token: null,
				lastLogin: null,
				lastWrongPassword: null,
				wrongPasswords: 0,
				groups: ''
			})
		};

		if (declarations.user) {
			mesa.log(`´yMerging predeclared user entity. Final fields: ´b[${Object.keys(declaration.fields).join(', ')}]´w`);
		} else {
			mesa.log('Declaring user entity with standard fields ´b[mail, password]´w');
		}

		mesa.declareEntity(
			'user',
			declaration,
			true
		);

		mesa.defineProcedure('user.create', ({stores, tools}) =>
			async ({user, args}) => {
				if (!user) {
					throw errors.needLogin();
				}

				if (!tools.hasRight(user, 'user.create')) {
					throw errors.missingRight('user.create');
				}

				const {
					// The auto-procedures default to a store with a simple-store interface, called "data".
					[declaration.store]: store
				} = stores;

				if (!args.mail || args.mail.match('@') === null) {
					throw errors.invalidMail(args.mail);
				}

				args.password = await hashPasssword(args.password);

				/**
				 * Hand the data over to the store. It should determine by itself
				 * if the data is valid - and will throw an error, if not.
				 */
				const result = store.add('user', args);

				/**
				 * Broadcast what happened so any parts of the application may register to it.
				 * This may also utilized by other connectors to send push messages.
				 */
				tools.broadcast('user.create', result);

				/**
				 * The resulting object from the store will be returned.
				 */
				return result;
			});

		mesa.defineProcedure('user.update', ({stores, tools}) =>
			async ({user, args}) => {
				if (!user) {
					throw errors.needLogin();
				}

				if (!tools.hasRight(user, 'user.update')) {
					throw errors.missingRight('user.update');
				}

				const {
					// The auto-procedures default to a store with a simple-store interface, called "data".
					[declaration.store]: store
				} = stores;

				if (args.password) {
					args.password = await hashPasssword(args.password);
				}

				/**
				 * Hand the data over to the store. It should determine by itself
				 * if the data is valid - and will throw an error, if not.
				 */
				const result = store.update('user', args);

				/**
				 * Broadcast what happened so any parts of the application may register to it.
				 * This may also utilized by other connectors to send push messages.
				 */
				tools.broadcast('user.update', result);

				/**
				 * The resulting object from the store will be returned.
				 */
				return result;
			});

		mesa.defineProcedure('user.auth', ({stores, tools}) =>
			async ({args}) => {
				const {
					mail,
					password,
					token
				} = args;

				const {
					// The auto-procedures default to a store with a simple-store interface, called "data".
					[declaration.store]: store
				} = stores;

				if (token) {
					const user = store.getByIndex('user', 'token', token);
					if (!user) {
						throw errors.invalidToken();
					}
					return user;
				}

				if (!mail || !password) {
					throw errors.missingAuthData();
				}

				const user = store.getByIndex('user', 'mail', mail);

				if (!user) {
					throw errors.unknownUser();
				}

				const validPassword = await checkPassword(user.password, password);

				if (!validPassword) {
					store.update(
						'user',
						{
							id: user.id,
							lastWrongPassword: Date.now(),
							wrongPasswords: (user.wrongPasswords || 0) + 1
						}
					);
					throw errors.wrongPassword();
				}

				const newToken = uuid();

				return store.update(
					'user',
					{
						id: user.id,
						token: newToken,
						lastLogin: Date.now(),
						wrongPasswords: 0
					});
			});
	}
};
