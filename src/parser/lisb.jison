
%lex
%%

(";"[^\n]*|\s+)                     /* skip whitespace and comments */
"#t"                                                            return 'TRUE'
"#f"                                                            return 'FALSE'
"-"?[0-9]+("."[0-9]+)?                                          return 'NUMBER'
"\""([\\]["]|.)*?"\""                                           return 'STRING'
[^\s'\)\("#]+                                                   return 'NAME'
"("                                                             return 'LPAR'
")"                                                             return 'RPAR'
"'"                                                             return 'SYMBOL'
<<EOF>>                                                         return 'EOF'

/lex



%start progr
%% /* language grammar */

progr
    : sexpr EOF
    { return $1; }
    ;

sexpr
    : 
    { $$ = lisb.NIL; }
    | value sexpr
    { $$ = new lisb.Pair($1, $2); }
    ;

value
    : boolean
    | NUMBER
    { $$ = lisb.Number(yytext); }
    | NAME
    { $$ = new lisb.Name($1); }
    | STRING
    { $$ = eval($1); /* Hack to get a proper string... */}
    | LPAR sexpr RPAR
    { $$ = $2; }
    | SYMBOL value
    { $$ = new lisb.Quote($2); }
    ;

boolean
    : TRUE
    { $$ = true; }
    | FALSE
    { $$ = false; }
    ;
