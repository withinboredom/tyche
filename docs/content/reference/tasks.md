+++
date = "2016-09-09T22:41:33-04:00"
next = "/reference/studies/"
prev = "/reference/native-tool/"
title = "tasks"
toc = true
weight = 5

+++

Tasks are the life-blood of tyche. To define a task, simply add it to
the `tyche.json` file:

``` json
{
    "tasks": [
        {
            "name": "a task", # this is the only thing a task requires
            "description": "a description",
            "exec": {
                "native": {}
            },
            "tasks": [
                {
                    "name": "another task"
                }
            ],
            "skips": {
                "path_exists": ["./path-to-file"],
                "files_not_changed": ["./src/**/*.js"],
                "forced": false,
                "skip_dependencies_if_skip": false
            },
            "constraints": {
                "always_use_tool": "docker-compose",
                "ignore_preferred_tool": true
            },
            "dependencies": [
                "another task"
            ]
        }
    ]
}
```

### Environment Variables

All environment variables from the shell that invoked `tyche` are passed
onto the command being run. The current version of the software is passed
as an environment variable as well as the variable `$BUILD_NUMBER`...

In a future release, this will probably be configurable.

## name

|attribute|value|
|--------|-----|
|required|true|
|type    |string|
|unique|true|

The name must be unique to the entire `tyche.json` file.

## description

|attribute|value|
|--------|-----|
|required|false|
|type    |string|

A freeform description

## exec

|attribute|value|
|--------|-----|
|required|false|
|type    |{{% button href="/reference/native-tool/" icon="fa fa-book" %}}Native{{% /button %}}{{% button href="/reference/docker-compose-tool/" icon="fa fa-book" %}}Docker Compose{{% /button %}}|

A description of how to run this task

## tasks

|attribute|value|
|--------|-----|
|required|false|
|type    |{{% button href="/reference/tasks/" icon="fa fa-book" %}}Task{{% /button %}}|

Dependent tasks that must be completed before this task can be completed.

Keep in mind, that sibling tasks could be run in parallel in future versions.
If you need to guarantee order, it would be a good idea to use
`dependencies` to specify the order.

{{% notice tip %}}
toplevel tasks can be called directly from the cli, as can their immediate descendants
{{% /notice %}}

## dependencies

|attribute|value|
|--------|-----|
|required|false|
|type    |array of task names|

A list of tasks that must be completed before this task can be completed.
They can be siblings to this task (a way to guarantee order)

{{% notice warning %}}
If it cannot find a task by the given name, it won't give any warning. 
It will just pretend it is always complete. If you disagree with this
behavior please open an [issue in GitHub](https://github.com/withinboredom/tyche/issues)
and lets discuss it.
{{% /notice %}}

## skips

|attribute|value|
|--------|-----|
|required|false|
|type    |object|
|file_exists|a list of files/directories that it checks for existence of. If it exists it will mark this task for a skip. Globs can be used.|
|files_not_changed|a list of files (no directories -- but globs are allowed) to watch for changes. If a matching file has not changed since the last run of this task, it will mark the task for a skip|
|forced|if `true` it will always skip this task. Handy for debugging...|
|skip_dependencies_if_skip|skip all dependencies and their children if this task gets marked for skipping.|

Skips gives tyche tasks some degree of flow control in a manner that
makes sense for tasks. Please [issue in GitHub](https://github.com/withinboredom/tyche/issues)
if you think of any other reasons a skip should occur or you find an issue
with skipping.

## constraints

|attribute|value|
|--------|-----|
|required|false|
|type    |string|
|always_use_tool|Always, *always*, **always** use the specified tool, unless they are preferring a different tool.
|ignore_preferred_tool|When used in conjunction with `always_use_tool`, it will ignore the user's preferred tool and use the specified tool no matter what.

These options constrain the tasks in some way and allow you to use `docker-compose`
for everything except the kind of things that you can't do in docker,
like maybe install docker? I'd be interested in seeing what you come up
with.
