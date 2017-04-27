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

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

var fileName = (function () {
	var m = /\?.*\bfile=([^&]+)/.exec(window.location.href)
	if (m && m[1]) {
		var file = decodeURIComponent(m[1]);
		return /([^\\\/]*)$/.exec(file)[1];
	} else
		return "PJN";
})();

rpc.listen({
	setBookMatches: SetBookMatches,
	error: (error) => {
		$(".book-content ul").hide();
		$(".book-content .message > div > div").text(error).show();
	}
})

function SetBookMatches(matches) {

	var listElem = $(".book-content ul");
	matches.forEach((match) => {
		$("<li>").addClass("list-group-item object-list-item").html(`
			<div class="media-body">
				<strong>${match.label}</strong>
			</div>
		`).on("click", () => {
				rpc.call("openBookMatch", gameName, match);
			}).appendTo(listElem);
	});
	$(".book-content .message").hide();
	listElem.show();
}

$(document).ready(() => {

	Jocly.getGameConfig(gameName)
		.then((config) => {
			$("head title").text(config.model["title-en"] + " Book - " + fileName);
			setTimeout(() => {
				electron.remote.getCurrentWebContents().emit("joclyboard-window-ready");
			})
		})
});
