const { contextBridge, ipcRenderer } = require("electron");

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
