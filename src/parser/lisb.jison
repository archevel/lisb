%lex
%%

\s+                   /* skip whitespace */
"-"?[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"define"              return 'DEFINE'
"'"                   return 'SYMBOLSTART'
"("                   return 'PARENS_BEG'
")"                   return 'PARENS_END'
[A-Za-z$¤#!?&§+\\/\,.<>|*"~}{^-]+ return 'NAME'
<<EOF>>               return 'EOF'

/lex

%start progr
%% /* language grammar */

progr
    : statements EOF
    {return $1}
    ;

statements
    : statement
    { $$ = [$1]; }
    | statements statement  
    { $$ = $1; $1.push($2);  }
    ;

statement
    : expression
    { $$ = $1; }
    | variable_def
    { $$ = $1; }
    | function_def
    { $$ = $1; }
    ;

variable_def
    : PARENS_BEG DEFINE NAME expression PARENS_END
    { $$ = { 'type':'variable_def', 'name': $3, 'value': $4 }; }
    ;

function_def
    : PARENS_BEG DEFINE NAME params body PARENS_END
    { $$ = { 'type':'function_def', 'name': $3, params: $4, 'body': $5 }; }
    ;

params
    : PARENS_BEG param_list PARENS_END
    { $$ = $2; }
    ;

param_list
    : NAME 
    { $$ = [$1]; }
    | param_list NAME
    { $$ = $1; $1.push($2); }
    ;

body
    : PARENS_BEGIN function PARENS_END
    { console.log('body function_call', $1);$$ = $1; }
    | PARENS_BEG statements PARENS_END
    { $$ = $2.push($3); console.log('body statements', $$);}
    ;

expressions
    : expression
    { $$ = [$1]; }
    | expressions expression
    { $$ = $1; $1.push($2);  }
    ;


expression
    : value
    | function_call
    ;

function_call
    : PARENS_BEGIN function PARENS_END
    { $$ = $2; }
    ;

function
    : NAME expressions
    { $$ = { type: 'call', name: $1, args: $2 }; }
    ;

value 
    : NUMBER
    {$$ = {'num':Number(yytext)};}
    | NAME
    { $$ = {'name': $1 }; }
    ;