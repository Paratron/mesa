module.exports = {
	missingRight: (right) => `R01: Missing right "${right}" to perform this operation`,
	noAdmin: () => 'RAD: Administrative access not allowed',
	needLogin: () => 'L01: A login is needed to perform this operation',
	missingAuthData: () => 'L02: Please provide mail and password to authenticate',
	invalidMail: (mail) => `"L03: ${mail}" is not a valid mail address`,
	invalidToken: () => 'L04: The provided token is invalid',
	unknownUser: () => 'L05: Unknown user',
	wrongPassword: () => 'L06: Wrong password'
};
