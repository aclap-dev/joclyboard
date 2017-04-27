
%{

	//console.log("PJNParser");

	var GetNagString = function(nag) {
		return "#"+nag;
	}

	parser.setNagStringFunction=function(fnt) {
		GetNagString = fnt;
	}	
	
	var SuperParse=parser.parse;
	parser.parse=function(input,callback,complete,error,lineNo) {
		//console.log("parser",input);
		input+="\n"; // dirty way to fix a problem when the game ends on the last character
		parser.lexer.options.ranges=true;
		var yy=parser.yy;
		yy.tags={};
		yy.startOffset=0;
		yy.lineFrom=lineNo;
		yy.rootNode={};
		yy.nodeStack=[yy.rootNode];
		yy.compiledGame=callback;
		yy.complete=complete;
		yy.parseError=function(errStr,errData) {
        	errStr = '!!! Parse error on line ' + (errData.line + lineNo + 1) + ':\n' + parser.lexer.showPosition() + 
        		'\nExpecting ' + errData.expected.join(', ') + ', got \'' + errData.token + '\'';
        	if(error)
        		error(errStr,errData);
        	else
				parser.parseError.call(parser,errStr,errData);
		}
		return SuperParse.call(parser,input);
	}

	function SaveGame(yy) { 			
		//console.warn("SaveGame");
		var tagsCount=0;
		for(var tag in yy.tags)
			tagsCount++;
		if((yy.rootNode.next || tagsCount>0) && yy.compiledGame && yy.lexer.yylloc.range[1]>yy.startOffset) 
			yy.compiledGame({
				offset: yy.startOffset,
				length: yy.lexer.yylloc.range[1]-yy.startOffset,
				lineFrom: yy.lineFrom,
				lineTo: yy.lexer.yylineno,
				tags: yy.tags || {},
				rootNode: yy.rootNode,
				fileName: yy.fileName,
			});
		
		yy.lineFrom=yy.lexer.yylineno;
		yy.startOffset = yy.lexer.yylloc.range[1];
		yy.tags={};
		var rootNode={};
		yy.nodeStack=[rootNode];
		yy.rootNode=rootNode;
	}
	
	function AddTag(yy,tagName,tagValue) {
		yy.tags[tagName]=tagValue;
	}
	
	function AddNode(yy,node) {
		var prevNode=yy.nodeStack[yy.nodeStack.length-1];
		if(!prevNode)
			console.log("line",yy.lexer.yylineno);
		prevNode.next=node;
		node.prev=prevNode;
		yy.nodeStack[yy.nodeStack.length-1]=node;
	}
	
	function CurrentNode(yy) {
		if(yy.nodeStack===undefined)
			debugger;
		return yy.nodeStack[yy.nodeStack.length-1];
	}
	
	function AddMove(yy,move) {
		//console.warn("AddMove",move);
		AddNode(yy,{
			move: move,
		});
	}

	function AddComment(yy,comment) {
		//console.warn("AddComment",comment);
		AddNode(yy,{
			comment: comment,
		});
	}
	
	function AddNAG(yy,nag) {
		var nagText=GetNagString(nag);
		if(nagText===undefined)
			nagText="$"+nag;
		AddComment(yy,nagText);
	}
	
	function EndGameBody(yy) {
		yy.nodeStack.pop();
	}
	
	function StartVariation(yy) {
		var prev=CurrentNode(yy);
		while(!prev.move)
			if(prev.prev)
				prev=prev.prev;
			else
				break;
		if(prev.prev)
			prev=prev.prev;
		var node={
			prev: prev,
		};
		AddNode(yy,{
			variation: node,
		});
		if(yy.nodeStack===undefined)
			debugger;
		yy.nodeStack.push(node);
	}

	function AddMoveNumber(yy,moveNumber) {
		//console.log("AddMoveNumber",moveNumber);
		CurrentNode(yy).moveNumber=moveNumber;
	}
	
	// if followed by blank, returns token otherwise JUSTCHARS
	function JustChars(context,token) {
		if(context._input.length==0)
			return undefined;
		var c=context._input[0];
		if(c==' ' || c=='\n' || c=='\r')
			return token;
		else
			return "JUSTCHARS";
	}
	
%}

%ebnf

%lex

%x REGEXP
%options flex

%%
// Tokens

"1-0"				return JustChars(this,"WIN1");
"1/2-1/2"			return JustChars(this,"DRAW1");
"0-1"				return JustChars(this,"LOSS1");
"2-0"				return JustChars(this,"WIN2");
"1-1"				return JustChars(this,"DRAW2");
"0-2"				return JustChars(this,"LOSS2");
"0-0"				return JustChars(this,"DOUBLEFORFEIT");
"="					return "MOVERATE";
"+="				return "MOVERATE";
"=+"				return "MOVERATE";
"-+"				return "MOVERATE";
"-/+"				return "MOVERATE";
"!"					return "MOVERATE";
"?"					return "MOVERATE";
"?!"				return "MOVERATE";
"??"				return "MOVERATE";
"#"					return "MOVERATE";
"+"					return "MOVERATE";
[0-9]+\.(\.\.?)?\s*	return "MOVENUMBER";


[0-9]				return "DIGIT";
[a-zA-Z]			return "LETTER";
"("					return "(";
")"					return ")";
"["					return "[";
"]"					return "]";
"{"					return "{";
"}"					return "}";
"*"					return "*";
"."					return ".";
'"'					return "DQUOTE";
"$"					return "$";

//[\/;\?\-+!&=#,':<>\\_%]	return "SIGN";

\s+					return "BLANK";


.					return "SIGN";

<<EOF>>				{ SaveGame(yy); if(yy.complete) yy.complete( yylineno ); }


%%

/lex

%%

// Game independent productions

PdnFile          : 
	BLANK? Game (GameSeparator Game)* GameSeparator? ;

GameSeparator    : 
	"*" BLANK? | (Result BLANK?)+ ;

Game             : 
	(GameHeader GameBody?) { SaveGame(yy); } | GameBody { SaveGame(yy); }; 

GameHeader       : 
	PdnTag+ ;
	
GameBody         : 
	(GameMove | Variation | COMMENT | SETUP | NAG | MOVENUMBER })+ { EndGameBody(yy); };

GameMove         : 
	MOVENUMBER Move MOVESTRENGTH? { AddMoveNumber(yy,$1) }
		| Move MOVESTRENGTH? ;
	
Variation        : 
	Variation1 Variation2 ; 

Variation1        : 
	"(" BLANK? { StartVariation(yy); }; 

Variation2        : 
	GameBody ")" BLANK?; 

PdnTag           : 
	"[" IDENTIFIER BLANK STRING "]" BLANK? { AddTag(yy,$2,$4); };
	
Move		:
	ELLIPSE BLANK? | MOVERATE BLANK? | MOVECHARS BLANK? { AddMove(yy,$1); } ;

Square           : 
	ALPHASQUARE | NUMSQUARE ;
	
COMMENT:
	"{" COMMENTCHARS "}" BLANK? { AddComment(yy,$2.join('').replace(/\s+/g,' ')); };
	
COMMENTCHARS:
	COMMENTCHAR* ;

COMMENTCHAR:
	"{" | BLANK | SAFECHAR | "." | "(" | ")" | "[" | "]" | "*" | "$" | DQUOTE | MOVERATE | MOVENUMBER | CompactResult | JUSTCHARS;	
	
Result           :
	CompactResult BLANK? ; 

CompactResult           : 
	Result1 | Result2 | DOUBLEFORFEIT ;
	
Result1          : 
	WIN1 | DRAW1 | LOSS1 ;
	
Result2          : 
	WIN2 | DRAW2 | LOSS2 ;

MOVECHARS	:
	(SAFECHAR | JUSTCHARS) MOVECHARS2 { $$ = $1 + $2; };

MOVECHARS2	:
	MOVECHAR+ { $$ = $1.join(''); };
	
MOVECHAR:
	SAFECHAR | "*" | "." | "$" | MOVERATE | MOVENUMBER | CompactResult | JUSTCHARS;


IDENTIFIER:
	LETTER (LETTER | DIGIT)* { $$ = $1 + $2.join(''); };
	
STRINGCHAR:
	SAFECHAR | BLANK | "*" | "." | "(" | ")" | "{" | "}" |  "[" | "]" | "$" | MOVERATE | MOVENUMBER | CompactResult | JUSTCHARS;
	
SAFECHAR:
	LETTER | DIGIT | SIGN ;
	
STRING:
	DQUOTE STRINGCHAR* DQUOTE { $$ = $2.join('') };

NAG: 
	"$" DIGIT+ BLANK? { AddNAG(yy,$2.join('')); } ;
	
ELLIPSE:
	"." "." ".";


%%
