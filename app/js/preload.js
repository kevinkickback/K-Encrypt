// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const { contextBridge, ipcRenderer } = require("electron");
const Toastify = require("toastify-js");

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EXPOSE IPC RENDERER METHODS                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

contextBridge.exposeInMainWorld("ipcExposed", {
	send: (channel, data) => {
		ipcRenderer.send(channel, data);
	},
	on: (channel, callback) => {
		ipcRenderer.on(channel, (event, data) => {
			callback(data);
		});
	},
	invoke: (channel, data) => {
		return ipcRenderer.invoke(channel, data);
	},
});

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EXPOSE TOSTIFY                                                                       ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

contextBridge.exposeInMainWorld("Toastify", {
	toast: (options) => Toastify(options).showToast(),
});