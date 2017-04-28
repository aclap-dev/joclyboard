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

const engineTypes = {
	"": {
		label: "Choose engine type",
		order: 1,
		fields: []
	},
	"uci": {
		label: "UCI",
		order: 2,
		fields: ["binary", "details"]
	},
	"cecp": {
		label: "CECP",
		order: 3,
		fields: ["binary", "details"]
	},
	"hub": {
		label: "Hub",
		order: 4,
		fields: ["binary", "details"]
	},
	"dxp": {
		label: "DXP",
		order: 4,
		fields: ["details"]
	}
}

var engine = (function () {
	var m = /\?.*\bengine=([^&]+)/.exec(window.location.href)
	try {
		return m && m[1] && JSON.parse(decodeURIComponent(m[1])) || null;
	} catch (e) {
		return null;
	}
})();

function Validate(field) {
	function CheckValue() {
		var value = $("#field-" + field).val();
		switch (field) {
			case "name":
				return Promise.resolve(value.trim().length > 0);
			case "game":
				return Promise.resolve(value !== "");
			case "type":
				return Promise.resolve(value !== "");
			case "binary":
				return rpc.call("isFile", value);
			case "details":
				try {
					jsyaml.safeLoad(value);
					return Promise.resolve(true);
				} catch (e) {
					return Promise.resolve(false);
				}
		}
		return Promise.resolve(false);
	}
	return CheckValue()
		.then((valid) => {
			if (valid)
				$("#field-" + field).removeClass("error");
			else
				$("#field-" + field).addClass("error");
			return valid;
		});
}

function Link(selector, url) {
	$(selector).on("click", (e) => {
		e.preventDefault();
		electron.shell.openExternal(url);
	});
}

$(document).ready(() => {
	jbwu.init("Engine");
	Jocly.listGames()
		.then((games) => {

			Object.keys(games).sort((a, b) => {
				if (games[a].title < games[b].title)
					return -1;
				else if (games[a].title > games[b].title)
					return 1
				else
					return 0;
			}).forEach((gameName) => {
				$("<option>")
					.attr("value", gameName)
					.text(games[gameName].title)
					.appendTo($("#field-game"));
			});
			$("<option>")
				.attr("value", "")
				.text("Choose a game")
				.prependTo($("#field-game"));

			Object.keys(engineTypes).sort((a, b) => {
				return engineTypes[a].order - engineTypes[b].order
			}).forEach((typeKey) => {
				var type = engineTypes[typeKey];
				$("<option>")
					.attr("value", typeKey)
					.text(type.label)
					.appendTo($("#field-type"));
			});
			for (var field in engine)
				if (engine.hasOwnProperty(field))
					$("#field-" + field).val(engine[field]);
			(engineTypes[engine.type].fields || []).forEach((field) => {
				$("#engine-field-" + field).show();
			});
			$("#field-type").on("change", () => {
				var type = $("#field-type").val();
				$(".engine-field").hide();
				(engineTypes[type].fields || []).forEach((field) => {
					$("#engine-field-" + field).show();
				});
			});
			$(".engine-content").on("change keydown paste input", () => {
				$("#button-save").prop("disabled", true);
				var type = $("#field-type").val();
				if (!type)
					return;
				var fields = ["name", "game", "type"].concat(engineTypes[type].fields);
				Promise.all(fields.map(Validate))
					.then((valids) => {
						var valid = true;
						valids.forEach((v) => {
							valid = valid && !!v;
						})
						if (valid)
							$("#button-save").prop("disabled", false);
					})
			});
			$("#button-cancel").on("click", () => {
				window.close();
			});
			$("#button-save").on("click", () => {
				var _engine = {
					id: engine.id
				}
				var type = $("#field-type").val();
				var fields = ["name", "game", "type"].concat(engineTypes[type].fields);
				fields.forEach((field) => {
					var value = $("#field-" + field).val();
					_engine[field] = value;
				});
				rpc.call("saveEngine", _engine)
					.then(() => {
						window.close();
					})
			});
			Link(".engine-content #help-link", "https://github.com/mi-g/joclyboard/wiki/Game-Engines");

		});

});

