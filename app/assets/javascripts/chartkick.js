/*jslint browser: true, indent: 2, plusplus: true */
/*global google*/

(function() {
  'use strict';

  // vendor

  // http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
  var clone = function(obj) {
    var copy, i, attr, len;

    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) {
      return obj;
    }

    // Handle Date
    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
      copy = [];
      for (i = 0, len = obj.length; i < len; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
      copy = {};
      for (attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = clone(obj[attr]);
        }
      }
      return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
  };

  // https://github.com/Do/iso8601.js
  var DECIMAL_SEPARATOR, ISO8601_PATTERN;
  ISO8601_PATTERN = /(\d\d\d\d)(\-)?(\d\d)(\-)?(\d\d)(T)?(\d\d)(:)?(\d\d)?(:)?(\d\d)?([\.,]\d+)?($|Z|([\+\-])(\d\d)(:)?(\d\d)?)/i;
  DECIMAL_SEPARATOR = String(1.5).charAt(1);

  var parseISO8601 = function(input) {
    var day, hour, matches, milliseconds, minutes, month, offset, result, seconds, type, year;
    type = Object.prototype.toString.call(input);
    if (type === '[object Date]') return input;
    if (type !== '[object String]') return;
    if (matches = input.match(ISO8601_PATTERN)) {
      year = parseInt(matches[1], 10);
      month = parseInt(matches[3], 10) - 1;
      day = parseInt(matches[5], 10);
      hour = parseInt(matches[7], 10);
      minutes = matches[9] ? parseInt(matches[9], 10) : 0;
      seconds = matches[11] ? parseInt(matches[11], 10) : 0;
      milliseconds = matches[12] ? parseFloat(DECIMAL_SEPARATOR + matches[12].slice(1)) * 1000 : 0;
      result = Date.UTC(year, month, day, hour, minutes, seconds, milliseconds);
      if (matches[13] && matches[14]) {
        offset = matches[15] * 60;
        if (matches[17]) offset += parseInt(matches[17], 10);
        offset *= matches[14] === '-' ? -1 : 1;
        result -= offset * 60 * 1000;
      }
      return new Date(result);
    }
  };

  // source

  if ("Highcharts" in window) {

    var defaultOptions = {
      xAxis: {
        labels: {
          style: {
            fontSize: "12px"
          }
        }
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          style: {
            fontSize: "12px"
          }
        },
        min: 0
      },
      title: {
        text: null
      },
      credits: {
        enabled: false
      },
      legend: {
        borderWidth: 0
      },
      tooltip: {
        style: {
          fontSize: "12px"
        }
      }
    };

    var jsOptions = function(opts) {
      var options = clone(defaultOptions);
      if ("min" in opts) {
        options.yAxis.min = opts.min;
      }
      if ("max" in opts) {
        options.yAxis.max = opts.max;
      }
      return options;
    }

    var renderLineChart = function(element, series, opts) {
      var options = jsOptions(opts), data, i, j;
      options.xAxis.type = "datetime";
      options.chart = {type: "spline"};

      for (i = 0; i < series.length; i++) {
        data = series[i].data;
        for (j = 0; j < data.length; j++) {
          data[j][0] = data[j][0].getTime();
        }
        series[i].marker = {symbol: "circle"};
      }
      options.series = series;

      if (series.length == 1) {
        options.legend = {enabled: false};
      }
      $(element).highcharts(options);
    };

    var renderPieChart = function(element, series, opts) {
      var options = jsOptions(opts);
      options.series = [{
        type: "pie",
        name: "Value",
        data: series
      }];
      $(element).highcharts(options);
    };

    var renderColumnChart = function(element, series, opts) {
      var options = jsOptions(opts), data, i, j;
      options.chart = {type: "column"};

      var i, j, s, d, rows = [];
      for (i = 0; i < series.length; i++) {
        s = series[i];

        for (j = 0; j < s.data.length; j++) {
          d = s.data[j];
          if (!rows[d[0]]) {
            rows[d[0]] = new Array(series.length);
          }
          rows[d[0]][i] = d[1];
        }
      }

      var categories = [];
      for (i in rows) {
        categories.push(i);
      }
      options.xAxis.categories = categories;

      var newSeries = [];
      for (i = 0; i < series.length; i++) {
        d = [];
        for (j = 0; j < categories.length; j++) {
          d.push(rows[categories[j]][i]);
        }

        newSeries.push({
          name: series[i].name,
          data: d
        });
      }
      options.series = newSeries;

      if (series.length == 1) {
        options.legend.enabled = false;
      }
      $(element).highcharts(options);
    };
  }
  else { // Google charts

    var loaded = false;
    google.setOnLoadCallback( function() {
      loaded = true;
    });
    google.load("visualization", "1.0", {"packages": ["corechart"]});

    var waitForLoaded = function(callback) {
      google.setOnLoadCallback(callback); // always do this to prevent race conditions (watch out for other issues due to this)
      if (loaded) {
        callback();
      }
    }

    // Set chart options
    var defaultOptions = {
      fontName: "'Lucida Grande', 'Lucida Sans Unicode', Verdana, Arial, Helvetica, sans-serif",
      pointSize: 6,
      legend: {
        textStyle: {
          fontSize: 12,
          color: "#444"
        },
        alignment: "center",
        position: "right"
      },
      curveType: "function",
      hAxis: {
        textStyle: {
          color: "#666",
          fontSize: 12
        },
        gridlines: {
          color: "transparent"
        },
        baselineColor: "#ccc"
      },
      vAxis: {
        textStyle: {
          color: "#666",
          fontSize: 12
        },
        baselineColor: "#ccc",
        viewWindow: {
          min: 0
        }
      },
      tooltip: {
        textStyle: {
          color: "#666",
          fontSize: 12
        }
      }
    }

    // cant use object as key
    var createDataTable = function(series, columnType) {
      var data = new google.visualization.DataTable();
      data.addColumn(columnType, "");

      var i, j, s, d, key, rows = [];
      for (i = 0; i < series.length; i++) {
        s = series[i];
        data.addColumn("number", s.name);

        for (j = 0; j < s.data.length; j++) {
          d = s.data[j];
          key = (columnType === "datetime") ? d[0].getTime() : d[0];
          if (!rows[key]) {
            rows[key] = new Array(series.length);
          }
          rows[key][i] = toFloat(d[1]);
        }
      }

      var rows2 = [];
      for (i in rows) {
        rows2.push([(columnType === "datetime") ? new Date(toFloat(i)) : i].concat(rows[i]));
      }
      data.addRows(rows2);

      return data;
    };

    var jsOptions = function(opts) {
      var options = clone(defaultOptions);
      if ("min" in opts) {
        options.vAxis.viewWindow.min = opts.min;
      }
      if ("max" in opts) {
        options.vAxis.viewWindow.max = opts.max;
      }
      return options;
    }

    var renderLineChart = function(element, series, opts) {
      waitForLoaded(function() {
        var data = createDataTable(series, "datetime");

        var options = jsOptions(opts);
        if (series.length == 1) {
          options.legend.position = "none";
        }

        var chart = new google.visualization.LineChart(element);
        chart.draw(data, options);
      })
    };

    var renderPieChart = function(element, series, opts) {
      waitForLoaded(function() {
        var data = new google.visualization.DataTable();
        data.addColumn("string", "");
        data.addColumn("number", "Value");
        data.addRows(series);

        var options = jsOptions(opts);
        options.chartArea = {
          top: "10%",
          height: "80%"
        };

        var chart = new google.visualization.PieChart(element);
        chart.draw(data, options);
      });
    };

    var renderColumnChart = function(element, series, opts) {
      waitForLoaded(function() {
        var data = createDataTable(series, "string");

        var options = jsOptions(opts);
        if (series.length == 1) {
          options.legend.position = "none";
        }

        var chart = new google.visualization.ColumnChart(element);
        chart.draw(data, options);
      });
    };
  }

  var chartError = function(element) {
    element.innerHTML = "Error Loading Chart";
    element.style.color = "red";
  };

  var getJSON = function(element, url, success) {
    // TODO no jquery
    // TODO parse JSON in older browsers
    // https://raw.github.com/douglascrockford/JSON-js/master/json2.js
    $.ajax({
      dataType: "json",
      url: url,
      success: success,
      error: function() {
        chartError(element);
      }
    });
  };

  // not working all the time
  var errorCatcher = function(element, data, opts, callback) {
    try {
      callback(element, data, opts);
    } catch (err) {
      chartError(element);
      throw err;
    }
  };

  // TODO catch errors for callback
  var fetchDataSource = function(element, dataSource, opts, callback) {
    if (typeof dataSource === "string") {
      getJSON(element, dataSource, function(data, textStatus, jqXHR) {
        errorCatcher(element, data, opts, callback);
      });
    }
    else {
      errorCatcher(element, dataSource, opts, callback);
    }
  };

  var isArray = function(variable) {
    return Object.prototype.toString.call(variable) === "[object Array]"
  };

  var standardSeries = function(series, time) {
    var i, j, data, r, key;

    // clean data
    if (!isArray(series) || typeof series[0] !== "object" || isArray(series[0])) {
      series = [{name: "Value", data: series}];
    }

    // right format
    for (i = 0; i < series.length; i++) {
      data = toArr(series[i].data);
      r = [];
      for (j = 0; j < data.length; j++) {
        key = data[j][0];
        if (time) {
          key = toDate(key);
        }
        else {
          key = toStr(key);
        }
        r.push([key, toFloat(data[j][1])]);
      }
      if (time) {
        r.sort(function(a,b){ return a[0].getTime() - b[0].getTime() });
      }
      series[i].data = r;
    }

    return series;
  }

  var toStr = function(n) {
    return "" + n;
  }

  var toFloat = function(n) {
    return parseFloat(n);
  };

  var toDate = function(n) {
    if (typeof n !== "object") {
      if (typeof n === "number") {
        n = new Date(n * 1000); // ms
      }
      else { // str
        // try our best to get the str into iso8601
        // TODO be smarter about this
        var str = n.replace(/ /, "T").replace(" ", "").replace("UTC", "Z");
        n = parseISO8601(str) || new Date(n);
      }
    }
    return n;
  };

  var toArr = function(n) {
    if (!isArray(n)) {
      var arr = [], i;
      for (i in n) {
        if (n.hasOwnProperty(i)) {
          arr.push([i, n[i]]);
        }
      }
      n = arr;
    }
    return n;
  }

  var processLineData = function(element, data, opts) {
    renderLineChart(element, standardSeries(data, true), opts);
  }

  var processColumnData = function(element, data, opts) {
    renderColumnChart(element, standardSeries(data, false), opts);
  }

  var processPieData = function(element, data, opts) {
    var perfectData = toArr(data), i;
    for (i = 0; i < perfectData.length; i++) {
      perfectData[i] = [toStr(perfectData[i][0]), toFloat(perfectData[i][1])];
    }
    renderPieChart(element, perfectData, opts);
  }

  var Chartkick = {
    LineChart: function(element, dataSource, opts) {
      fetchDataSource(element, dataSource, opts || {}, processLineData);
    },
    ColumnChart: function(element, dataSource, opts) {
      fetchDataSource(element, dataSource, opts || {}, processColumnData);
    },
    PieChart: function(element, dataSource, opts) {
      fetchDataSource(element, dataSource, opts || {}, processPieData);
    }
  };

  window.Chartkick = Chartkick;
})();
