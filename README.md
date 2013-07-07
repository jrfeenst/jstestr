Jstestr is broken up into 3 independent pieces. There is testing framework which
includes support for asynchronous tests using a callback or a future, test node
creation, and full page testing, console logging and reporting. There is an
assert module which includes asserts for equality, truthiness, object types,
mock functions with argument verification, and more. Finally, there is synthetic
events based GUI testing framework.

The framework makes use of AMD to load code and define dependencies. Any AMD
compliant loader may be used. There are example runner HTML pages which configure
RequireJS or dojo to load and execute tests. The example runners make some
assumptions about the relative locations of the loader script files. If the
assumptions are not correct the runner HTML page can be copied and configured
correctly. For example, if a dojoConfig variable needs to be set before loading, the
dojoRunner.html page can be modified to include that config script. The git
submodules are not required and are only used for the framework tests and demos.

[Documentation](http://jrfeenst.github.io/jstestr/docs/index.html)
[Framework Tests](http://jrfeenst.github.io/jstestr/runner/runner.html?module=tests/testAll)
