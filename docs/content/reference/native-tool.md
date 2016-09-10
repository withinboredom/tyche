+++
date = "2016-09-09T22:46:46-04:00"
next = "/reference/tasks/"
prev = "/reference/docker-compose-tool/"
title = "native tool"
toc = true
weight = 5

+++

The native tool is for running commands on bare metal, however, there's
some flexibility to run commands in varying environments. It looks like
this in a task definition:

``` json
{
    "exec": {
        "native": {},
        "darwin": {}, # AKA, OSX
        "freebsd": {},
        "linux": {},
        "openbsd": {},
        "win32": {},
        "native-nix": {},
        "native-win": {}
    }
}
```

If the command you need to run will work universally, it's a good idea
to use the "native" tool, however there are a few things that may not
"just work" everywhere. For example, `rm -rf folder` doesn't work in
windows where it's just `rmdir folder`. You can define these both:

``` json
{
    "exec": {
        "native-nix": {
            "command": ["rm","-rf","folder"]
        },
        "native-win": {
            "command": ["rmdir","folder"]
        }
    }
}
```

This allows your tasks to run cross-platform without too much hassle.

{{% notice info %}}
tyche will choose the more specific native command. If `darwin` and 
`native-nix` is defined, and tyche is being run on osx, it will choose
`darwin` instead of `native-nix`.
{{% /notice %}}

Here are the keys/values that the native tool responds to:

+ *command*: (array of strings) The command to run
+ *working*: (string) The working directory (current location of `tyche.json` if not defined)
+ *acceptsArgs*: (boolean) Allows passing arguments from the tyche process
