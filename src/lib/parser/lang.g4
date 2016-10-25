grammar lang;

TRUE: 'true';
FALSE: 'false';

fragment DIGIT: [0-9];
ID: [a-zA-Z] [a-zA-Z0-9|\-|_]*;

bool: TRUE | FALSE;
NEWLINE: '\r'? '\n' -> skip;
WS: [ \r\t\u000C\n]+ -> skip;
COMMENT: '//' .*? NEWLINE;
COLON: ':';
fragment ESCAPED_QUOTE : '\\"';
QUOTED_STRING :   '"' ( ESCAPED_QUOTE | ~('\n'|'\r') )*? '"';

defaultTool: 'defaultTool' COLON ID;
task: ID '{' taskBody '}';
list: (QUOTED_STRING ','?)*;
study: 'study' ID '{' studyBlock '}';
file: (defaultTool | task | study)*;

studyBlock: (watch | warn | error | ref)*;
watch: 'watch' (
    ('{' list '}') | (QUOTED_STRING)
);
warn: 'warn' COLON QUOTED_STRING;
error: 'error' COLON QUOTED_STRING;

skip: 'skip'
    (('if' 'not'? ('changed' | 'exists') ('{' list '}' | COLON QUOTED_STRING))
    | ('all' COLON bool));
always: 'always use' ID;
ignore_tool: 'ignore preferred tool';

execBlock: ID
    (
        (COLON QUOTED_STRING)
         |
        ('{' (QUOTED_STRING
              | 'success' COLON QUOTED_STRING
              | 'max-time' COLON QUOTED_STRING
              | 'revert-on-fail' COLON bool
              | 'working' COLON QUOTED_STRING
              | 'acceptsArgs' COLON bool)* '}' )
    );

exec: 'exec' execBlock;
revert: 'revert' execBlock;
wait: 'wait' execBlock;
description: QUOTED_STRING;
ref: 'ref' ID ('{' taskBody '}')?;
and: 'and' (skip|always|ignore_tool);
or: 'or' (skip|always|ignore_tool);

taskBody: (exec | description | task | ref | and | or | revert | wait)*;