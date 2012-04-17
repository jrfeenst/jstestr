
(function () {
    var context = {
        currentModule: {}
    };
    var cache = {};
    
    function load(dep) {
        
    }
    
    function executeFactory(factory, deps) {
        
    }
    
    var require = function require(deps, factory) {
        for (var i = 0; i < deps.length; i++) {
            load(deps[i]);
        }
        executeFactory(factory, deps);
    };
    
    var define = function define(mid, deps, factory) {
        if (arguments.length === 2) {
            factory = deps;
            deps = mid;
            mid = undefined;
        }
        mid = mid || context.currentFile.mid;
        
        cache[mid] = {
            factory: factory,
            deps: deps,
            mid: mid,
            unloaded: true
        };
    };
    
    this.require = require;
    this.define = define;
}());
