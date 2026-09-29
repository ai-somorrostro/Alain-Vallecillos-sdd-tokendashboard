(function () {
  "use strict";

  var tbody = document.getElementById("rows");
  var errorBox = document.getElementById("error");
  var table = document.getElementById("dashboard");
  var modelSelect = document.getElementById("model-select");
  var chartArea = document.getElementById("chart-area");
  var chartLegend = document.getElementById("chart-legend");
  var chartTitle = document.getElementById("chart-title");
  var chartSection = document.getElementById("chart-section");
  var chartToggle = document.getElementById("chart-toggle");
  var chartControls = document.getElementById("chart-controls");
  var filtersBox = document.getElementById("filters");
  var filterNameEl = document.getElementById("filter-name");
  var filterModalityEl = document.getElementById("filter-modality");
  var filterCountEl = document.getElementById("filter-count");
  var compareSection = document.getElementById("compare-section");

  var data = [];
  var sortState = { key: null, dir: "desc" };
  var selectedModel = null; // null = all models in the table
  var chartModel = 0;       // which model the chart shows
  var nameFilter = "";
  var modalityFilter = "";

  function formatPrice(p) {
    return "$" + (p * 1e6).toFixed(2);
  }

  function formatTokens(n) {
    var units = [
      { limit: 1e9, suffix: "B" },
      { limit: 1e6, suffix: "M" },
      { limit: 1e3, suffix: "K" }
    ];
    for (var i = 0; i < units.length; i++) {
      if (n >= units[i].limit) {
        var v = n / units[i].limit;
        var s = v.toFixed(1);
        if (s.slice(-2) === ".0") s = s.slice(0, -2);
        return s + units[i].suffix;
      }
    }
    return String(n);
  }

  function formatCost(n) {
    return "$" + n.toFixed(2);
  }

  function dayCost(m) {
    return m.inputTokensDay * m.inputPricePerToken + m.outputTokensDay * m.outputPricePerToken;
  }

  function weekCost(m) {
    return m.inputTokensWeek * m.inputPricePerToken + m.outputTokensWeek * m.outputPricePerToken;
  }

  function formatTtft(ms) {
    return ms + " ms";
  }

  function formatModality(m) {
    return m.inputModality + " -> " + m.outputModality;
  }

  function cell(text, group) {
    var td = document.createElement("td");
    td.textContent = text;
    if (group) td.className = group;
    return td;
  }

  function renderRow(m) {
    var tr = document.createElement("tr");
    tr.dataset.modelIndex = String(data.indexOf(m));
    tr.appendChild(cell(m.name, "g-name"));
    tr.appendChild(cell(formatPrice(m.inputPricePerToken), "g-price"));
    tr.appendChild(cell(formatPrice(m.outputPricePerToken), "g-price"));
    tr.appendChild(cell(formatTtft(m.ttft_ms), "g-time"));
    tr.appendChild(cell(formatModality(m), "g-modality"));
    tr.appendChild(cell(formatTokens(m.inputTokensDay), "g-vol"));
    tr.appendChild(cell(formatTokens(m.outputTokensDay), "g-vol"));
    tr.appendChild(cell(formatCost(dayCost(m)), "g-cost"));
    tr.appendChild(cell(formatTokens(m.inputTokensWeek), "g-vol"));
    tr.appendChild(cell(formatTokens(m.outputTokensWeek), "g-vol"));
    tr.appendChild(cell(formatCost(weekCost(m)), "g-cost"));
    return tr;
  }

  function visibleData() {
    return data.filter(function (m) {
      if (nameFilter && m.name.toLowerCase().indexOf(nameFilter) === -1) return false;
      if (modalityFilter && m.inputModality !== modalityFilter && m.outputModality !== modalityFilter) return false;
      return true;
    });
  }

  function render() {
    tbody.textContent = "";
    var source = selectedModel === null ? visibleData() : [data[selectedModel]];
    var sorted = source.slice();
    if (sortState.key) {
      var cmp = comparators[sortState.key];
      var dir = sortState.dir === "asc" ? 1 : -1;
      sorted.sort(function (a, b) {
        return cmp(a, b) * dir;
      });
    }
    if (sorted.length === 0 && data.length > 0) {
      var emptyRow = document.createElement("tr");
      var emptyCell = cell("No models match the filters.", "empty");
      emptyCell.setAttribute("colspan", "11");
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    }
    for (var i = 0; i < sorted.length; i++) {
      tbody.appendChild(renderRow(sorted[i]));
    }
    if (filterCountEl) {
      filterCountEl.textContent = sorted.length + " of " + data.length + " models";
    }
    updateHeaderIndicators();
  }

  function renderAll() {
    render();
    renderComparativa();
  }

  var comparators = {
    name: function (a, b) {
      return a.name.localeCompare(b.name);
    },
    inputPricePerToken: function (a, b) {
      return a.inputPricePerToken - b.inputPricePerToken;
    },
    outputPricePerToken: function (a, b) {
      return a.outputPricePerToken - b.outputPricePerToken;
    },
    ttft_ms: function (a, b) {
      return a.ttft_ms - b.ttft_ms;
    },
    modality: function (a, b) {
      return formatModality(a).localeCompare(formatModality(b));
    },
    inputTokensDay: function (a, b) {
      return a.inputTokensDay - b.inputTokensDay;
    },
    outputTokensDay: function (a, b) {
      return a.outputTokensDay - b.outputTokensDay;
    },
    dayCost: function (a, b) {
      return dayCost(a) - dayCost(b);
    },
    inputTokensWeek: function (a, b) {
      return a.inputTokensWeek - b.inputTokensWeek;
    },
    outputTokensWeek: function (a, b) {
      return a.outputTokensWeek - b.outputTokensWeek;
    },
    weekCost: function (a, b) {
      return weekCost(a) - weekCost(b);
    }
  };

  function updateHeaderIndicators() {
    var ths = table.querySelectorAll("thead th");
    for (var i = 0; i < ths.length; i++) {
      var th = ths[i];
      if (th.dataset.key === sortState.key) {
        th.setAttribute("aria-sort", sortState.dir === "asc" ? "ascending" : "descending");
      } else {
        th.setAttribute("aria-sort", "none");
      }
    }
  }

  function showError(message) {
    tbody.textContent = "";
    errorBox.textContent = message;
    errorBox.hidden = false;
    chartControls.hidden = true;
    chartSection.hidden = true;
    if (filtersBox) filtersBox.hidden = true;
    if (compareSection) compareSection.hidden = true;
  }

  var defaultDirs = { name: "asc", modality: "asc" };

  function onHeaderClick(e) {
    var th = e.target.closest("th");
    if (!th || !th.dataset.key) return;
    var key = th.dataset.key;
    if (!comparators[key]) return;
    var dir;
    if (sortState.key === key) {
      dir = sortState.dir === "desc" ? "asc" : "desc";
    } else {
      dir = defaultDirs[key] || "desc";
    }
    sortState = { key: key, dir: dir };
    render();
  }

  table.querySelector("thead").addEventListener("click", onHeaderClick);

  filterNameEl.addEventListener("input", function () {
    nameFilter = filterNameEl.value.trim().toLowerCase();
    renderAll();
  });

  filterModalityEl.addEventListener("change", function () {
    modalityFilter = filterModalityEl.value;
    renderAll();
  });

  var SVG_NS = "http://www.w3.org/2000/svg";

  var metrics = [
    {
      id: "inPrice",
      short: "In price",
      color: "#1b3b5f",
      desc: "Input price per 1,000,000 tokens (USD) - what you pay for every million tokens you send to the model.",
      get: function (m) { return m.inputPricePerToken; },
      fmt: formatPrice
    },
    {
      id: "outPrice",
      short: "Out price",
      color: "#356ea6",
      desc: "Output price per 1,000,000 tokens (USD) - what you pay for every million tokens the model generates.",
      get: function (m) { return m.outputPricePerToken; },
      fmt: formatPrice
    },
    {
      id: "ttft",
      short: "TTFT",
      color: "#78aad6",
      desc: "Time to first token in milliseconds - how long until the model starts replying. Lower is faster.",
      get: function (m) { return m.ttft_ms; },
      fmt: function (v) { return v + " ms"; }
    },
    {
      id: "dayTokens",
      short: "Day tokens",
      color: "#2f8a96",
      desc: "Total tokens processed per day (input + output).",
      get: function (m) { return m.inputTokensDay + m.outputTokensDay; },
      fmt: formatTokens
    },
    {
      id: "dayCost",
      short: "Day cost",
      color: "#24344d",
      desc: "Estimated daily cost = (day input tokens x input price) + (day output tokens x output price).",
      get: dayCost,
      fmt: formatCost
    },
    {
      id: "weekCost",
      short: "Week cost",
      color: "#5f96cf",
      desc: "Estimated weekly cost = (week input tokens x input price) + (week output tokens x output price).",
      get: weekCost,
      fmt: formatCost
    }
  ];

  var metricMaxes = {};

  function computeMaxes() {
    for (var i = 0; i < metrics.length; i++) {
      var max = 0;
      for (var j = 0; j < data.length; j++) {
        var v = metrics[i].get(data[j]);
        if (v > max) max = v;
      }
      metricMaxes[metrics[i].id] = max;
    }
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) {
        el.setAttribute(k, attrs[k]);
      }
    }
    return el;
  }

  function renderChart() {
    if (!data.length) return;
    var idx = chartModel;
    if (isNaN(idx) || idx < 0 || idx >= data.length) idx = 0;
    var model = data[idx];
    chartTitle.textContent = "Metrics: " + model.name;

    var W = 640, H = 300, L = 48, R = 8, T = 24, B = 56;
    var plotW = W - L - R, plotH = H - T - B;
    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H,
      width: W,
      height: H,
      role: "img",
      "aria-label": "Bar chart of key metrics for " + model.name
    });

    for (var p = 0; p <= 4; p++) {
      var gy = T + plotH - (plotH * p) / 4;
      svg.appendChild(svgEl("line", { x1: L, y1: gy, x2: W - R, y2: gy, "class": "grid" }));
      var yl = svgEl("text", { x: L - 6, y: gy + 4, "class": "axis-label", "text-anchor": "end" });
      yl.textContent = p * 25 + "%";
      svg.appendChild(yl);
    }

    var slot = plotW / metrics.length;
    var barW = slot * 0.55;
    for (var i = 0; i < metrics.length; i++) {
      var met = metrics[i];
      var value = met.get(model);
      var max = metricMaxes[met.id];
      var bh = max > 0 ? (value / max) * plotH : 0;
      var bx = L + slot * i + (slot - barW) / 2;
      var by = T + plotH - bh;
      svg.appendChild(svgEl("rect", { x: bx, y: by, width: barW, height: bh, fill: met.color, "class": "bar" }));
      var vt = svgEl("text", { x: bx + barW / 2, y: by - 6, "class": "bar-value", "text-anchor": "middle" });
      vt.textContent = met.fmt(value);
      svg.appendChild(vt);
      var bl = svgEl("text", { x: bx + barW / 2, y: T + plotH + 18, "class": "bar-label", "text-anchor": "middle" });
      bl.textContent = met.short;
      svg.appendChild(bl);
    }
    svg.appendChild(svgEl("line", { x1: L, y1: T + plotH, x2: W - R, y2: T + plotH, "class": "baseline" }));

    chartArea.textContent = "";
    chartArea.appendChild(svg);
  }

  function renderLegend() {
    chartLegend.textContent = "";
    for (var i = 0; i < metrics.length; i++) {
      var li = document.createElement("li");
      var sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.backgroundColor = metrics[i].color;
      li.appendChild(sw);
      var strong = document.createElement("strong");
      strong.textContent = metrics[i].short + ": ";
      li.appendChild(strong);
      li.appendChild(document.createTextNode(metrics[i].desc));
      chartLegend.appendChild(li);
    }
  }

  function emptyChart(container, text) {
    container.textContent = "";
    var p = document.createElement("p");
    p.className = "empty-chart";
    p.textContent = text;
    container.appendChild(p);
  }

  function miniLegend(container, items) {
    var ul = document.createElement("ul");
    ul.className = "legend";
    for (var i = 0; i < items.length; i++) {
      var li = document.createElement("li");
      var sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.backgroundColor = items[i].color;
      li.appendChild(sw);
      li.appendChild(document.createTextNode(items[i].label));
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  function renderGroupedChart(container, models, series, ariaPrefix) {
    if (!container) return;
    if (!models.length) {
      emptyChart(container, "No models match the filters.");
      return;
    }
    var W = 560, H = 300, L = 46, R = 8, T = 16, B = 56;
    var plotW = W - L - R, plotH = H - T - B;
    var max = 0;
    var si, mi;
    for (mi = 0; mi < models.length; mi++) {
      for (si = 0; si < series.length; si++) {
        var v = series[si].get(models[mi]);
        if (v > max) max = v;
      }
    }
    if (max <= 0) max = 1;
    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H,
      width: W,
      height: H,
      role: "img",
      "aria-label": ariaPrefix + " for " + models.length + " models"
    });

    for (var p = 0; p <= 4; p++) {
      var gy = T + plotH - (plotH * p) / 4;
      svg.appendChild(svgEl("line", { x1: L, y1: gy, x2: W - R, y2: gy, "class": "grid" }));
      var yl = svgEl("text", { x: L - 6, y: gy + 4, "class": "axis-label", "text-anchor": "end" });
      yl.textContent = series[0].fmt((max * p) / 4);
      svg.appendChild(yl);
    }

    var groupW = plotW / models.length;
    var gap = 2;
    var barW = Math.min(18, (groupW - 8) / series.length - gap);
    for (mi = 0; mi < models.length; mi++) {
      var m = models[mi];
      var total = series.length * barW + (series.length - 1) * gap;
      var start = L + groupW * mi + (groupW - total) / 2;
      for (si = 0; si < series.length; si++) {
        var val = series[si].get(m);
        var bh = (val / max) * plotH;
        var rect = svgEl("rect", {
          x: start + si * (barW + gap),
          y: T + plotH - bh,
          width: barW,
          height: bh,
          fill: series[si].color,
          "class": "bar"
        });
        var title = svgEl("title");
        title.textContent = m.name + " — " + series[si].label + ": " + series[si].fmt(val);
        rect.appendChild(title);
        svg.appendChild(rect);
      }
      var cx = L + groupW * mi + groupW / 2;
      var ly = T + plotH + 14;
      var lbl = svgEl("text", {
        x: cx,
        y: ly,
        "class": "axis-label",
        "text-anchor": "end",
        transform: "rotate(-20 " + cx + " " + ly + ")"
      });
      lbl.textContent = m.name.split(" ")[0];
      svg.appendChild(lbl);
    }
    svg.appendChild(svgEl("line", { x1: L, y1: T + plotH, x2: W - R, y2: T + plotH, "class": "baseline" }));

    container.textContent = "";
    container.appendChild(svg);
    var items = [];
    for (si = 0; si < series.length; si++) {
      items.push({ label: series[si].label, color: series[si].color });
    }
    miniLegend(container, items);
  }

  var SERIES_IN = "#1b3b5f";
  var SERIES_OUT = "#356ea6";

  function renderComparativa() {
    renderGroupedChart(document.getElementById("price-chart"), visibleData(), [
      { label: "Input price", color: SERIES_IN, get: function (m) { return m.inputPricePerToken; }, fmt: formatPrice },
      { label: "Output price", color: SERIES_OUT, get: function (m) { return m.outputPricePerToken; }, fmt: formatPrice }
    ], "Input and output price per 1M tokens");
    renderGroupedChart(document.getElementById("day-chart"), visibleData(), [
      { label: "Day in", color: SERIES_IN, get: function (m) { return m.inputTokensDay; }, fmt: formatTokens },
      { label: "Day out", color: SERIES_OUT, get: function (m) { return m.outputTokensDay; }, fmt: formatTokens }
    ], "Daily token consumption");
    renderGroupedChart(document.getElementById("week-chart"), visibleData(), [
      { label: "Week in", color: SERIES_IN, get: function (m) { return m.inputTokensWeek; }, fmt: formatTokens },
      { label: "Week out", color: SERIES_OUT, get: function (m) { return m.outputTokensWeek; }, fmt: formatTokens }
    ], "Weekly token consumption");
  }

  function populateSelect() {
    modelSelect.textContent = "";
    var allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All models";
    modelSelect.appendChild(allOpt);
    for (var i = 0; i < data.length; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = data[i].name;
      modelSelect.appendChild(opt);
    }
    modelSelect.value = "";
    modelSelect.disabled = false;
  }

  modelSelect.addEventListener("change", function () {
    var v = modelSelect.value;
    if (v === "") {
      selectedModel = null;
    } else {
      var i = parseInt(v, 10);
      if (isNaN(i) || i < 0 || i >= data.length) return;
      selectedModel = i;
      chartModel = i;
    }
    render();
    renderChart();
  });

  var chartVisible = true;
  chartToggle.addEventListener("click", function () {
    chartVisible = !chartVisible;
    chartSection.hidden = !chartVisible;
    chartToggle.textContent = chartVisible ? "Hide chart" : "Show chart";
    chartToggle.setAttribute("aria-expanded", String(chartVisible));
  });

  fetch("mock-data.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (json) {
      if (!Array.isArray(json)) throw new Error("Unexpected data shape");
      data = json;
      renderAll();
      computeMaxes();
      populateSelect();
      renderLegend();
      renderChart();
    })
    .catch(function (err) {
      showError(
        "Could not load mock-data.json (" + err.message + "). " +
        "This page must be served over HTTP - from the project directory run: " +
        "python3 -m http.server  then open http://localhost:8000/"
      );
    });
})();
