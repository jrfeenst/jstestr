#!/usr/bin/env node

var requirejs = require("requirejs");
requirejs.config({
	baseUrl: ".",
    packages: [{
        name: "jstestr",
        location: __dirname + "/../jstestr"
    }]
});

require("../jstestr/runner/nodeRunner");