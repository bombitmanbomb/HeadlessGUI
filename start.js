process.env.NODE_ENV = ((process.argv.indexOf("--debug")>-1)?'development':'production');
const os = require("os");
const PLATFORM = os.platform()
console.log(PLATFORM)
console.log(process.env.NODE_ENV)
const unhandled = require('electron-unhandled');
unhandled();
const electron = require('electron');
const url = require('url');
const path = require('path');
const uuidv4 = require('uuid/v4');
const fetch = require('node-fetch');
const jsdoc2md = require('jsdoc-to-markdown')

/**EventBus;
 * This is a standard Event Emitter linking the Server, Windows, and main process
 * @namespace {Object} bus
 * @listens {{Server:Update|Server:Log|Console:Close}}
 * @see EventEmitter
 */
var bus = require('./eventBus')
var md = require('markdown-it')();
const {
	crashReporter,
	dialog,
	app,
	BrowserWindow,
	Menu,
	ipcMain,
	Tray,
	remote
} = electron;
const NEOS = require('@bombitmanbomb/neosjs')
/**
 * Window Manager
 */
const Window = require('./WindowManager')(bus).WindowManager;
ipcMain.on('fetchDocs', function (e) {
	var Docs = jsdoc2md.renderSync({
		files: './*.js'
	})
	window.sendData('EditorWindow', 'Documentation:Update', Docs)
})

/**
 * System Window Manager
 */
const window = new Window(BrowserWindow);
const {store,config,themes} = require(path.join(__dirname,"Pages/Resources/store"))
//Predefine Windows in Global Space
const fs = require('fs-extra'); //Recursive Folder Delete



console.log("ARGUMENTS",process.argv)
store.set("pseudo", (process.argv.indexOf("--translationDebug")>-1))




/**
 * Neos API Endpoints
 */
const CLOUDX_PRODUCTION_NEOS_API = "https://cloudx.azurewebsites.net/";
const CLOUDX_STAGING_NEOS_API = "https://cloudx-staging.azurewebsites.net/";
const CLOUDX_NEOS_BLOB = "https://cloudxstorage.blob.core.windows.net/";
const CLOUDX_NEOS_CDN = "https://cloudx.azureedge.net/";
const LOCAL_NEOS_API = "http://localhost:60612";
const LOCAL_NEOS_BLOB = "http://127.0.0.1:10000/devstoreaccount1/";
const ICON_GLOBAL_PNG = path.join(__dirname, '/images/icon.png')
const ICON_GLOBAL_ICO = path.join(__dirname, '/images/icon.ico')
/**
 * Close all Windows
 * (Excluding Console Windows, Handling Later)
 */
function closeAllWindows() {
	window.closeAllWindows()
}
//Init
/** System Path
 * @typedef {String} path
 */

/** Path to %AppData%/Headless Core/
 * @const {path} dataDir
 */
var dataDir = app.getPath('userData')
/** Path to %AppData%/Headless Core/Scripts/
 * @const {path} scriptsDir
 */
var scriptsDir = path.join(dataDir, 'Scripts')
/** Path to %AppData%/Headless Core/Scripts/Enabled
 * @const {path} enabledScriptsDir
 */
var enabledScriptsDir = path.join(scriptsDir, 'Enabled')
/** Path to %AppData%/Headless Core/Scripts/Disabled
 * @const {path} disabledScriptsDir
 */
var disabledScriptsDir = path.join(scriptsDir, 'Disabled')
/** Path to %AppData%/Headless Core/Active Sessions/
 * @const {path} sessionsDir
 */
var sessionsDir = path.join(dataDir, "Active Sessions")
fs.removeSync(sessionsDir)
// Setup Scripts folder
if (!fs.pathExistsSync(scriptsDir)) {
	fs.mkdirSync(scriptsDir)
}
if (!fs.pathExistsSync(disabledScriptsDir)) {
	fs.mkdirSync(disabledScriptsDir)
}
if (!fs.pathExistsSync(enabledScriptsDir)) {
	fs.mkdirSync(enabledScriptsDir)
}
/** Path to %AppData%/Headless Core/Lang/
 * @const {path} langDir
 */
var langDir = path.join(dataDir, 'Lang')
if (!fs.pathExistsSync(langDir)) {
	fs.copySync(path.join(__dirname, "Lang"), langDir)
}
var lang = {}
let filenames = fs.readdirSync(langDir)
store.set('langDir', langDir)
filenames.forEach(function (filename) {
	let content = fs.readFileSync(path.join(langDir, filename))
	lang[filename] = JSON.parse(content);
})


const LocalizedStrings = require('localized-strings').default
var strings = new LocalizedStrings(lang, {
	pseudo: store.get("pseudo")
})
strings.setLanguage(config.get('lang'))

const {
	Instances
} = require("./Server.js")(bus, strings, config)
const instances = new Instances()
if (!store.has('MachineId')) { //For API Calls
	store.set('MachineId', uuidv4())
}



//Check if there is an internet connection, and set values accordingly

checkInternet(function (isConnected) {
	if (isConnected) {
		store.set('isConnected', true)
		if ((store.has('NEOS:token') && (new Date(store.get('NEOS:token:expire')) > new Date()))) {

			login(store.get('loginCredentials'), store.get('loginPassword')) // Login to Neos (If Able)
		}
	} else {
		store.set('isConnected', false)
	}
})

//Disable SubMenu & Dev tools

const contextMenu = require('electron-context-menu');
if (process.env.NODE_ENV != 'production') {
	contextMenu({
		/**
		 * @private
		 * @function
		 */

		prepend: (defaultActions, params, browserWindow) => [{
				label: 'Rainbow',
				// Only show it when right-clicking images
				visible: params.mediaType === 'image'
			},
			{
				label: 'Search Google for “{selection}”',
				// Only show it when right-clicking text
				visible: params.selectionText.trim().length > 0,
				/**
				 * @private
				 * @function
				 */

				click: () => {
					shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
				}
			}
		]
	});
}


if (!themes.has('Themes')) {
	config.set('currentTheme.name', 'Darkly')
	config.set('currentTheme.dark',true)
	themes.set('Themes', {
		"Darkly": {
			"url": `./CSS/Darkly.css`,
			"type": "file",
			"description": "Flatly in night mode",
			"dark":true
		},
		"Flatly": {
			"url": `./CSS/Flatly.css`,
			"type": "file",
			"description": "Flat and modern",
			"dark":false
		},
		"Cyborg": {
			"url": `./CSS/Cyborg.css`,
			"type": "file",
			"description": "Jet black and electric blue",
			"dark":true
		},
		"Minty": {
			"url": `./CSS/Minty.css`,
			"type": "file",
			"description": "A fresh feel",
			"dark":false
		},
		"Sketchy": {
			"url": `./CSS/Sketchy.css`,
			"type": "file",
			"description": "A hand-drawn look for mockups and mirth",
			"dark":false
		},
		"Solar": {
			"url": `./CSS/Solar.css`,
			"type": "file",
			"description": "A spin on Solarized",
			"dark":true
		},
		"Superhero": {
			"url": `./CSS/Superhero.css`,
			"type": "file",
			"description": "The brave and the blue",
			"dark":true
		}
	})
}
let singlemode = false

// Listen for App to be ready
let tray = null
app.on('ready', function () {

	
	const contextMenu = Menu.buildFromTemplate(mainMenuTemplate)
	


	Menu.setApplicationMenu(Menu.buildFromTemplate(mainMenuTemplate))
	// Create new Window
	if (process.argv.indexOf("--light")>-1) {
		tray = new Tray(ICON_GLOBAL_PNG)
		tray.setToolTip('HeadlessGUI')
		tray.setContextMenu(contextMenu)
		window.createWindow('MainWindow', {
			backgroundColor: '#303030',
			parent: 'MainWindow',
			width: 1920,
			height: 1080,
			title: "Main Window",
			icon: ICON_GLOBAL_PNG,
			webPreferences: {
				nodeIntegration: true
			}
		}, {
			page: {
				pathname: path.join(__dirname, '/Pages/mainWindow.html'),
				protocol: 'file:',
				slashes: true,
			},
			
		},false)
		//window.Windows['MainWindow'].setMenu(Menu.buildFromTemplate(mainMenuTemplate))
		window.Windows['MainWindow'].on('closed', function () {
			safeQuit()
		})
		window.Windows['MainWindow'].on('close', (e) => {
			if (JSON.stringify(instances.all()) === '{}') {
				return false
			} else {
				e.preventDefault()
				dialog.showMessageBox(null, {
					type: 'question',
					buttons: [strings.getString("Terms.Cancel"), strings.getString("Terms.Yes"), strings.getString("Terms.No")],
					defaultId: 2,
					title: strings.getString("Notifications.closeTitle"),
					message: strings.getString("Notifications.closeMessage"),
					detail: strings.getString("Notifications.closeDetail")
				}).then((e) => {
					if (e.response === 1) {
						safeQuit()
					}
				})
			}
		})
	} else {
		window.createWindow('MainWindow', {
			backgroundColor: '#303030',
			parent: 'MainWindow',
			width: 1920,
			height: 1080,
			title: "Main Window",
			icon: ICON_GLOBAL_PNG,
			webPreferences: {
				nodeIntegration: true
			}
		}, {
			page: {
				pathname: path.join(__dirname, '/Pages/mainWindow.html'),
				protocol: 'file:',
				slashes: true,
			}
		})
		window.Windows['MainWindow'].setMenu(Menu.buildFromTemplate(mainMenuTemplate))
		window.Windows['MainWindow'].on('closed', function () {
			safeQuit()
		})
		window.Windows['MainWindow'].on('close', (e) => {
			if (JSON.stringify(instances.all()) === '{}') {
				return false
			} else {
				e.preventDefault()
				dialog.showMessageBox(null, {
					type: 'question',
					buttons: [strings.getString("Terms.Cancel"), strings.getString("Terms.Yes"), strings.getString("Terms.No")],
					defaultId: 2,
					title: strings.getString("Notifications.closeTitle"),
					message: strings.getString("Notifications.closeMessage"),
					detail: strings.getString("Notifications.closeDetail")
				}).then((e) => {
					if (e.response === 1) {
						safeQuit()
					}
				})
			}
		})
	}
	//Create Main Window
	
});
//QUIT HANDELING

shuttingDown = false
/**
 * Safely quit the program
 */
function safeQuit() {
	shuttingDown = true
	instances.endAll()
}


/**
 * Remove Session Directory and quit app
 *
 */
function ClearQuit() {

	fs.removeSync(sessionsDir)
	window.closeWindow('MainWindow')
	setTimeout(() => {
		app.quit()
	}, 5000) // Need a better way to do this
}
/**
 * Open the New Server window
 *
 */
function createAddWindow() {
	if (!store.get('isConnected')&&!singlemode) {
		window.sendData('MainWindow', 'NOCONNECTION')
		return
	}
	if (!store.get('configSet') || !store.get('loginPassword')) {
		window.sendData('MainWindow', 'ConfigError')
		return
	}
	window.sendData('MainWindow', 'removeStart')

	window.createWindow('AddWindow', {
		backgroundColor: '#303030',
		parent: 'MainWindow',
		show: false,
		darkTheme: true,
		width: 800,
		height: 800,
		title: "New Server",
		icon: ICON_GLOBAL_PNG,
		webPreferences: {
			nodeIntegration: true
		}
	}, {
		page: {
			pathname: path.join(__dirname, '/Pages/addWindow.html'),
			protocol: 'file:',
			slashes: true,
		}
	},true)
}

/**
 * Open the Login Window
 *
 */
function createLoginWindow() {
	window.createWindow('LoginWindow', {
		backgroundColor: '#303030',
		parent: 'ConfigWindow',
		show: false,
		darkTheme: true,
		width: 500,
		height: 300,
		title: "Neos Login",
		icon: path.join(__dirname, 'images/GraphicIcon_-_Golden_Neos.png'),
		webPreferences: {
			nodeIntegration: true
		}
	}, {
		page: {
			pathname: path.join(__dirname, 'Pages/NeosLogin.html'),
			protocol: 'file:',
			slashes: true,
		}
	})
}

/**
 * Open the Config Menu
 */
function createConfigWindow() {
	window.createWindow('ConfigWindow', {
		backgroundColor: '#303030',
		parent: 'MainWindow',
		width: 1000,
		show: false,
		height: 810,
		title: "Config",
		icon: ICON_GLOBAL_PNG,
		webPreferences: {
			nodeIntegration: true
		}
	}, {
		page: {
			pathname: path.join(__dirname, '/Pages/ConfigWindow.html'),
			protocol: 'file:',
			slashes: true,
		},
		children: ['LoginWindow']
	})
}


/**
 * Open a Window to a URL
 *
 * @param {URL} URL www.host.com
 */
function createURLWindow(URL, width = 1080, height = 1080) {
	window.createWindow('URLWINDOW' + uuidv4(), {
		
		parent: 'MainWindow',
		show: false,
		darkTheme: true,
		width: 1080,
		height: 1080,
		title: "WINDOW",
		icon: path.join(__dirname, '/images/polylogix.jpg'),
		webPreferences: {
			nodeIntegration: false
		}
	}, {
		page: {
			pathname: URL,
			protocol: 'https:',
			slashes: true,
		}
	})
}
/**
 * Open the Script Editor Window
 */
function createEditorWindow() {
	window.createWindow('EditorWindow', {
		backgroundColor: '#303030',
		parent: 'ConfigWindow',
		show: false,
		darkTheme: true,
		width: 1920,
		height: 1080,
		title: "Editor",
		icon: path.join(__dirname, '/images/polylogix.jpg'),
		webPreferences: {
			nodeIntegration: true
		}
	}, {
		page: {
			pathname: path.join(__dirname, 'Pages/ScriptEditor.html'),
			protocol: 'file:',
			slashes: true,
		}
	}, null)
}
/**
 * Login to Neos
 * @ignore 
 * @async
 * @param {string} credential username, or email
 * @param {string} password password
 * @returns {JSON} Session Object
 */
function login(credential, password) {
	
	console.log(`Calling Login for ${credential}...`)
	let loginPayload = {}
	loginPayload.secretMachineId = store.get('MachineId');
	if (credential) {
		if (credential.includes('@')) {
			loginPayload.email = credential
		} else {
			loginPayload.username = credential
		}
	}
	if (password) {
		loginPayload.password = password;
	}
	loginPayload.rememberMe = true
	/* Login User and return Session Token */
	return sendLoginPost(loginPayload)
}
/**
 * Login Payload for Neos
 * @private
 * @typedef {Object} LoginPayload
 * @property {string} secretMachineId - Machine ID, Leaving blank will log out all instances
 * @property {string} [email] - Neos Email
 * @property {string} [username] - Neos Username, Do not use this if Email is supplied
 * @property {string} password - Neos Password
 * @property {boolean} rememberMe - Make token last 7 days
 */
/**
 * Response from Neos Servers
 * @private
 * @typedef {Object} loginResponse
 * @property {string} userId - User ID
 * @property {string} token - Neos Email
 * @property {string} created - When the token was created
 * @property {string} expire - When the token expires
 * @property {boolean} rememberMe - WIll the token work to log in
 * @property {string} secretMachineId - Machine ID
 * @property {string} sourceIP - IP
 * @property {string} partitionKey - Unknown
 * @property {string} rowKey - Unknown
 * @property {string} timestamp - Current time
 * @property {string} eTag - Unknown
 */
/**
 * Send a login request to the Neos Server
 * @ignore
 * @param {LoginPayload} loginPayload Login Info
 * @return {loginResponse} Response from Neos Servers
 * @link https://cloudx.azurewebsites.net/
 * @example sendLoginPost(username:"someUser",password:"password",rememberMe:true})
 */
function sendLoginPost(loginPayload) {
	console.log({
		method: "POST",
		body: JSON.stringify(loginPayload),
		headers: {
			'Content-Type': 'application/json'
		}
	})
	return fetch(CLOUDX_PRODUCTION_NEOS_API + 'api/userSessions', {
			method: "POST",
			body: JSON.stringify(loginPayload),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		.then(res => res.json())
		.then(json => {
			console.log("Login Successfull!")
			store.set('loginCredentials', (loginPayload.email ? loginPayload.email : loginPayload.username))
			store.set('loginPassword', (loginPayload.password ? loginPayload.password : store.get('loginPassword')))
			store.set('NEOS:token', json.token)
			store.set('NEOS:userId', json.userId)
			store.set('NEOS:token:expire', json.expire)
			return json
		}).catch((err) => {
			console.log('Login Failed!')
			if (!store.get('offlineMode')) { //Dont clear Credentials if offline
				store.delete('loginCredentials')
				store.delete('loginPassword')
				store.delete('NEOS:token')
				store.delete('NEOS:userId')
				store.delete('NEOS:token:expire')
			}
			return {
				err: true
			}
		})
}
/* Data Calls from Windows */
ipcMain.on('NEOS:Logout', function (e, info) {
			window.sendData('MainWindow', 'NEOS:Logout')
})
ipcMain.on('NEOS:Login', function (e, info) {
	login(info.neosCredential, info.neosPassword).then((test) => {
		if (!test.err) {
			window.sendData('ConfigWindow', 'NEOS:Login')
			window.sendData('MainWindow', 'NEOS:Login')
			if (window.isOpen('LoginWindow')) {
				window.closeWindow('LoginWindow')
			}

		} else {
			window.sendData('LoginWindow', 'NEOS:Failed', test)
		}
	})

})
ipcMain.on('callWindow:Login', function (e) {
	createLoginWindow()
})
// User has changed the Config
ipcMain.on('Config:Update', function (e, item) {
	//configWindow.close()
	window.sendData('MainWindow', 'removeConfig')
})
// Open Advanced Settings for New Server window

/* Create New Session */
ipcMain.on('server:new', function (e, item) {
	//Create server
	item.id = uuidv4()
	window.sendData('MainWindow', 'Main:updateList', item);
	window.closeWindow('AddWindow')
	instances.newSession({
		sessionsDir: sessionsDir,
		UUID: item.id,
		usernameOverride: item.usernameOverride,
		sessionName: item.sessionName,
		loadWorldURL: item.loadWorldURL,
		maxUsers: item.maxUsers,
		description: item.description,
		saveOnExit: item.saveOnExit,
		autosaveInterval: item.autosaveInterval,
		accessLevel: item.accessLevel,
		loadWorldPresetName: item.loadWorldPresetName,
		autoRecover: item.autoRecover,
		mobileFriendly: item.mobileFriendly,
		tickRate: item.tickRate,
		keeporiginalRoles: item.keepOriginalRoles,
		defaultUserRoles: item.defaultUserRoles,
		idleRestartInterval: item.idleRestartInterval,
		forcedRestartInterval: item.forcedRestartInterval,
		forcePort: item.forcePort,
		autoInviteUsernames: item.autoInviteUsernames,
		autoInviteMessage: item.autoInviteMessage
	})
})
ipcMain.on('new:editor', function (e, item) {
	createEditorWindow()
})
//Open a Browser
ipcMain.on('openURL', function (e, item) {
	createURLWindow(item)
})
ipcMain.on('getUpdateRaw', function (e, session) {
	instances.update(session)
})
ipcMain.on('Console:Command', function (e, item) {
	if (!instances.get(item.id).val()) {
		dialog.showMessageBox(null, {
			type: 'error',
			buttons: ['Ok'],
			defaultId: 2,
			title: "Session Not Found",
			message: `Session ${item.id} not found!`,
			detail: "This session does not exist!"
		})
		return
	}
	instances.runCommand(item.id, item.command)
})
const mainMenuTemplate = [{
		label: strings.getString('Menu.Main'),
		submenu: [{
				label: strings.getString('Menu.New_Server'),
				accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
				/**
				 * @private
				 * @function
				 */
				click() {
					createAddWindow()
				}
			},
			{
				label: strings.getString('Menu.Config'),
				accelerator: process.platform == 'darwin' ? 'Command+P' : 'Ctrl+P',
				/**
				 * @private
				 * @function
				 */
				click() {
					createConfigWindow()
				}
			},
			{
				label: strings.getString('Menu.Refresh'),
				accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
				/**
				 * @private
				 * @function
				 */
				click() {
					RefreshAll()
				}
			},
			{
				type: 'separator'
			},
			{
				label: strings.getString('Menu.Quit'),
				accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
				/**
				 * @private
				 * @function
				 */
				click() {
					safeQuit()
				}
			}
		]
	},
	{
		label: strings.getString('Menu.Help'),
		submenu: [{
				label: strings.getString('Menu.Online_Help'),
				accelerator: process.platform == 'darwin' ? 'F1' : 'F1',
				/**
				 * @private
				 * @function
				 */
				click() {
					createURLWindow('www.github.com/bombitmanbomb/HeadlessGUI/wiki/Introduction')
				}
			},
			{
				label: strings.getString('Menu.MyPXAccount'),
				accelerator: process.platform == 'darwin' ? 'F2' : 'F2',
				/**
				 * @private
				 * @function
				 */
				click() {
					createURLWindow('www.polylogix.studio/PolyLogiX-Account')
				}
			},
			{
				label: strings.getString('Menu.ReportBug'),
				accelerator: process.platform == 'darwin' ? 'F3' : 'F3',
				/**
				 * @private
				 * @function
				 */
				click() {
					createURLWindow('www.github.com/bombitmanbomb/HeadlessGUI/issues')
				}
			},
		]

	},
	{
		label: strings.getString('Menu.SupportUs'),
		/**
		 * @private
		 * @function
		 */
		click() {
			createURLWindow('www.patreon.com/PolyLogiX_VR')
		}
	}
]

// Dev tools so i know when i fuck up
if (process.env.NODE_ENV !== 'production') {
	mainMenuTemplate.push({
		label: 'Developer Tools',
		submenu: [{
				label: 'Toggle DevTools',
				accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
				/**
				 * @private
				 * @function
				 */

				click(item, focusedWindow) {
					focusedWindow.toggleDevTools();
				}
			},
			{
				role: 'reload'
			}
		]
	})
}
if (process.argv.indexOf("--light")>-1) {
	mainMenuTemplate.push({
		label: 'Light Mode',
		submenu: [{
				label: 'Nothing Yet.. :)',
			}
		]
	})
}
/**
 * @async
 * @param {CheckInternetCallback} cb Callback Function
 * @example checkInternet(function(connected){
 * if(connected){
 *  //do
 * } else {
 *  //not
 * }
 * })
 */
async function checkInternet(cb) {
	require('url-exists')(`https://neosvr.com/`, function (err, exists) {
		if (!exists) {
			cb(false);
		} else {
			cb(true);
		}
	});
}
/**
 * @callback CheckInternetCallback
 * @param {boolean} isConnected Has internet Connection
 */


//Server Pipe

bus.on('SessionForceUpdate', function (ID) {
	instances.update(ID)
})
bus.on('clearCache', function (THIS) {
	fs.removeSync(instances.get(THIS.ID).sessionDir)
	instances.clear(THIS.ID)
	if (shuttingDown && JSON.stringify(instances.all()) === '{}') {
		ClearQuit()
	}
})
ipcMain.on('getStore', function(event,args){
	event.returnValue = {'store':store,'config':config,'themes':themes}
})
ipcMain.on('Server:UpdateVisibility',function(event,args){
    instances.setAccess(args.session, args.accessLevel)
})
ipcMain.on('Server:UpdateRole', function (event, args) {
	instances.setRole(args.session, args.user, args.role)
})
bus.on('Server:Update', function (serverObject) {
	window.sendData('MainWindow', "Server:Update", serverObject)
	window.sendData(`ServerManager-${serverObject.ID}`, 'Update:Raw', serverObject)
})
bus.on("Console:Close", function (id) {
	window.closeWindow(`ServerManager-${id}`)
})
bus.on('Server:Log', function (id, message) {
	console.log(`${id}:${message}`)
	window.sendData(`ServerManager-${id}`, 'Server:Log', message)
})
ipcMain.on('fetchLanguage', (event, arg) => {
	event.returnValue = strings.getContent()
})
bus.on('getLang', (event, arg) => {
	bus.emit('sendLang', strings.getContent())
})
ipcMain.on('restartRequired', function (e, id) {
	window.sendData('MainWindow', 'restartRequired')
})
ipcMain.on('openManager', function (e, id) {
	instances.openWindow(id)
	window.createWindow(`ServerManager-${id}`, {
		backgroundColor: '#303030',
		parent: 'MainWindow',
		show: false,
		darkTheme: true,
		width: 1200,
		height: 800,
		title: "Console",
		icon: ICON_GLOBAL_PNG,
		webPreferences: {
			nodeIntegration: true
		}
	}, {
		page: {
			pathname: path.join(__dirname, `/Pages/ServerManager.html`),
			protocol: 'file:',
			slashes: true,
		},
		query: {
			"id": id
		}
	})


})