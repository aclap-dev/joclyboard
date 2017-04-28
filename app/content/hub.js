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
var electron = require("electron");
var settings = require("electron-settings");
var rpc = require('../rpc');
var pjson = require('../package.json');
var jbwu = require('./joclyboard-winutils');

var gameList = [], gamesMap = {};
var allGameList = [], favGameList = [], templateList = [], engineList = [];
var filterTimer = null;

var defaultFavorites = {

	"classic-chess": 100,
	"draughts": 90,
	"scrum": 80,
	"reversi": 70,
	"9-men-morris": 65,
	"fourinarow": 60,
	"tafl-hnefatafl": 55,
	"yohoho": 50,
	"margo6": 40,
	"pensoc": 30,

}

function Filter() {
	if (filterTimer)
		clearTimeout(filterTimer);
	filterTimer = setTimeout(DoFilter, 200);
}

function DoFilter(filterQuery) {
	if (!filterQuery) {
		var filterString = $("#gamefilter").val();
		filterQuery = filterQuery || {
			title: filterString,
			summary: filterString,
			module: filterString
		}
	}
	$("#game-list li.list-group-item").each(function () {
		var gameName = $(this).attr("data-game");
		var game = gamesMap[gameName];
		if (!game) return;
		var display = false;
		if (typeof (filterQuery.title) != "undefined" &&
			(filterQuery.title === "" || game.title.toLowerCase().indexOf(filterQuery.title.toLowerCase()) >= 0))
			display = true;
		else if (typeof (filterQuery.summary) != "undefined" &&
			(filterQuery.summary === "" || game.summary.toLowerCase().indexOf(filterQuery.summary.toLowerCase()) >= 0))
			display = true;
		else if (typeof (filterQuery.module) != "undefined" &&
			(filterQuery.module === "" || game.module.toLowerCase().indexOf(filterQuery.module.toLowerCase()) >= 0))
			display = true;
		if (display)
			$(this).show();
		else
			$(this).hide();
	});
}

function GameClicked(game) {
	rpc.call("openGame", game.gameName);
}

function GameShortcutClicked(game) {
	rpc.call("newMatch", game.gameName);
}

function UpdateGameList() {
	var gameListElem = $("#game-list");
	gameListElem.find(".list-group-item").remove();
	gameList.forEach((game) => {
		var li = $("<li>")
			.addClass("list-group-item object-list-item")
			.attr("data-game", game.gameName)
			.html(`
				<img 
					class="media-object pull-left" 
					src="${game.thumbnail}" 
					width="48" height="48"/>
				<div class="media-body">
					<strong>${game.title}</strong>
					<p>${game.summary}</p>
				</div>
				<div 
					title="Quick play"
					class="media-object pull-right list-shortcut">
					 <span class="icon icon-play"></span>
				</div>
			`).on("click", () => {
				GameClicked(game);
			});
		li.find(".list-shortcut").on("click", (event) => {
			GameShortcutClicked(game);
			event.stopPropagation();
		});
		gameListElem.append(li);
	});
}

function ListGames() {
	Jocly.listGames()
		.then((games) => {
			gamesMap = games;
			allGameList = Object.keys(games).map((gameName) => {
				return Object.assign({
					gameName: gameName
				}, games[gameName]);
			});
			allGameList.sort((a, b) => {
				if (b.title < a.title)
					return 1;
				else if (b.title > a.title)
					return -1;
				else
					return 0;
			});
			for (var game in defaultFavorites)
				if (defaultFavorites.hasOwnProperty(game))
					if (!gamesMap[game])
						delete defaultFavorites[game];
			switch (settings.get("nav-last", "games-fav")) {
				case "games-all":
					$("#nav-games-all").click();
					break;
				case "games-fav":
					$("#nav-games-fav").click();
					break;
				case "templates":
					$("#nav-templates").click();
					break;
				case "engines":
					$("#nav-engines").click();
					break;
				case "about":
					$("#nav-about").click();
					break;
			}
		});
}

function UpdateFavoriteGames(favorites) {
	favorites = favorites || settings.get("favoriteGames", defaultFavorites);
	favGameList = Object.keys(favorites).map((gameName) => {
		return Object.assign({
			gameName: gameName,
			lastSet: favorites[gameName] || 0
		}, gamesMap[gameName]);
	});
	favGameList.sort((a, b) => {
		return b.lastSet - a.lastSet;
	});
}

function UpdateTemplates(templates) {
	templates = templates || settings.get("templates", {});
	templateList = Object.keys(templates).map((templateName) => {
		return Object.assign({
			templateName: templateName
		}, templates[templateName]);
	});
	templateList.sort((a, b) => {
		return b.lastUsed - a.lastUsed;
	});
}

function UpdateTemplateList(templates) {
	var templateListElem = $("#template-list");
	templateListElem.find(".list-group-item").remove();
	templateList.forEach((template) => {
		var game = gamesMap[template.gameName];
		var li = $("<li>")
			.addClass("list-group-item object-list-item")
			.attr("data-template", template.templateName)
			.html(`
				<img 
					class="media-object pull-left" 
					src="${game.thumbnail}" 
					width="48" height="48"/>
				<div class="media-body">
					<strong>${template.templateName}</strong>
					<p>${game.title}</p>
				</div>
				<div 
					title="Remove template"
					class="media-object pull-right list-shortcut list-shortcut-del">
					 <span class="icon icon-cancel"></span>
				</div>
			`).on("click", () => {
				rpc.call("playTemplate", template.templateName);
			});
		li.find(".list-shortcut").on("click", (event) => {
			rpc.call("removeTemplate", template.templateName);
			event.stopPropagation();
		});
		templateListElem.append(li);
	});
}

function UpdateEngines(engines) {
	engines = engines || settings.get("engines", {});
	engineList = Object.keys(engines).map((engineName) => {
		return Object.assign({
			engineName: engineName
		}, engines[engineName]);
	});
	engineList.sort((a, b) => {
		return (b.lastOpened || 0) - (a.lastOpened || 0);
	});
}

function UpdateEngineList(engines) {
	var engineListElem = $("#engine-list");
	engineListElem.find(".list-group-item").remove();
	engineList.forEach((engine) => {
		var game = gamesMap[engine.game];
		var li = $("<li>")
			.addClass("list-group-item object-list-item")
			.attr("data-engine", engine.id)
			.html(`
				<img 
					class="media-object pull-left" 
					src="${game.thumbnail}" 
					width="48" height="48"/>
				<div class="media-body">
					<strong>${engine.name}</strong>
				</div>
				<div 
					title="Remove engine"
					class="media-object pull-right list-shortcut list-shortcut-del">
					 <span class="icon icon-cancel"></span>
				</div>
			`).on("click", () => {
				rpc.call("editEngine", engine.id);
			});
		li.find(".list-shortcut").on("click", (event) => {
			rpc.call("removeEngine", engine.id);
			event.stopPropagation();
		});
		engineListElem.append(li);
	});
}

function About() {
	function Link(selector, url) {
		$(selector).on("click", (e) => {
			e.preventDefault();
			electron.shell.openExternal(url);
		});
	}
	$(".appName").text(pjson.productName);
	$(".appVersion").text(pjson.version);
	Link(".goto-joclyboard", pjson.homepage);
	Link(".goto-jocly", "https://github.com/mi-g/jocly");
	Link(".goto-jocly-com", "https://jocly.com/");
	Link(".goto-agpl-v3", "https://www.gnu.org/licenses/agpl-3.0.en.html");
	Link(".goto-issue", "https://github.com/mi-g/joclyboard/issues");

	$(".goto-joclyboard").on("click", (e) => {
		e.preventDefault();
		electron.shell.openExternal(pjson.homepage);
	});
	$(".goto-jocly").on("click", (e) => {
		e.preventDefault();
		electron.shell.openExternal("https://github.com/mi-g/jocly")
	});
}

rpc.listen({
	updateFavorites: function (favorites) {
		UpdateFavoriteGames(favorites);
		if (settings.get("nav-last", null) == "games-fav") {
			gameList = favGameList;
			UpdateGameList();
		}
	},
	updateTemplates: function (templates) {
		UpdateTemplates(templates);
		if (settings.get("nav-last", null) == "templates")
			UpdateTemplateList();
	},
	updateEngines: function (engines) {
		UpdateEngines(engines);
		if (settings.get("nav-last", null) == "engines")
			UpdateEngineList();
	},
	notifyUser: function (options) {
		return new Promise((resolve, reject) => {
			$(".hub-notifier > *").hide();
			if (options.text)
				$(".hub-notifier-text").show()
					.text(options.text);
			if (options.okText)
				$(".hub-notifier-ok").show()
					.text(options.okText)
					.on("click", function () {
						$(this).off("click");
						$(".hub-notifier").hide();
						resolve(true);
					});
			if (options.koText)
				$(".hub-notifier-ko").show()
					.text(options.koText)
					.on("click", function () {
						$(this).off("click");
						$(".hub-notifier").hide();
						resolve(false);
					});
			$(".hub-notifier").show();
		})
	}
});

function NewEngine() {
	rpc.call("editEngine", null);
}

function SetNav(which) {
	$(".sidebar .nav-group-item").removeClass("active");
	$("#nav-" + which).addClass("active");
	settings.set("nav-last", which);
	$(".object-pane .pane").hide();
}

$(document).ready(() => {
	$("#nav-games-all").on("click", function () {
		SetNav("games-all");
		$("#game-list").show();
		gameList = allGameList;
		UpdateGameList();
	});
	$("#nav-games-fav").on("click", function () {
		SetNav("games-fav");
		$("#game-list").show();
		UpdateFavoriteGames();
		gameList = favGameList;
		UpdateGameList();
	});
	$("#nav-templates").on("click", function () {
		SetNav("templates");
		$("#template-list").show();
		UpdateTemplates();
		UpdateTemplateList();
	});
	$("#nav-engines").on("click", function () {
		SetNav("engines");
		$("#engine-list").show();
		UpdateEngines();
		UpdateEngineList();
	});
	$("#nav-about").on("click", function () {
		SetNav("about");
		$("#about").show();
		UpdateEngines();
		UpdateEngineList();
	});
	$("#gamefilter").on("change keydown paste input", Filter);
	$("#engine-list .list-group-header").on("click", NewEngine);
	ListGames();

	About();

	jbwu.init(pjson.productName+" "+pjson.version);
	jbwu.ready();
});
