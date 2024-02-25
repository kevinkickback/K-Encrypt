// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const encryption = require("./encryption");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");
const { ipcMain } = require("electron");

const encHighWaterMark = 1024 * 1024 * 100;
const decHighWaterMark = encHighWaterMark + 32;

let deleteEnabled = true;

// // Listen for delete file setting
// ipcMain.on("toggle-delete", (event, isEnabled) => {
//   deleteEnabled = isEnabled;
// });

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EN/DECRYPT FILE OPERATIONS                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

async function encryptFile(fileLocation, password) {
  const fileReadStream = fs.createReadStream(fileLocation, {
    highWaterMark: encHighWaterMark,
  });

  const { dir, ext, name } = path.parse(fileLocation);
  const newEncFile = `${dir}/${name}__ENC${ext}`;
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
    fileWriteStream
  );

  if (deleteEnabled) {
    await fs.promises.unlink(fileLocation);
  }

  return newEncFile;
}

async function decryptFile(encFileLocation, password) {
  const fileReadStream = fs.createReadStream(encFileLocation, {
    highWaterMark: decHighWaterMark,
  });

  const { dir, ext, name } = path.parse(encFileLocation);
  let fileName = name.toLowerCase().endsWith("__enc") ? name.slice(0, -5) : name;

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
    fileWriteStream
  );

  if (deleteEnabled) {
    await fs.promises.unlink(encFileLocation);
  }

  return newDecFile;
}

module.exports = { encryptFile, decryptFile };