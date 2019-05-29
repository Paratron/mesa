let declarations = {};
let definedStores = {};
let definedConnectors = {};
let procedures = {};
let booted = false;
const chalk = require('chalk');
const broadcast = require('./broadcast');

const defaultProcedures = ['create', 'update', 'remove', 'read', 'list'];

let metaData = {
	title: 'SOL Project'
};

const stores = {
	simple: 'simple'
};

const connectors = {
	websocket: 'websocket'
};

/**
 * Registers a new (data) entity within the mesa declarations.
 * This declaration contains information for the store, procedure
 * and connector parts to configure themselves.
 * @param {string} name
 * @param {object} declaration
 * @param {boolean} [force=false] Force-declare this entity, even if it already exists.
 */
const declareEntity = (name, declaration, force) => {
	if (booted) {
		throw new Error('Please declare all entities before booting your application');
	}

	if (declarations[name] && !force) {
		throw new Error(`Entity ${name} has already been declared.`);
	}

	if (declaration.procedures === true) {
		declaration.procedures = defaultProcedures;
	}

	// Normalize the procedure definition rules
	if (declaration.procedures) {
		declaration.procedures = declaration.procedures.map(def => {
			if (typeof def === 'string') {
				return {name: def, user: true, right: `${name}.${def}`};
			}
			return def;
		});
	}

	declarations[name] = declaration;
};

/**
 * Registers a new store to be used by the application.
 * Give your store a name to access it from within a procedure.
 * @param {string} name
 * @param {object} storeObj
 */
const useStore = (name, storeObj) => {
	if(typeof storeObj === 'string'){
		storeObj = require(`./stores/${storeObj}`);
	}

	if (booted) {
		throw new Error('Please introduce all stores before booting your application');
	}

	if (definedStores[name]) {
		throw new Error(`Store ${name} has already been declared.`);
	}

	definedStores[name] = storeObj;
};

/**
 * Will define a connector to enable procedures being able to be called
 * from the outside.
 * @param {string} name
 * @param {function} connectorObject
 * @param {object} [config]
 */
const useConnector = (name, connectorObject, config) => {
	if(typeof connectorObject === 'string'){
		connectorObject = require(`./connectors/${connectorObject}`);
	}

	if (booted) {
		throw new Error('Please introduce all connectors before booting your application');
	}

	if (definedConnectors[name]) {
		throw new Error(`Connector ${name} has already been declared.`);
	}

	definedConnectors[name] = [connectorObject, config];
};

const setMetaData = (data) => Object.assign(metaData, data);

/**
 * Will define a new procedure to be available for calls
 * from your connectors.
 * @param {string} name
 * @param {function({stores, declarations, tools}):function} initFunction
 */
const defineProcedure = (name, initFunction) => {
	if (booted) {
		throw new Error('Please introduce all procedures before booting your application');
	}

	if (procedures[name]) {
		throw new Error(`Procedure ${name} has already been declared.`);
	}

	procedures[name] = initFunction;
};

/**
 * Calls a predefined and initialized procedure.
 * @param {string} name Name of the procedure to be called
 * @param {object|string} [user=null] User object to put in context
 * @param {object} [args] Optional arguments to pass into the procedure
 */
const callProcedure = (name, user, args) => {
	if (!booted) {
		throw new Error('Please boot your application, before calling procedures');
	}

	if (!procedures[name]) {
		throw new Error(`Undefined procedure "${name}"`);
	}

	return procedures[name]({user, args});
};

const chalkMap = {
	'r': 'red',
	'g': 'green',
	'y': 'yellow',
	'b': 'blue',
	'm': 'magenta',
	'c': 'cyan',
	'w': 'white',
	'#': 'gray',
	'.': 'black',
	'R': 'bgRed',
	'G': 'bgGreen',
	'Y': 'bgYellow',
	'B': 'bgBlue',
	'M': 'bgMagenta',
	'C': 'bgCyan',
	'W': 'bgWhite'
};

const log = (...messages) => {
	const finalMessages = messages.map(m => {
		if (typeof m !== 'string') {
			return m;
		}

		const chunks = `${m.substr(0, 1) !== '´' ? '´w' : ''}${m}`.split('´');
		chunks.shift();

		return chunks.map(c => {
			const colorCode = c.substr(0, 1);
			const functionName = chalkMap[colorCode];
			return chalk[functionName](c.substr(1));
		}).join('');
	});
	console.log.apply(this, finalMessages);
};

/**
 * Useful functions to be called from within procedures.
 * @type {{}}
 */
const tools = {
	/**
	 * Checks if the user object has the given right.
	 * @param {object|string} user
	 * @param {string} rightName
	 */
	hasRight: (user, rightName) => {
		// String users are system users. They can do everything.
		if (typeof user === 'string') {
			return true;
		}

		if (!user.rights) {
			return false;
		}

		if (user.rights.indexOf('*') !== -1) {
			return true;
		}

		return user.rights.indexOf(rightName) !== -1;
	},
	/**
	 * Broadcasts an event system wide.
	 * @param name
	 * @param data
	 */
	broadcast: broadcast.send
};

/**
 * Will start the application 🤘
 */
const boot = async () => {
	log(`´gStarting ${metaData.title}`);
	log(`Starting ${metaData.title}`.replace(/./g, '='));
	log('');

	log('´gSetting up user system');
	require('./usersystem').init(declarations);
	log('========================');
	log('');

	log('´gInitializing stores');
	await Object.entries(definedStores).map(([name, store]) => {
		log(`Initializing "´b${name}´w" store.`);
		return store.initialize({declarations, log});
	});
	log('========================');
	log('');

	log('´gGenerating automatic procedures');
	require('./procGen').init(declarations, procedures, defineProcedure, log);
	log('========================');
	log('');

	log('´gInitializing procedures');
	procedures = Object.entries(procedures).map(([name, procedure]) => {
		log(`Initializing "´b${name}´w" procedure.`);
		return [name, procedure({stores: definedStores, declarations, tools})];
	}).reduce((acc, [name, procedure]) => (acc[name] = procedure, acc), {});
	log('========================');
	log('');

	log('´gInitializing connectors');
	await Object.entries(definedConnectors).map(([name, [connector, config]]) => {
		log(`Initializing "´b${name}´w" connector.`);
		return connector.initialize({
			metaData,
			declarations,
			procedures,
			callProcedure,
			receiveBroadcast: broadcast.receive,
			config,
			log
		});
	});
	log('========================');
	log('');

	log('´gBoot done.');
	booted = true;
};

module.exports = {
	stores,
	connectors,
	setMetaData,
	declareEntity,
	useStore,
	useConnector,
	defineProcedure,
	callProcedure,
	boot,
	log,
};
