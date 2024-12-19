// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const encryption = require("./encryption");
const path = require("node:path");
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");
const { Transform } = require("node:stream");

const encHighWaterMark = 1024 * 1024 * 100;
const decHighWaterMark = encHighWaterMark + 32;

const deleteEnabled = true;


// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EN/DECRYPT FILE OPERATIONS                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

// Encrypt file function
async function encryptFile(fileLocation, password) {
	const { dir, ext, name } = path.parse(fileLocation);
	const fileName = name.toLowerCase();

	// Check if the file is already encrypted
	if (fileName.includes("__enc")) {
		throw new Error("already_enc");
	}

	const fileReadStream = fs.createReadStream(fileLocation, {
		highWaterMark: encHighWaterMark,
	});

	const newEncFile = `${dir}/${fileName}__ENC${ext}`;
	const fileWriteStream = fs.createWriteStream(newEncFile);

	await pipeline(
		fileReadStream,
		new Transform({
			transform(chunk, encoding, callback) {
				try {
					const encryptedData = encryption.encrypt(chunk, password);
					callback(null, encryptedData);
				} catch (err) {
					fs.promises.unlink(newEncFile);
					callback(err);
				}
			},
		}),
		fileWriteStream,
	);

	if (deleteEnabled) {
		await fs.promises.unlink(fileLocation);
	}

	return newEncFile;
}

// Decrypt file function
async function decryptFile(encFileLocation, password) {
	const { dir, ext, name } = path.parse(encFileLocation);
	let fileName = name.toLowerCase();

	// Check if the file is encrypted
	if (!fileName.endsWith("__enc")) {
		throw new Error("not_enc");
	}

	const fileReadStream = fs.createReadStream(encFileLocation, {
		highWaterMark: decHighWaterMark,
	});

	fileName = fileName.slice(0, -5); // Remove "__enc" suffix
	const newDecFile = `${dir}/${fileName}${ext}`;
	const fileWriteStream = fs.createWriteStream(newDecFile);

	await pipeline(
		fileReadStream,
		new Transform({
			transform(chunk, encoding, callback) {
				try {
					const decryptedData = encryption.decrypt(chunk, password);
					callback(null, decryptedData);
				} catch (err) {
					fs.promises.unlink(newDecFile);
					callback(err);
				}
			},
		}),
		fileWriteStream,
	);

	if (deleteEnabled) {
		await fs.promises.unlink(encFileLocation);
	}

	return newDecFile;
}

module.exports = { encryptFile, decryptFile };
