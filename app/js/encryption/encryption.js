const nodeCrypto = require("node:crypto");
const iterationCount = 2 ** 14;

const encryption = {
	encrypt: (data, password) => {
		const salt = nodeCrypto.randomBytes(16);
		const key = nodeCrypto.scryptSync(password, salt, 32, {
			N: iterationCount,
		});
		const cipher = nodeCrypto.createCipheriv("aes-256-gcm", key, salt);
		const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
		const authTag = cipher.getAuthTag();

		return Buffer.concat([salt, authTag, encryptedData]);
	},
	decrypt: (data, password) => {
		const [salt, authTag, encData] = [
			data.slice(0, 16),
			data.slice(16, 32),
			data.slice(32),
		];

		const key = nodeCrypto.scryptSync(password, salt, 32, {
			N: iterationCount,
		});
		const decipher = nodeCrypto.createDecipheriv("aes-256-gcm", key, salt);

		decipher.setAuthTag(authTag);
		return Buffer.concat([decipher.update(encData), decipher.final()]);
	},
};

module.exports = encryption;