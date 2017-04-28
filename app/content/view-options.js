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
var jbwu = require('./joclyboard-winutils');

var matchId = (function () {
	var m = /\?.*\bid=([0-9]+)/.exec(window.location.href)
	return m && m[1] || 0;
})();

var viewOptions;

rpc.listen({
});

function UpdateOptions(_viewOptions) {
	viewOptions = _viewOptions;
	var { options, config, players } = _viewOptions;
	$("#skin").show();
	config.skins.forEach((skin) => {
		$("<option>").attr("value", skin.name).text(skin.title).appendTo($("#skin select"));
	});
	$("#skin select").val(options.skin);
	$("#sounds").show().find("input").prop("checked", options.sounds);
	if (config.useNotation)
		$("#notation").show().find("input").prop("checked", options.notation);
	if (config.useAutoComplete)
		$("#autoComplete").show().find("input").prop("checked", options.autoComplete);
	if (config.useShowMoves)
		$("#showMoves").show().find("input").prop("checked", options.showMoves);
	if (config.switchable) {
		[Jocly.PLAYER_A, Jocly.PLAYER_B].forEach((who) => {
			$("<option>").attr("value", who).text(players[who].name).appendTo($("#viewAs select"));
		});
		$("#viewAs").show().find("select").val(options.viewAs);
	}
	$("#anaglyph").show().find("input").prop("checked", options.anaglyph);
}

function SetViewOptions() {
	var { config } = viewOptions;
	var options = {
		skin: $("#skin select").val(),
		sounds: $("#sounds input").prop("checked"),
		anaglyph: $("#anaglyph input").prop("checked")
	};
	if (config.useNotation)
		options.notation = !!$("#notation input").prop("checked")
	if (config.useAutoComplete)
		options.autoComplete = !!$("#autoComplete input").prop("checked")
	if (config.useShowMoves)
		options.showMoves = $("#showMoves input").prop("checked")
	if (config.switchable)
		options.viewAs = $("#viewAs select").val();
	rpc.call("setViewOptions", matchId, options);
}

$(document).ready(() => {
	jbwu.init("View Options #" + matchId);
	rpc.call("getViewInfo", matchId)
		.then(UpdateOptions)
		.then(() => {
			$(".view-options").on("change", SetViewOptions);
		})
		.then(() => {
			jbwu.ready();
		});
	$("#button-close").on("click", () => {
		window.close();
	});
});

