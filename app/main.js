const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const { encryptFile, decryptFile, toggleDelete } = require("./js/encryption/fileHandler.js");
const path = require("node:path");

function createMainWindow() {

	const mainWindow = new BrowserWindow({
		width: 400,
		height: 500,
		resizable: false,
		icon: path.resolve(__dirname, 'img', 'icon.ico'),
		webPreferences: {
			sandbox: true,
			contextIsolation: true,
			nodeIntegration: false,
			devTools: !app.isPackaged,
			preload: path.join(__dirname, 'js', 'preload.js')
		}
	});

	// Show and focus mainWindow after loading
	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow.show();
		mainWindow.focus();
	});

	// Load HTML file
	mainWindow.loadFile(path.join(__dirname, 'index.html'));

	// Uncomment to open devTools for debugging
	// mainWindow.webContents.openDevTools();

	// Adjust window size if devTools are enabled
	mainWindow.webContents.on("devtools-opened", () => {
		mainWindow.setSize(800, 500, mainWindow.getSize()[1]);
	});

	// Links open externaly if target="_blank"
	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: 'deny' }
	});

	// Set custom menu for mainWindow (or use null to hide)
	mainWindow.setMenu(null);

	// Return mainWindow for use outside of function
	return mainWindow;
}

function createModalWindow(type, menu) {

	const parentBounds = mainWindow.getBounds();
	const centerX = parentBounds.x + parentBounds.width / 2 - 150;
	const centerY = parentBounds.y + parentBounds.height / 2 - 150;

	modalWindow = new BrowserWindow({
		width: 300,
		height: 300,
		resizable: false,
		parent: mainWindow,
		modal: true,
		x: centerX,
		y: centerY,
		icon: path.resolve(__dirname, "img", "icon.ico"),
	});

	// Event listeners on the window
	modalWindow.webContents.on("did-finish-load", () => {
		modalWindow.show();
		modalWindow.focus();
	});

	// Load different HTML files based on type parameter
	switch (type) {
		case "about":
			modalWindow.loadFile(path.join(__dirname, "about.html"));
			break;
		case "help":
			modalWindow.loadFile(path.join(__dirname, "help.html"));
			break;
		case "license":
			modalWindow.loadFile(path.join(__dirname, "license.html"));
			break;
		default:
			console.log(`Invalid type: ${type}`);
			break;
	}

	// Uncomment to open devTools for debugging
	// modalWindow.webContents.openDevTools();

	// Adjust window size if devTools are enabled
	modalWindow.webContents.on("devtools-opened", () => {
		modalWindow.setSize(600, modalWindow.getSize()[1]);
	});

	// Links open externaly if target="_blank"
	modalWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: 'deny' }
	});

	// Set custom menu or hide it based on conidtion
	if (menu === "on") {
		modalWindow.setMenu(customMenu);
	} else {
		modalWindow.setMenu(null);
	}

	// Return modalWindow for use outside of function
	return modalWindow;
}

// Disabe the native menu bar
Menu.setApplicationMenu(null);

// This method is called when Electron
// has finished initializing
app.whenReady().then(() => {
	mainWindow = createMainWindow();

	app.on("activate", () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) {
			mainWindow = createMainWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// Open modal window
ipcMain.on('modalWindow', (event, type, menu) => {
	createModalWindow(type, menu);
});

// Encrypt file
ipcMain.handle("encrypt-file", async (event, { fileLocation, password }) => {
	const newFileLocation = await encryptFile(fileLocation, password);
	return { newFileLocation };
});

// Decrypt file
ipcMain.handle("decrypt-file", async (event, { fileLocation, password }) => {
	try {
		const newFileLocation = await decryptFile(fileLocation, password);
		return { newFileLocation };
	} catch (error) {
		console.error("Decryption error:", error.message);
		throw error;
	}
});

// Notification handler
ipcMain.handle("notify", (event, { type, message }) => {
	const dialogType = type === "error" ? "error" : "info";
	const returnValue = type === "error" ? "failure" : type === "mixed" ? "mixed" : "success";

	dialog.showMessageBox(mainWindow, {
		type: dialogType,
		buttons: ["OK"],
		message: message
	});

	return returnValue;
});

// Toggle delete original file
ipcMain.on('toggle-delete', (event, enabled) => {
	toggleDelete(enabled);
});