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
var dialog = electron.remote.dialog;
var settings = require('electron-settings');
var dialogs = require('dialogs')();
var rpc = require('../rpc');
var jbwu = require('./joclyboard-winutils');

var viewPoints = [];
var viewPointsIndex = 1;
var speeds = [];
var speedsIndex = 1;
var selectedSpeed = 0;

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

var matchId = (function () {
	var m = /\?.*\bid=([0-9]+)/.exec(window.location.href)
	return m && m[1] || 0;
})();

function SaveViewPoints() {
	settings.set("camera-view:" + gameName, viewPoints);
}

function AddViewPoint(camera, id, title) {
	var id = id || viewPointsIndex++;
	var viewPoint = {
		id: id,
		title: title || "View point #" + id,
		camera: camera
	}
	viewPoints.push(viewPoint);
	$("<li>")
		.append($("<span>").text(viewPoint.title))
		.append($("<div>")
			.addClass("small-button small-button-red")
			.on("click", function (event) {
				event.stopPropagation();
				$(this).parent().remove();
				var index = viewPoints.map((vp) => {
					return vp.id;
				}).indexOf(viewPoint.id);
				if (index >= 0) {
					viewPoints.splice(index, 1);
					SaveViewPoints();
				}
			})
			.text("X"))
		.append($("<div>")
			.addClass("small-button small-button-blue")
			.on("click", function (event) {
				event.stopPropagation();
				var index = viewPoints.map((vp) => {
					return vp.id;
				}).indexOf(viewPoint.id);
				if (index >= 0) {
					var titleElem = $(this).parent().find("span");
					dialogs.prompt("New viewpoint name", (name) => {
						if (typeof name == "undefined")
							return;
						viewPoints[index].title = name;
						titleElem.text(name);
						SaveViewPoints();
					})
				}
			})
			.text("T"))
		.on("click", () => {
			rpc.call("setCamera", matchId, {
				type: "move",
				camera: viewPoint.camera,
				speed: selectedSpeed,
				smooth: parseFloat($("#kalman").val()) || .001
			})
				.catch((error) => {
					dialog.showErrorBox("Setting camera", error.message);
				})
		})
		.appendTo(".view-points");
	SaveViewPoints();
}

function SaveSpeeds() {
	settings.set("camera-view-speeds:" + gameName, speeds);
}

function Spin(direction) {
	rpc.call("setCamera", matchId, {
		type: "spin",
		direction: direction,
		speed: selectedSpeed
	})
		.catch((error) => {
			dialog.showErrorBox("Setting camera", error.message);
		})
}

function AddSpeed(speedValue, id) {
	var id = id || speedsIndex++;
	var speed = {
		id: id,
		title: speedValue + " seconds",
		speed: speedValue
	}
	speeds.push(speed);
	$("<li>")
		.append($("<span>").text(speed.title))
		.append($("<div>")
			.addClass("small-button small-button-red")
			.on("click", function () {
				$(this).parent().remove();
				var index = speeds.map((sp) => {
					return sp.id;
				}).indexOf(speed.id);
				if (index >= 0) {
					speeds.splice(index, 1);
					SaveSpeeds();
				}
			})
			.text("X"))
		.on("click", function () {
			$(".speeds li").removeClass("selected");
			$(this).addClass("selected");
			selectedSpeed = speed.speed;
		})
		.appendTo(".speeds");
	SaveSpeeds();
}

$(document).ready(() => {
	var _viewPoints = settings.get("camera-view:" + gameName, []);
	_viewPoints.forEach((viewPoint) => {
		if (viewPoint.id >= viewPointsIndex)
			viewPointsIndex = viewPoint.id + 1;
		AddViewPoint(viewPoint.camera, viewPoint.id, viewPoint.title);
	});
	$(".add-view-point").on("click", () => {
		rpc.call("getCamera", matchId)
			.then(AddViewPoint)
			.catch((error) => {
				dialog.showErrorBox("Getting camera", error.message);
			})
	});
	var _speeds = settings.get("camera-view-speeds:" + gameName, []);
	_speeds.forEach((speed) => {
		if (speed.id >= speedsIndex)
			speedsIndex = speed.id + 1;
		AddSpeed(speed.speed, speed.id);
	});
	$(".add-speed").on("click", () => {
		dialogs.prompt("Speed (seconds)", (speed) => {
			if (typeof speed == "undefined")
				return;
			speed = parseFloat(speed) || 0;
			AddSpeed(speed);
		})
	})
	$("#kalman")
		.val(settings.get("camera-view-kalman:" + gameName, .001))
		.on("change", () => {
			settings.set("camera-view-kalman:" + gameName, $("#kalman").val());
		});
	$("#spin-cw").on("click", () => {
		Spin("cw");
	});
	$("#spin-ccw").on("click", () => {
		Spin("ccw");
	});
	$("#pause").on("click", () => {
		rpc.call("setCamera", matchId, {
			type: "stop"
		})
			.catch((error) => {
				dialog.showErrorBox("Stop camera", error.message);
			})
	});
	$("#help").on("click", () => {
		electron.shell.openExternal("https://github.com/mi-g/joclyboard/wiki/Camera-View");
	});
	jbwu.init("Camera View #" + matchId);
	jbwu.ready();
	$("#button-close").on("click", () => {
		window.close();
	});
});

