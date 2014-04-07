
%lex
%%

(";"[^\n]*|\s+)                     /* skip whitespace and comments */
"define"                                                        return 'DEFINE'
"cond"                                                          return 'COND'
"if"                                                            return 'IF'
"else"                                                          return 'ELSE'
("-"(?!\d+)|[a-zA-Z=*+/<>!\?\$\^~¤§&\\|%])[a-zA-Z0-9=*+/<>!\?\-$\^~¤§&\\|%]*    return 'IDENTIFIER'
"-"?[0-9]+("."[0-9]+)?                                          return 'NUMBER'
"\"".*"\""                                                      return 'STRING' 
"("                                                             return 'PARENS_BEG'
")"                                                             return 'PARENS_END'
"'"                                                             return 'SYMBOLSTART'
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
    { $$ = { 'type':'variable_def', 'name': $3, 'value': $4 }; }
    | PARENS_BEG DEFINE function_def statements expression PARENS_END
    { $4.push($5); $$ = { 'type':'function_def', 'name': $3['name'], 'params': $3['params'], 'body': $4 }; }
    ;

function_def
    : PARENS_BEG IDENTIFIER function_params PARENS_END
    { $$ = { 'name': $2, 'params': $3 }; }
    ;

function_params
    : 
    { $$ = []; }
    | function_params IDENTIFIER
    { $$ = $1; $$.push($2); }
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
    ;

conditional
    : PARENS_BEG IF predicate consequent PARENS_END
    { $$ = { 'type': 'cond', 'clauses': [{ 'type': 'clause', 'predicate': $3, 'consequent': $4 }]}; }
    | PARENS_BEG IF predicate consequent alternative PARENS_END
    { $$ = { 'type': 'cond', 'clauses': [{ 'type': 'clause', 'predicate': $3, 'consequent': $4 }, { 'type': 'else', 'consequent': $5 }]}; }
    | PARENS_BEG COND clauses  PARENS_END
    { $$ = { 'type': 'cond', 'clauses': $3 }; }
    | PARENS_BEG COND clauses PARENS_BEG ELSE expression PARENS_END PARENS_END
    { $3.push({ 'type': 'else', 'consequent': $6 } ); $$ = { 'type': 'cond', 'clauses': $3 }; }
    ; 

clauses
    : clause
    { $$ = [$1]; }
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
    | STRING
    { $$ = {'type':'string', value: eval($1) }; }
    | SYMBOLSTART IDENTIFIER
    { $$ = {'type':'symbol', 'name':$2 }; }
    | SYMBOLSTART NUMBER
    { $$ = {'type':'num', 'value':Number(yytext)}; }
    ;