// jshint ignore: start
/* parser generated by jison 0.4.18 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[18,25,30,38,46,53,54,57,73,76,77,84],$V1=[1,17],$V2=[1,25],$V3=[1,11],$V4=[1,23],$V5=[1,20],$V6=[1,26],$V7=[1,21],$V8=[1,29],$V9=[1,30],$Va=[1,31],$Vb=[1,32],$Vc=[1,15],$Vd=[1,9,62,63,64,65,66,67,68],$Ve=[1,9,18,25,30,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84],$Vf=[1,9,18,25,27,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84],$Vg=[9,18,25,27,30,32,34,38,46,48,53,54,55,57,62,63,64,65,66,67,68,73,76,77],$Vh=[1,9,18,25,27,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84,85],$Vi=[18,25,38,46,53,54,57,73,76,77,84],$Vj=[1,62],$Vk=[1,66],$Vl=[1,65],$Vm=[1,63],$Vn=[1,64],$Vo=[1,68],$Vp=[1,71],$Vq=[1,72],$Vr=[1,73],$Vs=[1,74],$Vt=[1,75],$Vu=[1,76],$Vv=[1,77],$Vw=[9,18,38,53,54,57,62,63,64,65,66,67,68,73,76,77],$Vx=[1,9,18,25,27,30,32,34,38,46,48,53,54,55,57,62,63,64,65,66,67,68,73,76,77,84,85],$Vy=[32,73,76],$Vz=[1,9,18,25,27,32,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84],$VA=[1,9,18,25,27,32,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84,85],$VB=[1,18,25,30,38,46,53,54,57,73,76,77,84],$VC=[1,18,25,30,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84],$VD=[2,86],$VE=[1,116],$VF=[1,18,25,30,32,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"PdnFile":3,"PdnFile_option0":4,"Game":5,"PdnFile_repetition0":6,"PdnFile_option1":7,"GameSeparator":8,"*":9,"GameSeparator_option0":10,"GameSeparator_repetition_plus0":11,"GameHeader":12,"Game_option0":13,"GameBody":14,"GameHeader_repetition_plus0":15,"GameBody_repetition_plus0":16,"GameMove":17,"MOVENUMBER":18,"Move":19,"GameMove_option0":20,"GameMove_option1":21,"Variation":22,"Variation1":23,"Variation2":24,"(":25,"Variation1_option0":26,")":27,"Variation2_option0":28,"PdnTag":29,"[":30,"IDENTIFIER":31,"BLANK":32,"STRING":33,"]":34,"PdnTag_option0":35,"ELLIPSE":36,"Move_option0":37,"MOVERATE":38,"Move_option1":39,"MOVECHARS":40,"Move_option2":41,"Square":42,"ALPHASQUARE":43,"NUMSQUARE":44,"COMMENT":45,"{":46,"COMMENTCHARS":47,"}":48,"COMMENT_option0":49,"COMMENTCHARS_repetition0":50,"COMMENTCHAR":51,"SAFECHAR":52,".":53,"$":54,"DQUOTE":55,"CompactResult":56,"JUSTCHARS":57,"Result":58,"Result_option0":59,"Result1":60,"Result2":61,"DOUBLEFORFEIT":62,"WIN1":63,"DRAW1":64,"LOSS1":65,"WIN2":66,"DRAW2":67,"LOSS2":68,"MOVECHARS_group0":69,"MOVECHARS2":70,"MOVECHARS2_repetition_plus0":71,"MOVECHAR":72,"LETTER":73,"IDENTIFIER_repetition0":74,"STRINGCHAR":75,"DIGIT":76,"SIGN":77,"STRING_repetition0":78,"NAG":79,"NAG_repetition_plus0":80,"NAG_option0":81,"GameSeparator_repetition_plus0_option0":82,"GameBody_repetition_plus0_group0":83,"SETUP":84,"MOVESTRENGTH":85,"IDENTIFIER_repetition0_group0":86,"$accept":0,"$end":1},
terminals_: {2:"error",9:"*",18:"MOVENUMBER",25:"(",27:")",30:"[",32:"BLANK",34:"]",38:"MOVERATE",43:"ALPHASQUARE",44:"NUMSQUARE",46:"{",48:"}",53:".",54:"$",55:"DQUOTE",57:"JUSTCHARS",62:"DOUBLEFORFEIT",63:"WIN1",64:"DRAW1",65:"LOSS1",66:"WIN2",67:"DRAW2",68:"LOSS2",73:"LETTER",76:"DIGIT",77:"SIGN",84:"SETUP",85:"MOVESTRENGTH"},
productions_: [0,[3,4],[8,2],[8,1],[5,2],[5,1],[12,1],[14,1],[17,3],[17,2],[22,2],[23,2],[24,3],[29,6],[19,2],[19,2],[19,2],[42,1],[42,1],[45,4],[47,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[58,2],[56,1],[56,1],[56,1],[60,1],[60,1],[60,1],[61,1],[61,1],[61,1],[40,2],[70,1],[72,1],[72,1],[72,1],[72,1],[72,1],[72,1],[72,1],[72,1],[31,2],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[75,1],[52,1],[52,1],[52,1],[33,3],[79,3],[36,3],[4,0],[4,1],[6,0],[6,3],[7,0],[7,1],[10,0],[10,1],[82,0],[82,1],[11,2],[11,3],[13,0],[13,1],[15,1],[15,2],[83,1],[83,1],[83,1],[83,1],[83,1],[83,1],[16,1],[16,2],[20,0],[20,1],[21,0],[21,1],[26,0],[26,1],[28,0],[28,1],[35,0],[35,1],[37,0],[37,1],[39,0],[39,1],[41,0],[41,1],[49,0],[49,1],[50,0],[50,2],[59,0],[59,1],[69,1],[69,1],[71,1],[71,2],[86,1],[86,1],[74,0],[74,2],[78,0],[78,2],[80,1],[80,2],[81,0],[81,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 4: case 5:
 SaveGame(yy); 
break;
case 7:
 EndGameBody(yy); 
break;
case 8:
 AddMoveNumber(yy,$$[$0-2]) 
break;
case 11:
 StartVariation(yy); 
break;
case 13:
 AddTag(yy,$$[$0-4],$$[$0-2]); 
break;
case 16:
 AddMove(yy,$$[$0-1]); 
break;
case 19:
 AddComment(yy,$$[$0-2].join('').replace(/\s+/g,' ')); 
break;
case 46:
 this.$ = $$[$0-1] + $$[$0]; 
break;
case 47:
 this.$ = $$[$0].join(''); 
break;
case 56:
 this.$ = $$[$0-1] + $$[$0].join(''); 
break;
case 75:
 this.$ = $$[$0-1].join('') 
break;
case 76:
 AddNAG(yy,$$[$0-1].join('')); 
break;
case 80: case 120: case 130: case 132:
this.$ = [];
break;
case 81: case 89:
$$[$0-2].push($$[$0-1]);
break;
case 88:
this.$ = [$$[$0-1]];
break;
case 92: case 100: case 126: case 134:
this.$ = [$$[$0]];
break;
case 93: case 101: case 121: case 127: case 131: case 133: case 135:
$$[$0-1].push($$[$0]);
break;
}
},
table: [o($V0,[2,78],{3:1,4:2,32:[1,3]}),{1:[3]},{5:4,12:5,14:6,15:7,16:8,17:12,18:$V1,19:18,22:13,23:19,25:$V2,29:9,30:$V3,36:22,38:$V4,40:24,45:14,46:$V5,52:28,53:$V6,54:$V7,57:$V8,69:27,73:$V9,76:$Va,77:$Vb,79:16,83:10,84:$Vc},o($V0,[2,79]),o($Vd,[2,80],{6:33}),o($Vd,[2,90],{16:8,83:10,17:12,22:13,45:14,79:16,19:18,23:19,36:22,40:24,69:27,52:28,13:34,14:35,18:$V1,25:$V2,38:$V4,46:$V5,53:$V6,54:$V7,57:$V8,73:$V9,76:$Va,77:$Vb,84:$Vc}),o($Vd,[2,5]),o([1,9,18,25,38,46,53,54,57,62,63,64,65,66,67,68,73,76,77,84],[2,6],{29:36,30:$V3}),o([1,9,27,62,63,64,65,66,67,68],[2,7],{17:12,22:13,45:14,79:16,19:18,23:19,36:22,40:24,69:27,52:28,83:37,18:$V1,25:$V2,38:$V4,46:$V5,53:$V6,54:$V7,57:$V8,73:$V9,76:$Va,77:$Vb,84:$Vc}),o($Ve,[2,92]),o($Vf,[2,100]),{31:38,73:[1,39]},o($Vf,[2,94]),o($Vf,[2,95]),o($Vf,[2,96]),o($Vf,[2,97]),o($Vf,[2,98]),o([1,9,18,25,27,46,54,62,63,64,65,66,67,68,84],[2,99],{36:22,40:24,69:27,52:28,19:40,38:$V4,53:$V6,57:$V8,73:$V9,76:$Va,77:$Vb}),o($Vf,[2,104],{21:41,85:[1,42]}),{14:44,16:8,17:12,18:$V1,19:18,22:13,23:19,24:43,25:$V2,36:22,38:$V4,40:24,45:14,46:$V5,52:28,53:$V6,54:$V7,57:$V8,69:27,73:$V9,76:$Va,77:$Vb,79:16,83:10,84:$Vc},o($Vg,[2,120],{47:45,50:46}),{76:[1,48],80:47},o($Vh,[2,112],{37:49,32:[1,50]}),o($Vh,[2,114],{39:51,32:[1,52]}),o($Vh,[2,116],{41:53,32:[1,54]}),o($Vi,[2,106],{26:55,32:[1,56]}),{53:[1,57]},{9:$Vj,18:$Vk,38:$Vl,52:61,53:$Vm,54:$Vn,56:67,57:$Vo,60:69,61:70,62:$Vp,63:$Vq,64:$Vr,65:$Vs,66:$Vt,67:$Vu,68:$Vv,70:58,71:59,72:60,73:$V9,76:$Va,77:$Vb},o($Vw,[2,124]),o($Vw,[2,125]),o($Vx,[2,72]),o($Vx,[2,73]),o($Vx,[2,74]),{1:[2,82],7:78,8:79,9:[1,80],11:81,56:83,58:82,60:69,61:70,62:$Vp,63:$Vq,64:$Vr,65:$Vs,66:$Vt,67:$Vu,68:$Vv},o($Vd,[2,4]),o($Vd,[2,91]),o($Ve,[2,93]),o($Vf,[2,101]),{32:[1,84]},o($Vy,[2,130],{74:85}),o($Vf,[2,102],{20:86,85:[1,87]}),o($Vf,[2,9]),o($Vf,[2,105]),o($Vf,[2,10]),{27:[1,88]},{48:[1,89]},{9:[1,99],18:[1,103],25:[1,95],27:[1,96],30:[1,97],32:[1,92],34:[1,98],38:[1,102],46:[1,91],48:[2,20],51:90,52:93,53:[1,94],54:[1,100],55:[1,101],56:104,57:[1,105],60:69,61:70,62:$Vp,63:$Vq,64:$Vr,65:$Vs,66:$Vt,67:$Vu,68:$Vv,73:$V9,76:$Va,77:$Vb},o([1,9,18,25,27,38,46,53,54,57,62,63,64,65,66,67,68,73,77,84],[2,136],{81:106,32:[1,108],76:[1,107]}),o($Vz,[2,134]),o($Vh,[2,14]),o($Vh,[2,113]),o($Vh,[2,15]),o($Vh,[2,115]),o($Vh,[2,16]),o($Vh,[2,117]),o($Vi,[2,11]),o($Vi,[2,107]),{53:[1,109]},o($VA,[2,46]),o([1,25,27,32,46,84,85],[2,47],{52:61,56:67,60:69,61:70,72:110,9:$Vj,18:$Vk,38:$Vl,53:$Vm,54:$Vn,57:$Vo,62:$Vp,63:$Vq,64:$Vr,65:$Vs,66:$Vt,67:$Vu,68:$Vv,73:$V9,76:$Va,77:$Vb}),o($VA,[2,126]),o($VA,[2,48]),o($VA,[2,49]),o($VA,[2,50]),o($VA,[2,51]),o($VA,[2,52]),o($VA,[2,53]),o($VA,[2,54]),o($VA,[2,55]),o($Vx,[2,37]),o($Vx,[2,38]),o($Vx,[2,39]),o($Vx,[2,40]),o($Vx,[2,41]),o($Vx,[2,42]),o($Vx,[2,43]),o($Vx,[2,44]),o($Vx,[2,45]),{1:[2,1]},{1:[2,83],5:111,12:5,14:6,15:7,16:8,17:12,18:$V1,19:18,22:13,23:19,25:$V2,29:9,30:$V3,36:22,38:$V4,40:24,45:14,46:$V5,52:28,53:$V6,54:$V7,57:$V8,69:27,73:$V9,76:$Va,77:$Vb,79:16,83:10,84:$Vc},o($VB,[2,84],{10:112,32:[1,113]}),o($VB,[2,3],{60:69,61:70,56:83,58:114,62:$Vp,63:$Vq,64:$Vr,65:$Vs,66:$Vt,67:$Vu,68:$Vv}),o($VC,$VD,{82:115,32:$VE}),o($VC,[2,122],{59:117,32:[1,118]}),{33:119,55:[1,120]},{32:[2,56],73:[1,122],76:[1,123],86:121},o($Vf,[2,8]),o($Vf,[2,103]),o($Vf,[2,108],{28:124,32:[1,125]}),o($Vf,[2,118],{49:126,32:[1,127]}),o($Vg,[2,121]),o($Vg,[2,21]),o($Vg,[2,22]),o($Vg,[2,23]),o($Vg,[2,24]),o($Vg,[2,25]),o($Vg,[2,26]),o($Vg,[2,27]),o($Vg,[2,28]),o($Vg,[2,29]),o($Vg,[2,30]),o($Vg,[2,31]),o($Vg,[2,32]),o($Vg,[2,33]),o($Vg,[2,34]),o($Vg,[2,35]),o($Vf,[2,76]),o($Vz,[2,135]),o($Vf,[2,137]),o($VA,[2,77]),o($VA,[2,127]),o($Vd,[2,81]),o($VB,[2,2]),o($VB,[2,85]),o($VC,$VD,{82:128,32:$VE}),o($VC,[2,88]),o($VC,[2,87]),o($VF,[2,36]),o($VF,[2,123]),{34:[1,129]},o($Vg,[2,132],{78:130}),o($Vy,[2,131]),o($Vy,[2,128]),o($Vy,[2,129]),o($Vf,[2,12]),o($Vf,[2,109]),o($Vf,[2,19]),o($Vf,[2,119]),o($VC,[2,89]),o($Ve,[2,110],{35:131,32:[1,132]}),{9:[1,137],18:[1,147],25:[1,139],27:[1,140],30:[1,143],32:[1,136],34:[1,144],38:[1,146],46:[1,141],48:[1,142],52:135,53:[1,138],54:[1,145],55:[1,133],56:148,57:[1,149],60:69,61:70,62:$Vp,63:$Vq,64:$Vr,65:$Vs,66:$Vt,67:$Vu,68:$Vv,73:$V9,75:134,76:$Va,77:$Vb},o($Ve,[2,13]),o($Ve,[2,111]),{34:[2,75]},o($Vg,[2,133]),o($Vg,[2,57]),o($Vg,[2,58]),o($Vg,[2,59]),o($Vg,[2,60]),o($Vg,[2,61]),o($Vg,[2,62]),o($Vg,[2,63]),o($Vg,[2,64]),o($Vg,[2,65]),o($Vg,[2,66]),o($Vg,[2,67]),o($Vg,[2,68]),o($Vg,[2,69]),o($Vg,[2,70]),o($Vg,[2,71])],
defaultActions: {78:[2,1],133:[2,75]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        var error = new Error(str);
        error.hash = hash;
        throw error;
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        var lex = function () {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        };
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};


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
	

/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"flex":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return JustChars(this,"WIN1");
break;
case 1:return JustChars(this,"DRAW1");
break;
case 2:return JustChars(this,"LOSS1");
break;
case 3:return JustChars(this,"WIN2");
break;
case 4:return JustChars(this,"DRAW2");
break;
case 5:return JustChars(this,"LOSS2");
break;
case 6:return JustChars(this,"DOUBLEFORFEIT");
break;
case 7:return "MOVERATE";
break;
case 8:return "MOVERATE";
break;
case 9:return "MOVERATE";
break;
case 10:return "MOVERATE";
break;
case 11:return "MOVERATE";
break;
case 12:return "MOVERATE";
break;
case 13:return "MOVERATE";
break;
case 14:return "MOVERATE";
break;
case 15:return "MOVERATE";
break;
case 16:return "MOVERATE";
break;
case 17:return "MOVERATE";
break;
case 18:return "MOVENUMBER";
break;
case 19:return "DIGIT";
break;
case 20:return "LETTER";
break;
case 21:return "(";
break;
case 22:return ")";
break;
case 23:return "[";
break;
case 24:return "]";
break;
case 25:return "{";
break;
case 26:return "}";
break;
case 27:return "*";
break;
case 28:return ".";
break;
case 29:return "DQUOTE";
break;
case 30:return "$";
break;
case 31:return "BLANK";
break;
case 32:return "SIGN";
break;
case 33: SaveGame(yy); if(yy.complete) yy.complete( yy_.yylineno ); 
break;
case 34:console.log(yy_.yytext);
break;
}
},
rules: [/^(?:1-0)/,/^(?:1\/2-1\/2)/,/^(?:0-1)/,/^(?:2-0)/,/^(?:1-1)/,/^(?:0-2)/,/^(?:0-0)/,/^(?:=)/,/^(?:\+=)/,/^(?:=\+)/,/^(?:-\+)/,/^(?:-\/\+)/,/^(?:!)/,/^(?:\?)/,/^(?:\?!)/,/^(?:\?\?)/,/^(?:#)/,/^(?:\+)/,/^(?:[0-9]+\.(\.\.?)?\s*)/,/^(?:[0-9])/,/^(?:[a-zA-Z])/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:\*)/,/^(?:\.)/,/^(?:")/,/^(?:\$)/,/^(?:\s+)/,/^(?:.)/,/^(?:$)/,/^(?:.)/],
conditions: {"REGEXP":{"rules":[],"inclusive":false},"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}