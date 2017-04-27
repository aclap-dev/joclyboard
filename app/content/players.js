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
var rpc = require('../rpc');

var matchId = (function () {
	var m = /\?.*\bid=([0-9]+)/.exec(window.location.href)
	return m && m[1] || 0;
})();

var playerTypes;

function UpdatePlayers(data) {
	playerTypes = [];
	playerTypes.push({
		key: 'human',
		label: 'Human'
	});
	playerTypes.push({
		key: 'random',
		label: 'Random'
	});
	if (data.levels)
		data.levels.forEach((level, index) => {
			playerTypes.push({
				key: "ai:" + index,
				label: "Jocly - " + level
			})
		});
	['a', 'b'].forEach((which) => {
		var form = $(".players-" + which);
		var player = which == 'a' ? Jocly.PLAYER_A : Jocly.PLAYER_B;
		var select = form.find("select");
		playerTypes.forEach((type) => {
			select.append($("<option>").attr("value", type.key).text(type.label));
		})
		data.engines.forEach((engine) => {
			select.append($("<option>").attr("value", "engine:" + engine.id).text(engine.label));
		});
		select.val(data.players[player].type);
		form.find("input").val(data.players[player].name || "Player " + which.toUpperCase());
	});
}

$(document).ready(() => {
	$("head title").text("Players #" + matchId);
	rpc.call("getPlayersInfo", matchId)
		.then(UpdatePlayers)
		.then(() => {
			electron.remote.getCurrentWebContents().emit("joclyboard-window-ready");
		});
	$("#button-cancel").on("click", () => {
		window.close();
	});
	$("#button-save").on("click", () => {
		var players = {};
		['a', 'b'].forEach((which) => {
			var form = $(".players-" + which);
			var player = which == 'a' ? Jocly.PLAYER_A : Jocly.PLAYER_B;
			players[player] = {
				type: form.find("select").val(),
				name: form.find("input").val()
			}
		});
		rpc.call("setPlayers", matchId, players)
			.then(() => {
				window.close();
			})
	});
});

