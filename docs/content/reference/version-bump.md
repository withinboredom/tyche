+++
date = "2016-09-09T22:42:05-04:00"
prev = "/reference/studies/"
title = "version bump"
toc = true
weight = 15

+++

Bumping the version is important. It's a way of saying, "hey, I changed
in some important way." It could be defined as semver, or just a regular
old build number.

You can also define a task, whose name is `bump` and it will run that
task, passing the environment variable `$BUILD_NUMBER` to the tool so
that you can use tyche to actually perform your releases.

Tyche understands regular numbers and semver. By default, it uses regular
numbers, if you'd like to use semver instead: `tyche bump --set vx.y.z`
where x is the major version, y the minor, and z the patch.

Please see the output of `tyche --help bump` for more usage information.
