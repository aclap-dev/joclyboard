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
var jbwu = require('./joclyboard-winutils');

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

var selectedPlayer = 0;

function UpdateSymmetry(symmetry) {
	$(".form-group").hide();
	if (symmetry == "same")
		$(".form-group.group-same").show();
	else {
		$(".form-group.group-different.player-sel").show();
		$(".form-group.group-different.player-sel .player-selector").removeClass("highlighted");
		$(".form-group.group-different.player-sel .player-selector.player" + selectedPlayer).addClass("highlighted");
		$(".form-group.group-different.player" + selectedPlayer).show();
	}
}

function SetForm(setup) {
	$(".symmetry").val(setup.symmetry);
	UpdateSymmetry(setup.symmetry);
	$(".group-same input.time").val(setup.timing.same.value);
	$(".group-same select.unit").val(setup.timing.same.factor);
	$(".group-same input.xtrasec").val(setup.timing.same.xtrasec);
	$(".group-same input.mps").val(setup.timing.same.mps);
	[0, 1].forEach((which) => {
		$(".group-different.player" + which + " input.time").val(setup.timing.different[which].value);
		$(".group-different.player" + which + " select.unit").val(setup.timing.different[which].factor);
		$(".group-different.player" + which + " input.xtrasec").val(setup.timing.different[which].xtrasec);
		$(".group-different.player" + which + " input.mps").val(setup.timing.different[which].mps);
	});
	debugger;
}

function GetClock() {
	function GetTiming(group) {
		var value = parseInt(group.find("input.time").val());
		if (isNaN(value))
			throw new Error();
		return 1000 * value * parseInt(group.find("select.unit").val());
	}

	var clock = {
		mode: "countdown"
	};
	var symmetry = $(".symmetry").val();
	try {
		if (symmetry == "same") {
			clock[Jocly.PLAYER_A] = clock[Jocly.PLAYER_B] = GetTiming($(".group-same"));
			clock["xtrasec_" + Jocly.PLAYER_A] = clock["xtrasec_" + Jocly.PLAYER_B] = parseInt($(".group-same input.xtrasec").val()) || 0;
			clock["mps_" + Jocly.PLAYER_A] = clock["mps_" + Jocly.PLAYER_B] = parseInt($(".group-same input.mps").val()) || 0;
		}
		else {
			clock[Jocly.PLAYER_A] = GetTiming($(".group-different.player0"));
			clock["xtrasec_" + Jocly.PLAYER_A] = parseInt($(".group-different.player0 input.xtrasec").val()) || 0;
			clock["mps_" + Jocly.PLAYER_A] = parseInt($(".group-different.player0 input.mps").val()) || 0;
			clock[Jocly.PLAYER_B] = GetTiming($(".group-different.player1"));
			clock["xtrasec_" + Jocly.PLAYER_B] = parseInt($(".group-different.player1 input.xtrasec").val()) || 0;
			clock["mps_" + Jocly.PLAYER_B] = parseInt($(".group-different.player1 input.mps").val()) || 0;
		}
		return clock;
	} catch (e) {
		return null;
	}
}

$(document).ready(() => {
	Jocly.getGameConfig(gameName)
		.then((config) => {
			jbwu.init(config.model["title-en"] + " clock setup");
		});
	$(".player-selector").on("click", function () {
		selectedPlayer = $(this).hasClass("player0") ? 0 : 1;
		UpdateSymmetry();
	});
	$("#button-save").on("click", () => {
		var clock = GetClock();
		if (clock) {
			settings.set("clock", {
				symmetry: $(".symmetry").val(),
				timing: {
					same: {
						value: $(".group-same input.time").val(),
						factor: $(".group-same select.unit").val(),
						xtrasec: $(".group-same input.xtrasec").val(),
						mps: $(".group-same input.mps").val()
					},
					different: [{
						value: $(".group-different.player0 input.time").val(),
						factor: $(".group-different.player0 select.unit").val(),
						xtrasec: $(".group-different.player0 input.xtrasec").val(),
						mps: $(".group-different.player0 input.mps").val()
					}, {
						value: $(".group-different.player1 input.time").val(),
						factor: $(".group-different.player1 select.unit").val(),
						xtrasec: $(".group-different.player1 input.xtrasec").val(),
						mps: $(".group-different.player1 input.mps").val()
					}]
				}
			})
			rpc.call("newMatch", gameName, clock)
				.then(() => {
					window.close();
				})
		}
	});
	$("#button-cancel").on("click", () => {
		window.close();
	});
	var setup = settings.get('clock', {
		symmetry: "same",
		timing: {
			same: {},
			different: [{}, {}]
		}
	});
	Object.assign(setup.timing.same, {
		value: 5,
		factor: 60,
		xtrasec: 0,
		mps: 0
	}, setup.timing.same);
	[0, 1].forEach((which) => {
		Object.assign({}, {
			value: 5,
			factor: 60,
			xtrasec: 0,
			mps: 0
		}, setup.timing.different[which]);
	});
	SetForm(setup);
	$(".clock-setup-content").on("change keydown paste input", () => {
		UpdateSymmetry($(".symmetry").val());
		if (GetClock())
			$("#button-save").removeClass("disabled");
		else
			$("#button-save").addClass("disabled");
	});
	$(".clock-setup-content").trigger("change");
	jbwu.ready();

});

