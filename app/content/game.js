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
var rpc = require('../rpc');
var settings = require('electron-settings');

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

var visuals = [];
var visualIndex = 0;

function SetupVisuals(view) {
	function NextVisual() {
		visualIndex = (visualIndex + 1) % visuals.length;
		$(".visuals>div>div").css({
			opacity: 0
		});
		$(".visuals>div>div[data-index=" + visualIndex + "]").css({
			opacity: 1
		});
	}
	if (view.visuals && view.visuals["600x600"]) {
		visuals = view.visuals["600x600"];
		if (!Array.isArray(visuals))
			visuals = [visuals];
		visuals = visuals.map((visual) => {
			return view.fullPath + "/" + visual;
		});
		visuals.forEach((visual, index) => {
			$("<div>").attr("data-index", index).css({
				backgroundImage: "url(" + visual + ")"
			}).appendTo(".visuals>div");
		});
		setInterval(NextVisual, 5000);
		NextVisual();
	}
}

function SetupInfo(config) {
	$(".game-title").text(config.model["title-en"]);
	$(".game-thumbnail").css({
		backgroundImage: "url(" + config.view.fullPath + "/" + config.model.thumbnail + ")"
	});
	$(".game-summary").text(config.model.summary);
	UpdateFavorite(config);
	$("#favorite").on("click", () => {
		rpc.call("setFavorite", gameName, true)
			.then(() => {
				UpdateFavorite(config);
			});
	})
	$("#unfavorite").on("click", () => {
		rpc.call("setFavorite", gameName, false)
			.then(() => {
				UpdateFavorite(config);
			});
	})
	$("#quickplay").on("click", () => {
		rpc.call("newMatch", gameName);
	})
	$("#clockedplay").on("click", () => {
		rpc.call("newClockedMatch", gameName);
	})
	$("#info").on("click", () => {
		rpc.call("openInfo", gameName);
	})
	$("#openbook").on("click", () => {
		OpenBook();
	})
	$("#boardstate").on("click", () => {
		rpc.call("openBoardState", gameName);
	})
	$("#fileElem").on("change", function () {
		var fileName = $(this).val();
		var fileReader = new FileReader();
		fileReader.readAsText($(this)[0].files[0]);
		fileReader.onload = function (event) {
			var data = event.target.result;
			rpc.call("openBook", gameName, fileName, data);
		}
		$(this).val('');
	})
}

function UpdateFavorite(config) {
	$("#favorite,#unfavorite").hide();
	rpc.call("isFavorite", gameName)
		.then((favorite) => {
			if (favorite)
				$("#unfavorite").show();
			else
				$("#favorite").show();
		})
}

function UpdateTemplates(templates) {

	$(".templates").empty();
	templates = templates || settings.get("templates", {});
	Object.keys(templates).map((templateName) => {
		return Object.assign({
			templateName: templateName
		}, templates[templateName]);
	}).filter((template) => {
		return template.gameName == gameName;
	}).sort((a, b) => {
		return b.lastUsed - a.lastUsed;
	}).forEach((template) => {
		$("<div>")
			.addClass("template")
			.text(template.templateName)
			.on("click", () => {
				rpc.call("playTemplate", template.templateName)
			})
			.appendTo($(".templates"));
	});
}

function OpenBook() {
	$("#fileElem")[0].click();
}

$(document).ready(() => {
	Jocly.getGameConfig(gameName)
		.then((config) => {
			$("head title").text(config.model["title-en"]);
			SetupVisuals(config.view);
			SetupInfo(config);
			UpdateTemplates();
			// the line below seems to cause the settings regularly. bug in electron-settings ?
			//settings.watch("templates",UpdateTemplates);
		});
});