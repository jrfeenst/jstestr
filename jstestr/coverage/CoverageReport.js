
define([], function () {
    
    function CoverageReport(converageContainer) {
        this.document = converageContainer.ownerDocument;
        converageContainer.innerHTML = this._template;
    
        this.coverageReport = converageContainer.querySelector('.coverageReport');        
        this.summaryTable = converageContainer.querySelector('.summary');
        this.functionsTableBody = converageContainer.querySelector('.functionsSummary tbody');
        this.functionName = converageContainer.querySelector('.functionName');
        this.gutterNode = converageContainer.querySelector('.function .gutter');
        this.codeNode = converageContainer.querySelector('.function .code');

        this._onRowClickListener = this._onRowClick.bind(this);
        this.functionsTableBody.addEventListener('click', this._onRowClickListener);
    }

    CoverageReport.prototype.reset = function reset() {
        this.summaryTable.innerHTML = '';
        this.functionsTableBody.innerHTML = '';
    };

    CoverageReport.prototype.generate = function generate(coverageData) {
        this.coverageData = coverageData;

        var keys = ['statements', 'branches', 'functions'];
        var coverage = coverageUtils.summarizeCoverage(coverageData);

        this.summaryTable.innerHTML = keys.map(function (key) {
            return '<tr><td>' + key.charAt(0).toUpperCase() + key.substr(1) + '</td><td>' +
                    coverage[key].covered + '/' + coverage[key].total + '</td><td>' +
                    coverage[key].pct + '%</td></tr>';
        }).join('\n');

        var paths = this._convertFilesToPaths(Object.keys(coverageData));
        var pathKeys = Object.keys(paths);
        pathKeys.sort();

        this.functionsTableBody.innerHTML = pathKeys.map(function (pathKey) {
            var coverage = coverageUtils.summarizeCoverage(paths[pathKey].map(function (path) {
                return coverageData[path];
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
    };

    CoverageReport.prototype._template = '<div class="coverageReport"><table class="summary"></table>\n' +
            '<table class="functionsSummary"><thead><th>Files</th><th colspan=2>Lines / Statements</th>' +
            '<th colspan=2>Branches</th><th colspan=2>Functions</th></thead><tbody></tbody></table>\n' +
            '<pre class="functionName"></pre>\n' +
            '<pre class="function"><div class="gutter"></div><div class="code"></div></pre></div>';

    CoverageReport.prototype._onRowClick = function _onRowClick(event) {
        var node = event.target;
        while (node.getAttribute('data-path') || node.parentElement) {
            var path = node.getAttribute('data-path');
            if (path && /\.js$/.test(path)) {
                this._showFunction(path);
            } else if (path) {
                var showChildren = {};
                var visible = {};
                var i, rows = this.functionsTableBody.querySelectorAll('tr');
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
    };

    CoverageReport.prototype._showFunction = function _showFunction(file) {
        var coverage = this.coverageData[file];
        var code = coverage.code;
        var lines = code.split('\n');
        var rows = new Array(lines.length);

        this.functionName.innerHTML = file;

        this.codeNode.innerHTML = '';
        var i, line;
        for (i = 0; i < lines.length; i++) {
            rows[i] = i + 1;

            line = this.document.createElement('div');
            line.appendChild(this.document.createTextNode(lines[i]));
            if (coverage.l[i + 1] !== undefined) {
                line.setAttribute('class', 'covered covered' + Math.min(Math.ceil(coverage.l[i + 1] / 4), 2));
            }
            this.codeNode.appendChild(line);
        }

        this.gutterNode.innerHTML = rows.join('\n');
    };

    CoverageReport.prototype._convertFilesToPaths = function _convertFilesToPaths(files) {
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
    };

    return CoverageReport;
})