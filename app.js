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
  page: 'studenti',
  selected: {
    docente: 'exhaustive',
    studenti: 'timer'
  },
  subcat: {
    docente: 'estrazione',
    studenti: 'tempo'
  }
};

function filterBySubcategory(page, subcat) {
  viewState.subcat[page] = subcat;
  document.querySelectorAll(`.subcat-btn[data-page="${page}"], .subcat-card[data-page="${page}"]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.subcategory === subcat);
  });
  document.querySelectorAll(`.app-card[data-page="${page}"]`).forEach((btn) => {
    const match = btn.dataset.subcategory === subcat;
    btn.classList.toggle('hidden', !match);
    if (!match) btn.classList.remove('active');
  });
  const visibleCards = Array.from(document.querySelectorAll(`.tool-card[data-page="${page}"]`)).filter(
    (card) => card.dataset.subcategory === subcat
  );
  document.querySelectorAll(`.tool-card[data-page="${page}"]`).forEach((card) => {
    card.classList.toggle('hidden', card.dataset.subcategory !== subcat);
  });
  if (visibleCards.length && !visibleCards.some((c) => c.dataset.tool === viewState.selected[page])) {
    selectTool(page, visibleCards[0].dataset.tool, false);
  } else {
    selectTool(page, viewState.selected[page], false);
  }
}

function activatePage(page) {
  viewState.page = page;
  document.querySelectorAll('[data-page-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.pageBtn === page);
  });
  document.querySelectorAll('.page').forEach((section) => {
    section.classList.toggle('active', section.dataset.page === page);
  });
  filterBySubcategory(page, viewState.subcat[page]);
}

function selectTool(page, tool, updateSubcat = true) {
  const card = document.querySelector(`.tool-card[data-page="${page}"][data-tool="${tool}"]`);
  if (!card) return;
  const subcat = card.dataset.subcategory;
  viewState.selected[page] = tool;
  if (updateSubcat) {
    filterBySubcategory(page, subcat);
  }
  document.querySelectorAll(`.app-card[data-page="${page}"]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });
  document.querySelectorAll(`.tool-card[data-page="${page}"]`).forEach((c) => {
    c.classList.toggle('active', c.dataset.tool === tool);
  });
}

function initNavigation() {
  document.querySelectorAll('[data-page-btn]').forEach((btn) => {
    btn.addEventListener('click', () => activatePage(btn.dataset.pageBtn));
  });

  document.querySelectorAll('.app-card').forEach((card) => {
    card.addEventListener('click', () => selectTool(card.dataset.page, card.dataset.tool));
  });

  document.querySelectorAll('.subcat-btn, .subcat-card').forEach((btn) => {
    btn.addEventListener('click', () => filterBySubcategory(btn.dataset.page, btn.dataset.subcategory));
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

// ----- Conversione basi -----
function parseInBase(value, base) {
  const symbols = '0123456789ABCDEF';
  const clean = value.trim().toUpperCase();
  if (!clean) throw new Error('Inserisci un numero.');
  if (base < 2 || base > 16) throw new Error('Base fuori range 2-16.');
  let negative = false;
  let idx = 0;
  if (clean[0] === '-') {
    negative = true;
    idx = 1;
  }
  let total = 0n;
  for (; idx < clean.length; idx += 1) {
    const ch = clean[idx];
    const digit = symbols.indexOf(ch);
    if (digit < 0 || digit >= base) throw new Error(`Cifra non valida per base ${base}: ${ch}`);
    total = total * BigInt(base) + BigInt(digit);
  }
  return negative ? -total : total;
}

function toBaseString(value, base) {
  const symbols = '0123456789ABCDEF';
  if (base < 2 || base > 16) throw new Error('Base fuori range 2-16.');
  let n = value;
  if (n === 0n) return '0';
  const negative = n < 0;
  if (negative) n = -n;
  let out = '';
  while (n > 0) {
    const digit = Number(n % BigInt(base));
    out = symbols[digit] + out;
    n /= BigInt(base);
  }
  return negative ? `-${out}` : out;
}

function initBaseConverter() {
  const inputEl = document.getElementById('baseconv-input');
  const fromEl = document.getElementById('baseconv-from');
  const toEl = document.getElementById('baseconv-to');
  const runBtn = document.getElementById('baseconv-run');
  const swapBtn = document.getElementById('baseconv-swap');
  const outputEl = document.getElementById('baseconv-output');
  const tableEl = document.getElementById('baseconv-table');

  function renderTable(valueBig) {
    const bases = [2, 8, 10, 16];
    const rows = bases
      .map((b) => `<tr><td>Base ${b}</td><td><code>${toBaseString(valueBig, b)}</code></td></tr>`)
      .join('');
    tableEl.innerHTML = `<table><tbody>${rows}</tbody></table>`;
  }

  function convert() {
    try {
      const fromBase = Number(fromEl.value);
      const toBase = Number(toEl.value);
      const valueBig = parseInBase(inputEl.value, fromBase);
      const converted = toBaseString(valueBig, toBase);
      outputEl.textContent = `${inputEl.value.trim()} (base ${fromBase}) = ${converted} (base ${toBase})`;
      renderTable(valueBig);
    } catch (err) {
      outputEl.textContent = err.message;
      tableEl.innerHTML = '';
    }
  }

  function swap() {
    const a = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = a;
    convert();
  }

  runBtn.addEventListener('click', convert);
  swapBtn.addEventListener('click', swap);
}

// ----- Operazioni binarie -----
function initBinOps() {
  const aEl = document.getElementById('binops-a');
  const bEl = document.getElementById('binops-b');
  const opEl = document.getElementById('binops-op');
  const runBtn = document.getElementById('binops-run');
  const clearBtn = document.getElementById('binops-clear');
  const outputEl = document.getElementById('binops-output');

  function toBinStr(n) {
    return n.toString(2);
  }

  function run() {
    try {
      const a = parseInBase(aEl.value, 2);
      const b = parseInBase(bEl.value, 2);
      let res = 0n;
      if (opEl.value === 'add') {
        res = a + b;
      } else {
        res = a - b;
      }
      outputEl.textContent = [
        `A: ${toBinStr(a)} (${a.toString(10)})`,
        `B: ${toBinStr(b)} (${b.toString(10)})`,
        `${opEl.value === 'add' ? 'A + B' : 'A - B'} = ${toBinStr(res)} (${res.toString(10)})`
      ].join('\\n');
    } catch (err) {
      outputEl.textContent = err.message;
    }
  }

  function clear() {
    aEl.value = '';
    bEl.value = '';
    outputEl.textContent = 'Inserisci A e B, poi Calcola.';
  }

  runBtn.addEventListener('click', run);
  clearBtn.addEventListener('click', clear);
}

// ----- Complemento a 2 -----
function toComplement2(value, bits) {
  const max = (1n << BigInt(bits - 1)) - 1n;
  const min = -(1n << BigInt(bits - 1));
  if (value > max || value < min) throw new Error(`Fuori intervallo per ${bits} bit: da ${min} a ${max}`);
  if (value >= 0) {
    const bin = value.toString(2).padStart(bits, '0');
    return bin.slice(-bits);
  }
  const mod = (1n << BigInt(bits));
  const bin = (mod + value).toString(2).padStart(bits, '0');
  return bin.slice(-bits);
}

function fromComplement2(binStr, bits) {
  const clean = binStr.replace(/\\s+/g, '');
  if (!clean.match(/^[01]+$/)) throw new Error('Inserisci solo bit 0/1.');
  const padded = clean.padStart(bits, clean[0]);
  const unsigned = BigInt('0b' + padded);
  const sign = padded[0] === '1';
  if (!sign) return unsigned;
  const mod = 1n << BigInt(bits);
  return unsigned - mod;
}

function initComplementTwo() {
  const decEl = document.getElementById('comp2-decimal');
  const bitsEl = document.getElementById('comp2-bits');
  const binEl = document.getElementById('comp2-binary');
  const encBtn = document.getElementById('comp2-encode');
  const decBtn = document.getElementById('comp2-decode');
  const outputEl = document.getElementById('comp2-output');

  function encode() {
    try {
      const value = BigInt(decEl.value);
      const bits = Number(bitsEl.value);
      if (!Number.isFinite(bits) || bits < 2) throw new Error('Bit non validi.');
      const bin = toComplement2(value, bits);
      const max = (1n << BigInt(bits - 1)) - 1n;
      const min = -(1n << BigInt(bits - 1));
      outputEl.textContent = `${value} su ${bits} bit -> ${bin}\\nIntervallo: [${min}, ${max}]`;
      binEl.value = bin;
    } catch (err) {
      outputEl.textContent = err.message;
    }
  }

  function decode() {
    try {
      const bits = Number(bitsEl.value);
      if (!Number.isFinite(bits) || bits < 2) throw new Error('Bit non validi.');
      const value = fromComplement2(binEl.value || '', bits);
      const max = (1n << BigInt(bits - 1)) - 1n;
      const min = -(1n << BigInt(bits - 1));
      outputEl.textContent = `${binEl.value.trim() || '(vuoto)'} su ${bits} bit -> ${value}\\nIntervallo: [${min}, ${max}]`;
      decEl.value = value.toString();
    } catch (err) {
      outputEl.textContent = err.message;
    }
  }

  encBtn?.addEventListener('click', encode);
  decBtn?.addEventListener('click', decode);
}

// ----- IEEE 754 single -----
function floatToHex32(value) {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, Number(value));
  const hex = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex;
}

function hexToFloat32(hexOrBin) {
  let clean = hexOrBin.replace(/\\s+/g, '');
  if (clean.length === 32 && /^[01]+$/.test(clean)) {
    // convert binary to hex
    clean = parseInt(clean, 2).toString(16).padStart(8, '0');
  }
  if (!clean.match(/^[0-9a-fA-F]{8}$/)) throw new Error('Inserisci 8 cifre hex o 32 bit binari.');
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  for (let i = 0; i < 4; i += 1) {
    const byte = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    view.setUint8(i, byte);
  }
  return view.getFloat32(0);
}

function hexToBin(hex) {
  return hex
    .split('')
    .map((c) => parseInt(c, 16).toString(2).padStart(4, '0'))
    .join('');
}

function initIeee754() {
  const decEl = document.getElementById('ieee-decimal');
  const hexEl = document.getElementById('ieee-hex');
  const encBtn = document.getElementById('ieee-encode');
  const decBtn = document.getElementById('ieee-decode');
  const outputEl = document.getElementById('ieee-output');
  const bitsContainer = document.getElementById('ieee-bits');
  const applyBitsBtn = document.getElementById('ieee-apply-bits');
  const bitToggles = [];

  function describeBits(hex) {
    const bin = hexToBin(hex).padStart(32, '0');
    const sign = bin.slice(0, 1);
    const exp = bin.slice(1, 9);
    const mant = bin.slice(9);
    return `Segno: ${sign} | Esponente: ${exp} | Mantissa: ${mant}`;
  }

  function buildBitsUI() {
    if (!bitsContainer) return;
    const rows = {
      sign: { count: 1, node: bitsContainer.querySelector('[data-section="sign"]') },
      exp: { count: 8, node: bitsContainer.querySelector('[data-section="exp"]') },
      mant: { count: 23, node: bitsContainer.querySelector('[data-section="mant"]') }
    };
    Object.entries(rows).forEach(([key, cfg]) => {
      cfg.node.querySelectorAll('.bit-toggle').forEach((el) => el.remove());
      for (let i = 0; i < cfg.count; i += 1) {
        const span = document.createElement('span');
        span.className = 'bit-toggle';
        span.dataset.section = key;
        span.dataset.index = i;
        span.textContent = '0';
        span.addEventListener('click', () => {
          const isOn = span.classList.toggle('on');
          span.textContent = isOn ? '1' : '0';
        });
        cfg.node.appendChild(span);
        bitToggles.push(span);
      }
    });
  }

  function setBitsFromBinary(bin) {
    const clean = bin.padStart(32, '0').slice(0, 32);
    bitToggles.forEach((toggle, idx) => {
      const bit = clean[idx] === '1';
      toggle.classList.toggle('on', bit);
      toggle.textContent = bit ? '1' : '0';
    });
  }

  function getBitsBinary() {
    return bitToggles.map((toggle) => (toggle.classList.contains('on') ? '1' : '0')).join('');
  }

  function encode() {
    try {
      const val = Number(decEl.value);
      if (!Number.isFinite(val)) throw new Error('Inserisci un numero decimale valido.');
      const hex = floatToHex32(val);
      outputEl.textContent = `${val} -> 0x${hex}\n${describeBits(hex)}`;
      hexEl.value = hex;
      setBitsFromBinary(hexToBin(hex));
    } catch (err) {
      outputEl.textContent = err.message;
    }
  }

  function decode() {
    try {
      const val = hexToFloat32(hexEl.value);
      const hex = floatToHex32(val);
      outputEl.textContent = `${hexEl.value.trim()} -> ${hexToBin(hex)}\n${describeBits(hex)}\nValore: ${val}`;
      decEl.value = val;
      setBitsFromBinary(hexToBin(hex));
    } catch (err) {
      outputEl.textContent = err.message;
    }
  }

  function applyBits() {
    try {
      const bin = getBitsBinary();
      const hex = parseInt(bin, 2).toString(16).padStart(8, '0');
      hexEl.value = hex;
      const val = hexToFloat32(hex);
      decEl.value = val;
      outputEl.textContent = `${bin}\n${describeBits(hex)}\nValore: ${val}`;
    } catch (err) {
      outputEl.textContent = err.message;
    }
  }

  buildBitsUI();
  encBtn?.addEventListener('click', encode);
  decBtn?.addEventListener('click', decode);
  applyBitsBtn?.addEventListener('click', applyBits);
}

// ----- Service worker -----
function registerServiceWorker() {
  // Disabilitato: i service worker precedenti hanno causato blocchi.
  return;
}

async function clearServiceWorkersAndCaches() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch (err) {
    console.warn('SW unregister failed', err);
  }
  if (typeof caches !== 'undefined') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (err) {
      console.warn('Cache cleanup failed', err);
    }
  }
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
  initBaseConverter();
  initBinOps();
  initComplementTwo();
  initIeee754();
  clearServiceWorkersAndCaches().finally(() => {
    registerServiceWorker();
  });
  activatePage('studenti');
});
