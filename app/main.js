// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron");
const path = require("node:path");
const { encryptFile, decryptFile } = require("./js/encryption/fileHandler.js");

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ CREATE MAIN WINDOW                                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		width: 400,
		height: 500,
		resizable: false,
		icon: path.resolve(__dirname, "img", "icon.ico"),
		webPreferences: {
			sandbox: false,
			contextIsolation: true,
			nodeIntegration: false,
			preload: path.join(__dirname, "js", "preload.js"),
		},
	});

	// Event listeners on the window
	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow.show();
		mainWindow.focus();
	});

	// Load our HTML file
	//mainWindow.webContents.openDevTools();
	mainWindow.loadFile(path.join(__dirname, "index.html"));

	// Adjust window size if devTools are enabled
	mainWindow.webContents.on("devtools-opened", () => {
		mainWindow.setSize(800, mainWindow.getSize()[1]);
	});

	// Links open externaly if target="_blank"
	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// Return mainWindow for use outside of function
	return mainWindow;
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ CREATE MODAL WINDOW                                                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

function createModalWindow(type) {
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
	//modalWindow.webContents.openDevTools();
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

	// Adjust window size if devTools are enabled
	modalWindow.webContents.on("devtools-opened", () => {
		modalWindow.setSize(800, 800);
	});

	// Links open externaly if target="_blank"
	modalWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url);
		return { action: "deny" };
	});

	// Return modalWindow for use outside of function
	return modalWindow;
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ APP & WINDOW BEHAVIOR                                                                ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

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


// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IPC HANDELING                                                                        ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

// Open modal window
ipcMain.on("modalWindow", (event, type) => {
	createModalWindow(type);
});

// Encrypt file
ipcMain.handle("encrypt-file", async (event, { fileLocation, password }) => {
	const result = await encryptFile(fileLocation, password);
	return result;
});

// Decrypt file
ipcMain.handle("decrypt-file", async (event, { fileLocation, password }) => {
	const result = await decryptFile(fileLocation, password);
	return result;
});
