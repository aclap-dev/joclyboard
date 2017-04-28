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
const electron = require("electron");
var jbwu = require('./joclyboard-winutils');

var gameName = (function () {
	var m = /\?.*\bgame=([^&]+)/.exec(window.location.href)
	return m && m[1] || "classic-chess";
})();

function TabSelected(what) {
	$(".tab-group .tab-item[data-tab]").removeClass("active");
	$(".tab-group .tab-item[data-tab='" + what + "']").addClass("active");
	$(".window-content [data-tab]").hide();
	$(".window-content [data-tab='" + what + "']").show();
}

function DefaultTab() {
	if ($(".tab-group .tab-item[data-tab='rules']").is(":visible"))
		TabSelected("rules");
	else if ($(".tab-group .tab-item[data-tab='description']").is(":visible"))
		TabSelected("description");
	else if ($(".tab-group .tab-item[data-tab='credits']").is(":visible"))
		TabSelected("credits");
}

function GetHtml(config, what) {
	var descriptor = config.model[what];
	var htmlUrl = descriptor && descriptor.en || descriptor || null;
	if (!htmlUrl)
		return;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			$(".tab-group .tab-item[data-tab='" + what + "']").show();
			var html = this.responseText.replace(/\{GAME\}/g, config.view.fullPath);
			var content = $(".window-content [data-tab='" + what + "']");
			content.html(html);
			content.find("a[href]").on("click", function (event) {
				event.preventDefault();
				electron.shell.openExternal($(this).attr("href"));
			})
			DefaultTab();
		}
	};
	xhr.open("GET", config.view.fullPath + "/" + htmlUrl);
	xhr.send();
}

$(document).ready(() => {
	Jocly.getGameConfig(gameName)
		.then((config) => {
			jbwu.init("About " + config.model["title-en"]);
			GetHtml(config, "rules");
			GetHtml(config, "description");
			GetHtml(config, "credits");
			$(".tab-group .tab-item[data-tab]").on("click", function () {
				var what = $(this).attr("data-tab");
				TabSelected(what);
			});
		})
});

