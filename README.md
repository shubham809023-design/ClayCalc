# 🎨 ClayCalc

A soft, tactile 3D claymorphic scientific web calculator designed with modern aesthetics and robust mathematical precision.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Security](https://img.shields.io/badge/security-hardened-success.svg)

---

## ✨ Features

- **Soft Claymorphism 3D UI**: Delightful pastel tactile buttons and shadows with light and dark mode support.
- **Scientific Calculator Engine**:
  - Trigonometry: `sin`, `cos`, `tan`, `asin`, `acos`, `atan` (Degrees & Radians toggle)
  - Logarithms: Natural log (`ln`), Base-10 log (`log`)
  - Powers & Roots: Square root (`√`), exponents (`xʸ`, `x²`)
  - Constants: Pi (`π`), Euler's constant (`e`)
  - Factorials (`!`) & Percentages (`%`)
- **Calculation History**: Drawer panel with tap-to-reuse previous calculations.
- **Keyboard Shortcuts**: Complete desktop keyboard support (numeric keys, operators, Enter to calculate, Escape to clear, Backspace).
- **Audio / Haptic Feedback**: Subtle vibration on mobile touch for authentic tactile feel.
- **Responsive Design**: Adapts seamlessly to mobile phones, tablets, and desktop displays.

---

## 🔒 Security & Privacy

ClayCalc was built from the ground up with security and privacy as first-class citizens:

- **100% Client-Side**: No backend server required. Your calculations never leave your device.
- **Safe Parser**: Completely avoids `eval()` and `new Function()`. Powered by a custom recursive-descent AST tokenizer/evaluator.
- **Content Security Policy (CSP)**: Hardened headers to block malicious code injection and XSS.
- **Zero Trackers**: No analytics, no third-party cookies, and no tracking scripts.

---

## 🚀 Getting Started

### Local Setup

Simply clone the repository and open `index.html` in your web browser:

```bash
git clone https://github.com/shubham809023-design/ClayCalc.git
cd ClayCalc
```

Run with any lightweight local web server:

**Python 3:**
```bash
python3 -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

**Node.js:**
```bash
npx serve .
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0` - `9` | Digits |
| `+`, `-`, `*`, `/` | Basic Operators |
| `^` | Power |
| `(` and `)` | Parentheses |
| `Enter` or `=` | Calculate |
| `Escape` or `c` | Clear (AC) |
| `Backspace` | Delete last entry |
| `h` | Toggle History |
| `t` | Toggle Theme |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
