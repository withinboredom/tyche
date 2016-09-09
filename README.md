[![API Doc](https://doclets.io/withinboredom/tyche/master.svg)](https://doclets.io/withinboredom/tyche/master) [![Build status](https://ci.appveyor.com/api/projects/status/g6g599g61onplq17/branch/master?svg=true)](https://ci.appveyor.com/project/withinboredom/tyche/branch/master) [![Build Status](https://travis-ci.org/withinboredom/tyche.svg?branch=master)](https://travis-ci.org/withinboredom/tyche)

# May the god of fortune bring your project fortune

Tyche is a build tool, for use in places like TeamCity, Jenkins, TravisCI
and most importantly, on your very own development machine.

*No more* will you be trying to replicate a build failure that you witness
in a log output. You will be able to run the exact same build process that
you run locally ... anywhere, on any machine or platform.

### How Tyche works

Tyche works through a concept of tasks and studies (studies are not implemented
yet). Tasks are defined in a [tyche.json](./tyche.json) file. They can be
related to one another by setting dependencies on other tasks.

The API is rapidly changing (just take a look at the history of the one
in this repo). As it matures, more time can be taken to discuss it.

### Why Tyche exists

Everywhere I've worked, every project I've worked on (for pleasure, or profit),
I seem to spend several hours or more putting together a build process.

This isn't ideal, so I've taken many hours building a general purpose tool
that can handle many of the things that I've seen and built into other tools.

### Running tyche

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

Open a Pull Request back to this repo
