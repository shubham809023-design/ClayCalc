(function () {
  'use strict';

  const Engine = window.ClayEngine;

  const STORAGE = {
    theme: 'claycalc.theme',
    angle: 'claycalc.angle',
    history: 'claycalc.history',
    sci: 'claycalc.sci'
  };

  const BINARY = new Set(['+', '−', '×', '÷', '^']);
  const UNARY_BEFORE = /[+×÷^(]$/;

  const el = {
    expression: document.getElementById('expression'),
    result: document.getElementById('result'),
    angleToggle: document.getElementById('angleToggle'),
    themeToggle: document.getElementById('themeToggle'),
    historyToggle: document.getElementById('historyToggle'),
    historyPanel: document.getElementById('historyPanel'),
    closeHistory: document.getElementById('closeHistory'),
    historyList: document.getElementById('historyList'),
    historyFoot: document.getElementById('historyFoot'),
    clearHistory: document.getElementById('clearHistory'),
    backdrop: document.getElementById('backdrop'),
    toast: document.getElementById('toast'),
    sciPad: document.getElementById('sciPad'),
    sciToggle: document.getElementById('sciToggle'),
    metaTheme: document.querySelector('meta[name="theme-color"]')
  };

  const state = {
    expr: '',
    justEvaluated: false,
    error: false,
    preview: 0,
    lastValue: 0,
    angle: 'DEG',
    history: []
  };

  let toastTimer = 0;

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      return;
    }
  }

  function haptic() {
    if (navigator.vibrate) navigator.vibrate(7);
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.toast.classList.remove('is-visible');
    }, 1700);
  }

  function clearError() {
    state.error = false;
  }

  function tryEvaluate(expr) {
    if (!expr) return null;
    try {
      return Engine.evaluate(Engine.autoClose(expr), { angle: state.angle });
    } catch (err) {
      return null;
    }
  }

  function renderResult(text, isError, raw) {
    el.result.textContent = text;
    el.result.classList.toggle('is-error', Boolean(isError));
    el.result.classList.toggle('is-long', !isError && text.length > 10 && text.length <= 14);
    el.result.classList.toggle('is-xlong', !isError && text.length > 14);
    el.result.dataset.raw = raw || text;
    el.result.scrollLeft = el.result.scrollWidth;
  }

  function refreshExpression() {
    el.expression.textContent = state.expr + (state.justEvaluated ? ' =' : '');
    el.expression.scrollLeft = el.expression.scrollWidth;
  }

  function refresh() {
    refreshExpression();

    if (state.error) {
      renderResult('Error', true, 'Error');
      return;
    }

    if (state.justEvaluated) {
      const raw = Engine.format(state.lastValue, { grouping: false });
      renderResult(Engine.format(state.lastValue), false, raw);
      return;
    }

    if (!state.expr) {
      state.preview = 0;
      renderResult('0', false, '0');
      return;
    }

    const value = tryEvaluate(state.expr);
    if (value !== null) state.preview = value;

    const raw = Engine.format(state.preview, { grouping: false });
    renderResult(Engine.format(state.preview), false, raw);
  }

  function popResult() {
    el.result.classList.remove('pop');
    void el.result.offsetWidth;
    el.result.classList.add('pop');
  }

  function shakeResult() {
    el.result.classList.remove('is-error');
    void el.result.offsetWidth;
    el.result.classList.add('is-error');
  }

  function insert(value) {
    clearError();

    if (state.justEvaluated) {
      if (BINARY.has(value) || value === '%') {
        state.expr = Engine.format(state.lastValue, { grouping: false }) + value;
        state.preview = state.lastValue;
        state.justEvaluated = false;
        refresh();
        return;
      }
      state.expr = '';
      state.preview = 0;
      state.justEvaluated = false;
    }

    if (value === '.') {
      const last = state.expr.slice(-1);
      if (/\d/.test(last)) {
        const tail = state.expr.split(/[+−×÷^()%]/).pop();
        if (tail.includes('.')) return;
        state.expr += '.';
      } else {
        state.expr += '0.';
      }
      refresh();
      return;
    }

    if (BINARY.has(value)) {
      if (!state.expr) {
        if (value === '−') state.expr = '−';
        refresh();
        return;
      }

      const last = state.expr.slice(-1);

      if (last === '(') {
        if (value === '−') state.expr += value;
        refresh();
        return;
      }

      if (last === '×' || last === '÷' || last === '^') {
        if (value === '−') state.expr += value;
        refresh();
        return;
      }

      if (BINARY.has(last)) {
        if (last === '−' && state.expr.length > 1) {
          const before = state.expr.slice(0, -1);
          if (/[×÷^]$/.test(before)) {
            state.expr = before.slice(0, -1) + (value === '−' ? '×−' : value);
            refresh();
            return;
          }
        }
        state.expr = state.expr.slice(0, -1) + value;
        refresh();
        return;
      }

      state.expr += value;
      refresh();
      return;
    }

    if (value === '%') {
      if (!state.expr) return;
      const last = state.expr.slice(-1);
      if (BINARY.has(last) || last === '(' || last === '.') return;
      state.expr += value;
      refresh();
      return;
    }

    if (value === ')') {
      const opens = (state.expr.match(/\(/g) || []).length;
      const closes = (state.expr.match(/\)/g) || []).length;
      if (opens <= closes) return;
      if (/[+−×÷^(.]$/.test(state.expr)) return;
    }

    if (value.endsWith('(') && state.expr.endsWith('.')) return;

    state.expr += value;
    refresh();
  }

  function deleteLast() {
    clearError();

    if (state.justEvaluated) {
      state.expr = Engine.format(state.lastValue, { grouping: false });
      state.preview = state.lastValue;
      state.justEvaluated = false;
    }

    if (!state.expr) {
      refresh();
      return;
    }

    const fnMatch = state.expr.match(/(?:asin|acos|atan|sin|cos|tan|ln|log|sqrt)\($/);
    if (fnMatch) {
      state.expr = state.expr.slice(0, -fnMatch[0].length);
    } else if (state.expr.endsWith('√(')) {
      state.expr = state.expr.slice(0, -2);
    } else if (state.expr.endsWith('^2')) {
      state.expr = state.expr.slice(0, -2);
    } else {
      state.expr = state.expr.slice(0, -1);
    }

    if (!state.expr) state.preview = 0;
    refresh();
  }

  function clearAll() {
    state.expr = '';
    state.justEvaluated = false;
    state.error = false;
    state.preview = 0;
    state.lastValue = 0;
    refresh();
  }

  function toggleSign() {
    clearError();

    if (state.justEvaluated) {
      state.lastValue = -state.lastValue;
      state.preview = state.lastValue;
      state.expr = Engine.format(state.lastValue, { grouping: false });
      state.justEvaluated = false;
      refresh();
      return;
    }

    if (!state.expr) {
      state.expr = '−';
      refresh();
      return;
    }

    const wrapped = state.expr.match(/\(−(\d+\.?\d*)\)$/);
    if (wrapped) {
      state.expr = state.expr.slice(0, wrapped.index) + wrapped[1];
      refresh();
      return;
    }

    const number = state.expr.match(/(\d+\.?\d*)$/);
    if (number) {
      const before = state.expr.slice(0, state.expr.length - number[0].length);
      state.expr = before + '(−' + number[0] + ')';
      refresh();
      return;
    }

    const last = state.expr.slice(-1);
    if (last === '−' && (state.expr.length === 1 || UNARY_BEFORE.test(state.expr.slice(0, -1)))) {
      state.expr = state.expr.slice(0, -1);
      refresh();
      return;
    }

    if (last === ')' || last === 'π' || last === 'e') {
      state.expr += '×(−1)';
    } else {
      state.expr += '(−';
    }
    refresh();
  }

  function equals() {
    if (!state.expr) return;
    clearError();

    try {
      const closed = Engine.autoClose(state.expr);
      const value = Engine.evaluate(closed, { angle: state.angle });
      state.expr = closed;
      state.lastValue = value;
      state.preview = value;
      state.justEvaluated = true;
      refresh();
      popResult();
      addHistory(state.expr, value);
    } catch (err) {
      state.error = true;
      state.justEvaluated = false;
      refresh();
      shakeResult();
    }
  }

  function copyResult() {
    if (state.error) return;
    const raw = el.result.dataset.raw || '0';

    const done = () => toast('Copied ' + raw);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(raw).then(done).catch(() => {
        fallbackCopy(raw);
        done();
      });
      return;
    }

    fallbackCopy(raw);
    done();
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      return;
    } finally {
      area.remove();
    }
  }

  function runAction(action) {
    if (action === 'clear') clearAll();
    else if (action === 'delete') deleteLast();
    else if (action === 'sign') toggleSign();
    else if (action === 'equals') equals();
  }

  function flash(selector) {
    const button = document.querySelector(selector);
    if (!button) return;
    button.classList.add('is-active');
    window.setTimeout(() => button.classList.remove('is-active'), 120);
  }

  function releaseFocus() {
    const active = document.activeElement;
    if (active && active !== document.body && typeof active.blur === 'function') {
      active.blur();
    }
  }

  function setAngle(mode, persist) {
    state.angle = mode === 'RAD' ? 'RAD' : 'DEG';
    el.angleToggle.textContent = state.angle;
    el.angleToggle.setAttribute(
      'aria-label',
      'Angle mode: ' + (state.angle === 'DEG' ? 'degrees' : 'radians')
    );
    if (persist) write(STORAGE.angle, state.angle);
    refresh();
  }

  function setSci(open, persist) {
    el.sciPad.classList.toggle('is-collapsed', !open);
    el.sciToggle.setAttribute('aria-expanded', String(open));
    if (persist) write(STORAGE.sci, open ? 'open' : 'closed');
  }

  function setTheme(theme, persist) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    el.themeToggle.setAttribute(
      'aria-label',
      dark ? 'Switch to light theme' : 'Switch to dark theme'
    );
    el.themeToggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    el.metaTheme.setAttribute('content', dark ? '#241b25' : '#efe3d6');
    if (persist) write(STORAGE.theme, dark ? 'dark' : 'light');
  }

  function setHistoryOpen(open) {
    const wasOpen = document.body.classList.contains('history-open');
    document.body.classList.toggle('history-open', open);
    el.historyToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      el.closeHistory.focus({ preventScroll: true });
      return;
    }
    if (wasOpen && el.historyPanel.contains(document.activeElement)) {
      el.historyToggle.focus({ preventScroll: true });
    }
  }

  function addHistory(expr, value) {
    const raw = Engine.format(value, { grouping: false });
    const last = state.history[0];
    if (last && last.expr === expr && last.value === raw) return;

    state.history.unshift({ expr, value: raw, at: Date.now() });
    state.history = state.history.slice(0, 40);
    write(STORAGE.history, JSON.stringify(state.history));
    renderHistory();
  }

  function renderHistory() {
    el.historyList.textContent = '';

    if (!state.history.length) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';

      const orb = document.createElement('span');
      orb.className = 'empty-orb';
      orb.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.textContent = 'No calculations yet. Your results will land here.';

      empty.append(orb, label);
      el.historyList.append(empty);
      el.historyFoot.hidden = true;
      return;
    }

    el.historyFoot.hidden = false;
    const fragment = document.createDocumentFragment();

    state.history.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'history-item';
      button.title = 'Use this result';

      const expr = document.createElement('span');
      expr.className = 'h-expr';
      expr.textContent = item.expr;

      const result = document.createElement('span');
      result.className = 'h-result';
      result.textContent = Engine.format(Number(item.value));

      button.append(expr, result);
      button.addEventListener('click', () => useHistory(index));
      fragment.append(button);
    });

    el.historyList.append(fragment);
  }

  function useHistory(index) {
    const item = state.history[index];
    if (!item) return;

    const value = Number(item.value);
    state.expr = Engine.format(value, { grouping: false });
    state.preview = value;
    state.lastValue = value;
    state.justEvaluated = true;
    state.error = false;
    refresh();
    popResult();
    setHistoryOpen(false);
    toast('Result loaded');
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(read(STORAGE.history, '[]'));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item) =>
            item &&
            typeof item.expr === 'string' &&
            Number.isFinite(Number(item.value))
        )
        .slice(0, 40);
    } catch (err) {
      return [];
    }
  }

  document.querySelectorAll('[data-insert]').forEach((button) => {
    button.addEventListener('click', () => {
      haptic();
      insert(button.dataset.insert);
    });
  });

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      haptic();
      runAction(button.dataset.action);
    });
  });

  el.angleToggle.addEventListener('click', () => {
    setAngle(state.angle === 'DEG' ? 'RAD' : 'DEG', true);
    toast(state.angle === 'DEG' ? 'Degrees' : 'Radians');
  });

  el.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark', true);
  });

  el.sciToggle.addEventListener('click', () => {
    const open = el.sciPad.classList.contains('is-collapsed');
    setSci(open, true);
  });

  el.historyToggle.addEventListener('click', () => {
    setHistoryOpen(!document.body.classList.contains('history-open'));
  });

  el.closeHistory.addEventListener('click', () => setHistoryOpen(false));
  el.backdrop.addEventListener('click', () => setHistoryOpen(false));

  el.clearHistory.addEventListener('click', () => {
    if (!state.history.length) return;
    state.history = [];
    write(STORAGE.history, '[]');
    renderHistory();
    toast('History cleared');
  });

  document.addEventListener('click', (event) => {
    if (event.detail <= 0) return;
    const button = event.target && event.target.closest ? event.target.closest('button') : null;
    if (button) button.blur();
  });

  el.result.addEventListener('click', copyResult);

  el.result.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      copyResult();
    }
  });

  el.result.addEventListener('animationend', (event) => {
    if (event.animationName === 'pop') el.result.classList.remove('pop');
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;
    const target = event.target;

    if ((key === 'Enter' || key === ' ') && target && target.closest && target.closest('button')) {
      return;
    }

    if (key === 'Enter' || key === '=') {
      event.preventDefault();
      releaseFocus();
      equals();
      flash('[data-action="equals"]');
      return;
    }

    if (key === 'Backspace') {
      event.preventDefault();
      releaseFocus();
      deleteLast();
      flash('[data-action="delete"]');
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      releaseFocus();
      if (document.body.classList.contains('history-open')) {
        setHistoryOpen(false);
        return;
      }
      clearAll();
      flash('[data-action="clear"]');
      return;
    }

    if (key === 'Delete') {
      event.preventDefault();
      releaseFocus();
      clearAll();
      flash('[data-action="clear"]');
      return;
    }

    const map = {
      '+': '+',
      '-': '−',
      '*': '×',
      '/': '÷',
      x: '×',
      X: '×',
      '^': '^',
      '%': '%',
      '(': '(',
      ')': ')',
      '.': '.',
      ',': '.'
    };

    if (/^[0-9]$/.test(key)) {
      releaseFocus();
      insert(key);
      flash('[data-insert="' + key + '"]');
      return;
    }

    if (map[key]) {
      event.preventDefault();
      releaseFocus();
      insert(map[key]);
      flash('[data-insert="' + map[key] + '"]');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) setHistoryOpen(false);
  });

  state.angle = read(STORAGE.angle, 'DEG') === 'RAD' ? 'RAD' : 'DEG';
  state.history = loadHistory();
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', false);
  setAngle(state.angle, false);
  setSci(read(STORAGE.sci, 'open') !== 'closed', false);
  renderHistory();
  refresh();
})();
