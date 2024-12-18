// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const { contextBridge, ipcRenderer } = require("electron");
const Toastify = require("toastify-js");

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EXPOSE IPC RENDERER METHODS                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

contextBridge.exposeInMainWorld("ipcExposed", {
	send: (channel, ...args) => {
		ipcRenderer.send(channel, ...args);
	},
	on: (channel, callback) => {
		const listener = (event, ...args) => callback(...args);
		ipcRenderer.on(channel, listener);
		return () => ipcRenderer.removeListener(channel, listener);
	},
	invoke: (channel, ...args) => {
		return ipcRenderer.invoke(channel, ...args);
	},
});

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EXPOSE TOSTIFY                                                                       ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

contextBridge.exposeInMainWorld("Toastify", {
	toast: (options) => Toastify(options).showToast(),
});