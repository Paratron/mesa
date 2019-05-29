/**
 * Broadcast
 * =========
 * This module enables sending and receiving broadcast messages
 * across any part of the application that imports this module.
 */

let pool = {};

/**
 * Sends a broadcast message.
 * @param {string} name
 * @param {*} [data]
 */
const send = (name, data) => {
	const callbacks = pool[name];

	if (!callbacks || !callbacks.length) {
		return;
	}

	for (let i = 0; i < callbacks.length; i++) {
		callbacks[i].call(this, data);
	}
};

/**
 * Listens for a broadcast message.
 * @param {string} name
 * @param {function} callback
 * @returns {Function} A termination function to be called to stop listening.
 */
const receive = (name, callback) => {
	if (!pool[name]) {
		pool[name] = [];
	}

	pool[name].push(callback);

	return () => {
		const i = pool[name].indexOf(callback);
		pool[name].splice(i, 1);
	};
};

module.exports = {
	send,
	receive
};
