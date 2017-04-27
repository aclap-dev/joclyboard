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
var electron = require('electron');

var ipc = electron.ipcRenderer || electron.ipcMain;

var replyId = 0;
var replies = {};
var listener = null;
var debugLevel = 0;

module.exports = {
	call: function () {
		var window, method, args;
		if (typeof arguments[0] == "object") {
			[window, method, ...args] = arguments;
		} else {
			[method, ...args] = arguments;
		}
		var promise = new Promise(function (resolve, reject) {
			var rid = ++replyId;
			if (debugLevel >= 2)
				console.info("rpc #" + rid, "call =>", method, args);
			replies[rid] = {
				resolve: resolve,
				reject: reject
			}
			var sender = ipc;
			if (window)
				sender = window.webContents;
			sender.send('jocly-message', {
				_request: rid,
				_method: method,
				_args: [...args]
			});
		});
		return promise;
	},
	listen: function (_listener) {
		listener = _listener;
	},
	setDebug: function (_debugLevel) {
		debugLevel = _debugLevel;
	}
}

ipc.on('jocly-message', (event, message) => {
	if (message._request)
		if (!listener)
			event.sender.send('jocly-message', {
				_reply: message._request,
				_error: "No listener installed"
			});
		else
			Promise.resolve()
				.then(() => {
					var method = listener[message._method];
					if (typeof method == "function") {
						if (debugLevel >= 2)
							console.info("rpc #" + message._request, "serve <= ", message._method, message._args);
						return method.apply(listener, message._args);
					} else
						throw new Error("Method " + message._method + " is not a function");
				})
				.then((result) => {
					if (debugLevel >= 2)
						console.info("rpc #" + message._request, "serve => ", result);
					event.sender.send('jocly-message', {
						_reply: message._request,
						_result: result
					});
				})
				.catch((error) => {
					if (debugLevel >= 1)
						console.info("rpc #" + message._request, "serve => !", error.message);
					event.sender.send('jocly-message', {
						_reply: message._request,
						_error: error.message
					});
				});
	else if (message._reply) {
		var reply = replies[message._reply];
		delete replies[message._reply];
		if (!reply)
			console.error("Missing reply handler");
		else if (message._error) {
			if (debugLevel >= 1)
				console.info("rpc #" + message._reply, "call <= !", message._error);
			reply.reject(new Error(message._error));
		} else {
			if (debugLevel >= 2)
				console.info("rpc #" + message._reply, "call <= ", message._result);
			reply.resolve(message._result);
		}
	}

});