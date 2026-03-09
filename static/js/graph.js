let chart = null;
let currentType = 'iv_curve';

function setType(type, btn) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('chartLabel').textContent = btn.textContent;

  const defaults = {
    iv_curve: { x: 'Voltage', xu: 'V', y: 'Current', yu: 'mA' },
    bode_mag: { x: 'Frequency', xu: 'Hz', y: 'Magnitude', yu: 'dB' },
    bode_phase: { x: 'Frequency', xu: 'Hz', y: 'Phase', yu: '°' }
  };
  const d = defaults[type];
  if (!document.getElementById('xLabel').value) document.getElementById('xLabel').value = d.x;
  if (!document.getElementById('xUnit').value) document.getElementById('xUnit').value = d.xu;
  if (!document.getElementById('yLabel').value) document.getElementById('yLabel').value = d.y;
  if (!document.getElementById('yUnit').value) document.getElementById('yUnit').value = d.yu;
}

function parseData() {
  const raw = document.getElementById('dataInput').value.trim();
  if (!raw) return null;
  const points = [];
  raw.split('\n').forEach(line => {
    const parts = line.split(/[\s,;]+/);
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
    }
  });
  return points.length ? points : null;
}

function bestFitLine(points) {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  return [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
}

function getThemeColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid: dark ? '#2a2a2a' : '#e5e5e5',
    tick: dark ? '#666' : '#999',
    text: dark ? '#ccc' : '#444',
    bg: dark ? '#111' : '#fff',
    accent: '#00e5ff',
    bestfit: '#ff6b35'
  };
}

function renderGraph() {
  const points = parseData();
  const empty = document.getElementById('chartEmpty');
  if (!points) { empty.style.display = 'flex'; return; }
  empty.style.display = 'none';

  const xLabel = document.getElementById('xLabel').value || 'X';
  const yLabel = document.getElementById('yLabel').value || 'Y';
  const xUnit = document.getElementById('xUnit').value;
  const yUnit = document.getElementById('yUnit').value;
  const title = document.getElementById('graphTitle').value || 'Graph';
  const showBestFit = document.getElementById('bestFit').checked;
  const logY = document.getElementById('logScale').checked;
  const colors = getThemeColors();

  const datasets = [{
    label: `${yLabel}${yUnit ? ' (' + yUnit + ')' : ''}`,
    data: points,
    borderColor: colors.accent,
    backgroundColor: colors.accent + '18',
    borderWidth: 2.5,
    pointRadius: 4,
    pointBackgroundColor: colors.accent,
    fill: true,
    tension: currentType === 'iv_curve' ? 0.4 : 0.1,
  }];

  if (showBestFit) {
    const fit = bestFitLine(points);
    datasets.push({
      label: 'Best Fit',
      data: fit,
      borderColor: colors.bestfit,
      borderWidth: 2,
      borderDash: [6, 3],
      pointRadius: 0,
      fill: false,
    });
  }

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById('mainChart'), {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      plugins: {
        title: {
          display: true,
          text: title,
          color: colors.text,
          font: { family: 'Syne', size: 16, weight: '700' },
          padding: { bottom: 16 }
        },
        legend: {
          labels: { color: colors.text, font: { family: 'DM Mono', size: 12 } }
        }
      },
      scales: {
        x: {
          type: currentType.startsWith('bode') ? 'logarithmic' : 'linear',
          title: { display: true, text: `${xLabel}${xUnit ? ' (' + xUnit + ')' : ''}`, color: colors.tick, font: { family: 'DM Mono' } },
          grid: { color: colors.grid },
          ticks: { color: colors.tick, font: { family: 'DM Mono', size: 11 } }
        },
        y: {
          type: logY ? 'logarithmic' : 'linear',
          title: { display: true, text: `${yLabel}${yUnit ? ' (' + yUnit + ')' : ''}`, color: colors.tick, font: { family: 'DM Mono' } },
          grid: { color: colors.grid },
          ticks: { color: colors.tick, font: { family: 'DM Mono', size: 11 } }
        }
      }
    }
  });
}

function exportPNG() {
  if (!chart) { alert('Plot a graph first!'); return; }
  const a = document.createElement('a');
  a.href = document.getElementById('mainChart').toDataURL('image/png');
  a.download = (document.getElementById('graphTitle').value || 'grafx-graph') + '.png';
  a.click();
}

async function saveGraph() {
  const points = parseData();
  if (!points) { alert('No data to save!'); return; }

  const payload = {
    title: document.getElementById('graphTitle').value || 'Untitled Graph',
    graph_type: currentType,
    x_label: document.getElementById('xLabel').value,
    y_label: document.getElementById('yLabel').value,
    x_unit: document.getElementById('xUnit').value,
    y_unit: document.getElementById('yUnit').value,
    data: points,
    best_fit: document.getElementById('bestFit').checked
  };

  const res = await fetch('/graph/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const msg = document.getElementById('saveMsg');
  if (data.success) {
    msg.textContent = '✅ Graph saved!';
    msg.className = 'save-msg success';
  } else {
    msg.textContent = '❌ Save failed.';
    msg.className = 'save-msg error';
  }
  setTimeout(() => msg.textContent = '', 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  if (savedGraph) {
    document.getElementById('graphTitle').value = savedGraph.title;
    document.getElementById('xLabel').value = savedGraph.x_label;
    document.getElementById('yLabel').value = savedGraph.y_label;
    document.getElementById('xUnit').value = savedGraph.x_unit;
    document.getElementById('yUnit').value = savedGraph.y_unit;
    document.getElementById('bestFit').checked = savedGraph.best_fit;
    currentType = savedGraph.graph_type;
    const rows = savedGraph.data.map(p => `${p.x}, ${p.y}`).join('\n');
    document.getElementById('dataInput').value = rows;
    document.querySelectorAll('.type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === currentType);
    });
    renderGraph();
  }
});