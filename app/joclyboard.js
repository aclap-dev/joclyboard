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
const electron = require('electron');
const settings = require('electron-settings');
const Jocly = require("jocly");
const rpc = require("./rpc");
const utils = require("./joclyboard-utils");
const jbEngines = require("./joclyboard-engines");
const JoclyBoardError = require('./joclyboard-error');
const PJNParser = require("./PJNParser");
const argv = require("yargs").argv;
const pjson = require("./package.json");

exports.mainWindow = null;

var matchesId = 0; // counter for match IDs
var matches = {}; // alive matches

/*
 * JBMatch objects encapsulate Jocly Match objects and provide additional match data like player types, 
 * UI window handlers, ...
 */
class JBMatch {

	constructor(gameName) {
		this.id = ++matchesId;
		this.gameName = gameName;
		this.boardWin = null;
		this.match = null;
	}

	init(clock) {
		var self = this;
		if (clock) {
			self.clock = Object.assign({}, clock);
			self.originalClock = Object.assign({}, clock);
		}
		this.lifePromise = new Promise(function (resolve, reject) {
			self.endLife = resolve;
		});
		return Jocly.createMatch(self.gameName)
			.then((match) => {
				self.match = match;
				return settings.get("view-options:" + match.gameName, null) || match.getViewOptions();
			})
			.then((viewOptions) => {
				self.viewOptions = viewOptions;
			})
	}

	displayBoard(viewOptions, winGeometry) {
		var self = this;
		if (self.boardWin !== null)
			return Promise.reject(new Error("Board already displayed"));
		return self.match.getConfig()
			.then((config) => {
				var preferredRatio = config.view.preferredRatio || 1;
				var maxDimension = 800;
				var extraHeight = 30;
				var width = Math.min(maxDimension, maxDimension * preferredRatio);
				var height = Math.min(maxDimension, maxDimension / preferredRatio);
				var url = `file://${__dirname}/content/play.html?game=${self.gameName}&id=${self.id}`;
				if (viewOptions)
					url += "&options=" + encodeURIComponent(JSON.stringify(viewOptions));
				var winStyle = {
					width: width,
					height: height + extraHeight
				}
				var winOptions = {
					onClosed: function () {
						self.boardWin = null;
						self.destroy();
					}
				}
				if (winGeometry)
					winOptions.geometry = winGeometry;
				else
					winOptions.persist = "board:" + self.gameName;
				return utils.createWindowPromise(url, winStyle, winOptions);
			})
			.then((window) => {
				self.boardWin = window;
			})
	}

	play() {
		var self = this;
		if (self.paused)
			return Promise.resolve();
		var promise = new Promise(function (resolve, reject) {
			self.match.getConfig()
				.then((config) => {
					if (!self.players) {
						self.players = {};
						self.players[Jocly.PLAYER_A] = {
							type: "human",
							name: "Player A"
						}
						self.players[Jocly.PLAYER_B] = {
							type: "ai:0",
							name: "Player B"
						}
					}
					for (let which in self.players)
						if (self.players.hasOwnProperty(which)) {
							let player = self.players[which];
							let m = /^ai:([0-9]+)/.exec(player.type);
							if (m)
								player.level = config.model.levels[m[1]];
						}
					function DisplayResult(result) {
						if (result.winner == Jocly.PLAYER_A)
							self.setBoardText(self.players[Jocly.PLAYER_A].name + " wins");
						else if (result.winner == Jocly.PLAYER_B)
							self.setBoardText(self.players[Jocly.PLAYER_B].name + " wins");
						else
							self.setBoardText("Draw");
					}

					if (self.historyBookWin)
						self.historyBookWin.close();

					function NextMove() {
						self.nextMove()
							.then(([move, result]) => {
								return self.match.applyMove(move);
							})
							.then((result) => {
								if (self.historyWin)
									rpc.call(self.historyWin, "updateHistory");
								if (result.finished) {
									DisplayResult(result);
									resolve();
								} else
									NextMove();
							})
							.catch((error) => {
								if (error instanceof JoclyBoardError)
									// we should report this error to the user
									console.error("!!!!!!!", error);
							});
					}
					if (self.historyWin)
						rpc.call(self.historyWin, "updateHistory");
					self.match.getFinished()
						.then((result) => {
							if (result.finished) {
								DisplayResult(result);
								resolve();
							} else
								NextMove();
						}, reject);
				})
				.catch((error) => {
					reject(error);
				});
		});
		return promise;
	}

	nextMove() {
		var self = this;
		var promise = new Promise(function (resolve, reject) {
			self.actionReject = reject;
			self.match.getTurn()
				.then((turn) => {
					return Promise.all([turn, self.match.otherPlayer(turn)]);
				})
				.then(([turn, otherTurn]) => {
					if (self.clock) {
						if (self.clock.turn != turn) {
							var now = Date.now();
							if (self.clock.turn == otherTurn)
								self.clock[otherTurn] -= now - self.clock.t0;
							self.clock.t0 = now;
							self.clock.turn = turn;
							if (self.clockWin)
								rpc.call(self.clockWin, "updateClock")
									.then(() => { }, () => { });
						}
					}
					if (turn == Jocly.PLAYER_A)
						self.setBoardText(self.players[Jocly.PLAYER_A].name + " playing");
					else if (turn == Jocly.PLAYER_B)
						self.setBoardText(self.players[Jocly.PLAYER_B].name + " playing");
					var player = self.players[turn];
					if (player.type == "human")
						self.nextMoveHuman(player)
							.then(resolve, reject);
					else if (/^ai:[0-9]+/.test(player.type))
						self.nextMoveAI(player)
							.then(resolve, reject);
					else if (/^engine:/.test(player.type))
						self.nextMoveEngine(player)
							.then(resolve, reject);
					else if (player.type == "random")
						self.nextMoveRandom(player)
							.then(resolve, reject);
					else
						reject(new Error("nextMove: no such player type " + player.type));
				});
		});
		self.actionPromise = promise;
		promise = promise.then((result) => {
			if (self.clock) {
				if (result[1].finished) {
					if (self.clock.turn) {
						var now = Date.now();
						self.clock[self.clock.turn] -= now - self.clock.t0;
						delete self.clock.turn;
						if (self.clockWin)
							rpc.call(self.clockWin, "updateClock")
								.then(() => { }, () => { });
					}
				}
			}
			delete self.actionReject;
			delete self.actionPromise;
			return result;
		}).catch((error) => {
			delete self.actionReject;
			delete self.actionPromise;
			throw error;
		});
		return promise;
	}

	nextMoveHuman(player) {
		var self = this;
		if (!self.boardWin)
			return Promise.reject(new Error("nextMoveHuman: no board window"));
		return self.match.save()
			.then((gameData) => {
				return rpc.call(self.boardWin, "humanTurn", {
					gameData: gameData
				});
			})
			.then((result) => {
				return [result.move, result];
			})
	}

	nextMoveAI(player) {
		// use the jocly ai from board window to save CPU from the main thread
		var self = this;
		if (!self.boardWin)
			return Promise.reject(new Error("nextMoveHuman: no board window"));
		return self.match.save()
			.then((gameData) => {
				var level = player.level;
				if (self.clock) {
					if (level.ai == "uct") {
						level = Object.assign({}, level);
						delete level.maxNodes;
						const moveTimeRatio = 40; // time allocated to this move = 1/40 the remaining time
						level.maxDuration = (self.clock[self.clock.turn] / moveTimeRatio) / 1000;
					}
				}
				return rpc.call(self.boardWin, "aiTurn", {
					gameData: gameData,
					level: level
				});
			})
	}

	nextMoveRandom(player) {
		var self = this;
		if (!self.boardWin)
			return Promise.reject(new Error("nextMoveRandom: no board window"));
		return self.match.getPossibleMoves()
			.then((moves) => {
				if (moves.length === 0)
					throw new Error("nextMoveRandom: no possible move");
				var index = Math.floor(Math.random() * moves.length);
				return moves[index];
			})
			.then((move) => {
				return Promise.all([move, self.match.save()]);
			})
			.then(([move, gameData]) => {
				return rpc.call(self.boardWin, "playMove", {
					gameData: gameData,
					move: move
				})
			})
	}

	nextMoveEngine(player) {
		var self = this;
		var engines = settings.get("engines", {});
		var engineId = /^engine:(.*)$/.exec(player.type)[1];
		var engine = engines[engineId];
		if (!engine)
			return Promise.reject(new Error("No such engine id " + engineId));
		return self.match.getTurn()
			.then((who) => {
				self.engines = self.engines || {};
				var jbEngine = self.engines[who];
				var promise = Promise.resolve();
				if (!jbEngine)
					promise = promise.then(() => {
						return jbEngines.createEngine(engine)
					})
						.then((_jbEngine) => {
							return (jbEngine = self.engines[who] = _jbEngine);
						});
				return promise.then(() => {
					return jbEngine.catchUp(self.match, self.clock)
				})
					.then((engineMove) => {
						return jbEngine.getBestMove(engineMove);
					})
					.then((move) => {
						return Promise.all([move, self.match.save()]);
					})
					.then(([move, gameData]) => {
						return rpc.call(self.boardWin, "playMove", {
							gameData: gameData,
							move: move
						})
					})
			})
	}

	takeBack(index) {
		var self = this;
		return self.cleanAction()
			.then(() => {
				self.pause(false)
			})
			.then(() => {
				return self.match.getPlayedMoves()
			})
			.then((playedMoves) => {
				if (typeof index != "undefined")
					return self.match.rollback(index);
				var lastUserMove = -1;
				if (
					((playedMoves.length % 2 === 1) && self.players[Jocly.PLAYER_A].type == "human") ||
					((playedMoves.length % 2 === 0) && self.players[Jocly.PLAYER_B].type == "human"))
					lastUserMove = playedMoves.length - 1;
				else if (
					((playedMoves.length % 2 === 1) && self.players[Jocly.PLAYER_B].type == "human") ||
					((playedMoves.length % 2 === 0) && self.players[Jocly.PLAYER_A].type == "human"))
					lastUserMove = playedMoves.length - 2;
				if (lastUserMove >= 0)
					return self.match.rollback(lastUserMove);
				else
					return Promise.reject(new Error("takeBack: no human player"));
			});
	}

	restart() {
		var self = this;
		return self.cleanAction()
			.then(() => {
				if (self.clock)
					self.clock = Object.assign({}, self.originalClock);
				return self.match.rollback(0)
			})
	}

	setPlayers(players) {
		var self = this;
		return self.cleanAction()
			.then(() => {
				Object.keys(self.engines || []).map((id) => {
					self.engines[id].destroy();
					delete self.engines[id];
				});
				self.players = players;
				return Promise.resolve();
			})
	}

	getPlayers() {
		var self = this;
		var players = {};
		['A', 'B'].forEach((which) => {
			players[Jocly["PLAYER_" + which]] = {
				type: self.players && self.players[Jocly["PLAYER_" + which]].type || "human",
				name: self.players && self.players[Jocly["PLAYER_" + which]].name || "Player " + which,
			}
		})
		return players;
	}

	load(data) {
		var self = this;
		return self.cleanAction()
			.then(() => {
				return self.match.load(data);
			})
	}

	setBoardText(text) {
		if (!this.boardWin)
			return;
		rpc.call(this.boardWin, "setFooterText", text);
	}

	openPlayers() {
		var self = this;
		if (this.playersWin)
			this.playersWin.show();
		else
			utils.createWindowPromise(`file://${__dirname}/content/players.html?id=${self.id}`, {
				width: 400,
				height: 240
			}, {
					onClosed: function () {
						delete self.playersWin;
					}
				})
				.then((window) => {
					self.playersWin = window;
				});
	}

	openViewOptions() {
		var self = this;
		if (this.viewOptionsWin)
			this.viewOptionsWin.show();
		else
			utils.createWindowPromise(`file://${__dirname}/content/view-options.html?id=${self.id}`, {
				width: 280,
				height: 340
			}, {
					onClosed: function () {
						delete self.viewOptionsWin;
					}
				})
				.then((window) => {
					self.viewOptionsWin = window;
				});
	}

	setViewOptions(options) {
		var self = this;
		return self.cleanAction()
			.then(() => {
				return rpc.call(self.boardWin, "setViewOptions", options)
			});
	}

	openHistory(winGeometry) {
		var self = this;
		if (this.historyWin)
			this.historyWin.show();
		else {
			var winOptions = {
				onClosed: function () {
					delete self.historyWin;
				}
			}
			if (winGeometry)
				winOptions.geometry = winGeometry;
			else
				winOptions.persist = "history:" + self.gameName
			utils.createWindowPromise(`file://${__dirname}/content/history.html?game=${self.gameName}&id=${self.id}`, {
				width: 400,
				height: 220
			}, winOptions)
				.then((window) => {
					self.historyWin = window;
				});
		}
	}

	getHistory() {
		var self = this;
		return self.match.getPlayedMoves()
			.then((moves) => {
				return self.match.getMoveString(moves);
			})
	}

	openClock(winGeometry) {
		var self = this;
		if (this.clockWin)
			this.clockWin.show();
		else {
			var winOptions = {
				onClosed: function () {
					delete self.clockWin;
				}
			}
			if (winGeometry)
				winOptions.geometry = winGeometry;
			else
				winOptions.persist = "clock:" + self.gameName
			utils.createWindowPromise(`file://${__dirname}/content/clock.html?id=${self.id}`, {
				width: 400,
				height: 145,
				minWidth: 100,
				minHeight: 25
			}, winOptions)
				.then((window) => {
					self.clockWin = window;
				});
		}
	}

	freeze(index, animLast) {
		var self = this;
		return self.cleanAction()
			.then(() => {
				return self.match.save()
			})
			.then((gameData) => {
				if (animLast) {
					var lastMove = gameData.playedMoves[index];
					gameData.playedMoves = gameData.playedMoves.slice(0, index);
					return rpc.call(self.boardWin, "display", {
						gameData: gameData
					})
						.then(() => {
							return rpc.call(self.boardWin, "playMove", {
								gameData: gameData,
								move: lastMove
							})
						})
						.then(() => {
							self.setBoardText("")
						})
				} else {
					gameData.playedMoves = gameData.playedMoves.splice(0, index + 1);
					return rpc.call(self.boardWin, "display", {
						gameData: gameData
					})
						.then(() => {
							self.setBoardText("")
						})
				}
			});
	}

	pause(paused) {
		var self = this;
		return self.cleanAction()
			.then(() => {
				if (self.paused != paused) {
					self.paused = paused;
					if (self.clock) {
						delete self.clock.turn;
						if (self.clockWin)
							rpc.call(self.clockWin, "updateClock")
								.then(() => { }, () => { });
					}
				}
			});
	}

	replayLastMove() {
		var self = this;
		return self.cleanAction()
			.then(() => {
				return self.match.save()
			})
			.then((gameData) => {
				var index = gameData.playedMoves.length - 1;
				if (gameData.playedMoves.length < 0)
					return Promise.resolve();
				var lastMove = gameData.playedMoves[index];
				gameData.playedMoves = gameData.playedMoves.slice(0, index);
				return rpc.call(self.boardWin, "display", {
					gameData: gameData
				})
					.then(() => {
						return rpc.call(self.boardWin, "playMove", {
							gameData: gameData,
							move: lastMove
						})
					})
			})
	}

	cleanAction() {
		var self = this;
		return new Promise((resolve, reject) => {
			if (self.actionPromise) {
				self.actionReject(new Error("cleanAction: aborted"));
				self.actionPromise.then(resolve, resolve);
			} else
				resolve();
		}).then(() => {
			self.destroyEngines();
		})
	}

	loadFromNotation(prettyMoves, initial) {
		var self = this;
		var moves = [], index = 0;
		return self.match.load({
			playedMoves: [],
			initialBoard: initial
		})
			.then(() => {
				return new Promise(function (resolve, reject) {
					function NextMove() {
						if (index >= prettyMoves.length) {
							if (self.historyWin)
								rpc.call(self.historyWin, "updateHistory");
							return self.match.save()
								.then((gameData) => {
									var moves = gameData.playedMoves;
									var lastMove = moves.length > 0 && moves[moves.length - 1];
									if (lastMove) {
										var _gameData = Object.assign({}, gameData, {
											playedMoves: moves.slice(0, moves.length - 1)
										});
										return rpc.call(self.boardWin, "display", {
											gameData: _gameData
										})
											.then(() => {
												return rpc.call(self.boardWin, "playMove", {
													gameData: _gameData,
													move: lastMove
												})
											})
									} else
										return rpc.call(self.boardWin, "display", {
											gameData: gameData
										})
								})
								.then(() => {
									resolve();
								})
						}
						self.match.pickMove(prettyMoves[index])
							.then((move) => {
								if (!move)
									return reject(new Error("Invalid move " + prettyMoves[index]));
								moves.push(move);
								index++;
								return self.match.applyMove(move);
							})
							.then(() => {
								return NextMove();
							})
							.catch(reject);
					}
					NextMove();
				})
			})
	}

	destroyEngines() {
		var self = this;
		return Promise.all(
			Object.keys(self.engines || []).map((id) => {
				return self.engines[id].destroy()
					.then(() => {
						delete self.engines[id];
					})
			})
		);
	}

	destroy() {
		var self = this;
		["boardWin", "viewOptionsWin", "playersWin", "historyWin", "clockWin", "historyBookWin"].forEach((win) => {
			if (self[win]) {
				self[win].close();
				delete self[win];
			}
		});
		return self.destroyEngines()
			.then(() => {
				self.endLife();
			});
	}

}

/*
 * Returns as a promise the JBMatch object corresponding to the given match id.
 * Rejects the promise is no such match
 */
function GetMatch(matchId) {
	var jbMatch = matches[matchId];
	if (!jbMatch)
		return Promise.reject(new Error("no such match id", matchId));
	else
		return Promise.resolve(jbMatch);
}

/*
 * Cleans up current match action, calls given action method then resumes playing 
 * whatever the action method promise result
 */
function MatchAction(matchId, actionFunction) {
	return GetMatch(matchId)
		.then((match) => {
			function KeepPlaying() {
				match.play();
			}
			return actionFunction.call(match, match)
				.then(KeepPlaying, KeepPlaying);
		})
}

/* 
 * Controller methods are intended to be invoked from UI windows
 */
var controller = {};

controller.openGame = (gameName) => {
	utils.createWindow(`file://${__dirname}/content/game.html?game=${gameName}`, {
		width: 500,
		height: 400
	}, {
			persist: "game:" + gameName
		});
}

controller.openInfo = (gameName) => {
	utils.createWindow(`file://${__dirname}/content/info.html?game=${gameName}`, {
		width: 600,
		height: 400
	});
}

controller.newMatch = (gameName, clock) => {
	var jbMatch = new JBMatch(gameName);
	return jbMatch.init(clock)
		.then(() => {
			matches[jbMatch.id] = jbMatch;
			return jbMatch.displayBoard();
		})
		.then(() => {
			jbMatch.play()
				.catch(() => { });
		})
		.catch((err) => { console.warn(err) })
		.then(() => {
			return jbMatch;
		})
}

controller.setFavorite = (gameName, favorite) => {
	var favorites = settings.get("favoriteGames", {});
	if (favorite)
		favorites[gameName] = Date.now();
	else
		delete favorites[gameName];
	settings.set("favoriteGames", favorites);
	rpc.call(exports.mainWindow, "updateFavorites", favorites);
}

controller.isFavorite = (gameName) => {
	var favorites = settings.get("favoriteGames", {});
	return Promise.resolve(!!favorites[gameName]);
}

controller.takeBack = (matchId, index) => {
	return MatchAction(matchId, (match) => {
		return match.takeBack(index);
	})
}

controller.restart = (matchId) => {
	return MatchAction(matchId, (match) => {
		return match.restart();
	});
}

controller.loadMatch = (matchId, data) => {
	return MatchAction(matchId, (match) => {
		return match.load(data);
	});
}

controller.openPlayers = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.openPlayers();
		});
}

controller.openViewOptions = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.openViewOptions();
		});
}

controller.getPlayersInfo = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return Promise.all([match, match.match.getConfig()]);
		})
		.then(([match, config]) => {
			var engines = settings.get("engines", {});
			var engineList = Object.keys(engines)
				.filter((engineId) => {
					var engine = engines[engineId];
					return engine && engine.game == match.gameName;
				})
				.map((engineId) => {
					return {
						id: engineId,
						label: engines[engineId].name
					}
				});
			var levels = config.model.levels.map((level) => level.label);
			if (match.clock)
				levels = ["Auto"];
			return ({
				players: match.getPlayers(),
				levels: levels,
				engines: engineList
			})
		})
}

controller.setPlayers = function (matchId, players) {
	return MatchAction(matchId, (match) => {
		return match.setPlayers(players)
			.then(() => {
				settings.set("players:" + match.gameName, players);
			})
	});
}

controller.getViewInfo = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.match.getConfig()
				.then((config) => {
					return {
						options: match.viewOptions,
						config: config.view,
						players: match.getPlayers()
					}
				});
		})
}

controller.setViewOptions = (matchId, options) => {
	return MatchAction(matchId, (match) => {
		return match.setViewOptions(options)
			.then(() => {
				match.viewOptions = options;
				settings.set("view-options:" + match.gameName, options);
			})
	});
}

controller.openSaveTemplate = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			var templates = settings.get("templates", {});
			var templateName = match.templateName;
			if (!templateName) {
				var templateIndex = 1;
				while (templates["Template-" + templateIndex])
					templateIndex++;
				templateName = "Template-" + templateIndex;
			}
			utils.createWindow(`file://${__dirname}/content/save-template.html?id=${matchId}&name=${templateName}`, {
				width: 400,
				height: 200
			});
		})
}

controller.saveTemplate = (matchId, templateName) => {
	return GetMatch(matchId)
		.then((match) => {
			var templates = settings.get("templates", {});
			var template = {
				gameName: match.gameName,
				created: Date.now(),
				lastUsed: Date.now(),
				players: match.players,
				clock: match.originalClock,
				viewOptions: match.viewOptions,
				winSize: match.boardWin.getSize(),
				winPos: match.boardWin.getPosition(),
				templateName: templateName
			}
			match.templateName = templateName;
			if (match.historyWin) {
				let position = match.historyWin.getPosition();
				let size = match.historyWin.getSize();
				template.historyWin = {
					width: size[0],
					height: size[1],
					x: position[0],
					y: position[1]
				}
			}
			if (match.clockWin) {
				let position = match.clockWin.getPosition();
				let size = match.clockWin.getSize();
				template.clockWin = {
					width: size[0],
					height: size[1],
					x: position[0],
					y: position[1]
				}
			}
			templates[templateName] = template;
			settings.set("templates", templates);
			return rpc.call(exports.mainWindow, "updateTemplates", templates);
		});
}

controller.isTemplateNameValid = (templateName) => {
	if (!/^[0-9A-Za-z\-_]+$/.test(templateName))
		return false;
	var templates = settings.get("templates", {});
	return !templates[templateName];
}

controller.removeTemplate = (templateName) => {
	var templates = settings.get("templates", {});
	if (!templates[templateName])
		return Promise.reject(new Error("No such template"));
	delete templates[templateName];
	settings.set("templates", templates);
	return rpc.call(exports.mainWindow, "updateTemplates", templates);
}

controller.playTemplate = (templateName) => {
	var templates = settings.get("templates", {});
	var template = templates[templateName];
	if (!template)
		return Promise.reject(new Error("No such template"));
	template.lastUsed = Date.now();
	settings.set("templates", templates);
	rpc.call(exports.mainWindow, "updateTemplates", templates)
		.catch(() => { });

	var jbMatch = new JBMatch(template.gameName);

	return jbMatch.init(template.clock)
		.then(() => {
			return jbMatch.setPlayers(template.players)
		})
		.then(() => {
			matches[jbMatch.id] = jbMatch;
			jbMatch.viewOptions = template.viewOptions;
			jbMatch.templateName = template.templateName;
			return jbMatch.displayBoard(template.viewOptions, {
				width: template.winSize[0],
				height: template.winSize[1],
				x: template.winPos[0],
				y: template.winPos[1]
			})
		})
		.then(() => {
			var children = []
			if (template.historyWin)
				children.push(jbMatch.openHistory(template.historyWin));
			if (template.clockWin)
				children.push(jbMatch.openClock(template.clockWin));
			return Promise.all(children);
		})
		.then(() => {
			jbMatch.play();
		})
		.catch(() => { })
		.then(() => {
			return jbMatch;
		})
}

controller.editEngine = (engineName) => {
	var engines = settings.get("engines", {});
	var engine = null;
	if (engineName) {
		engine = engines[engineName];
		if (!engine)
			return Promise.reject(new Error("No such engine " + engineName));
	} else {
		var id = 1;
		while (engines[id])
			id++;
		engine = {
			id: id,
			name: "Engine " + id,
			game: "",
			type: "",
			details: "# Yaml format\n\n",
			lastOpened: Date.now()
		}
	}
	var url = `file://${__dirname}/content/engine.html?engine=${encodeURIComponent(JSON.stringify(engine))}`;
	utils.createWindow(url, {
		width: 350,
		height: 570
	}, {
			persist: "engine"
		});
	return Promise.resolve();
}

controller.removeEngine = (engineId) => {
	var engines = settings.get("engines", {});
	if (!engines[engineId])
		return Promise.reject(new Error("No such engine"));
	delete engines[engineId];
	settings.set("engines", engines);
	return rpc.call(exports.mainWindow, "updateEngines", engines)
}


controller.saveEngine = (engine) => {
	engine.lastOpened = Date.now();
	var engines = settings.get("engines", {});
	engines[engine.id] = engine;
	settings.set("engines", engines);
	return rpc.call(exports.mainWindow, "updateEngines", engines)
}

controller.isFile = (path) => {
	return new Promise((resolve, reject) => {
		require("fs").stat(path, (err, stat) => {
			resolve(!err && stat.isFile());
		})
	})
}

controller.openHistory = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.openHistory();
		});
}

controller.getHistory = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.getHistory();
		});
}

controller.openClock = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.openClock();
		});
}

controller.freeze = (matchId, index, animLast) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.freeze(index, animLast);
		});
}

controller.getClock = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return Promise.all([match, match.getPlayers()]);
		})
		.then(([match, players]) => {
			return {
				players: players,
				clock: match.clock
			}
		});
}

controller.isPaused = (matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return !!match.paused;
		})
}

controller.pause = (matchId, paused) => {
	return MatchAction(matchId, (match) => {
		return match.pause(paused)
	})
}

controller.replayLastMove = (matchId) => {
	return MatchAction(matchId, (match) => {
		return match.replayLastMove()
	})
}


controller.newClockedMatch = (gameName) => {
	utils.createWindowPromise(`file://${__dirname}/content/clock-setup.html?game=${gameName}`, {
		width: 400,
		height: 250
	});
}

controller.openBook = (gameName, fileName, data) => {

	function FormatTag(tags, name) {
		if (tags[name])
			return (/^"*(.*?)"*$/).exec(tags[name])[1];
		else
			return "?";
	}


	utils.createWindowPromise(`file://${__dirname}/content/book.html?game=${gameName}&file=${encodeURIComponent(fileName)}`, {
		width: 250,
		height: 400,
		persist: "book:" + gameName
	})
		.then((window) => {
			var bookMatches = [];
			try {
				PJNParser.parse(data, (match) => {
					var label = "Match";
					if (match.tags.White && match.tags.Black) {
						label = FormatTag(match.tags, 'White') + ' vs ' + FormatTag(match.tags, 'Black');
						if (match.tags.Result && match.tags.Result != '*')
							label += " - " + match.tags.Result;
					}
					label += " #" + (bookMatches.length + 1);
					var bookMatch = {
						label: label,
						text: data.substr(match.offset, match.length)
					};
					bookMatch.playerA = match.tags.White;
					bookMatch.playerB = match.tags.Black;
					bookMatches.push(bookMatch);
				}, () => {
					if (bookMatches.length === 0)
						return rpc.call(window, "error", "No game found in this file");
					rpc.call(window, "setBookMatches", bookMatches);
				}, (error) => {
					throw error;
				})
			} catch (error) {
				rpc.call(window, "error", "Could not parse file: " + error.message);
			}
		})
}

controller.openBookMatch = (gameName, matchData) => {
	var jbMatch = new JBMatch(gameName);
	return jbMatch.init()
		.then(() => {
			jbMatch.paused = true;
			jbMatch.players = {};
			jbMatch.players[Jocly.PLAYER_A] = {
				type: "human",
				name: matchData.playerA || "Player A"
			}
			jbMatch.players[Jocly.PLAYER_B] = {
				type: "human",
				name: matchData.playerB || "Player B"
			}
			matches[jbMatch.id] = jbMatch;
			jbMatch.displayBoard()
				.then(() => {
					utils.createWindowPromise(`file://${__dirname}/content/book-history.html?game=${gameName}&id=${jbMatch.id}`, {
						width: 400,
						height: 250
					}, {
							onClosed: function () {
								delete jbMatch.historyBookWin;
							},
							persist: "book-history:" + gameName
						})
						.then((window) => {
							jbMatch.historyBookWin = window;
							return rpc.call(window, "setMatchData", matchData);
						})
				})
		});
}

controller.bookHistoryView = (matchId, spec) => {
	return MatchAction(matchId, (match) => {
		return match.loadFromNotation(spec.playedMoves.slice(0, spec.playMove ? spec.current + 1 : spec.current), spec.initial);
	})
}

controller.log = function () {
	console.log.apply(console, arguments);
}

controller.openBoardState = (gameName, matchId) => {
	utils.createWindowPromise(`file://${__dirname}/content/open-position.html?game=${gameName}&id=${matchId || ''}`, {
		width: 400,
		height: 150
	});
}

controller.loadBoardState = (gameName, matchId, boardState) => {
	var gameData = {
		game: gameName,
		playedMoves: [],
		initialBoard: boardState
	};
	if (matchId) {
		return MatchAction(matchId, (match) => {
			return match.load(gameData);
		})
	} else {
		var jbMatch = new JBMatch(gameName);
		return jbMatch.init()
			.then(() => {
				jbMatch.players = {};
				jbMatch.players[Jocly.PLAYER_A] = {
					type: "human",
					name: "Player A"
				}
				jbMatch.players[Jocly.PLAYER_B] = {
					type: "human",
					name: "Player B"
				}
				return jbMatch.load(gameData)
			})
			.then(() => {
				jbMatch.paused = true;
				matches[jbMatch.id] = jbMatch;
				return jbMatch.displayBoard();
			})
			.then(() => {
				return rpc.call(jbMatch.boardWin, "display", {
					gameData: gameData
				})
			})
			.catch(() => { });
	}
}

controller.showBoardState = (gameName, matchId) => {
	return GetMatch(matchId)
		.then((match) => {
			return match.match.getBoardState();
		})
		.then((boardState) => {
			utils.createWindowPromise(`file://${__dirname}/content/show-position.html?game=${gameName}&id=${matchId || ''}`, {
				width: 400,
				height: 150
			}, {
					persist: "show-history:" + gameName
				}).then((window) => {
					rpc.call(window, "setPosition", boardState)
				});
		})
}

rpc.listen(controller);

exports.createMainWindow = function () {
	return utils.createWindowPromise(`file://${__dirname}/content/hub.html`, {
		show: !argv["hide-main"]
	}, {
			persist: "main"
		})
		.then((window) => {
			exports.mainWindow = window;
			return window;
		})
		.catch((err) => {
			console.warn(err);
		})
}

exports.notifyUser = function (options) {
	return rpc.call(exports.mainWindow, "notifyUser", options);
}

electron.app.on('ready', () => {
	var playPromises = [];
	if (argv["quick-play"])
		playPromises = playPromises.concat(
			argv["quick-play"].split(":").map((game) => {
				return controller.newMatch(game)
					.then((match) => {
						return match.lifePromise;
					})
			})
		)

	if (argv.play)
		playPromises = playPromises.concat(
			argv.play.split(":").map((template) => {
				return controller.playTemplate(template)
					.then((match) => {
						return match.lifePromise;
					})
			})
		)

	if (playPromises.length > 0)
		Promise.all(playPromises)
			.then(() => {
				process.exit(0);
			})
});

if (argv["debug-content"])
	require("electron-debug")({
		showDevTools: true
	});

if (argv["rpc-debug-level"])
	rpc.setDebug(parseInt(argv["rpc-debug-level"]));

if (argv.help) {
	console.info(
		`
${pjson.productName} version ${pjson.version}

Command line options:
  --help : print this message
  --list-games : display the list of supported games
  --list-templates : display the list of defined templates
  --quick-play <game>[:<game>...] : start playing game(s) directly
  --play <template>[:<template>...] : start playing from template(s)
  --hide-main : do not show main window
  --debug-content : windows have debugger
  --rpc-debug-level <level> : trace rpc calls

Licensed under AGPL v3.0
`
	);
	process.exit(0);
}

if (argv["list-games"]) {
	Jocly.listGames()
		.then((games) => {
			var gameList = Object.keys(games).sort().map((game) => {
				return Object.assign({
					gameName: game
				}, games[game]);
			});
			gameList.forEach((game) => {
				console.info(game.gameName, ":", game.title, "-", game.summary);
			});
			process.exit(0);
		})
}

if (argv["list-templates"]) {
	var templates = settings.get("templates", {});
	var templateList = Object.keys(templates).map((templateId) => {
		return templates[templateId];
	});
	templateList.sort((a, b) => {
		if (b.templateName < a.templateName)
			return 1;
		if (b.templateName > a.templateName)
			return -1;
		return 0;
	});
	templateList.forEach((template) => {
		console.info(template.templateName, ":", template.gameName,
			template.players[Jocly.PLAYER_A].type + "/" + template.players[Jocly.PLAYER_B].type,
			template.clock ? template.clock[Jocly.PLAYER_A] + "/" + template.clock[Jocly.PLAYER_B] : "no clock");
	});
	process.exit(0);
}
