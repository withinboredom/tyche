+++
date = "2016-09-08T22:46:48-04:00"
next = "/basics/studies/"
prev = "/basics/"
title = "Create a tyche.json file"
toc = true
weight = 1

+++

After you have tyche installed, there is one thing you'll need to do.
Create a `tyche.json` file in the root of your repo (or where ever you
want to launch tasks from). A tyche.json file is a description of
tasks that work together to achieve some kind of result. Each task can
have rules (or not) that allow you define tasks with great detail.

For example, it might make sense to create a task that runs `npm install`
if, and only if, the node_modules directory doesn't exist or the
package.json file changes.

In order to do that, the `tyche.json` file might look something like:

``` json
{
    "settings": {
        "defaultTool": "native"
    },
    "tasks": [
        {
            "name": "install-dependencies",
            "description": "run npm install",
            "exec": {
                "native": {
                    "command": "npm install"
                }
            },
            "skips": {
                "files_not_changed": ["package.json"],
                "path_exists": ["node_modules"]
            }
        }
    ]
}
```

{{% notice info %}}
Make sure your task names are globally unique. They are the identifier
used internally.
{{% /notice %}}

The output of `tyche --help`:

```
Usage: tyche [options] [command]


  Commands:

    install-dependencies [options]   run npm install
    init                             Initialize the tool in this repository
    bump [options]                   Bump the build number +1

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -v, --verbose  Turn on verbose logging
```

Another use case might be to build something, use `./configure` and `make`
for example:

``` json
{
    "settings": {
        "defaultTool": "native"
    },
    "tasks": [
        {
            "name": "make",
            "description": "Run make",
            "exec": {
                "native": {
                    "command": "make"
                }
            },
            "tasks": [
                {
                    "name": "configure",
                    "description": "Run configure",
                    "exec": {
                        "native": {
                            "command": "./configure"
                        }
                    }
                }
            ]
        }
    ]
}
```

And the output of `tyche --help`

```
Usage: tyche [options] [command]


  Commands:

    make [options] [configure]  Run make
    init                        Initialize the tool in this repository
    bump [options]              Bump the build number +1

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -v, --verbose  Turn on verbose logging
```

Notice how the tasks are nested inside one another. This means that the
`make` task depends on the `configure` task. This also makes running
immediate children of a top-level task easy from the cli as well. Since
you can run `tyche make configure` to run that specific task.

tyche uses this internally to build and develop the documentation you
are reading right now. `tyche docs dev` to enable development while
watching the filesystem and `tyche docs new-chapter` for example.

------------------------------

It's important to note that the command you specify will inherit the
same environment variables that are present from wherever you invoke tyche
as well as run the command in a shell. This is what makes tyche pretty
amazing as a lot of build environments (such as TravisCI or TeamCity)
inject environment variables into the build process.

{{% notice warning %}}
Currently, there's not any way to trap a signal 9 (SIGKILL). This means
a command started by a task, may continue to run in the background when
the tyche process is killed in this way.
Most likely, this will only affect people running TeamCity on versions
less than 10.02... You've been warned.
{{% /notice %}}
