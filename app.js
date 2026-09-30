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
  var kpisBox = document.getElementById("kpis");
  var kpiCount = document.getElementById("kpi-count");
  var kpiDay = document.getElementById("kpi-day");
  var kpiWeek = document.getElementById("kpi-week");
  var kpiTtft = document.getElementById("kpi-ttft");
  var duelWrap = document.getElementById("duel-wrap");
  var duelPeek = document.getElementById("duel-peek");
  var duelHide = document.getElementById("duel-hide");
  var duelA = document.getElementById("duel-a");
  var duelB = document.getElementById("duel-b");
  var duelHeadA = document.getElementById("duel-head-a");
  var duelHeadB = document.getElementById("duel-head-b");
  var duelRows = document.getElementById("duel-rows");
  var duelChart = document.getElementById("duel-chart");
  var drawer = document.getElementById("drawer");
  var drawerBackdrop = document.getElementById("drawer-backdrop");
  var drawerTitle = document.getElementById("drawer-title");
  var drawerSub = document.getElementById("drawer-sub");
  var drawerGrid = document.getElementById("drawer-grid");
  var drawerChart = document.getElementById("drawer-chart");
  var drawerClose = document.getElementById("drawer-close");

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
    applyBadges(sorted);
    filterCountEl.textContent = sorted.length + " of " + data.length + " models";
    updateHeaderIndicators();
  }

  var badgeCols = [
    { idx: 1, val: function (m) { return m.inputPricePerToken; }, best: "Lowest input price among the shown models", worst: "Highest input price among the shown models" },
    { idx: 2, val: function (m) { return m.outputPricePerToken; }, best: "Lowest output price among the shown models", worst: "Highest output price among the shown models" },
    { idx: 3, val: function (m) { return m.ttft_ms; }, best: "Fastest TTFT among the shown models", worst: "Slowest TTFT among the shown models" },
    { idx: 7, val: dayCost, best: "Lowest daily cost among the shown models", worst: "Highest daily cost among the shown models" },
    { idx: 10, val: weekCost, best: "Lowest weekly cost among the shown models", worst: "Highest weekly cost among the shown models" }
  ];

  function applyBadges(sorted) {
    if (sorted.length < 2) return;
    var rows = tbody.children;
    for (var c = 0; c < badgeCols.length; c++) {
      var col = badgeCols[c];
      var min = col.val(sorted[0]);
      var max = col.val(sorted[0]);
      for (var i = 1; i < sorted.length; i++) {
        var v = col.val(sorted[i]);
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) continue;
      for (var r = 0; r < rows.length; r++) {
        var td = rows[r].children[col.idx];
        if (!td) continue;
        var cellVal = col.val(sorted[r]);
        if (cellVal === min) {
          td.className = td.className + " is-best";
          td.title = col.best;
        } else if (cellVal === max) {
          td.className = td.className + " is-worst";
          td.title = col.worst;
        }
      }
    }
  }

  function renderKPIs() {
    var set = visibleData();
    if (!set.length) {
      kpiCount.textContent = "–";
      kpiDay.textContent = "–";
      kpiWeek.textContent = "–";
      kpiTtft.textContent = "–";
      return;
    }
    var d = 0, w = 0, ttft = 0;
    for (var i = 0; i < set.length; i++) {
      d += dayCost(set[i]);
      w += weekCost(set[i]);
      ttft += set[i].ttft_ms;
    }
    kpiCount.textContent = String(set.length);
    kpiDay.textContent = formatCost(d);
    kpiWeek.textContent = formatCost(w);
    kpiTtft.textContent = Math.round(ttft / set.length) + " ms";
  }

  function renderAll() {
    render();
    renderKPIs();
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
    filtersBox.hidden = true;
    compareSection.hidden = true;
    kpisBox.hidden = true;
    duelWrap.hidden = true;
  }

  var DUEL_VISIBLE_KEY = "tokenDashboard.duelVisible";

  function isDuelVisible() {
    try {
      return localStorage.getItem(DUEL_VISIBLE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setDuelVisible(visible, moveFocus) {
    duelWrap.setAttribute("data-state", visible ? "open" : "closed");
    duelPeek.setAttribute("aria-expanded", String(visible));
    try {
      localStorage.setItem(DUEL_VISIBLE_KEY, visible ? "1" : "0");
    } catch (e) {
      /* storage unavailable: state just will not persist */
    }
    if (moveFocus) {
      (visible ? duelHide : duelPeek).focus();
    }
  }

  setDuelVisible(isDuelVisible(), false);

  duelPeek.addEventListener("click", function () {
    setDuelVisible(true, true);
  });

  duelHide.addEventListener("click", function () {
    setDuelVisible(false, true);
  });

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
      better: "low",
      short: "In price",
      color: "#1b3b5f",
      desc: "Input price per 1,000,000 tokens (USD) - what you pay for every million tokens you send to the model.",
      get: function (m) { return m.inputPricePerToken; },
      fmt: formatPrice
    },
    {
      id: "outPrice",
      better: "low",
      short: "Out price",
      color: "#356ea6",
      desc: "Output price per 1,000,000 tokens (USD) - what you pay for every million tokens the model generates.",
      get: function (m) { return m.outputPricePerToken; },
      fmt: formatPrice
    },
    {
      id: "ttft",
      better: "low",
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
      better: "low",
      short: "Day cost",
      color: "#24344d",
      desc: "Estimated daily cost = (day input tokens x input price) + (day output tokens x output price).",
      get: dayCost,
      fmt: formatCost
    },
    {
      id: "weekCost",
      better: "low",
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

  function buildChartSvg(model) {
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
    return svg;
  }

  function renderChart() {
    if (!data.length) return;
    var idx = chartModel;
    if (isNaN(idx) || idx < 0 || idx >= data.length) idx = 0;
    var model = data[idx];
    chartTitle.textContent = "Metrics: " + model.name;

    chartArea.textContent = "";
    chartArea.appendChild(buildChartSvg(model));
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
    var models = visibleData();
    renderGroupedChart(document.getElementById("price-chart"), models, [
      { label: "Input price", color: SERIES_IN, get: function (m) { return m.inputPricePerToken; }, fmt: formatPrice },
      { label: "Output price", color: SERIES_OUT, get: function (m) { return m.outputPricePerToken; }, fmt: formatPrice }
    ], "Input and output price per 1M tokens");
    renderGroupedChart(document.getElementById("day-chart"), models, [
      { label: "Day in", color: SERIES_IN, get: function (m) { return m.inputTokensDay; }, fmt: formatTokens },
      { label: "Day out", color: SERIES_OUT, get: function (m) { return m.outputTokensDay; }, fmt: formatTokens }
    ], "Daily token consumption");
    renderGroupedChart(document.getElementById("week-chart"), models, [
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

  function openDrawer(idx) {
    var m = data[idx];
    if (!m) return;
    drawerTitle.textContent = m.name;
    drawerSub.textContent = "All figures per 1,000,000 tokens unless stated otherwise.";
    drawerGrid.textContent = "";
    var items = [
      ["Input price", formatPrice(m.inputPricePerToken)],
      ["Output price", formatPrice(m.outputPricePerToken)],
      ["TTFT", formatTtft(m.ttft_ms)],
      ["Modality", formatModality(m)],
      ["Day tokens in", formatTokens(m.inputTokensDay)],
      ["Day tokens out", formatTokens(m.outputTokensDay)],
      ["Day cost", formatCost(dayCost(m))],
      ["Week tokens in", formatTokens(m.inputTokensWeek)],
      ["Week tokens out", formatTokens(m.outputTokensWeek)],
      ["Week cost", formatCost(weekCost(m))]
    ];
    for (var i = 0; i < items.length; i++) {
      var box = document.createElement("div");
      box.className = "drawer-item";
      var k = document.createElement("span");
      k.className = "k";
      k.textContent = items[i][0];
      var v = document.createElement("span");
      v.className = "v";
      v.textContent = items[i][1];
      box.appendChild(k);
      box.appendChild(v);
      drawerGrid.appendChild(box);
    }
    drawerChart.textContent = "";
    drawerChart.appendChild(buildChartSvg(m));
    drawer.hidden = false;
    drawerBackdrop.hidden = false;
    drawerClose.focus();
  }

  function closeDrawer() {
    drawer.hidden = true;
    drawerBackdrop.hidden = true;
  }

  tbody.addEventListener("click", function (e) {
    var tr = e.target.closest("tr");
    if (!tr || !tr.dataset || !tr.dataset.modelIndex) return;
    var idx = parseInt(tr.dataset.modelIndex, 10);
    if (isNaN(idx)) return;
    openDrawer(idx);
  });

  drawerClose.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) closeDrawer();
  });

  function populateDuelSelects() {
    duelA.textContent = "";
    duelB.textContent = "";
    for (var i = 0; i < data.length; i++) {
      var optA = document.createElement("option");
      optA.value = String(i);
      optA.textContent = data[i].name;
      duelA.appendChild(optA);
      var optB = document.createElement("option");
      optB.value = String(i);
      optB.textContent = data[i].name;
      duelB.appendChild(optB);
    }
    duelA.value = "0";
    duelB.value = "1";
  }

  function renderDuelChart(A, B) {
    duelChart.textContent = "";
    var W = 640, H = 300, L = 48, R = 8, T = 24, B2 = 56;
    var plotW = W - L - R, plotH = H - T - B2;
    var svg = svgEl("svg", {
      viewBox: "0 0 " + W + " " + H,
      width: W,
      height: H,
      role: "img",
      "aria-label": "Metric comparison between " + A.name + " and " + B.name
    });
    for (var p = 0; p <= 4; p++) {
      var gy = T + plotH - (plotH * p) / 4;
      svg.appendChild(svgEl("line", { x1: L, y1: gy, x2: W - R, y2: gy, "class": "grid" }));
      var yl = svgEl("text", { x: L - 6, y: gy + 4, "class": "axis-label", "text-anchor": "end" });
      yl.textContent = p * 25 + "%";
      svg.appendChild(yl);
    }
    var slot = plotW / metrics.length;
    var gap = 4;
    var barW = slot * 0.3;
    for (var i = 0; i < metrics.length; i++) {
      var met = metrics[i];
      var max = metricMaxes[met.id];
      var va = met.get(A);
      var vb = met.get(B);
      var ha = max > 0 ? (va / max) * plotH : 0;
      var hb = max > 0 ? (vb / max) * plotH : 0;
      var center = L + slot * i + slot / 2;
      var bars = [
        { x: center - barW - gap / 2, h: ha, v: va, color: "#1b3b5f", who: A },
        { x: center + gap / 2, h: hb, v: vb, color: "#356ea6", who: B }
      ];
      for (var b = 0; b < bars.length; b++) {
        var bar = bars[b];
        var rect = svgEl("rect", {
          x: bar.x,
          y: T + plotH - bar.h,
          width: barW,
          height: bar.h,
          fill: bar.color,
          "class": "bar"
        });
        var t = svgEl("title");
        t.textContent = bar.who.name + " — " + met.short + ": " + met.fmt(bar.v);
        rect.appendChild(t);
        svg.appendChild(rect);
        var vt = svgEl("text", {
          x: bar.x + barW / 2,
          y: T + plotH - bar.h - 6,
          "class": "bar-value",
          "text-anchor": "middle"
        });
        vt.textContent = met.fmt(bar.v);
        svg.appendChild(vt);
      }
      var bl = svgEl("text", { x: center, y: T + plotH + 18, "class": "bar-label", "text-anchor": "middle" });
      bl.textContent = met.short;
      svg.appendChild(bl);
    }
    svg.appendChild(svgEl("line", { x1: L, y1: T + plotH, x2: W - R, y2: T + plotH, "class": "baseline" }));
    duelChart.appendChild(svg);
    miniLegend(duelChart, [
      { label: A.name, color: "#1b3b5f" },
      { label: B.name, color: "#356ea6" }
    ]);
  }

  function renderDuel() {
    if (!data.length) return;
    var ia = parseInt(duelA.value, 10);
    var ib = parseInt(duelB.value, 10);
    if (isNaN(ia) || ia < 0 || ia >= data.length) ia = 0;
    if (isNaN(ib) || ib < 0 || ib >= data.length) ib = Math.min(1, data.length - 1);
    var A = data[ia];
    var B = data[ib];
    duelHeadA.textContent = A.name;
    duelHeadB.textContent = B.name;
    duelRows.textContent = "";
    for (var i = 0; i < metrics.length; i++) {
      var met = metrics[i];
      var va = met.get(A);
      var vb = met.get(B);
      var tr = document.createElement("tr");
      var label = document.createElement("td");
      label.textContent = met.short;
      tr.appendChild(label);
      var tdA = document.createElement("td");
      tdA.textContent = met.fmt(va);
      var tdB = document.createElement("td");
      tdB.textContent = met.fmt(vb);
      if (met.better === "low" && va !== vb) {
        if (va < vb) tdA.className = "win";
        else tdB.className = "win";
      }
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      duelRows.appendChild(tr);
    }
    renderDuelChart(A, B);
  }

  duelA.addEventListener("change", renderDuel);
  duelB.addEventListener("change", renderDuel);

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
      populateDuelSelects();
      renderDuel();
    })
    .catch(function (err) {
      showError(
        "Could not load mock-data.json (" + err.message + "). " +
        "This page must be served over HTTP - from the project directory run: " +
        "python3 -m http.server  then open http://localhost:8000/"
      );
    });
})();
