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
var settings = require('electron-settings');
var rpc = require("../rpc");
var jbwu = require('./joclyboard-winutils');

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

var matchId = (function () {
	var m = /\?.*\bid=([0-9]+)/.exec(window.location.href)
	return m && m[1] || 0;
})();

var viewOptions = (function () {
	var m = /\?.*\boptions=([^&]+)/.exec(window.location.href)
	try {
		return m && m[1] && JSON.parse(decodeURIComponent(m[1])) || null;
	} catch (e) {
		return null;
	}
})();

var match;

$(document).ready(() => {
	Jocly.getGameConfig(gameName)
		.then((config) => {
			jbwu.init(config.model["title-en"] + " #" + matchId, ".game-header");
			$("#button-favorite-no").on("click", () => {
				rpc.call("setFavorite", gameName, true);
				$("#button-favorite-no").hide();
				$("#button-favorite-yes").show();
			});
			$("#button-favorite-yes").on("click", () => {
				rpc.call("setFavorite", gameName, false);
				$("#button-favorite-yes").hide();
				$("#button-favorite-no").show();
			});
			rpc.call("isFavorite", gameName)
				.then((favorite) => {
					if (favorite) {
						$("#button-favorite-no").hide();
						$("#button-favorite-yes").show();
					} else {
						$("#button-favorite-yes").hide();
						$("#button-favorite-no").show();
					}
				});
			$("#button-fullscreen").on("click", () => {
				($(".game-area")[0]).webkitRequestFullscreen();
			});
			$("#button-takeback").on("click", () => {
				rpc.call("takeBack", matchId);
			});
			$("#button-restart").on("click", () => {
				rpc.call("restart", matchId);
			});
			$("#button-history").on("click", () => {
				rpc.call("openHistory", matchId);
			});
			$("#button-clock").on("click", () => {
				rpc.call("openClock", matchId);
			});
			$("#button-replay").on("click", () => {
				rpc.call("replayLastMove", matchId);
			});
			$("#button-pause").on("click", () => {
				rpc.call("pause", matchId, true)
					.then(() => {
						UpdatePause();
					})
			});
			$("#button-resume").on("click", () => {
				rpc.call("pause", matchId, false)
					.then(() => {
						UpdatePause();
					})
			});
			$("#button-save").on("click", () => {
				match.save()
					.then((data) => {
						var json = JSON.stringify(data, null, 2);
						var a = document.createElement("a");
						var uriContent = "data:application/octet-stream," + encodeURIComponent(json);
						a.setAttribute("href", uriContent);
						a.setAttribute("download", gameName + ".json");
						a.click();
					});
			});
			// reading file locally
			var fileElem = $("#fileElem").on("change", function () {
				var fileReader = new FileReader();
				fileReader.readAsText(fileElem[0].files[0]);
				fileReader.onload = function (event) {
					var json = event.target.result;
					var data = JSON.parse(json);
					rpc.call("loadMatch", matchId, data);
				}
			})
			$("#button-load").on("click", () => {
				fileElem[0].click();
			});
			$("#button-players").on("click", () => {
				rpc.call("openPlayers", matchId);
			});
			$("#button-options").on("click", () => {
				rpc.call("openViewOptions", matchId);
			});
			$("#button-help").on("click", () => {
				rpc.call("openInfo", match.gameName);
			});
			$("#button-template").on("click", () => {
				rpc.call("openSaveTemplate", matchId);
			});
			$("#button-clone").on("click", () => {
				rpc.call("cloneMatch", matchId);
			});

			UpdatePause();

			Jocly.createMatch(gameName)
				.then((_match) => {
					match = _match;
					return match.getConfig(config);
				})
				.then((config) => {
					var supports3D = (function () {
						try {
							return !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
						}
						catch (e) {
							return false;
						}
					})();
					var skins = config.view.skins.filter((skin) => {
						return supports3D || !skin["3d"];
					});
					var gameArea = $(".game-area")[0];
					viewOptions = Object.assign({
						sounds: true,
						notation: false,
						moves: true,
						autoComplete: false,
						viewAs: Jocly.PLAYER_A
					}, config.view.defaultOptions, settings.get("view-options:" + match.gameName, null), viewOptions);
					if (!(viewOptions.skin in skins.map((skin) => skin.name)))
						viewOptions.skin = skins[0].name;
					return match.attachElement(gameArea, { viewOptions: viewOptions });
				})
				.then(() => {
					jbwu.ready();
				})
		});
});

function UpdatePause() {
	rpc.call("isPaused", matchId)
		.then((paused) => {
			if (paused) {
				$("#button-pause").hide();
				$("#button-resume").show();
			} else {
				$("#button-pause").show();
				$("#button-resume").hide();
			}
		})
}

function Cleanup() {
	return match.abortUserTurn()
		.then(() => {
			return match.abortMachineSearch();
		})
		.then(() => {
			return match.resetView(true);
		})
}

rpc.listen({
	humanTurn: function (data) {
		return Cleanup()
			.then(() => {
				return match.load(data.gameData)
			})
			.then(() => {
				return match.userTurn();
			});
	},
	aiTurn: function (data) {
		return Cleanup()
			.then(() => {
				return match.load(data.gameData)
			})
			.then(() => {
				return match.machineSearch({
					level: data.level
				});
			})
			.then((result) => {
				return Promise.all([result.move, match.playMove(result.move)]);
			});
	},
	playMove: function (data) {
		return Cleanup()
			.then(() => {
				return match.load(data.gameData)
			})
			.then(() => {
				return Promise.all([data.move, match.playMove(data.move)]);
			});
	},
	display: function (data) {
		return Cleanup()
			.then(() => {
				return match.load(data.gameData)
			});
	},
	setViewOptions: function (options) {
		return Cleanup()
			.then(() => {
				return match.setViewOptions(options);
			});
	},
	setFooterText: function (text) {
		$("#board-footer-text").text(text);
	}
});
