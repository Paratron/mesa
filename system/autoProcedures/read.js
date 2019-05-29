/**
 * This is an automatic procedure to create new entities of a declared data type
 * in the store. The first call is the _pre-initialize_ call and should not yet create any data.
 * It receives additional information in the declaration phase of the boot.
 * @param {string} entityName Name of the data entity
 * @param {string} procedureName The name of the procedure. This is usually [typename].[procedurename]
 * @param {object} def Reference to the definition object for the data type.
 * @returns {function({stores: *, declarations: *, tools: *}): function({user?: *, args?: *}): *}
 */
const read = (entityName, procedureName, def) =>
	/**
	 * This returned function from the initial call will be called from the system
	 * when dependency systems are ready. This includes mainly stores. It is the main
	 * init function called during boot/startup.
 	 * @param {object} stores Reference object to all currently active stores.
	 * @param {object} declarations Reference to the object that contains all entity definitions
	 * @param {object} tools Object that contains tools prepared by mesa.
	 * @returns {function({user?: *, args?: *}): *}
	 */
	({stores, declarations, tools}) => {
	const declaration = declarations[entityName];
	const {
		// The auto-procedures default to a store with a simple-store interface, called "data".
		[declaration.store || 'data']: store
	} = stores;

	if (!store || store.interface !== 'simple') {
		throw new Error('A simple store with the name "data" needs to be defined to use auto procedures.');
	}

	/**
	 * This function will be called when `mesa.callProcedure()` is
	 * called. It requires the current user as well as the passed arguments.
	 */
	return async ({user, args}) => {
		// Check if the declaration enforces a user for this procedure.
		if (def.user !== false && !user) {
			throw new Error(errors.needLogin());
		}

		// Check if the declaration enforces a right for this procedure.
		if (def.right) {
			if (!tools.hasRight(user, def.right)) {
				throw new Error(errors.missingRight(def.right));
			}
		}

		/**
		 * Hand the data over to the store. It should determine by itself
		 * if the data is valid - and will throw an error, if not.
		 */
		const {
			id
		} = args;
		const result = store.get(entityName, id);

		/**
		 * Broadcast what happened so any parts of the application may register to it.
		 * This may also utilized by other connectors to send push messages.
 		 */
		tools.broadcast(procedureName, result);

		/**
		 * The resulting object from the store will be returned.
		 */
		return result;
	};
};

module.exports = read;
