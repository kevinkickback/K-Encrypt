const encryption = require("./encryption");
const path = require("node:path");
const fs = require("node:fs");
const { pipeline } = require("node:stream/promises");
const { Transform } = require("node:stream");

// File signature constants and stream configuration
const FILE_SIGNATURE = Buffer.from("K-ENCRYPT");
const FILE_SIGNATURE_LENGTH = FILE_SIGNATURE.length;
const encHighWaterMark = 1024 * 1024 * 100;
const decHighWaterMark = encHighWaterMark + 32;

let deleteEnabled = true;

// Toggle file deletion setting
function toggleDelete(enabled) {
	deleteEnabled = enabled;
}

// Create transform stream for encryption/decryption
const createCryptoTransform = (operation, password, outputFile) => {
	return new Transform({
		transform(chunk, encoding, callback) {
			try {
				const processedData = operation === 'encrypt'
					? encryption.encrypt(chunk, password)
					: encryption.decrypt(chunk, password);
				callback(null, processedData);
			} catch (err) {
				fs.promises.unlink(outputFile).catch(() => { });
				callback(err);
			}
		}
	});
};

// Verify file signature
async function verifyFileSignature(fileLocation, expectEncrypted) {
	const headerBuffer = Buffer.alloc(FILE_SIGNATURE_LENGTH);
	const fileHandle = await fs.promises.open(fileLocation, 'r');

	try {
		await fileHandle.read(headerBuffer, 0, FILE_SIGNATURE_LENGTH, 0);
		const isEncrypted = headerBuffer.equals(FILE_SIGNATURE);

		if (expectEncrypted && !isEncrypted) {
			throw new Error("not encrypted");
		}

		if (!expectEncrypted && isEncrypted) {
			throw new Error("already encrypted");
		}

		return isEncrypted;
	} finally {
		await fileHandle.close();
	}
}

// File encryption with signature verification
async function encryptFile(fileLocation, password) {
	const { dir, ext, name } = path.parse(fileLocation);
	const fileName = name.toLowerCase();
	const newEncFile = `${dir}/${fileName}__ENC${ext}`;

	try {
		await verifyFileSignature(fileLocation, false);
	} catch (error) {
		if (error.message === "already encrypted") throw error;
		// Other errors will be caught during actual encryption
	}

	// Write signature header then encrypt file content
	const fileWriteStream = fs.createWriteStream(newEncFile);
	fileWriteStream.write(FILE_SIGNATURE);

	try {
		await pipeline(
			fs.createReadStream(fileLocation, { highWaterMark: encHighWaterMark }),
			createCryptoTransform('encrypt', password, newEncFile),
			fileWriteStream
		);

		if (deleteEnabled) await fs.promises.unlink(fileLocation);
		return newEncFile;
	} catch (error) {
		// Clean up partial output file on error
		if (fs.existsSync(newEncFile)) {
			await fs.promises.unlink(newEncFile).catch(() => { });
		}
		throw error;
	}
}

// File decryption with signature verification
async function decryptFile(encFileLocation, password) {
	const { dir, ext, name } = path.parse(encFileLocation);
	let fileName = name.toLowerCase();

	await verifyFileSignature(encFileLocation, true);

	// Remove "__enc" suffix if present
	fileName = fileName.endsWith("__enc") ? fileName.slice(0, -5) : fileName;
	const newDecFile = `${dir}/${fileName}${ext}`;

	try {
		await pipeline(
			fs.createReadStream(encFileLocation, {
				start: FILE_SIGNATURE_LENGTH,
				highWaterMark: decHighWaterMark,
			}),
			createCryptoTransform('decrypt', password, newDecFile),
			fs.createWriteStream(newDecFile)
		);

		if (deleteEnabled) await fs.promises.unlink(encFileLocation);
		return newDecFile;
	} catch (error) {
		// Clean up partial output file on error
		if (fs.existsSync(newDecFile)) {
			await fs.promises.unlink(newDecFile).catch(() => { });
		}
		throw error;
	}
}

module.exports = { encryptFile, decryptFile, toggleDelete };
