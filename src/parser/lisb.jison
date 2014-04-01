
%lex
%%
\s+                     /* skip whitespace */
"define"                                                    return 'DEFINE'
("-"(?!\d+)|[a-zA-Z=*+/<>!\?\$\^])[a-zA-Z0-9=*+/<>!\?\-$\^]*    return 'IDENTIFIER'
"-"?[0-9]+("."[0-9]+)?                   return 'NUMBER'
"'"                                                         return 'SYMBOLSTART'
"("                                                         return 'PARENS_BEG'
")"                                                         return 'PARENS_END'
<<EOF>>                                                     return 'EOF'

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
    | PARENS_BEG DEFINE function_def function_body PARENS_END
    { $$ = { 'type':'function_def', 'name': $3['name'], 'params': $3['params'], 'body': $4 }; }
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

function_body
    : statments
    { $$ = $1; }
    | expression
    { $$ = [$1]; }
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
    | invocation
    { $$ = $1; }
    ;

value 
    : NUMBER
    { $$ = {'type':'num', 'value':Number(yytext)};}
    | IDENTIFIER
    { $$ = {'type':'identifier', 'name':yytext }; }
    ;