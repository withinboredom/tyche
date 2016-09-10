+++
date = "2016-09-09T22:24:21-04:00"
next = "/reference/"
prev = "/basics/create-tyche-json/"
title = "Studies"
toc = true
weight = 5

+++

Studies are a concept in tyche that allow you to define certain files
that should be watched for changes and if a task hasn't been run by the
time a commit or push is attempted, then it should tell the user they
need to perform those tasks. This is installed into a repository by
running `tyche init`

{{% notice info %}}
This feature is currently only supported in git. You are welcome to open
an issue and/or pull request if you'd like to see this feature extended
to other version control systems.
{{% /notice %}}

For example, if you'd like to watch the folder `src` for changes and
require that tests be run before allowing a commit, it would look
something like:

``` json
{
    "study": [
        {
            "on": "commit",
            "watch": [
                "./src"
            ],
            "message": {
                "error": "It looks like you forgot to test the code before committing, please do so"
            },
            "reset": [
                "test"
            ]
        }
    ]
}
```

Once a task named `test` is run, it will reset the error and allow the
commit into source control.
