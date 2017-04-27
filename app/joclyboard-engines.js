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
const spawn = require('child_process').spawn;
const jsyaml = require('js-yaml');
const byline = require('byline');
const Jocly = require("jocly");
const JoclyBoardError = require('./joclyboard-error');
const net = require('net');

class Engine {

	init(config) {
		this.config = Object.assign({}, config, {
			details: jsyaml.safeLoad(config.details) || {}
		});
		this.format = "natural";
	}

	catchUp(match) {
		var self = this;
		this.match = match;
		return self.match.getPossibleMoves()
			.then((moves) => {
				self.possibleMoves = moves;
				return self.match.getMoveString(moves, self.format);
			})
			.then((moves) => {
				self.possibleEngineMoves = moves;
			})
	}

	getBestMove(engineMove) {
		var self = this;
		return new Promise((resolve, reject) => {
			if (self.possibleMoves.length == 1)
				return resolve(self.possibleMoves[0]);
			var moveIndex = self.possibleEngineMoves.indexOf(engineMove);
			if (moveIndex >= 0)
				resolve(self.possibleMoves[moveIndex]);
			else
				console.warn("move", engineMove, "has no exact match, trying to guess");
			self.match.pickMove(engineMove)
				.then(resolve, (err) => {
					console.warn("could not find match for move", engineMove);
				});
		})
	}

	destroy() {
		return Promise.resolve();
	}
}

class ProcessEngine extends Engine {

	init() {
		super.init.apply(this, arguments);
		this.input = [];
	}

	catchUpStdIO(match, matchClock) {
		var self = this;
		return super.catchUp(match, matchClock)
			.then(() => {
				if (self.process)
					return;
				try {
					var args = self.config.details.args || [];
					var processOptions = {};
					if (self.config.details.workingDir)
						processOptions.cwd = self.config.details.workingDir;
					self.process = spawn(self.config.binary, args, processOptions);
					byline(self.process.stdout).on('data', (data) => {

						function NewMessage(message) {
							if (self.waiter && self.waiter.call(self, message)) {
								delete self.waiter;
								return;
							}
							self.input.push(message);
						}

						var line = data.toString('utf8');
						if (self.config.details.debug)
							console.info(Date.now(), "> ", line);
						NewMessage(line);
					});
					byline(self.process.stderr).on('data', (data) => {
						var line = data.toString('utf8');
						if (self.config.details.debug)
							console.info(Date.now(), "!> ", line);
					});
					self.process.on('exit', (code, signal) => {
						if (self.config.details.debug)
							console.info(Date.now(), "Engine closed", code, signal);
					});
					self.process.stdin.setEncoding('utf-8');
					(self.config.details.initialCommands || []).forEach((command) => {
						self.writeEngine(command + "\n");
					});
				} catch (error) {
					return Promise.reject(error);
				}
			})
	}

	writeEngine(text) {
		var self = this;
		return new Promise((resolve, reject) => {
			if (!self.process)
				return reject(new Error("no engine process"));
			if (self.config.details.debug)
				text.trim().split(/\r?\n/).forEach((line) => {
					console.info(Date.now(), "< ", line);
				})
			try {
				self.process.stdin.write(text, () => {
					resolve();
				});
			} catch (e) {
				reject(new JoclyBoardError("Cannot write to " + self.config.name + " engine: " + e.message));
			}
		})
	}

	wait(fn) {
		var self = this;
		return new Promise((resolve, reject) => {
			function Wait(message) {
				try {
					if (fn.call(self, message)) {
						resolve();
						return true;
					} else
						return false;
				} catch (e) {
					reject(e);
					return true;
				}
			}
			while (self.input.length > 0) {
				var message = self.input.shift();
				if (Wait(message))
					return;
			}
			self.waiter = Wait;
		})
	}

	destroy() {
		var self = this;
		if (self.process) {
			try {
				self.process.kill("SIGKILL");
				delete self.process;
			} catch (e) { }
		}
		return super.destroy();
	}

}

class CecpEngine extends ProcessEngine {

	init() {
		super.init.apply(this, arguments);
		this.format = "engine";
	}

	catchUp(match, matchClock) {
		var self = this;
		return super.catchUpStdIO(match, matchClock)
			.then(() => {
				return match.getPlayedMoves();
			})
			.then((moves) => {
				return Promise.all([moves, match.getMoveString(moves, "engine"), match.getTurn()]);
			})
			.then(([moves, engineMoves, turn]) => {
				return Promise.all([moves, engineMoves, turn, match.otherPlayer(turn), match.getInitialBoardState("fen")])
			})
			.then(([moves, engineMoves, turn, otherTurn, initialBoardState]) => {
				var commands = ["new"];
				if (self.config.details.variant)
					commands.push("variant " + self.config.details.variant);

				if (initialBoardState)
					commands.push("setboard " + initialBoardState.boardState);

				commands.push("force");
				(self.config.details.boardSetup || []).forEach((line) => {
					commands.push(line)
				});
				engineMoves.forEach((move) => {
					commands.push(move);
				})

				var clock = {
					time: self.config.details.defaultClock || 5000,
					otim: self.config.details.defaultClock || 5000
				}
				if (matchClock) {
					clock.time = matchClock[turn] - (Date.now() - matchClock.t0);
					clock.otim = matchClock[otherTurn];
				}
				clock.time = Math.max(0, clock.time);
				clock.otim = Math.max(0, clock.otim);

				commands.push("time " + Math.floor(clock.time / 10));
				commands.push("otim " + Math.floor(clock.otim / 10));
				commands.push("go");
				self.writeEngine(commands.join("\n") + "\n")
			})
			.then(() => {
				var re = new RegExp(self.config.details.movePattern || "move\\s+(\\S+)");
				return self.wait((line) => {
					var m = re.exec(line);
					if (m) {
						self.engineMove = m[1];
						return true;
					} else
						return false;
				})
			})
			.then(() => {
				return self.engineMove;
			})
	}
}

class UciEngine extends ProcessEngine {

	init() {
		super.init.apply(this, arguments);
		this.format = "engine";
	}

	catchUp(match, matchClock) {
		var self = this;
		return super.catchUpStdIO(match, matchClock)
			.then(() => {
				return match.getPlayedMoves();
			})
			.then((moves) => {
				return Promise.all([moves, match.getMoveString(moves, "engine"), match.getInitialBoardState("fen")]);
			})
			.then(([moves, engineMoves, initialBoardState]) => {
				var commands = ["ucinewgame"];
				if (self.config.details.variant)
					commands.push("variant " + self.config.details.variant);

				(self.config.details.boardSetup || []).forEach((line) => {
					commands.push(line)
				});

				if (initialBoardState)
					commands.push("position fen " + initialBoardState.boardState + " moves " + engineMoves.join(" "));
				else
					commands.push("position startpos moves " + engineMoves.join(" "));

				var clock = {
					wtime: self.config.details.defaultClock || 5000,
					btime: self.config.details.defaultClock || 5000
				}
				if (matchClock) {
					clock.wtime = matchClock[Jocly.PLAYER_A] - (matchClock.turn == Jocly.PLAYER_A ? Date.now() - matchClock.t0 : 0);
					clock.btime = matchClock[Jocly.PLAYER_B] - (matchClock.turn == Jocly.PLAYER_B ? Date.now() - matchClock.t0 : 0);
				}
				clock.wtime = Math.max(0, clock.wtime);
				clock.btime = Math.max(0, clock.btime);

				commands.push("go wtime " + clock.wtime + " btime " + clock.btime);

				self.writeEngine(commands.join("\n") + "\n")
			})
			.then(() => {
				var re = new RegExp(self.config.details.movePattern || "bestmove\\s+(\\S+)");
				return self.wait((line) => {
					var m = re.exec(line);
					if (m) {
						self.engineMove = m[1];
						return true;
					} else
						return false;
				})
			})
			.then(() => {
				return self.engineMove;
			})
	}
}

class HubEngine extends ProcessEngine {

	catchUp(match, matchClock) {
		var self = this;
		return super.catchUpStdIO(match, matchClock)
			.then(() => {
				return match.getPlayedMoves();
			})
			.then((moves) => {
				return Promise.all([moves, match.getMoveString(moves, "hub"), match.getInitialBoardState("hub")]);
			})
			.then(([moves, engineMoves, initialBoardState]) => {

				var commands = ["start"];
				if (self.config.details.variant)
					commands.push("variant " + self.config.details.variant);

				if (initialBoardState)
					commands.push("pos " + initialBoardState.boardState);

				engineMoves.forEach((move) => {
					commands.push("move " + move);
				});

				var clock = self.config.details.defaultClock || 5000;
				if (matchClock && matchClock.turn)
					clock = matchClock[matchClock.turn] - (Date.now() - matchClock.t0);
				clock = Math.max(0, clock);

				commands.push("level 0 " + clock + " 0");
				commands.push("go");

				self.writeEngine(commands.join("\n") + "\n")

				var re = new RegExp(self.config.details.movePattern || "move\\s+(\\S+)");
				return self.wait((line) => {
					var m = re.exec(line);
					if (m) {
						self.engineMove = m[1];
						return true;
					} else
						return false;
				})
			})
			.then(() => {
				return self.engineMove;
			})
			.then((move) => {
				if (self.config.details.restart) {
					self.process.kill("SIGKILL");
					delete self.process;
				}
				if (move.indexOf("x") >= 0) {
					var parts = move.split("x");
					var capts = parts.slice(2);
					capts.sort();
					move = parts.slice(0, 2).concat(capts).join("x");
				}
				return move;
			})
	}

}

class ServerEngine extends ProcessEngine {

	init() {
		super.init.apply(this, arguments);
		this.port = 80;
		this.host = "127.0.0.1";
		this.input = [];
	}

	destroy() {
		var self = this;
		if (self.socket) {
			try {
				self.socket.end();
				delete self.socket;
			} catch (e) { }
		}
		return super.destroy();
	}

	ensureConnect() {
		var self = this;
		return this.doConnect()
			.then(() => {
				console.info("connected");
			})
			.catch((err) => {
			})
			.then(() => {
				if (self.socket)
					return Promise.resolve();
				console.info("could not connect: trying to launch server ?", self.config.details.binary);
				// see if there is a binary to launch
				if (self.config.details.binary) {
					console.info("launching binary", self.config.details.binary);
					var args = self.config.details.args || [];
					var processOptions = {};
					if (self.config.details.workingDir)
						processOptions.cwd = self.config.details.workingDir;
					self.process = spawn(self.config.details.binary, args, processOptions);
					byline(self.process.stdout).on('data', (data) => {
						var line = data.toString('utf8');
						if (self.config.details.debug)
							console.info(Date.now(), "OUT> ", line);
					});
					byline(self.process.stderr).on('data', (data) => {
						var line = data.toString('utf8');
						if (self.config.details.debug)
							console.info(Date.now(), "ERR> ", line);
					});
					return new Promise((resolve, reject) => {
						setTimeout(resolve, self.config.details.launchDelay || 500);
					})
						.then(() => {
							return self.doConnect()
						})
						.catch((err) => {
							console.info("fail connecting after launching server", err);
							throw err;
						})
				} else
					throw new Error("cannot connect to server and no way to launch it");
			})
	}

	doConnect() {
		var self = this;
		if (!self.socket)
			return new Promise(function (resolve, reject) {
				var socket = new net.Socket();
				self.input = [];
				self.currentInput = null;
				socket.on("connect", () => {
					if (self.config.details.debug)
						console.info(Date.now(), " engine connected");
					self.socket = socket;
					resolve();
				});
				socket.on("error", () => {
					if (!self.socket)
						reject(new Error("Could not connect"));
				})
				socket.on("close", () => {
					if (self.config.details.debug)
						console.info(Date.now(), " engine disconnected");
					if (!self.socket)
						return;
					delete self.socket;
				});
				socket.on("data", (data) => {
					if (self.config.details.debug)
						console.info(Date.now(), "<", data);
					function NewMessage(message) {
						if (self.waiter && self.waiter.call(self, message)) {
							delete self.waiter;
							return;
						}
						self.input.push(message);
					}
					if (!self.socket)
						return;
					var index = 0;
					while (index < data.length) {
						var zeroPos = data.indexOf(0, index);
						if (zeroPos < 0) {
							if (self.currentInput)
								self.currentInput = Buffer.concat(self.currentInput, data.slice(index))
							else
								self.currentInput = data.slice(index);
						} else {
							if (self.currentInput) {
								NewMessage(Buffer.concat(self.currentInput, data.slice(index, zeroPos)));
								self.currentInput = null;
							} else
								NewMessage(data.slice(index, zeroPos));
							index = zeroPos + 1;
						}
					}
				});
				socket.connect({
					port: self.port,
					host: self.host
				});
			});
		else
			return Promise.resolve();
	}

	writeEngine(data) {
		var self = this;
		var buffer = new Buffer(data);
		if (self.config.details.debug)
			console.info(Date.now(), ">", buffer);
		return new Promise((resolve, reject) => {
			self.socket.write(buffer, (err) => {
				if (err)
					reject(err);
				else
					resolve();
			})
		})
	}

}

class DxpEngine extends ServerEngine {

	init() {
		super.init.apply(this, arguments);
		this.port = this.config.details.port || 27531;
	}

	catchUp(match, matchClock) {
		var self = this;
		return super.catchUp(match, matchClock)
			.then(() => {
				return match.getPossibleMoves();
			})
			.then((possibleMoves) => {
				self.possibleMoves = possibleMoves;
				if (self.possibleMoves.length == 1)
					return Promise.resolve("n/a");
				else
					return Promise.resolve(self.ensureConnect())
						.then(() => {
							return match.getPlayedMoves();
						})
						.then((moves) => {
							return match.getMoveString(moves, "dxp");
						})
						.then((engineMoves) => {
							self.engineMoves = engineMoves;
							delete self.engineMove;
							return self.sendGAMEREQ(match, matchClock);
						})
						.then(() => {
							return self.wait((message) => {
								return message[0] == "A".charCodeAt(0);
							})
						})
						.then(() => {
							return self.wait((message) => {
								if (message[0] == "M".charCodeAt(0)) {
									var moveString = message.slice(5).toString('ascii');
									var captCount = parseInt(moveString.slice(4, 6))
									var capts = [];
									for (var i = 0; i < captCount; i++)
										capts.push(moveString.slice(6 + 2 * i, 6 + 2 * i + 2));
									capts.sort();
									self.engineMove = moveString.slice(0, 6) + capts.join("");
									return true;
								}
								return false;
							});
						})
						.then(() => {
							return self.sendGAMEEND();
						})
						.then(() => {
							return self.wait((message) => {
								return message[0] == "E".charCodeAt(0);
							});
						})
						.then(() => {
							return match.getMoveString(possibleMoves, "dxp");
						})
						.then((possibleEngineMoves) => {
							self.possibleEngineMoves = possibleEngineMoves;
							var engineMove = self.engineMove;
							delete self.engineMoves;
							return engineMove;
						})
			})
	}

	writeBufferString(buffer, index, str, length) {
		length = length || str.length;
		for (var i = 0; i < str.length; i++)
			buffer[index + i] = str.charCodeAt(i);
		for (; i < length; i++)
			buffer[index + i] = " ".charCodeAt(0);
	}

	writeBufferNumber(buffer, index, num, length) {
		length = length || 0;
		var str = "" + num;
		for (; str.length < length;)
			str = "0" + str;
		this.writeBufferString(buffer, index, str);
	}

	sendGAMEREQ(match, matchClock) {
		var self = this;

		var buffer = new Uint8Array(95);
		buffer[buffer.length - 1] = 0;
		buffer[0] = "R".charCodeAt(0);
		this.writeBufferString(buffer, 1, "01");
		this.writeBufferString(buffer, 3, "JoclyBoard", 32);
		var follower = (this.engineMoves.length % 2) ? "Z" : "W";
		this.writeBufferString(buffer, 35, follower);
		var clock = this.config.details.defaultClock || 120000;
		if (matchClock && matchClock.turn)
			clock = matchClock[matchClock.turn] - (Date.now() - matchClock.t0);
		clock = Math.max(0, Math.floor(clock / 60000));
		this.writeBufferNumber(buffer, 36, clock, 3);
		this.writeBufferNumber(buffer, 39, 0, 3);
		this.writeBufferString(buffer, 42, "B");
		this.writeBufferString(buffer, 43, (this.engineMoves.length % 2) ? "Z" : "W");
		return match.getBoardState("dxp")
			.then((boardState) => {
				self.writeBufferString(buffer, 44, boardState, 50);
			})
			.then(() => {
				return this.writeEngine(buffer);
			})
	}

	sendGAMEEND() {
		var buffer = new Uint8Array(4);
		this.writeBufferString(buffer, 0, "E00");
		buffer[3] = 0;
		var self = this;
		return self.writeEngine(buffer);
	}

}

exports.createEngine = function (config) {
	return new Promise(function (resolve, reject) {
		var engine;
		switch (config.type) {
			case "cecp":
				engine = new CecpEngine();
				break;
			case "uci":
				engine = new UciEngine();
				break;
			case "hub":
				engine = new HubEngine();
				break;
			case "dxp":
				engine = new DxpEngine();
				break;
			default:
				return reject(new Error("Unsupported engine type " + config.type));
		}
		engine.init(config);
		resolve(engine);
	});
}