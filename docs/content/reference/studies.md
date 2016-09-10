+++
date = "2016-09-09T22:41:55-04:00"
next = "/reference/version-bump/"
prev = "/reference/tasks/"
title = "studies"
toc = true
weight = 10

+++

Studies are a way to constrain the user of tyche and prevent them from
making common mistakes. It requires the user to be using `git` as their
source control provider as well as running `tyche init` before the feature
can be utilized. It works through git-hooks.

To add a study:

``` json
{
    "study": [
        {
            "on": "commit",
            "watch": [
                "package.json",
                "src/**/*.js"
            ],
            "message": {
                "error": "Please run `tyche test` before committing"
            },
            "reset": [
                "test"
            ]
        }
    ]
}
```

In this example, if `package.json` or any javascript file changes in the
src/ directory tree, then the user will be given an error message and
prevented from committing to the repo until they run `tyche test`. Once
the "test" task is run, it will reset the error and allow them to commit
to the repo.

## on

|attribute|value|
|--------|-----|
|required|true|
|type    |one of `commit` or `push`|

What action on the repo will trigger this message?

## watch

|attribute|value|
|--------|-----|
|required|true|
|type    |an array of glob strings|

Which files/folders to watch for changes

## message

|attribute|value|
|--------|-----|
|required|true|
|type    |an object containing one of `error` or `warning`|
|error| prevent the user from committing or pushing|
|warning| allow the user to continue committing or pushing, but display a message|

## reset

|attribute|value|
|--------|-----|
|required|true|
|type    |array of task names|

Running any of these tasks will reset the warning/error and prevent it
from stopping them.
