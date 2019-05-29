const mesa = require('./system');

// Load definitions
require('./config');

// And go!
mesa.boot().then(async () => {
	await mesa.callProcedure('user.create', 'system', {
		mail: 'test@example.com',
		password: 'test'
	});

	console.log('Created a user!');
});
