## Language Specification

The language of tyche is to provide a high level task language similar to
other languages that perform the same kind of function. However, what makes
this tool different, is a simpler specification that enables rapid
prototyping and testing.

### `prefer`

```
prefer [default] <tool>
```

Usage examples:
- `prefer docker-compose`
- `prefer default native`
- `prefer default`

Prefer the specified tool, in the absence of a specified tool, unless
`default` is specified, then it will override any given tool from the
cli or it's parent task.

`prefer default` without any specified tool, will revert it to the tool
given on the command line, or specified by the nearest parent.

`prefer`, by itself, is a syntax error and is undefined.

### `template`

```
template my-template ( $PARAM1, $PARAM2 ) {}

task {
  invoke my-template "param1" "param2"
}
```

Usage examples:
- `template example($PARAM)`
- `template example(-e, $PARAM)`

Templates allow reusing tasks throughout the task, and are usually
specified at the topmost level, though they don't have to be.

A template is called using `invoke`.

### `set`

```
set -e "var"
set -p $VAR
set $var $VAR
```

Set's a variable to a value or another variable. There are two kinds
of variables, one's that start with '$' and ones that start with '-'.

If a variable starts with $, it will set an environment variable on any
exec block in the specific task, as well as any child tasks.

If a variable starts with -, it will set a flag on any child task or the
specific task in which it is set.

A variable will become unset by setting it to an empty value: `set $VAR`.

This will work:

```
set -e $VAR
```

However, this will not work:

```
set $VAR -e
```

It will set $VAR to the string, '-e' but not the value of the persistent
flag of -e

### `task`

```
task [a-name] {}
```

A task may have children, or not. It may have an `exec`, `invoke`
templates or set variables. It may have a name, or not.

All things are tasks.

Tasks execute in the order they are given but their definitions are
not lexical. This means a template defined after the definition of the
current task may be invoked.

### `exec`

```
exec <tool> {}
```

Execute a specifc tool. Each tool may expect it's own options, so see
the specific tool's options and how they may function.

### `invoke`

```
invoke <name> [parameters...]
```

Invoke another task or template. If a task is given, it acts much like
a goto in other languages. If the task invoked expects variables to
be set in the outer scope, it cannot be invoked.

If a template is invoked, it's more like a dynamic task. The task is
generated in the AST. In fact, a template is just sugar for:

```
task template {
  set $PARAM1 "param1"
  set -param2 "param2"

  task {
    // perform tasks
  }
}
```

### `if`

```
if <glob> <contains|missing|exists|gone> <predicate> then <skip|do> 
```

Check a glob, if it is false, skip to the next if in the task, or the
end of the task, whichever comes first.

#### `contains:`

Scans a glob for a particular string, or lack thereof, then explains
how to perform the rest of the task definition.

#### `missing:`

Scans a glob for a particular string, if it isn't found, explains how
to perform the rest of the task definition.

#### `exists:`

If a glob exists, perform the action.

#### `gone:`

If a glob doesn't exist, perform the action.

#### `skip:`

Skip to the next `if` or the end of the task.

#### `do:`

Perform the rest of the task, until the next if, or the end of the task.

### `chdir`

```
chdir <directory>
```

Changes the context of the task to the directory.

## Parse Tree

This is what the various AST nodes look like:

### `prefer`

For regular:

``` js
{
    type: 'toolStack',
    perform: 'push',
    right: 'VALUE'
}
```

For default, with toolname:

``` js 
{
    type: 'overrideToolStack',
    perform: 'push',
    right: 'VALUE'
}
```

For default, without toolname:

``` js
{
    type: 'toolStack',
    perform: 'pop'
}
```

### `set`

``` js
{
    type: 'assign',
    left: AST[IDENT],
    right: AST[VALUE] || AST[IDENT]
}
```

### `task`

``` js
{
    type: 'task',
    left: AST[IDENT] || null
    right: []
}
```

### `exec`

``` js
{
    type: 'exec',
    left: AST[TOOL],
    right: AST[OPTIONS]
}
```

### `invoke`

``` js 
{
    type: 'task',
    left: null
    right: [
        AST[SET]...,
        AST[TASK]
    ]
}
```

### `if`

``` js
{
    type: 'conditional',
    glob: AST[GLOB],
    condition: AST[CONDITION]
    action: AST[ACTION]
    result: []
}
```

### `chdir`

``` js
{
    type: 'chdir'
    target: AST[STRING]
}
```

### `IDENT`

``` js
{
    type: 'ident',
    kind: 'VAR' || 'SWITCH'
    value: 'VALUE'
}
```

### `VALUE`

``` js
{
    type: 'value',
    value: AST[VAR] || AST[STRING] || AST[BOOL]
}
```

### `TOOL`

``` js
{
    type: 'tool',
    value: 'VALUE'
}
```

### `OPTIONS`

``` js
{
    type: 'options',
    value: AST
}
```

