
%lex
%%

(";"[^\n]*|\s+)                     /* skip whitespace and comments */
"define"                                                        return 'DEFINE'
"cond"                                                          return 'COND'
"if"                                                            return 'IF'
"else"                                                          return 'ELSE'
"lambda"                                                        return 'LAMBDA'
"let"                                                           return 'LET'
("-"(?!\d+)|[a-zA-Z=*+/<>!\?\$\^~¤§&\\|%])[a-zA-Z0-9=*+/<>!\?\-$\^~¤§&\\|%]*    return 'IDENTIFIER'
"-"?[0-9]+("."[0-9]+)?                                          return 'NUMBER'
"\"".*"\""                                                      return 'STRING' 
"("                                                             return 'PARENS_BEG'
")"                                                             return 'PARENS_END'
"'"                                                             return 'SYMBOLSTART'
"#t"                                                            return 'TRUE'
"#f"                                                            return 'FALSE'
<<EOF>>                                                         return 'EOF'

/lex



%start progr
%% /* language grammar */

progr
    : statements EOF
    {return $1}
    ;

statements
    : 
    { $$ = []; }
    | statements statement  
    { $$ = $1; $1.push($2);  }
    ;

statement
    : expression
    { $$ = $1; }
    | definition
    { $$ = $1; }
    ;

definition
    : PARENS_BEG DEFINE IDENTIFIER expression PARENS_END
    { $$ = { 'type':'def', 'name': $3, 'value': $4 }; }
    | PARENS_BEG DEFINE function_def PARENS_END
    { $$ = { 'type':'def', 'name': $3['name'], 'value': $3['lambda'] }; }
    ;

function_def
    : PARENS_BEG IDENTIFIER function_params PARENS_END statements expression
    { $5.push($6); $$ = { 'name': $2, 'lambda': { 'type': 'lambda', 'params': $3, 'body': $5 } }; }
    ;

function_params
    : 
    { $$ = []; }
    | function_params IDENTIFIER
    { $$ = $1; $$.push({'type':'identifier', 'name':$2}); }
    ;

invocation
    : PARENS_BEG expression invocation_args PARENS_END
    { $$ = { 'type': 'invocation', 'func': $2, 'args':$3 }; }
    ;

invocation_args
    :
    { $$ = []; }
    | invocation_args expression
    { $$ = $1; $$.push($2); }
    ;

expression
    : value
    { $$ = $1; }
    | conditional
    { $$ = $1; }
    | invocation
    { $$ = $1; }
    | let_expr
    ;

let_expr 
    : PARENS_BEG LET PARENS_BEG params_args PARENS_END statements expression PARENS_END
    { $6.push($7); $$ = { 'type': 'invocation', 'func': { 'type': 'lambda', 'params': $4.params, 'body': $6 }, 'args': $4.args }; }
    ;

params_args
    :
    { $$ ={ 'params': [], 'args': [] }; }
    | params_args param_arg
    { $1.params.push($2.param); $1.args.push($2.arg); $$ = $1; }
    ;

param_arg
    : PARENS_BEG IDENTIFIER expression PARENS_END
    { $$ = { 'param': {'type':'identifier', 'name':$2 }, 'arg': $3 }; }
    ;

conditional
    : PARENS_BEG IF predicate consequent PARENS_END
    { $$ = { 'type': 'cond', 'clauses': [{ 'type': 'clause', 'predicate': $3, 'consequent': $4 }]}; }
    | PARENS_BEG IF predicate consequent alternative PARENS_END
    { $$ = { 'type': 'cond', 'clauses': [{ 'type': 'clause', 'predicate': $3, 'consequent': $4 }, { 'type': 'else', 'consequent': $5 }]}; }
    | PARENS_BEG COND clauses clause  PARENS_END
    { $3.push($4); $$ = { 'type': 'cond', 'clauses': $3 }; }
    | PARENS_BEG COND clauses PARENS_BEG ELSE expression PARENS_END PARENS_END
    { $3.push({ 'type': 'else', 'consequent': $6 } ); $$ = { 'type': 'cond', 'clauses': $3 }; }
    ; 

clauses
    : 
    { $$ = []; }
    | clauses clause
    { $$ = $1; $$.push($2); }
    ;

clause
    : PARENS_BEG predicate consequent PARENS_END
    { $$ = { 'type': 'clause', 'predicate': $2, 'consequent': $3 }; }
    ;


predicate
    : expression
    { $$ = $1; }
    ;

consequent
    : expression
    { $$ = $1; }
    ;

alternative
    : expression
    { $$ = $1; }
    ;

value 
    : NUMBER
    { $$ = {'type':'num', 'value':Number(yytext)}; }
    | IDENTIFIER
    { $$ = {'type':'identifier', 'name':yytext }; }
    | boolean
    { $$ = {'type':'boolean', value: $1 }; }
    | STRING
    { $$ = {'type':'string', value: eval($1) }; }
    | SYMBOLSTART IDENTIFIER
    { $$ = {'type':'symbol', 'name':$2 }; }
    | SYMBOLSTART NUMBER
    { $$ = {'type':'num', 'value':Number(yytext)}; }
    | PARENS_BEG LAMBDA PARENS_BEG function_params PARENS_END statements expression PARENS_END
    { $6.push($7); $$ = { 'type':'lambda', 'params': $4, 'body': $6 }; }
    ;

boolean
    : TRUE
    { $$ = true; }
    | FALSE
    { $$ = false; }
    ;