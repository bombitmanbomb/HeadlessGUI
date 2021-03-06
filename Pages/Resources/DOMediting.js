const path = require('path')
const {store,config,themes} = require(path.join(__dirname,"store"))


/**
 * File Path to a File 
 * @typedef {string} FilePath
 */


        

/** Remove a page element
 * @param {string} elementId
 * @deprecated
 */
function removeElement(elementId) {
	// Removes an element from the document
	document.getElementById(elementId).remove()
}
/** Create a Page Element
 * @param {string} parentId
 * @param {string} elementTag
 * @param {string} elementId
 * @param {string} elementClass
 * @param {string} html
 * @deprecated
 */
function addElement(parentId, elementTag, elementId, elementClass, html) {
	// Adds an element to the document
	var p = document.getElementById(parentId);
	var newElement = document.createElement(elementTag);
	newElement.setAttribute('id', elementId);
	newElement.setAttribute('class', elementClass);
	newElement.innerHTML = html;
	p.appendChild(newElement);
}
/**Load a Js or CSS File
 * @param {FilePath} filename
 * @param {string} filetype
 * @private
 */
function loadjscssfile(filename, filetype) {
	if (filetype == "js") { //if filename is a external JavaScript file
		var fileref = document.createElement('script')
		fileref.setAttribute("type", "text/javascript")
		fileref.setAttribute("src", filename)
	} else if (filetype == "css") { //if filename is an external CSS file
		var fileref = document.createElement("link")
		fileref.setAttribute("rel", "stylesheet")
		fileref.setAttribute("type", "text/css")
		fileref.setAttribute("href", filename)
	}
	if (typeof fileref != "undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref)
}
/**Load a Js or CSS File
 * @param {FilePath} filename
 * @param {string} filetype
 */
function createjscssfile(filename, filetype) {
	if (filetype == "js") { //if filename is a external JavaScript file
		var fileref = document.createElement('script')
		fileref.setAttribute("type", "text/javascript")
		fileref.setAttribute("src", filename)
	} else if (filetype == "css") { //if filename is an external CSS file
		var fileref = document.createElement("link")
		fileref.setAttribute("rel", "stylesheet")
		fileref.setAttribute("type", "text/css")
		fileref.setAttribute("href", filename)
	}
	return fileref
}
/**
 *Load a Js or CSS File, Replacing oldname
 *
 * @param {string} oldfilename
 * @param {string} newfilename
 * @param {string} filetype
 */
function replacejscssfile(oldfilename, newfilename, filetype) {
	var targetelement = (filetype == "js") ? "script" : (filetype == "css") ? "link" : "none" //determine element type to create nodelist using
	var targetattr = (filetype == "js") ? "src" : (filetype == "css") ? "href" : "none" //determine corresponding attribute to test for
	var allsuspects = document.getElementsByTagName(targetelement)
	for (var i = allsuspects.length; i >= 0; i--) { //search backwards within nodelist for matching elements to remove
		if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(oldfilename) != -1) {
			var newelement = createjscssfile(newfilename, filetype)
			allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i])
		}
	}
}
/**
 *Setup the page Theme
 *
 */
function newTheme(oldfilename, newfilename, filetype){
	replacejscssfile(oldfilename,newfilename,filetype)
}
function setupThemes() {
	loadjscssfile(themes.get(`Themes.${config.get('currentTheme.name')}.url`), 'css')
	//loadjscssfile('./Resources/Icons-', 'css')
}


/**
 * Update to a new theme(If changed)
 *
 */
function updateTheme() {
	console.log("updateTheme")
	const reload = require('electron-css-reload');
	document.getElementById('Theme').href = themes.get(`Themes.${config.get('currentTheme.name')}.url`)
	reload()
}
module.exports = {setupThemes,removeElement,addElement,replacejscssfile,loadjscssfile,createjscssfile,newTheme}