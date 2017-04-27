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
var settings = require('electron-settings');

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

function UpdateSymmetry(symmetry) {
	$(".form-group").hide();
	$(".form-group.group-" + symmetry).show();
}

function SetForm(setup) {
	$(".symmetry").val(setup.symmetry);
	UpdateSymmetry(setup.symmetry);
	$(".group-same input").val(setup.timing.same.value);
	$(".group-same select").val(setup.timing.same.factor);
	[0, 1].forEach((which) => {
		var group = $($(".group-different")[which]);
		group.find("input").val(setup.timing.different[which].value);
		group.find("select").val(setup.timing.different[which].factor);
	});
}

function GetClock() {
	function GetTiming(group) {
		var value = parseInt(group.find("input").val());
		if (isNaN(value))
			throw new Error();
		return 1000 * value * parseInt(group.find("select").val());
	}

	var clock = {
		mode: "countdown"
	};
	var symmetry = $(".symmetry").val();
	try {
		if (symmetry == "same")
			clock[Jocly.PLAYER_A] = clock[Jocly.PLAYER_B] = GetTiming($(".group-same"));
		else {
			clock[Jocly.PLAYER_A] = GetTiming($($(".group-different")[0]));
			clock[Jocly.PLAYER_B] = GetTiming($($(".group-different")[1]));
		}
		return clock;
	} catch (e) {
		return null;
	}
}

$(document).ready(() => {
	Jocly.getGameConfig(gameName)
		.then((config) => {
			$("head title").text(config.model["title-en"] + " clock setup");
		});
	$("#button-save").on("click", () => {
		var clock = GetClock();
		if (clock) {
			settings.set("clock", {
				symmetry: $(".symmetry").val(),
				timing: {
					same: {
						value: $(".group-same input").val(),
						factor: $(".group-same select").val()
					},
					different: [{
						value: $($(".group-different")[0]).find("input").val(),
						factor: $($(".group-different")[0]).find("select").val()
					}, {
						value: $($(".group-different")[1]).find("input").val(),
						factor: $($(".group-different")[1]).find("select").val()
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
			same: {
				value: 5,
				factor: 60
			},
			different: [{
				value: 5,
				factor: 60
			}, {
				value: 5,
				factor: 60
			}]
		}
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
	electron.remote.getCurrentWebContents().emit("joclyboard-window-ready");

});

