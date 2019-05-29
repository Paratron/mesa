const errors = require('../errors');

let sessions = {};

const respondSuccess = (callback, data) => callback({ok: data});

const respondError = (callback, error) => callback({error});

module.exports = {
	/**
	 * This function will be called
	 * @param declarations
	 * @param procedures
	 * @param callProcedure
	 * @param receiveBroadcast
	 * @param config
	 * @returns {Promise<any>}
	 */
	initialize: (
		{
			declarations,
			procedures,
			metaData,
			callProcedure,
			receiveBroadcast,
			config,
			log
		}
	) => new Promise((resolve, reject) => {
		const http = require('http');
		const IO = require('socket.io');
		const server = http.createServer();
		server.listen(config.port || 80, () => {
			log('Websockets available on port', config.port || 80);
			resolve();
		});

		const discoveryData = {
			metaData,
			declarations,
			procedures: Object.keys(procedures)
		};

		const io = IO.listen(server);

		io.on('connection', socket => {
			sessions[socket.id] = {
				user: null
			};

			socket.once('disconnect', () => {
				delete sessions[socket.id];
			});

			if (config.admin) {
				socket.on('rpc', (props, callback) => {
					log('´bRPC IN: ', JSON.stringify(props, null, 2));
					(async () => {
						const {procedure, args} = props;
						const session = sessions[socket.id];
						const {
							user
						} = session;

						switch (procedure) {
							/**
							 * This is not handled under "default" even tough its a
							 * "regular" procedure call, because we want to grab the
							 * resulting user object on success and store it in the session.
							 */
							case 'user.auth':
								try {
									let result = await callProcedure('user.auth', null, args);
									delete result.password;
									sessions[socket.id].user = result;
									log('´gRPC OK', JSON.stringify(result, null, 2));
									result.discoveryData = discoveryData;
									respondSuccess(callback, result);
								} catch (e) {
									log('´rRPC ERROR', e);
									respondError(callback, e);
								}
								break;
							default:
								try {
									const result = await callProcedure(procedure, user, args);
									log('´gRPC OK', JSON.stringify(result, null, 2));
									respondSuccess(callback, result);
								} catch (e) {
									log('´rRPC ERROR', e);
									respondError(callback, e);
								}
						}
					})();
				});
			}
		});
	}),
	/**
	 * Shutdown procedure - called when the backend should quit
	 * @param declarations
	 */
	terminate: ({declarations}) => {

	}
};
