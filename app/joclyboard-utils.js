/*    Copyright 2017 Jocly
 *
 *    This program is free software: you can redistribute it and/or  modify
 *    it under the terms of the GNU Affero General Public License, version 3,
 *    as published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *    As a special exception, the copyright holders give permission to link the
 *    code of portions of this program with the OpenSSL library under certain
 *    conditions as described in each individual source file and distribute
 *    linked combinations including the program with the OpenSSL library. You
 *    must comply with the GNU Affero General Public License in all respects
 *    for all of the code used other than as permitted herein. If you modify
 *    file(s) with this exception, you may extend this exception to your
 *    version of the file(s), but you are not obligated to do so. If you do not
 *    wish to do so, delete this exception statement from your version. If you
 *    delete this exception statement from all source files in the program,
 *    then also delete it in the license file.
 */
const electron = require("electron");
var settings = require("electron-settings");

const defaultWindowStyle = {
	width: 500,
	height: 600,
	minWidth: 300,
	minHeight: 200,
	acceptFirstMouse: true,
	titleBarStyle: 'hidden',
	frame: true
}

exports.createWindow = function (url, style, options) {
	style = Object.assign({}, defaultWindowStyle, style);
	options = options || {}

	var winGeometry = options.geometry;
	if (!winGeometry && options.persist)
		winGeometry = settings.get("window:" + options.persist, null);
	if (winGeometry) {
		style.width = winGeometry.width;
		style.height = winGeometry.height;
		style.x = winGeometry.x;
		style.y = winGeometry.y;
	}

	var win = new electron.BrowserWindow(style);
	win.setMenu(null);

	var persistTimer = null;
	function PersistGeometry() {
		if (persistTimer)
			clearTimeout(persistTimer);
		persistTimer = setTimeout(() => {
			var size = win.getSize();
			var position = win.getPosition();
			var winGeometry = {
				width: size[0],
				height: size[1],
				x: position[0],
				y: position[1]
			}
			settings.set("window:" + options.persist, winGeometry);
		}, 250);
	}
	if (options.persist) {
		win.on('resize', () => {
			PersistGeometry();
		});
		win.on('move', () => {
			PersistGeometry();
		});
	}

	win.loadURL(url);
	if (options.onClosed)
		win.on('closed', options.onClosed);

	return win;
}

exports.createWindowPromise = function (url, style, options) {
	var promise = new Promise(function (resolve, reject) {
		var window = exports.createWindow(url, style, options);
		window.webContents.once('joclyboard-window-ready', () => {
			resolve(window);
		});
	});
	return promise;
}
