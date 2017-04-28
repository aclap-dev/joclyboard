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
var jbwu = require('./joclyboard-winutils');

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

var matchId = (function () {
	var m = /\?.*\bid=([0-9]+)/.exec(window.location.href)
	return m && m[1] || 0;
})();


rpc.listen({
	updateHistory: function () {
		return RequestHistory()
	}
});

var currentIndex = -1;
var moveCount = 0;
var playing = false, frozen = false;
var book = [];
var plyCount = 0;

function UpdateButtons() {
	function UpdateButton(which, enabled, visibility) {
		var button = $(".toolbar-actions button[data-action=" + which + "]");
		if (visibility)
			if (enabled)
				button.show();
			else
				button.hide();
		else
			if (enabled)
				button.removeClass("disabled");
			else
				button.addClass("disabled");
	}
	UpdateButton("start", currentIndex >= 0);
	UpdateButton("stepback", currentIndex >= 0);
	UpdateButton("stepforward", currentIndex < moveCount - 1);
	UpdateButton("play", currentIndex < moveCount - 1);
	UpdateButton("end", currentIndex < moveCount - 1);
	UpdateButton("resume", true);
	UpdateButton("play", !playing, true);
	UpdateButton("pause", playing, true);
}

function SelectMove(index) {
	$("#moves .move").removeClass("active");
	$("#moves .move[data-index=" + index + "]").addClass("active");
	currentIndex = index;
	UpdateButtons();
}

function UpdateHistory(history) {
	frozen = false;
	moveCount = history.length;
	function ClickedMove() {
		var index = parseInt($(this).attr("data-index"));
		if (index == currentIndex)
			return;
		frozen = true;
		SelectMove(index);
		rpc.call("freeze", matchId, index);
		currentIndex = index;
	}
	var movesElem = $("#moves");
	movesElem.empty();
	book = [];
	plyCount = history.length;
	history.forEach((move, index) => {
		if (index % 2 === 0) {
			var text = index / 2 + 1 + ".";
			$("<span>").text(text).addClass("movenumber").appendTo(movesElem);
			book.push(text);
		}
		$("<span>").attr("data-index", index).addClass("move").text(move).on("click", ClickedMove).appendTo(movesElem);
		book.push(move);
	});
	var container = movesElem.parent();
	container.animate({ scrollTop: container.prop("scrollHeight") }, 250);
	SelectMove(moveCount - 1);
	UpdateButtons();
}

function RequestHistory() {
	return rpc.call("getHistory", matchId)
		.then(UpdateHistory)
}

function StartPlaying(animate) {
	playing = true;
	rpc.call("freeze", matchId, currentIndex, animate)
		.then(() => {
			SelectMove(currentIndex);
			if (playing && currentIndex < moveCount - 1) {
				currentIndex++;
				StartPlaying(true);
			} else {
				playing = false;
				UpdateButtons();
			}
		})
}

function StopPlaying() {
	playing = false;
}

function SaveBook() {
	rpc.call("getPlayersInfo", matchId)
		.then((playersData) => {
			var date = new Date();
			var tags = [
				"[JoclyGame \"" + gameName + "\"]",
				"[Date \"" + date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate() + "\"]",
				"[White \"" + playersData.players[Jocly.PLAYER_A].name.replace(/"/g, "'") + "\"]",
				"[Black \"" + playersData.players[Jocly.PLAYER_B].name.replace(/"/g, "'") + "\"]",
				"[PlyCount \"" + plyCount + "\"]"
			];
			var text = tags.join("\n") + "\n\n" + book.join(" ") + "\n";
			var a = document.createElement("a");
			var uriContent = "data:application/octet-stream," + encodeURIComponent(text);
			a.setAttribute("href", uriContent);
			a.setAttribute("download", gameName + ".pjn");
			a.click();
		})
}

$(document).ready(() => {
	jbwu.init("History #" + matchId);
	$("[data-action=start]").on("click", () => {
		frozen = true;
		SelectMove(-1);
		rpc.call("freeze", matchId, currentIndex);
	});
	$("[data-action=stepback]").on("click", () => {
		frozen = true;
		SelectMove(currentIndex - 1);
		rpc.call("freeze", matchId, currentIndex);
	});
	$("[data-action=stepforward]").on("click", () => {
		frozen = true;
		SelectMove(currentIndex + 1);
		rpc.call("freeze", matchId, currentIndex, true);
	});
	$("[data-action=end]").on("click", () => {
		frozen = true;
		SelectMove(moveCount - 1);
		rpc.call("freeze", matchId, currentIndex);
	});
	$("[data-action=resume]").on("click", () => {
		rpc.call("takeBack", matchId, currentIndex + 1);
	});
	$("[data-action=position]").on("click", () => {
		rpc.call("openBoardState", gameName, matchId);
	});
	$("[data-action=showpos]").on("click", () => {
		rpc.call("showBoardState", gameName, matchId);
	});
	$("[data-action=play]").on("click", () => {
		StartPlaying();
	});
	$("[data-action=pause]").on("click", () => {
		StopPlaying();
	});
	$("[data-action=save]").on("click", () => {
		SaveBook();
	});
	RequestHistory()
		.then(() => {
			jbwu.ready();
		});
	$("#button-close").on("click", () => {
		window.close();
	});
});

