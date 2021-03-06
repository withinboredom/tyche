+++
date = "2016-09-09T22:41:23-04:00"
next = "/reference/docker-compose-tool/"
prev = "/reference/"
title = "tyche.json Reference"
toc = true
weight = 1

+++

An example `tyche.json` file, taken from the tyche repository:

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
            "docker-compose": {
              "action": "down",
              "volumes": true
            }
          }
        }
      ]
    },
    {
      "name": "build",
      "description": "Build this nifty little cli tool",
      "tasks": [
        "doc-build",
        {
          "name": "dependencies",
          "description": "Install build dependencies",
          "exec": {
            "native": {
              "command": ["npm","install"]
            },
            "docker-compose": {
              "service": "tyche-prep"
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
          "name": "build-cli",
          "description": "Actually build the tool...",
          "tasks": [
            "dependencies"
          ],
          "exec": {
            "native": {
              "command": ["npm","run","build-cli"]
            },
            "docker-compose": {
              "service": "tyche-builder"
            }
          }
        }
      ]
    },
    {
      "name": "watch",
      "description": "Build as you write code",
      "exec": {
        "native": {
          "command": ["npm","run","watch"]
        }
      },
      "tasks": [
        "dependencies"
      ]
    },
    {
      "name": "test",
      "description": "Run unit tests",
      "exec": {
        "native": {
          "command": ["npm","run","test","--","--coverage"]
        },
        "docker-compose": {
          "service": "tyche-tests"
        },
        "tasks": [
          "build"
        ]
      }
    },
    {
      "name": "bump",
      "description": "bumps the current version",
      "exec": {
        "native": {
          "command": ["npm","version","$BUILD_NUMBER"]
        }
      }
    },
    {
      "name": "docs",
      "description": "operate on the documentation",
      "tasks": [
        {
          "name": "dev",
          "description": "Watch and build the docs in realtime",
          "exec": {
            "native": {
              "command": ["hugo","serve"],
              "working": "./docs"
            }
          }
        },
        {
          "name": "doc-build",
          "description": "Turn the docs into static pages for github",
          "exec": {
            "native": {
              "command": ["hugo","-d","."],
              "working": "./docs"
            }
          }
        },
        {
          "name": "new-chapter",
          "description": "Create a new page for the docs",
          "exec": {
            "native": {
              "command": ["hugo","new","--kind","chapter"],
              "acceptsArgs": true,
              "working": "./docs"
            }
          }
        },
        {
          "name": "new-page",
          "description": "Create a new page for the docs",
          "exec": {
            "native": {
              "command": ["hugo","new"],
              "acceptsArgs": true,
              "working": "./docs"
            }
          }
        }
      ]
    }
  ],
  "study": [
    {
      "on": "commit",
      "watch": [
        "tyche.json",
        "package.json",
        "src/**/*"
      ],
      "message": {
        "warn": "It looks like you forgot to build this commit, maybe you should do that?"
      },
      "reset": [
        "build",
        "watch"
      ]
    },
    {
      "on": "push",
      "watch": [
        "tyche.json",
        "package.json",
        "src/**/*.js"
      ],
      "message": {
        "error": "It looks like you forgot to build this commit, please do that"
      },
      "reset": [
        "build",
        "watch"
      ],
      "branch": ["master"]
    },
    {
      "on": "commit",
      "plugin": "no-conflicts",
      "message": {
        "error": "You cannot commit conflicts. Please resolve them and try again."
      }
    }
  ]
}
```

# Settings

``` json
{
    "settings": {
        "defaultTool": "docker-compose" # Either native or docker-compose
    }
}
```
