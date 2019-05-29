const mesa = require('../system');

mesa.setMetaData({
	title: 'Nähdatenbank'
});

mesa.useStore('data', mesa.stores.simple);
mesa.useConnector('websocket', mesa.connectors.websocket, {
	/**
	 * If admin = true, the socket connector will watch automatically
	 * for calls from the administrator app.
	 */
	admin: true,
	port: 1337
});

mesa.declareEntity(
	'link',
	{
		/**
		 * Those two props will be consumed by mesa admin
		 */
		title: 'Link',
		icon: 'link',

		/**
		 * mesa will automatically create CRUD+L operations, if you want to
		 * When given as string, each procedure will have a user required
		 * and requires him to own the right "[entityName].[procedureName]".
		 */
		procedures: ['create', 'update', 'remove', 'read', 'list'],
		/**
		 * If you need more control, you can tell mesa how to configure
		 * the auto-procedures:
		 *
		 * createProcedures: ['create', {name: 'list', user: false, right: false}]
		 */

		storeOptions: {},

		/**
		 * Auto fields are fields automatically added and maintained by
		 * mesa.
		 */
		autoFields: ['id', 'creationTime', 'modificationTime', 'deletionTime'],

		fields: {
			title: 'string',
			url: 'string'
		},
		defaults: {
			title: null,
			url: null
		},

		/**
		 * Admin fields will control how mesa admin will render the overview for
		 * this data type. Only mentioned fields will be rendered and the order will
		 * honored as well.
		 */
		adminFields: {
			id: true,
			creationTime: true,
			modificationTime: true,
			title: {
				title: 'Link Titel',
				sortable: true
			},
			url: {
				title: 'Linkziel',
				component: 'Link'
			}
		}
	}
);
