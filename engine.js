(function (global) {
  'use strict';

  const FUNCTIONS = {
    sin: (x) => Math.sin(x),
    cos: (x) => Math.cos(x),
    tan: (x) => Math.tan(x),
    asin: (x) => Math.asin(x),
    acos: (x) => Math.acos(x),
    atan: (x) => Math.atan(x),
    ln: (x) => Math.log(x),
    log: (x) => Math.log10(x),
    sqrt: (x) => Math.sqrt(x),
    abs: (x) => Math.abs(x)
  };

  const FUNCTION_NAMES = Object.keys(FUNCTIONS).sort((a, b) => b.length - a.length);
  const TRIG = ['sin', 'cos', 'tan'];
  const INVERSE_TRIG = ['asin', 'acos', 'atan'];

  function tokenize(input) {
    const tokens = [];
    let i = 0;

    while (i < input.length) {
      const rest = input.slice(i);
      const ch = input[i];

      if (ch === ' ') {
        i += 1;
        continue;
      }

      const num = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (num) {
        tokens.push({ type: 'number', value: Number(num[0]) });
        i += num[0].length;
        continue;
      }

      const fn = FUNCTION_NAMES.find((name) => rest.startsWith(name));
      if (fn) {
        tokens.push({ type: 'function', name: fn });
        i += fn.length;
        continue;
      }

      if (ch === 'π') {
        tokens.push({ type: 'number', value: Math.PI });
        i += 1;
        continue;
      }

      if (ch === 'e') {
        tokens.push({ type: 'number', value: Math.E });
        i += 1;
        continue;
      }

      if (ch === '√') {
        tokens.push({ type: 'function', name: 'sqrt' });
        i += 1;
        continue;
      }

      if ('+−-×*÷/^%!()'.includes(ch)) {
        let type = ch;
        if (ch === '-') type = '−';
        if (ch === '*') type = '×';
        if (ch === '/') type = '÷';
        tokens.push({ type });
        i += 1;
        continue;
      }

      throw new Error('Unexpected character');
    }

    return tokens;
  }

  function factorial(value) {
    if (!Number.isInteger(value) || value < 0 || value > 170) {
      throw new Error('Invalid factorial');
    }
    let result = 1;
    for (let i = 2; i <= value; i += 1) result *= i;
    return result;
  }

  function applyFunction(name, argument, angle) {
    const fn = FUNCTIONS[name];
    if (!fn) throw new Error('Unknown function');

    let value = argument;
    if (angle === 'DEG' && TRIG.includes(name)) value = (value * Math.PI) / 180;

    let result = fn(value);

    if (angle === 'DEG' && INVERSE_TRIG.includes(name)) {
      result = (result * 180) / Math.PI;
    }

    if (Number.isNaN(result)) throw new Error('Undefined result');
    return result;
  }

  function evaluate(input, options) {
    const settings = options || {};
    const angle = settings.angle === 'RAD' ? 'RAD' : 'DEG';
    const tokens = tokenize(String(input));
    let pos = 0;

    const peek = () => tokens[pos];

    function parseExpression() {
      let value = parseTerm();
      while (peek() && (peek().type === '+' || peek().type === '−')) {
        const op = tokens[pos].type;
        pos += 1;
        const rhs = parseTerm();
        value = op === '+' ? value + rhs : value - rhs;
      }
      return value;
    }

    function parseTerm() {
      let value = parseUnary();
      while (peek()) {
        const token = peek();
        if (token.type === '×' || token.type === '÷') {
          pos += 1;
          const rhs = parseUnary();
          value = token.type === '×' ? value * rhs : value / rhs;
          continue;
        }
        if (token.type === 'number' || token.type === '(' || token.type === 'function') {
          value *= parseUnary();
          continue;
        }
        break;
      }
      return value;
    }

    function parseUnary() {
      const token = peek();
      if (token && (token.type === '−' || token.type === '+')) {
        pos += 1;
        const value = parseUnary();
        return token.type === '−' ? -value : value;
      }
      return parsePower();
    }

    function parsePower() {
      const base = parsePostfix();
      if (peek() && peek().type === '^') {
        pos += 1;
        return Math.pow(base, parseUnary());
      }
      return base;
    }

    function parsePostfix() {
      let value = parsePrimary();
      while (peek()) {
        if (peek().type === '%') {
          pos += 1;
          value /= 100;
          continue;
        }
        if (peek().type === '!') {
          pos += 1;
          value = factorial(value);
          continue;
        }
        break;
      }
      return value;
    }

    function parsePrimary() {
      const token = peek();
      if (!token) throw new Error('Incomplete expression');

      if (token.type === 'number') {
        pos += 1;
        return token.value;
      }

      if (token.type === '(') {
        pos += 1;
        const value = parseExpression();
        if (!peek() || peek().type !== ')') throw new Error('Missing parenthesis');
        pos += 1;
        return value;
      }

      if (token.type === 'function') {
        pos += 1;
        if (!peek() || peek().type !== '(') throw new Error('Missing function argument');
        pos += 1;
        const argument = parseExpression();
        if (!peek() || peek().type !== ')') throw new Error('Missing parenthesis');
        pos += 1;
        return applyFunction(token.name, argument, angle);
      }

      throw new Error('Unexpected token');
    }

    if (!tokens.length) throw new Error('Empty expression');

    const result = parseExpression();
    if (pos !== tokens.length) throw new Error('Unexpected token');
    if (!Number.isFinite(result)) throw new Error('Math error');
    return result;
  }

  function autoClose(input) {
    let open = 0;
    for (const ch of String(input)) {
      if (ch === '(') open += 1;
      else if (ch === ')') open = Math.max(0, open - 1);
    }
    return String(input) + ')'.repeat(open);
  }

  function format(value, options) {
    const settings = options || {};
    const grouping = settings.grouping !== false;

    if (typeof value !== 'number' || !Number.isFinite(value)) return 'Error';
    if (Object.is(value, -0)) value = 0;

    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) {
      return value
        .toExponential(8)
        .replace(/\.?0+e/, 'e')
        .replace('e+', 'e');
    }

    const str = String(Number(value.toPrecision(12)));
    if (str.includes('e')) return str.replace('e+', 'e');
    if (!grouping) return str;

    const parts = str.split('.');
    const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts[1] ? grouped + '.' + parts[1] : grouped;
  }

  const api = { evaluate, format, autoClose };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ClayEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
