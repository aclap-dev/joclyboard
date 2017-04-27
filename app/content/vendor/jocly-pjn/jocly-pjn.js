/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
* @author mig <michel.gutierrez@gmail.com>
* @module jquery-jocly
* @overview Utilities for Portable Jocly Notation (includes PGN and PDN).
*/

(function($) {
	
	var GameTypes={
		0: 'chess',
		20: 'draughts',
		21:	'english-draughts',
	}

	function PJN(jqElm) {
		this.jqElm = jqElm;
		this.ajaxReq = null;
		this.applets = $();
	}
	PJN.prototype.init = function(options) {
		var $this=this;
		this.options = {
			defaultGame: 'classic-chess',
			data: null,
			dataUrl: null,
			strings: {
				loadingRemote: 'Loading remote PJN ...',
				loadingError: 'Could not load remote PJN',
				parsingPJN: 'Parsing PJN ...',
				errorParsing: 'Error parsing PJN',
				vs: 'vs',
				tags: 'Tags',
				pickAGame: 'Pick a game ...',
				comment: '?',
				variation: 'V',
			},
			varClasses: ['jocly-pjn-variation-1','jocly-pjn-variation-2','jocly-pjn-variation-3'],
			commentsInitialVisible: true,
			variationsInitialVisible: false,
			commentsToggleable: true,
			variationsToggleable: true,
			onParsedGame: function() {},
			navigation: true,
			nag: {
				0:	'null annotation',
				1:	'good move',
				2:	'poor move',
				3:	'very good move',
				4:	'very poor move',
				5:	'speculative move',
				6:	'questionable move',
				7:	'forced move (all others lose quickly)',
				8:	'singular move (no reasonable alternatives)',
				9:	'worst move',
				10:	'drawish position',
				11:	'equal chances, quiet position',
				12:	'equal chances, active position',
				13:	'unclear position',
				14:	'White has a slight advantage',
				15:	'Black has a slight advantage',
				16:	'White has a moderate advantage',
				17:	'Black has a moderate advantage',
				18:	'White has a decisive advantage',
				19:	'Black has a decisive advantage',
				20:	'White has a crushing advantage (Black should resign)',
				21:	'Black has a crushing advantage (White should resign)',
				22:	'White is in zugzwang',
				23:	'Black is in zugzwang',
				24:	'White has a slight space advantage',
				25:	'Black has a slight space advantage',
				26:	'White has a moderate space advantage',
				27:	'Black has a moderate space advantage',
				28:	'White has a decisive space advantage',
				29:	'Black has a decisive space advantage',
				30:	'White has a slight time (development) advantage',
				31:	'Black has a slight time (development) advantage',
				32:	'White has a moderate time (development) advantage',
				33:	'Black has a moderate time (development) advantage',
				34:	'White has a decisive time (development) advantage',
				35:	'Black has a decisive time (development) advantage',
				36:	'White has the initiative',
				37:	'Black has the initiative',
				38:	'White has a lasting initiative',
				39:	'Black has a lasting initiative',
				40:	'White has the attack',
				41:	'Black has the attack',
				42:	'White has insufficient compensation for material deficit',
				43:	'Black has insufficient compensation for material deficit',
				44:	'White has sufficient compensation for material deficit',
				45:	'Black has sufficient compensation for material deficit',
				46:	'White has more than adequate compensation for material deficit',
				47:	'Black has more than adequate compensation for material deficit',
				48:	'White has a slight center control advantage',
				49:	'Black has a slight center control advantage',
				50:	'White has a moderate center control advantage',
				51:	'Black has a moderate center control advantage',
				52:	'White has a decisive center control advantage',
				53:	'Black has a decisive center control advantage',
				54:	'White has a slight kingside control advantage',
				55:	'Black has a slight kingside control advantage',
				56:	'White has a moderate kingside control advantage',
				57:	'Black has a moderate kingside control advantage',
				58:	'White has a decisive kingside control advantage',
				59:	'Black has a decisive kingside control advantage',
				60:	'White has a slight queenside control advantage',
				61:	'Black has a slight queenside control advantage',
				62:	'White has a moderate queenside control advantage',
				63:	'Black has a moderate queenside control advantage',
				64:	'White has a decisive queenside control advantage',
				65:	'Black has a decisive queenside control advantage',
				66:	'White has a vulnerable first rank',
				67:	'Black has a vulnerable first rank',
				68:	'White has a well protected first rank',
				69:	'Black has a well protected first rank',
				70:	'White has a poorly protected king',
				71:	'Black has a poorly protected king',
				72:	'White has a well protected king',
				73:	'Black has a well protected king',
				74:	'White has a poorly placed king',
				75:	'Black has a poorly placed king',
				76:	'White has a well placed king',
				77:	'Black has a well placed king',
				78:	'White has a very weak pawn structure',
				79:	'Black has a very weak pawn structure',
				80:	'White has a moderately weak pawn structure',
				81:	'Black has a moderately weak pawn structure',
				82:	'White has a moderately strong pawn structure',
				83:	'Black has a moderately strong pawn structure',
				84:	'White has a very strong pawn structure',
				85:	'Black has a very strong pawn structure',
				86:	'White has poor knight placement',
				87:	'Black has poor knight placement',
				88:	'White has good knight placement',
				89:	'Black has good knight placement',
				90:	'White has poor bishop placement',
				91:	'Black has poor bishop placement',
				92:	'White has good bishop placement',
				93:	'Black has good bishop placement',
				94:	'White has poor rook placement',
				95:	'Black has poor rook placement',
				96:	'White has good rook placement',
				97:	'Black has good rook placement',
				98:	'White has poor queen placement',
				99:	'Black has poor queen placement',
				100:	'White has good queen placement',
				101:	'Black has good queen placement',
				102:	'White has poor piece coordination',
				103:	'Black has poor piece coordination',
				104:	'White has good piece coordination',
				105:	'Black has good piece coordination',
				106:	'White has played the opening very poorly',
				107:	'Black has played the opening very poorly',
				108:	'White has played the opening poorly',
				109:	'Black has played the opening poorly',
				110:	'White has played the opening well',
				111:	'Black has played the opening well',
				112:	'White has played the opening very well',
				113:	'Black has played the opening very well',
				114:	'White has played the middlegame very poorly',
				115:	'Black has played the middlegame very poorly',
				116:	'White has played the middlegame poorly',
				117:	'Black has played the middlegame poorly',
				118:	'White has played the middlegame well',
				119:	'Black has played the middlegame well',
				120:	'White has played the middlegame very well',
				121:	'Black has played the middlegame very well',
				122:	'White has played the ending very poorly',
				123:	'Black has played the ending very poorly',
				124:	'White has played the ending poorly',
				125:	'Black has played the ending poorly',
				126:	'White has played the ending well',
				127:	'Black has played the ending well',
				128:	'White has played the ending very well',
				129:	'Black has played the ending very well',
				130:	'White has slight counterplay',
				131:	'Black has slight counterplay',
				132:	'White has moderate counterplay',
				133:	'Black has moderate counterplay',
				134:	'White has decisive counterplay',
				135:	'Black has decisive counterplay',
				136:	'White has moderate time control pressure',
				137:	'Black has moderate time control pressure',
				138:	'White has severe time control pressure',
				139:	'Black has severe time control pressure',
			},
		}
		if (options)
			$.extend(true,this.options, options);
		if(typeof PJNParser != "undefined")
			PJNParser.setNagStringFunction(function(nag) {
				return $this.options.nag[nag] || '$'+nag;
			});
		this.listener=function(event,data) {
			switch(data.type) {
			case 'display':
				$this.highlightMove(data);
				break;
			case 'undisplay':
				$this.unhighlightMove(data);
				break;
			}
		}
		this.jqElm.addClass("jocly-listener");
		this.jqElm.bind("jocly",this.listener);
		this.content = this.jqElm.html();
		this.jqElm.empty();
		if(this.options.data)
			this.load(this.options.data);
		else if(this.options.dataUrl)
			this.loadRemote(this.options.dataUrl);
		else if(this.options.parsedGameData)
			this.loadParsedGame(this.options.parsedGameData);
	}
	PJN.prototype.setOptions = function(options) {
		$.extend(true,this.options,options);
	}
	PJN.prototype.remove = function() {
		this.jqElm.empty();
		this.jqElm.html(this.content);
		this.jqElm.data("jocly-pjn", null);
		this.jqElm.unbind("jocly",this.listener);
		this.jqElm.removeClass("jocly-listener");
	}
	PJN.prototype.update = function(options) {
		this.remove();
		this.init(options);
	}
	PJN.prototype.abortAjax = function() {
		if(this.ajaxReq) {
			this.ajaxReq.abort();
			this.ajaxReq=null;
		}
	}
	PJN.prototype.load = function(data) {
		this.abortAjax();
		this.parse(data);
	}
	PJN.prototype.loadRemote = function(url) {
		var $this=this;
		this.jqElm.html(this.options.strings.loadingRemote);
		this.ajaxReq = $.ajax({
			url: url,
			success: function(data) {
				$this.jqElm.empty();
				$this.parse(data);
			},
			error: function() {
				$this.jqElm.html($this.options.strings.loadingError);
				console.error("Jocly pjn: could not load PJN from "+$this.options.dataUrl);
			},
			complete: function() {
				$this.ajaxReq=null;
			}
		});
	}
	PJN.prototype.parse = function(data) {
		var $this=this;
		this.pjnData = data;
		this.jqElm.html(this.options.strings.parsingPJN);

		this.games=[];
		PJNParser.parse(data,function(game) {
			$this.games.push(game);
		},function() {
			$this.jqElm.empty();
			if($this.games.length==1) {
				$this.jqView=$("<div/>").addClass("jocly-pjn").appendTo($this.jqElm);
				var game=$this.games[0];
				var pjnGame=$this.pjnData.substr(game.offset,game.length);
				$this.parseGame(pjnGame,function() {
					$this.gotoNode($this.game.root);				
				});
			}
			else if($this.games.length>1)
				$this.buildChoice();
		},function(error) {
			$("<pre/>").text(error).addClass("jocly-pjn-error").appendTo($this.jqElm);
		},0);
	}
	PJN.prototype.buildChoice = function() {
		var $this=this;
		//this.jqElm.find("select.jocly-pjn-selector").remove();
		var select=$("<select/>").addClass("jocly-pjn-selector");
		function FormatTag(tags,name) {
			if(tags[name])
				return (/^"*(.*?)"*$/).exec(tags[name])[1];
			else
				return "?";
		}
		$("<option/>").attr("value",'').text(this.options.strings.pickAGame).appendTo(select);
		this.games.forEach(function(game,gameIndex) {
			var label=FormatTag(game.tags,'White') +' '+$this.options.strings.vs+' '+FormatTag(game.tags,'Black');
			if(game.tags.Result && game.tags.Result!='*')
				label+=" - "+game.tags.Result;
			$("<option/>").attr("value",gameIndex).text(label).appendTo(select);
		});
		select.appendTo(this.jqElm);
		this.jqView=$("<div/>").addClass("jocly-pjn").appendTo(this.jqElm);
		select.on("change",function() {
			$this.gameIndex=select.val();
			var game=$this.games[$this.gameIndex];
			var pjnGame=$this.pjnData.substr(game.offset,game.length);
			$this.jqView.text(pjnGame);
			$this.parseGame(pjnGame,function() {
				$this.gotoNode($this.game.root);				
			});
		});
	}
	
	PJN.prototype.select = function(index) {
		this.jqElm.find("select.jocly-pjn-selector").val(index).trigger("change");
	}
	
	PJN.prototype.parseGame = function(data,callback) {
		var $this=this;
		PJNParser.parse(data,function(game) {
			$this.game={
				tags: game.tags,
				root: game.rootNode,
			}
			$this.options.onParsedGame(game);
		},function() {
			$this.updateGameTree();
			$this.display();
			if(callback)
				callback();
		},function(error) {
			$("<pre/>").text(error).addClass("jocly-pjn-error").appendTo($this.jqElm);
			$this.game=null;
		},0);
	}

	PJN.prototype.loadParsedGame = function(data) {
		this.jqView=$("<div/>").addClass("jocly-pjn").appendTo(this.jqElm);
		this.game = {
			tags: data.tags,
			root: data.rootNode
		}
		this.updateGameTree();
		this.display();
		this.gotoNode(this.game.root);
	}
	
	PJN.prototype.updateGameTree = function() {
		function Update(node,moveIndex,side) {
			while(node) {
				if(node.move) {
					if(node.moveNumber) {
						var m=/([0-9]+) *(\.\.\.)?/.exec(node.moveNumber);
						if(m) {
							if(m[2]) {
								side=-1;
								moveIndex=parseInt(m[1])*2-1;
							} else 
								moveIndex=parseInt(m[1])*2-2;
						}
					}
					node.moveIndex=moveIndex;
					node.side=side;
					side=-side;
					moveIndex++;
				}
				if(node.variation)
					Update(node.variation,moveIndex,-side);
				node=node.next;
			}
		}
		Update(this.game.root,0,1);
	}

	PJN.prototype.makeTagsDOM = function(tags) {
		var priority={
			White: 100,
			Black: 99,
			Event: 98,
			Site: 97,
			Date: 96,
			Round: 95,
			FEN: -1,
		}
		var tagArr=[];
		for(var t in tags)
			tagArr.push({
				name: t,
				element: $("<span/>").addClass("jocly-pjn-tag")
					.append($("<span/>").addClass("jocly-pjn-tag-name").text(t))
					.append($("<span/>").addClass("jocly-pjn-tag-sep").text('='))
					.append($("<span/>").addClass("jocly-pjn-tag-value").text(/^"*(.*?)"*$/.exec(tags[t])[1])),
			});
		tagArr.sort(function(t1,t2) {
			var p1=priority[t1.name] || 0;
			var p2=priority[t2.name] || 0;
			return p2-p1;
		});
		var tagsElm=$("<span/>").addClass("jocly-pjn-tags");
		tagArr.forEach(function(tag) {
			tagsElm.append(tag.element);
		});
		return tagsElm;
	}
	
	PJN.prototype.makeNodesDOM = function(node,level,crc,prev,prevPrev) {
		var $this=this;
		function SetMoveClickHandler(elm,node) {
			if($this.options.navigation)
				elm.on("click",function() {
					if($this.options.simpleHighlight) {
						$this.jqView.find(".jocly-pjn-current-move").removeClass("jocly-pjn-current-move");
						$(this).addClass("jocly-pjn-current-move");
					} else
						$(this).addClass("jocly-pjn-pending-move");
					$this.gotoNode(node);				
				});
		}
		var start=true;
		var elm=$("<span/>").addClass("jocly-pjn-moves"); 
		while(node) {
			if(node.move) {
				crc=$.joclyCRC32(prevPrev,crc);
				if(node.side==1)
					elm.append($("<span/>").addClass("jocly-pjn-move-number").text((Math.floor(node.moveIndex/2)+1)+"."));
				else if(start)
					elm.append($("<span/>").addClass("jocly-pjn-move-number").text((Math.floor(node.moveIndex/2)+1)+"..."));
				var elmMove=$("<span/>").addClass("jocly-pjn-move")
					.attr("jocly-pjn-crc",$.joclyCRC32(node.move,$.joclyCRC32(prev,crc))).text(node.move);
				elm.append(elmMove);
				SetMoveClickHandler(elmMove,node);
				start=false;
				prevPrev=prev;
				prev=node.move;
			}
			if(node.comment) {
				var comment=$("<span/>").addClass("jocly-pjn-comment").text(node.comment);
				elm.append(this.makeViewToggler({
					label: this.options.strings.comment,
					show: this.options.commentsInitialVisible,
					toggleable: this.options.commentsToggleable,
				},comment)).append(comment);
			}
			if(node.variation) {
				var variation=this.makeNodesDOM(node.variation,level+1,crc,prevPrev,"");
				variation.addClass(this.options.varClasses[level%this.options.varClasses.length]);
				elm.append(this.makeViewToggler({
					label: this.options.strings.variation,
					show: this.options.variationsInitialVisible,
					toggleable: this.options.variationsToggleable,
				},variation)).append(variation);
			}
				
			node=node.next;
		}
		return elm;
	}

	PJN.prototype.makeViewToggler = function(options,child) {
		options=$.extend({
			label: '',
			openedSuff: '-',
			closedSuff: '+',
			className: '',
			show: false,
		},options);
		function Update() {
			if(state) {
				child.show();
				elm.text(options.label+options.openedSuff);
			} else {
				child.hide();
				elm.text(options.label+options.closedSuff);				
			}
		}
		if(options.toggleable) {
			var state=options.show;
			var elm=$("<span/>").addClass('jocly-pjn-toggler').on("click",function() {
				state=!state;
				Update();
			});
			Update();
			return elm;
		} else
			return $("<span/>");
	}

	PJN.prototype.display = function() {
		this.jqView.empty();
		var tags=this.makeTagsDOM(this.game.tags);
		this.jqView.append(this.makeViewToggler({
			label: this.options.strings.tags,
			toggleable: true,
		},tags)).append(tags).append(this.makeNodesDOM(this.game.root,0,0,this.game.tags.FEN || "",""));
	}
	
	PJN.prototype.attachApplet = function(applets) {
		this.applets=this.applets.add(applets);
	}
	
	PJN.prototype.gotoNode = function(node) {
		var gameName=this.options.defaultGame;
		var spec={
			format: "pjn",
			playedMoves: [],
			tags: this.game.tags,
		}
		if(this.game.tags.JoclyGame)
			gameName=this.game.tags.JoclyGame;
		else if(this.game.tags.GameType) {
			var m=/([0-9]+)(?:,([WB]),([0-9]+),([0-9]+),[ANS][0123](,[01])?)?/.exec(this.game.tags.GameType);
			if(m)
				gameName=GameTypes[m[1]] || gameName;
		}
		var node0=node;
		node=node.prev;
		while(node) {
			if(node.move)
				spec.playedMoves.unshift(node.move);
			node=node.prev;
		}
		node=node0;
		spec.current=spec.playedMoves.length;
		if(node.move)
			spec.playMove=true;
		while(node) {
			if(node.move)
				spec.playedMoves.push(node.move);
			node=node.next;
		}
		
		if(this.game.tags.FEN)
			spec.initial=this.game.tags.FEN;
		if(this.options.appletAction)
			this.options.appletAction("view",gameName,spec);
		else
			this.applets.jocly("view",gameName,spec);
	}
	
	PJN.prototype.highlightMove = function(message) {
		this.unhighlightMove(message); 
		this.jqElm.find(".jocly-pjn-move[jocly-pjn-crc='"+message.crc+"']").addClass("jocly-pjn-current-move");
	}

	PJN.prototype.unhighlightMove = function(message) {
		this.jqElm.find(".jocly-pjn-move").removeClass("jocly-pjn-current-move jocly-pjn-pending-move");
	}

	$.fn.joclyPJN = function() {
		var $arguments = arguments;
		this.each(function() {
				var pjn = $(this).data("jocly-pjn");
				if (!pjn) {
					pjn = new PJN($(this));
					var options = null;
					var dataAttr = $(this).attr("data-jocly-pjn");
					if (dataAttr)
						try {
							options = eval("(" + dataAttr + ")"); // jshint ignore:line
						} catch (e) {
							console
									.error("Jocly pjn: invalid data-jocly-pjn "
											+ dataAttr);
						}
					else if($arguments.length > 0 && typeof $arguments[0] == "object")
						options = $arguments[0];
					pjn.init(options);
					$(this).data("jocly-pjn", pjn);
				}
				if ($arguments.length > 0) {
					var method = $arguments[0];
					if (typeof method != "string")
						return;
					if (typeof pjn[method] != "function")
						throw new Error("Jocly pjn: no such method '"
								+ method + "'");
					pjn[method].apply(pjn, Array.prototype.splice
							.call($arguments, 1));
				}
			});
		return this;
	};

	$(document).ready(function() {

		$("[data-jocly-pjn]").each(function() {
			var $this=$(this);
			$this.jocly();
			if(this.hasAttribute("data-jocly-pjn-init")) {
				var attr=$this.attr("data-jocly-pjn-init");
				if(attr.length===0)
					return;
				try {
					var arr=JSON.parse(attr);
					try {
						if(!Array.isArray(arr)) {
							console.warn("jquery.jocly: data-jocly-pjn-init attribute is not an array");				
						}
						for(var i=0;i<arr.length;i++) {
							var element=arr[i];
							if(Array.isArray(element))
								$this.jocly.apply($this,element);						
							else {
								$this.jocly.apply($this,arr);
								return;
							}
						}
					} catch(e) {
						console.warn("jquery.jocly: data-jocly-pjn-init error:",e);					
					}
				} catch(e) {
					console.warn("jquery.jocly: data-jocly-pjn-init attribute has no JSON valid value");
				}
			}
		});

	});

}(jQuery));

