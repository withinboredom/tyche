[![API Doc](https://doclets.io/withinboredom/tyche/master.svg)](https://doclets.io/withinboredom/tyche/master) [![Build status](https://ci.appveyor.com/api/projects/status/g6g599g61onplq17/branch/master?svg=true)](https://ci.appveyor.com/project/withinboredom/tyche/branch/master) [![Build Status](https://travis-ci.org/withinboredom/tyche.svg?branch=master)](https://travis-ci.org/withinboredom/tyche) [![codecov](https://codecov.io/gh/withinboredom/tyche/branch/master/graph/badge.svg)](https://codecov.io/gh/withinboredom/tyche)


# May the god of fortune bring your project fortune

Tyche is a build tool, for use in places like TeamCity, Jenkins, TravisCI
and most importantly, on your very own development machine.

*No more* will you be trying to replicate a build failure that you witness
in a log output. You will be able to run the exact same build process that
you run locally ... anywhere, on any machine or platform.

### How Tyche works

Tyche works through a concept of tasks and studies that allow you to work
smarter, not harder. Tasks are defined in a [tyche.json](./tyche.json) file. 
They can be related to one another by setting dependencies on other tasks.

### Why Tyche exists

Everywhere I've worked, every project I've worked on (for pleasure, or profit),
I seem to spend several hours or more putting together a build process.

This isn't ideal, so I've taken many hours building a general purpose tool
that can handle many of the things that I've seen and built into other tools.

## Getting started

### Requirements

Windows:
 - node 6.x+

Linux/OSX:
 - node 5.x+

### Installing

As simple as `npm install -g tyche`...

See the great getting started guide at [the tyche docs](https://withinboredom.github.io/tyche).

### Configuring

If you are building a javascript project, a good starting point might be:

``` json
{
  "settings": {
    "defaultTool": "native"
  },
  "tasks": [
    {
      "name": "clean",
      "description": "Removes all build dependencies",
      "tasks": [
        {
          "name": "node_modules",
          "description": "Clean node_modules",
          "exec": {
            "native-nix": {
              "command": ["rm","-rf","node_modules"]
            },
            "native-win": {
              "command": ["rmdir","node_modules","/s"]
            }
          }
        }
      ]
    },
    {
      "name": "build",
      "description": "Build this project",
      "tasks": [
        {
          "name": "dependencies",
          "description": "Install build dependencies",
          "exec": {
            "native": {
              "command": ["npm","install"]
            }
          },
          "skips": {
            "files_not_changed": [
              "package.json"
            ],
            "path_exists": [
              "node_modules"
            ],
            "skip_dependencies_if_skip": true
          }
        },
        {
          "name": "build-project",
          "description": "Actually build the thing...",
          "dependencies": [
            "dependencies"
          ],
          "exec": {
            "native": {
              "command": ["npm","run","build"]
            }
          }
        }
      ]
    }
  ]
}
```

After which, running `tyche --help` will show

```
Usage: tyche [options] [command]


  Commands:

    clean [options] [node_modules]                Removes all build dependencies
    build [options] [dependencies|build-project]  Build this project
    init                                          Initialize the tool in this repository
    bump [options]                                Bump the build number +1

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -v, --verbose  Turn on verbose logging
```

You can now run the tasks defined by simply calling tyche.

### Build numbers

Tyche supports build numbers in plain old number form, or semver.

## Running tyche

clone this repo, then

1. `npm install -g tyche`
2. `tyche build`
3. `tyche test`

### Contributing

1. fork the repo
1. clone the fork

- `npm test -- --watch` to run unit tests while you work
- `npm run build-cli` to build the cli
- `npm link` to install the cli to your system
- `tyche --help` to see how to have tyche build itself

Sling some code and then open a Pull Request back to this repo
