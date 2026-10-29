# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

- **No `eval()`**: ClayCalc uses a secure, custom recursive-descent mathematical parser without using JavaScript's `eval()` or `new Function()`.
- **Zero Remote Data Transmission**: All calculations and history are processed locally in your browser's memory and `localStorage`. No telemetry or user tracking.
- **Strict Content Security Policy (CSP)**: Protected against Cross-Site Scripting (XSS) and unauthorized external script injection.
- **Sanitized DOM**: UI rendering uses safe DOM properties (`textContent`) instead of arbitrary `innerHTML` injection.

## Reporting a Vulnerability

If you discover any security-related issues, please open an issue on the GitHub repository or contact the maintainer directly.
