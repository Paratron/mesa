/**
 * ProcGen
 * =======
 * This module generates automatic procedures for CRUD+L operations.
 */

const errors = require('./errors');

const autoProcedures = {
	create: require('./autoProcedures/create'),
	update: require('./autoProcedures/update'),
	remove: require('./autoProcedures/remove'),
	read: require('./autoProcedures/read'),
	list: require('./autoProcedures/list')
};

module.exports = {
	/**
	 * This starts the procedure generator.
	 * It travels through all defined entity types and tries to create CRUD+L procedures.
	 * @param {object} declarations
	 * @param {object} userProcedures Already defined procedures from the user
	 * @param {function} defineProcedure A mesa function to register procedures.
	 * @param {function} log A mesa function to render log messages
	 */
	init: (declarations, userProcedures, defineProcedure, log) => {
		Object.entries(declarations).forEach(([name, declaration]) => {
			if (!declaration.procedures) {
				return;
			}

			/**
			 * Iterates over the "procedures" array of the entity. This array
			 * lists procedures that should be automatically declared.
			 */
			declaration.procedures.forEach(def => {
				const procedureName = `${name}.${def.name}`;
				if (userProcedures[procedureName]) {
					log(`Skipping already defined procedure "´b${procedureName}´w"`);
					return;
				}

				if (autoProcedures[def.name] === undefined) {
					log(`´rProcedure "´y${procedureName}´r" could not be automatically generated. Unknown type "´y${def.name}´r".`);
					return;
				}

				log(`Auto-defining procedure "´b${procedureName}´w" - needs user: ´b${def.user ? 'yes' : 'no'}´w, needs right: ´b${def.right || '-'}`);
				/**
				 * This defines the procedure.
				 * A pre-init will be done, handing over the entity type name, name of the procedure
				 * and procedure definition data.
				 */
				defineProcedure(
					procedureName,
					autoProcedures[def.name](name, procedureName, def)
				);
			});
		});
	},
	autoProcedures
};
