define([
    './graphicalLogger',
    '../Event'
], function (graphicalLogger, Event) {
    var listen = graphicalLogger.listen;
    graphicalLogger.listen = function (test, containerDiv) {
        listen.apply(this, arguments);

        var coverageHtml = '<table class="summary"></table>\n' +
                '<table class="functionsSummary"><thead><th>Files</th><th colspan=2>Lines / Statements</th>' +
                '<th colspan=2>Branches</th><th colspan=2>Functions</th></thead><tbody></tbody></table>\n' +
                '<pre class="function"><div class="lines"></div><div class="gutter"></div><div class="code"></div></pre>';

        var doc = containerDiv.ownerDocument;
        var tabs = doc.getElementById('tabs');
        var tabContents = doc.getElementById('tabContents');

        var coverageTab = doc.createElement('div');
        coverageTab.setAttribute('id', 'coverageTab');
        coverageTab.setAttribute('class', 'tab');
        coverageTab.innerHTML = 'Code Coverage';
        tabs.appendChild(coverageTab);

        var coverageNode = doc.createElement('div');
        coverageNode.setAttribute('id', 'coverageContent');
        coverageNode.setAttribute('class', 'tabContent');
        tabContents.appendChild(coverageNode);

        coverageNode.innerHTML = coverageHtml;

        var summaryTable = coverageNode.querySelector('.summary');
        var functionsTableBody = coverageNode.querySelector('.functionsSummary tbody');
        var linesNode = coverageNode.querySelector('.function .lines');
        var gutterNode = coverageNode.querySelector('.function .gutter');
        var codeNode = coverageNode.querySelector('.function .code');


        function showFunction(file) {
            var coverage = __coverage__[file];
            var code = coverage.code;
            var lines = code.split('\n');
            var rows = new Array(lines.length);

            linesNode.innerHTML = '';
            var i, line;
            for (i = 0; i < lines.length; i++) {
                rows[i] = i + 1;

                line = doc.createElement('div');
                line.innerHTML = " ";
                if (coverage.l[i + 1]) {
                    line.setAttribute('class', 'covered covered' + Math.min(coverage.l[i + 1], 5));
                }
                linesNode.appendChild(line);
            }

            gutterNode.innerHTML = rows.join('\n');
            codeNode.innerHTML = '';
            codeNode.appendChild(doc.createTextNode(code));
        }


        Event.on('click', functionsTableBody, function (event) {
            var node = event.target;
            while (node.getAttribute('data-path') || node.parentElement) {
                var path = node.getAttribute('data-path');
                if (path && /\.js$/.test(path)) {
                    showFunction(path);
                } else if (path) {
                    var showChildren = {};
                    var visible = {};
                    var i, rows = functionsTableBody.querySelectorAll('tr');
                    for (i = 0; i < rows.length; i++) {
                        showChildren[rows[i].getAttribute('data-path')] = !(rows[i].getAttribute('data-showchildren') === 'false');
                        visible[rows[i].getAttribute('data-path')] = true;
                    }

                    showChildren[path] = !showChildren[path];

                    Object.keys(showChildren).forEach(function (path) {
                        parent = '';
                        visible[path] = path.split(/(?=\/)/).every(function (part) {
                            var parentVisible = !parent || (visible[parent] && showChildren[parent]);
                            parent += part;
                            return parentVisible;
                        });
                    });

                    for (i = 0; i < rows.length; i++) {
                        path = rows[i].getAttribute('data-path');
                        var style = visible[path] ? '' : 'display:none';
                        rows[i].setAttribute('style', style);

                        if (rows[i].getAttribute('data-showchildren')) {
                            rows[i].setAttribute('data-showchildren', showChildren[path]);
                        }
                    }

                    return;
                }
                node = node.parentElement;
            }
        });


        test.on('onStart', function (suiteName, testName) {
            summaryTable.innerHTML = '';
            functionsTableBody.innerHTML = '';
        });


        function convertFilesToPaths(files) {
            var paths = {};
            files.forEach(function (file) {
                var parts = file.split(/(?=\/)/);
                var path = '';
                parts.forEach(function (part) {
                    path += part;
                    if (!paths[path]) {
                        paths[path] = [];
                    }
                    paths[path].push(file);
                });
            });
            return paths;
        }


        test.on('onEnd', function (suiteName, testName) {
            var keys = ['statements', 'branches', 'functions'];
            var coverage = coverageUtils.summarizeCoverage(__coverage__);

            summaryTable.innerHTML = keys.map(function (key) {
                return '<tr><td>' + key.charAt(0).toUpperCase() + key.substr(1) + '</td><td>' +
                        coverage[key].covered + '/' + coverage[key].total + '</td><td>' +
                        coverage[key].pct + '%</td></tr>';
            }).join('\n');

            var paths = convertFilesToPaths(Object.keys(__coverage__));
            var pathKeys = Object.keys(paths);
            pathKeys.sort();

            functionsTableBody.innerHTML = pathKeys.map(function (pathKey) {
                var coverage = coverageUtils.summarizeCoverage(paths[pathKey].map(function (path) {
                    return __coverage__[path];
                }));

                var summaryCells = keys.map(function (key) {
                    return '<td>' + coverage[key].covered + '/' + coverage[key].total +
                            '</td><td>' + coverage[key].pct + '%</td>';
                }).join('');

                var spacing = pathKey.split('/').map(function () {
                    return '&nbsp';
                }).join('');

                var hasParent = (pathKey.indexOf("/") >= 0);
                var dataAttribute = /^.*\.js$/.test(pathKey) ? '' : ' data-showchildren="false"';
                var style = hasParent ? ' style="display:none"' : '';
                return '<tr data-path="' + pathKey + '"' + style + dataAttribute +
                        '><td>' + spacing + pathKey + '</td>' + summaryCells + '</tr>';
            }).join('\n');
        });
    };
});
