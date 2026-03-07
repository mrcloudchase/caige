import { state } from './state.js';
import { escapeHTML } from './utils.js';

export function showResults(onDownloadCert) {
  let totalCorrect = 0;
  const domainScores = {};
  const domainTotals = {};
  const domainNames = {};

  state.questions.forEach((q, idx) => {
    if (!domainScores[q.domain]) {
      domainScores[q.domain] = 0;
      domainTotals[q.domain] = 0;
      domainNames[q.domain] = q.domainName;
    }
    domainTotals[q.domain]++;

    const selected = (state.answers[idx] || []).sort();
    const correct = [...q.correct].sort();

    if (selected.length === correct.length && selected.every((v, i) => v === correct[i])) {
      totalCorrect++;
      domainScores[q.domain]++;
    }
  });

  const total = state.questions.length;
  const pct = Math.round((totalCorrect / total) * 100);
  const passed = pct >= 70;

  const banner = document.getElementById('result-banner');
  banner.className = 'result-banner ' + (passed ? 'pass' : 'fail');
  document.getElementById('result-status').textContent = passed ? 'PASSED' : 'DID NOT PASS';
  document.getElementById('result-score').textContent = 'Score: ' + totalCorrect + ' / ' + total;
  document.getElementById('result-percent').textContent = pct + '%' + (passed ? '' : ' (70% required to pass)');

  const tbody = document.getElementById('domain-breakdown');
  tbody.innerHTML = '';
  for (let d = 1; d <= 6; d++) {
    if (!domainTotals[d]) continue;
    const dScore = domainScores[d];
    const dTotal = domainTotals[d];
    const dPct = Math.round((dScore / dTotal) * 100);
    let colorClass = 'pass-color';
    if (dPct < 50) colorClass = 'fail-color';
    else if (dPct < 70) colorClass = 'warn-color';

    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>Domain ' + d + ': ' + escapeHTML(domainNames[d]) + '</td>' +
      '<td>' + dScore + '/' + dTotal + '</td>' +
      '<td><div class="score-bar-cell"><div class="score-bar-track"><div class="score-bar-fill ' + colorClass + '" style="width:' + dPct + '%"></div></div><span class="score-label">' + dPct + '%</span></div></td>';
    tbody.appendChild(tr);
  }

  const actions = document.getElementById('result-actions');
  actions.innerHTML = '';
  if (passed) {
    const certBtn = document.createElement('button');
    certBtn.className = 'btn btn-success';
    certBtn.textContent = 'Download Certificate';
    certBtn.addEventListener('click', () => onDownloadCert(totalCorrect, total, pct));
    actions.appendChild(certBtn);
  }
  const homeBtn = document.createElement('button');
  homeBtn.className = 'btn btn-secondary';
  homeBtn.textContent = 'Return Home';
  homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
  actions.appendChild(homeBtn);

  document.getElementById('results-screen').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
