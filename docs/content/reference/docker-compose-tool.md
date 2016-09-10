+++
date = "2016-09-09T22:46:54-04:00"
next = "/reference/native-tool/"
prev = "/reference/tyche-json/"
title = "docker compose tool"
toc = true
weight = 5

+++

[Docker Compose](https://docs.docker.com/compose/) is a cli tool from
the great people at [Docker](https://www.docker.com/). It's a supported
tool in tyche. I've personally found it to be very powerful when used to
create prod-like and reliable development environments.

To use this tool, simply add it to the task definition:

``` json
{
    "exec": {
        "docker-compose": {}
    }
}
```

Here are the available keys/values the tool accepts:

**bold** is the default, if the key is required.

+ action: (string)
 - **up**: same as `docker-compose up`
 - *down*: same as `docker-compose down`
 - *build*: same as `docker-compose build`
 - *pull*: same as `docker-compose pull`
 - *run*: same as `docker-compose run`
+ *service*: (string) The name of the service(s) to perform an action on
+ *file*: (string) The name of the `docker-compose.yml` file, which is the default
+ *command*: (string) The command string to pass to `docker-compose run`
+ *volumes*: (boolean) Whether to delete volumes when the action is `down`
