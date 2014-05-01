
%lex
%%

(";"[^\n]*|\s+)                     /* skip whitespace and comments */
"define"                                                        return 'DEFINE'
"set!"                                                          return 'SET'
"cond"                                                          return 'COND'
"if"                                                            return 'IF'
"else"                                                          return 'ELSE'
"lambda"                                                        return 'LAMBDA'
"let"                                                           return 'LET'
("-"(?!\d+)|[a-zA-Z=*+/<>!\?\$\^~¤§&\\|%_])[a-zA-Z0-9=*+/<>!\?\-$\^~¤§&\\|%_]*    return 'IDENTIFIER'
"-"?[0-9]+("."[0-9]+)?                                          return 'NUMBER'
"\""([\\]["]|.)*?"\""                                                      return 'STRING' 
"("                                                             return 'LPAR'
")"                                                             return 'RPAR'
"'"([^\s\(\)]+)                                                   return 'SYMBOL'
"'("                                                            return 'SEXPR'
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
    | assignment
    { $$ = $1; }
    ;

assignment
    : LPAR SET IDENTIFIER expression RPAR
    { $$ = new lisb.Set($3, $4); }
    ;


definition
    : LPAR DEFINE IDENTIFIER expression RPAR
    { $$ = new lisb.Def($3, $4); }
    | LPAR DEFINE function_def RPAR
    { $$ =  new lisb.Def($3['name'], $3['lambda']); }
    ;

function_def
    : LPAR IDENTIFIER function_params RPAR statements expression
    { $5.push($6); $$ = { 'name': $2, 'lambda': new lisb.Lambda($3, $5) }; }
    ;

function_params
    : 
    { $$ = []; }
    | function_params IDENTIFIER
    { $$ = $1; $$.push(new lisb.Id($2)); }
    ;

invocation
    : LPAR expression invocation_args RPAR
    { $$ = new lisb.Call($2, $3); }
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
    : LPAR LET LPAR params_args RPAR statements expression RPAR
    { $6.push($7); $$ = new lisb.Call(new lisb.Lambda($4.params, $6), $4.args ); }
    ;

params_args
    :
    { $$ ={ 'params': [], 'args': [] }; }
    | params_args param_arg
    { $1.params.push($2.param); $1.args.push($2.arg); $$ = $1; }
    ;

param_arg
    : LPAR IDENTIFIER expression RPAR
    { $$ = { 'param': new lisb.Id($2), 'arg': $3 }; }
    ;

conditional
    : LPAR IF predicate consequent RPAR
    { $$ = new lisb.Cond([new lisb.Clause($3, $4)]); }
    | LPAR IF predicate consequent alternative RPAR
    { $$ = new lisb.Cond([new lisb.Clause($3, $4), new lisb.Clause(true, $5)]); }
    | LPAR COND clauses clause  RPAR
    { $3.push($4); $$ = new lisb.Cond($3); }
    | LPAR COND clauses LPAR ELSE expression RPAR RPAR
    { $3.push(new lisb.Clause(true, $6)); $$ = new lisb.Cond($3); }
    ; 

clauses
    : 
    { $$ = []; }
    | clauses clause
    { $$ = $1; $$.push($2); }
    ;

clause
    : LPAR predicate consequent RPAR
    { $$ = new lisb.Clause( $2,  $3 ); }
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
    { $$ = lisb.Number(yytext); }
    | IDENTIFIER
    { $$ = new lisb.Id(yytext);; }
    | boolean
    { $$ = $1; }
    | STRING
    { $$ = lisb.String(eval($1)); }
    | symbol
    | LPAR LAMBDA LPAR function_params RPAR statements expression RPAR
    { $6.push($7); $$ = new lisb.Lambda($4, $6); }
    | SEXPR sexprs RPAR
    { $$ = $2; }
    ;

boolean
    : TRUE
    { $$ = true; }
    | FALSE
    { $$ = false; }
    ;

symbol
    : SYMBOL
    { var symb = $1.substr(1); var n = lisb.Number(symb);  $$ = n ? n : new lisb.Symb(symb); }
    ;

sexprs
    :
    { $$ = lisb.NIL; }
    | sexpr sexprs
    { $$ = new lisb.Pair($1, $2); }
    ;

sexpr
    : IDENTIFIER
    { $$ = new lisb.Id(yytext); }
    | DEFINE
    { $$ = new lisb.Id(yytext); }
    | SET
    { $$ = new lisb.Id(yytext); }
    | COND
    { $$ = new lisb.Id(yytext); }
    | IF
    { $$ = new lisb.Id(yytext); }
    | ELSE
    { $$ = new lisb.Id(yytext); }
    | LAMBDA
    { $$ = new lisb.Id(yytext); }
    | LET
    { $$ = new lisb.Id(yytext); }
    | NUMBER
    { $$ = lisb.Number(yytext); }
    | STRING
    { $$ = lisb.String(eval($1)); }
    | symbol
    | boolean
    ;
