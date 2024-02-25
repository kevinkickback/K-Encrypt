// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const nodeCrypto = require("crypto");
const iterationCount = 2 ** 14;

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EN/DECRYPTION FUNCTION                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const encryption = {
  encrypt: function (data, password) {
    const salt = nodeCrypto.randomBytes(16);
    const key = nodeCrypto.scryptSync(password, salt, 32, { N: iterationCount });
    const cipher = nodeCrypto.createCipheriv("aes-256-gcm", key, salt);
    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([salt, authTag, encryptedData]);
  },
  decrypt: function (data, password) {
    try {
      const [salt, authTag, encData] = [
        data.slice(0, 16),
        data.slice(16, 32),
        data.slice(32),
      ];

      const key = nodeCrypto.scryptSync(password, salt, 32, { N: iterationCount });
      const decipher = nodeCrypto.createDecipheriv("aes-256-gcm", key, salt);

      decipher.setAuthTag(authTag);
      const plainText = Buffer.concat([
        decipher.update(encData),
        decipher.final(),
      ]);

      return plainText;
    } catch (error) {
      throw error; // Throw error back to fileHandler
    }
  }
};

module.exports = encryption;