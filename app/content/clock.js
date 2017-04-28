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

rpc.listen({
	updateClock: UpdateClock
})

var timers = {}, clock = null;

function TimeFormat(ms) {
	var text = "";
	if (ms < 0) {
		text += "-";
		ms = -ms;
	}
	var secs = Math.floor(ms / 1000);
	var mins = Math.floor(secs / 60);
	var hours = Math.floor(mins / 60);
	mins = mins % 60;
	secs = secs % 60;
	if (hours > 0)
		text = hours + ":" + (mins < 10 ? "0" : "");
	text += mins + ":" + (secs < 10 ? "0" : "");
	text += secs;
	return text;
}

function UpdateClock() {
	return rpc.call("getClock", matchId)
		.then(({ players, clock: _clock }) => {
			clock = _clock;
			$(".players > div, .times > div").removeClass("turn");
			[Jocly.PLAYER_A, Jocly.PLAYER_B].forEach((which) => {
				$("#clock-player" + which).text(players[which].name);
				if (clock && clock.turn == which)
					$("#clock-player" + which + ",#clock-time" + which).addClass("turn");
				Update();
			});
		});
}

function Update() {
	[Jocly.PLAYER_A, Jocly.PLAYER_B].forEach((which) => {
		var timer;
		if (clock && clock[which]) {
			var ms = clock[which];
			if (clock.turn == which)
				ms -= Date.now() - clock.t0;
			timer = TimeFormat(ms);
		} else
			timer = "--:--";
		if (timer != timers[which]) {
			timers[which] = timer;
			$("#clock-time" + which).text(timer);
		}
	});

}

$(document).ready(() => {

	jbwu.init("Clock #" + matchId);
	[Jocly.PLAYER_A, Jocly.PLAYER_B].forEach((which) => {
		$("<div>").attr("id", "clock-player" + which).appendTo($(".clock .players"));
		$("<div>").attr("id", "clock-time" + which).appendTo($(".clock .times"));
	})
	UpdateClock().then(() => {
		setInterval(Update, 100);
	});
	jbwu.ready();

});

