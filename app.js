const STORAGE_KEY = 'edu-classlists';
let latestScript = '';

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderChips(container, items) {
  container.innerHTML = '';
  if (!items.length) {
    container.innerHTML = '<span class="tiny">Nessun elemento estratto finora.</span>';
    return;
  }
  items.forEach((item) => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = item;
    container.appendChild(span);
  });
}

// ----- Pagine e launcher -----
const viewState = {
  page: 'docente',
  selected: {
    docente: 'exhaustive',
    studenti: 'timer'
  }
};

function activatePage(page) {
  viewState.page = page;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.pageBtn === page);
  });
  document.querySelectorAll('.page').forEach((section) => {
    section.classList.toggle('active', section.dataset.page === page);
  });
  selectTool(page, viewState.selected[page]);
}

function selectTool(page, tool) {
  viewState.selected[page] = tool;
  document.querySelectorAll(`.app-card[data-page="${page}"]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  document.querySelectorAll(`.tool-card[data-page="${page}"]`).forEach((card) => {
    card.classList.toggle('active', card.dataset.tool === tool);
  });
}

function initNavigation() {
  document.querySelectorAll('[data-page-btn]').forEach((btn) => {
    btn.addEventListener('click', () => activatePage(btn.dataset.pageBtn));
  });

  document.querySelectorAll('.app-card').forEach((card) => {
    card.addEventListener('click', () => selectTool(card.dataset.page, card.dataset.tool));
  });
}

// ----- Estrazione ad esaurimento -----
function initExhaustiveDraw() {
  const countInput = document.getElementById('exhaustive-count');
  const shuffleBtn = document.getElementById('exhaustive-shuffle');
  const nextBtn = document.getElementById('exhaustive-next');
  const resetBtn = document.getElementById('exhaustive-reset');
  const statusEl = document.getElementById('exhaustive-status');
  const outputEl = document.getElementById('exhaustive-output');

  const state = { pool: [], drawn: [] };

  function updateStatus() {
    const total = state.pool.length + state.drawn.length;
    const remaining = state.pool.length;
    if (!total) {
      statusEl.textContent = 'Pronto a partire. Inserisci il numero di studenti e premi Mescola.';
      renderChips(outputEl, []);
      return;
    }
    statusEl.textContent = `Estratti ${state.drawn.length}/${total} studenti. Rimasti: ${remaining}`;
    renderChips(outputEl, state.drawn);
  }

  function shuffle() {
    const n = Number(countInput.value);
    if (!Number.isFinite(n) || n <= 0) {
      statusEl.textContent = 'Inserisci un numero di studenti valido.';
      return;
    }
    state.pool = Array.from({ length: n }, (_, i) => i + 1);
    shuffleArray(state.pool);
    state.drawn = [];
    statusEl.textContent = `Generato ordine casuale per ${n} studenti.`;
    renderChips(outputEl, state.drawn);
  }

  function drawNext() {
    if (!state.pool.length) {
      statusEl.textContent = 'Nessuno studente da estrarre. Premi Mescola o Reset.';
      return;
    }
    const value = state.pool.shift();
    state.drawn.push(value);
    statusEl.textContent = `Estratto: ${value}`;
    updateStatus();
  }

  function reset() {
    state.pool = [];
    state.drawn = [];
    statusEl.textContent = 'Reset effettuato. Pronto a creare un nuovo ordine.';
    renderChips(outputEl, state.drawn);
  }

  shuffleBtn.addEventListener('click', shuffle);
  nextBtn.addEventListener('click', drawNext);
  resetBtn.addEventListener('click', reset);
}

// ----- Estrazione mirata con classi salvate -----
function loadClasses() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && typeof data === 'object') return data;
  } catch (e) {
    // ignore
  }
  return { "Esempio": ['Alfa', 'Beta', 'Gamma'] };
}

function saveClasses(classes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
}

function initTargetedDraw() {
  const classSelect = document.getElementById('targeted-class-select');
  const nameInput = document.getElementById('targeted-class-name');
  const namesArea = document.getElementById('targeted-names');
  const saveBtn = document.getElementById('targeted-save');
  const deleteBtn = document.getElementById('targeted-delete');
  const shuffleBtn = document.getElementById('targeted-shuffle');
  const nextBtn = document.getElementById('targeted-next');
  const resetBtn = document.getElementById('targeted-reset');
  const statusEl = document.getElementById('targeted-status');
  const outputEl = document.getElementById('targeted-output');

  const state = { pool: [], drawn: [] };
  let classes = loadClasses();

  function refreshSelect() {
    classSelect.innerHTML = '';
    Object.keys(classes).forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      classSelect.appendChild(opt);
    });
    if (!classSelect.value && classSelect.options.length) {
      classSelect.value = classSelect.options[0].value;
    }
    loadSelectedClass();
  }

  function loadSelectedClass() {
    const key = classSelect.value;
    if (key && classes[key]) {
      nameInput.value = key;
      namesArea.value = classes[key].join('\n');
    } else {
      nameInput.value = '';
      namesArea.value = '';
    }
  }

  function parseNames() {
    return namesArea.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function saveClass() {
    const name = nameInput.value.trim();
    const names = parseNames();
    if (!name) {
      statusEl.textContent = 'Dai un nome alla classe per salvarla.';
      return;
    }
    if (!names.length) {
      statusEl.textContent = 'Inserisci almeno un nome per salvare la classe.';
      return;
    }
    classes[name] = names;
    saveClasses(classes);
    statusEl.textContent = `Classe "${name}" salvata (${names.length} nomi).`;
    refreshSelect();
    classSelect.value = name;
  }

  function deleteClass() {
    const key = classSelect.value;
    if (!key || !classes[key]) {
      statusEl.textContent = 'Nessuna classe da eliminare.';
      return;
    }
    delete classes[key];
    saveClasses(classes);
    statusEl.textContent = `Classe "${key}" eliminata.`;
    refreshSelect();
    namesArea.value = '';
  }

  function shuffle() {
    const list = parseNames();
    if (!list.length) {
      statusEl.textContent = 'Nessun nome in elenco. Aggiungi nomi e salva/mescola.';
      renderChips(outputEl, []);
      return;
    }
    state.pool = shuffleArray([...list]);
    state.drawn = [];
    statusEl.textContent = `Mischiati ${list.length} nomi. Pronto a pescare.`;
    renderChips(outputEl, state.drawn);
  }

  function drawNext() {
    if (!state.pool.length) {
      statusEl.textContent = 'Elenco terminato o non creato. Premi Mescola per ripartire.';
      return;
    }
    const value = state.pool.shift();
    state.drawn.push(value);
    statusEl.textContent = `Estratto: ${value}`;
    renderChips(outputEl, state.drawn);
  }

  function reset() {
    state.pool = [];
    state.drawn = [];
    statusEl.textContent = 'Reset effettuato. Seleziona o salva una classe e premi Mescola.';
    renderChips(outputEl, state.drawn);
  }

  classSelect.addEventListener('change', loadSelectedClass);
  saveBtn.addEventListener('click', saveClass);
  deleteBtn.addEventListener('click', deleteClass);
  shuffleBtn.addEventListener('click', shuffle);
  nextBtn.addEventListener('click', drawNext);
  resetBtn.addEventListener('click', reset);

  refreshSelect();
}

// ----- Conversione voto -----
function initGradeConverter() {
  const scoreInput = document.getElementById('score-current');
  const maxInput = document.getElementById('score-max');
  const adjustInput = document.getElementById('score-adjust');
  const resultEl = document.getElementById('grade-result');
  const notesEl = document.getElementById('grade-notes');
  const meterEl = document.getElementById('grade-meter');

  function update() {
    const score = Number(scoreInput.value);
    const max = Number(maxInput.value);
    const adjust = Number(adjustInput.value);
    if (!Number.isFinite(score) || !Number.isFinite(max) || max <= 0) {
      resultEl.textContent = 'Inserisci valori validi.';
      meterEl.style.width = '0%';
      return;
    }
    let grade = (score * 10) / max + (Number.isFinite(adjust) ? adjust : 0);
    const percentage = Math.max(0, Math.min((grade / 10) * 100, 100));
    meterEl.style.width = `${percentage}%`;
    resultEl.textContent = `Voto: ${grade.toFixed(2)} / 10`;
    notesEl.textContent = `Rapporto ${score}/${max} con fattore ${adjust || 0}.`;
  }

  [scoreInput, maxInput, adjustInput].forEach((el) => el.addEventListener('input', update));
  update();
}

// ----- Form converter -----
function parseQuiz(inputText) {
  const lines = inputText.split(/\r?\n/);
  const questions = [];
  let current = null;
  const questionHeader = /^\s*\d+\.\s*(.*)$/;
  const optionLine = /^\s*(\*?)([A-Za-z]+)[\).]\s*(.*)$/;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const qMatch = questionHeader.exec(trimmed);
    if (qMatch) {
      if (current) questions.push(current);
      current = { question: qMatch[1].trim(), options: [] };
      return;
    }
    const oMatch = optionLine.exec(trimmed);
    if (oMatch && current) {
      current.options.push({ text: oMatch[3].trim(), correct: oMatch[1] === '*' });
    } else if (current) {
      current.question = `${current.question} ${trimmed}`;
    }
  });
  if (current) questions.push(current);
  return questions;
}

function escapeQuotes(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildFormScript(inputText, options) {
  const { title, quizMode, limitCheckbox, limitValue } = options;
  const questions = parseQuiz(inputText);
  const formId = 'LIEL2N2RL8FM0Y3S';
  const quizFlag = quizMode ? 'true' : 'false';
  const lines = [
    'function myFunction() {',
    `  var form = FormApp.create("${escapeQuotes(title)}");`,
    `  form.setIsQuiz(${quizFlag});`
  ];

  questions.forEach((q) => {
    const escapedQuestion = escapeQuotes(q.question);
    if (!q.options.length) {
      lines.push('  var item = form.addParagraphTextItem();');
      lines.push(`  item.setTitle("${escapedQuestion}");`);
      lines.push('  item.setPoints(1);');
      lines.push('  item.setRequired(true);');
      return;
    }

    const correctCount = q.options.filter((o) => o.correct).length;
    if (correctCount === 1) {
      lines.push('  var item = form.addMultipleChoiceItem();');
    } else {
      lines.push('  var item = form.addCheckboxItem();');
    }

    const choices = q.options
      .map((o) => `item.createChoice("${escapeQuotes(o.text)}", ${o.correct ? 'true' : 'false'})`)
      .join(', ');

    lines.push(`  item.setTitle("${escapedQuestion}").setChoices([${choices}]);`);
    lines.push('  item.setPoints(1);');
    lines.push('  item.setRequired(true);');

    if (limitCheckbox && correctCount !== 1) {
      lines.push(`  item.setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(${limitValue}).build());`);
    }
  });

  lines.push(`  Logger.log("Form created: https://docs.google.com/forms/d/${formId}/edit");`);
  lines.push('}');

  latestScript = lines.join('\n');
  return { script: latestScript, questions };
}

function initFormConverter() {
  const titleInput = document.getElementById('form-title');
  const quizModeInput = document.getElementById('form-quiz-mode');
  const limitCheckbox = document.getElementById('form-limit');
  const limitValueInput = document.getElementById('form-limit-value');
  const textArea = document.getElementById('form-input');
  const convertBtn = document.getElementById('form-convert');
  const copyBtn = document.getElementById('form-copy');
  const downloadBtn = document.getElementById('form-download');
  const outputEl = document.getElementById('form-output');
  const previewEl = document.getElementById('form-preview');

  function renderPreview(questions) {
    if (!questions.length) {
      previewEl.innerHTML = '<p class="tiny">Nessuna domanda rilevata.</p>';
      return;
    }
    const list = questions
      .map((q, idx) => {
        const opts = q.options
          .map((o) => `<li>${o.correct ? '✅ ' : ''}${o.text}</li>`)
          .join('');
        return `<div class="question"><strong>${idx + 1}. ${q.question}</strong>${opts ? `<ul>${opts}</ul>` : '<p class="tiny">Risposta aperta</p>'}</div>`;
      })
      .join('');
    previewEl.innerHTML = list;
  }

  function convert() {
    const { script, questions } = buildFormScript(textArea.value, {
      title: titleInput.value || 'Untitled Form',
      quizMode: quizModeInput.checked,
      limitCheckbox: limitCheckbox.checked,
      limitValue: Number(limitValueInput.value) || 1
    });
    outputEl.textContent = script;
    renderPreview(questions);
  }

  function copyScript() {
    if (!latestScript) convert();
    navigator.clipboard?.writeText(latestScript).then(() => {
      outputEl.textContent = `${latestScript}\n// Copiato negli appunti.`;
    }).catch(() => {
      outputEl.textContent = `${latestScript}\n// Copia non riuscita.`;
    });
  }

  function downloadScript() {
    if (!latestScript) convert();
    const blob = new Blob([latestScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-converter.gs';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  convertBtn.addEventListener('click', convert);
  copyBtn.addEventListener('click', copyScript);
  downloadBtn.addEventListener('click', downloadScript);

  convert();
}

// ----- Timer -----
function initTimer() {
  const focusInput = document.getElementById('focus-minutes');
  const breakInput = document.getElementById('break-minutes');
  const toggleBtn = document.getElementById('timer-toggle');
  const resetBtn = document.getElementById('timer-reset');
  const displayEl = document.getElementById('timer-display');
  const modeEl = document.getElementById('timer-mode');
  const progressEl = document.getElementById('timer-progress');

  const circumference = 2 * Math.PI * 54;
  let timerId = null;
  let totalSeconds = 0;
  let remaining = 0;
  let mode = 'Pronto';
  let running = false;

  function format(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateDisplay() {
    const progress = totalSeconds ? 1 - remaining / totalSeconds : 0;
    progressEl.style.strokeDashoffset = circumference * (1 - progress);
    displayEl.textContent = format(Math.max(remaining, 0));
    modeEl.textContent = mode;
    toggleBtn.textContent = running ? 'Pausa' : 'Avvia';
  }

  function startPhase(newMode, minutes) {
    mode = newMode;
    totalSeconds = Math.max(1, Math.round(minutes * 60));
    remaining = totalSeconds;
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerId);
        running = false;
        if (mode === 'Studio') {
          startPhase('Pausa', Number(breakInput.value || 5));
          running = true;
        } else {
          mode = 'Completato';
          remaining = 0;
        }
      }
      updateDisplay();
    }, 1000);
    running = true;
    updateDisplay();
  }

  function toggle() {
    if (running) {
      clearInterval(timerId);
      running = false;
      updateDisplay();
      return;
    }
    startPhase('Studio', Number(focusInput.value || 25));
  }

  function reset() {
    clearInterval(timerId);
    running = false;
    mode = 'Pronto';
    totalSeconds = Number(focusInput.value || 25) * 60;
    remaining = totalSeconds;
    updateDisplay();
  }

  toggleBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', reset);
  focusInput.addEventListener('input', reset);
  breakInput.addEventListener('input', reset);
  reset();
}

// ----- Media -----
function initAverageCalculator() {
  const gradeInput = document.getElementById('avg-grade');
  const weightInput = document.getElementById('avg-weight');
  const addBtn = document.getElementById('avg-add');
  const clearBtn = document.getElementById('avg-clear');
  const listEl = document.getElementById('avg-list');
  const resultEl = document.getElementById('avg-result');

  const entries = [];

  function render() {
    listEl.innerHTML = '';
    if (!entries.length) {
      listEl.innerHTML = '<span class="tiny">Aggiungi almeno un voto.</span>';
      resultEl.textContent = 'Media: n/d';
      return;
    }
    const totalWeight = entries.reduce((acc, e) => acc + e.weight, 0);
    const weighted = entries.reduce((acc, e) => acc + e.grade * e.weight, 0);
    const average = weighted / (totalWeight || 1);
    entries.forEach((e, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = `${e.grade} (x${e.weight})`;
      chip.title = 'Clicca per rimuovere';
      chip.addEventListener('click', () => {
        entries.splice(idx, 1);
        render();
      });
      listEl.appendChild(chip);
    });
    resultEl.textContent = `Media: ${average.toFixed(2)} / 10`;
  }

  function add() {
    const grade = Number(gradeInput.value);
    const weight = Number(weightInput.value);
    if (!Number.isFinite(grade) || grade < 1 || grade > 10) {
      resultEl.textContent = 'Inserisci un voto tra 1 e 10.';
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      resultEl.textContent = 'Inserisci un peso positivo.';
      return;
    }
    entries.push({ grade, weight });
    gradeInput.value = '';
    render();
  }

  function clearAll() {
    entries.length = 0;
    render();
  }

  addBtn.addEventListener('click', add);
  clearBtn.addEventListener('click', clearAll);
  render();
}

// ----- Service worker -----
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('SW registration failed', err);
    });
  });
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initExhaustiveDraw();
  initTargetedDraw();
  initGradeConverter();
  initFormConverter();
  initTimer();
  initAverageCalculator();
  registerServiceWorker();
  activatePage('docente');
});
