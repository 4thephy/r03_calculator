/* ==========================================================================
   Smart Neuro Calculator - Main Javascript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const displayInput = document.getElementById('display-input');
  const displayPreview = document.getElementById('display-preview');
  
  const tabButtons = document.querySelectorAll('.tab-btn');
  const workspaceViews = document.querySelectorAll('.workspace-view');
  const scientificPad = document.getElementById('scientific-pad');
  
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const historyToggleBtn = document.getElementById('history-toggle-btn');
  const historySidebar = document.getElementById('history-sidebar');
  const historyList = document.getElementById('history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const toggleAngleBtn = document.getElementById('toggle-angle');

  // --- Graphing Elements ---
  const canvas = document.getElementById('graph-canvas');
  const ctx = canvas.getContext('2d');
  const fn1Input = document.getElementById('fn1-input');
  const fn2Input = document.getElementById('fn2-input');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const graphTooltip = document.getElementById('graph-tooltip');

  // --- Unit Converter Elements ---
  const converterCategories = document.querySelectorAll('.conv-cat-btn');
  const convInputVal = document.getElementById('converter-input-val');
  const convOutputVal = document.getElementById('converter-output-val');
  const convInputUnit = document.getElementById('converter-input-unit');
  const convOutputUnit = document.getElementById('converter-output-unit');

  // --- Financial Elements ---
  const finTabButtons = document.querySelectorAll('.fin-tab-btn');
  const finSubViews = document.querySelectorAll('.fin-sub-view');
  
  const savPrincipal = document.getElementById('sav-principal');
  const savRate = document.getElementById('sav-rate');
  const savPeriod = document.getElementById('sav-period');
  const savPeriodUnit = document.getElementById('sav-period-unit');
  const savCompound = document.getElementById('sav-compound');
  const savTax = document.getElementById('sav-tax');
  
  const savOutPrincipal = document.getElementById('sav-out-principal');
  const savOutInterestPre = document.getElementById('sav-out-interest-pre');
  const savOutTax = document.getElementById('sav-out-tax');
  const savOutTotal = document.getElementById('sav-out-total');

  const loanPrincipal = document.getElementById('loan-principal');
  const loanRate = document.getElementById('loan-rate');
  const loanPeriod = document.getElementById('loan-period');
  const loanRepayType = document.getElementById('loan-repay-type');
  
  const loanOutPrincipal = document.getElementById('loan-out-principal');
  const loanOutInterest = document.getElementById('loan-out-interest');
  const loanOutTotal = document.getElementById('loan-out-total');
  const loanAmortBody = document.getElementById('loan-amort-body');

  // --- Programmer Elements ---
  const progBaseRows = document.querySelectorAll('.prog-base-row');
  const progValHex = document.getElementById('prog-val-hex');
  const progValDec = document.getElementById('prog-val-dec');
  const progValOct = document.getElementById('prog-val-oct');
  const progValBin = document.getElementById('prog-val-bin');
  const progButtons = document.querySelectorAll('.programmer-keypad button');

  // --- Application State ---
  let appMode = 'standard'; // standard, scientific, graphing, converter
  let currentTheme = 'dark';
  let angleMode = 'RAD'; // RAD, DEG
  let historyData = [];
  let isHistoryOpen = true;

  // Real-time expression editing buffer
  let expressionBuffer = '';

  // Programmer Mode variables
  let progInputExpr = '';
  let progActiveBase = 'DEC'; // HEX, DEC, OCT, BIN

  // --- Math Constants & Helper Functions for Sandbox Evaluator ---
  const MathScope = {
    PI: Math.PI,
    E: Math.E,
    sin: (x) => angleMode === 'DEG' ? Math.sin(x * Math.PI / 180) : Math.sin(x),
    cos: (x) => angleMode === 'DEG' ? Math.cos(x * Math.PI / 180) : Math.cos(x),
    tan: (x) => angleMode === 'DEG' ? Math.tan(x * Math.PI / 180) : Math.tan(x),
    asin: (x) => angleMode === 'DEG' ? Math.asin(x) * 180 / Math.PI : Math.asin(x),
    acos: (x) => angleMode === 'DEG' ? Math.acos(x) * 180 / Math.PI : Math.acos(x),
    atan: (x) => angleMode === 'DEG' ? Math.atan(x) * 180 / Math.PI : Math.atan(x),
    log: (x) => Math.log10(x),
    ln: (x) => Math.log(x),
    sqrt: (x) => Math.sqrt(x),
    abs: (x) => Math.abs(x),
    pow: (x, y) => Math.pow(x, y),
    mod: (x, y) => x % y,
    fact: (n) => {
      if (n < 0 || !Number.isInteger(n)) return NaN;
      if (n === 0 || n === 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return result;
    }
  };

  // --- Load Initial State ---
  function init() {
    // 1. History loading
    const savedHistory = localStorage.getItem('calc_history');
    if (savedHistory) {
      historyData = JSON.parse(savedHistory);
      renderHistory();
    }

    // 2. Theme loading
    const savedTheme = localStorage.getItem('calc_theme');
    if (savedTheme) {
      currentTheme = savedTheme;
      document.body.className = `${currentTheme}-theme`;
    }

    // 3. Initialize Unit Converter dropdowns
    setupConverter('length');

    // 4. Initialize Graphing canvas size
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      if (appMode === 'graphing') drawGraph();
    });

    // 5. Initialize Financial calculations
    runSavingsCalculation();
    runLoanCalculation();

    // 6. Initialize Programmer settings
    updateProgrammerKeys();
    runProgrammerCalculation();

    // 7. Setup event handlers
    setupEventBindings();
  }

  // --- Theme Toggle ---
  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.className = `${currentTheme}-theme`;
    localStorage.setItem('calc_theme', currentTheme);
    if (appMode === 'graphing') drawGraph(); // Redraw with new theme colors
  }

  // --- Mode Toggle ---
  function setMode(mode) {
    appMode = mode;
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    // Handle view element activations
    workspaceViews.forEach(view => {
      const isKeyView = (mode === 'standard' || mode === 'scientific') && view.id === 'keyboard-view';
      const isMatch = view.id === `${mode}-view` || isKeyView;
      view.classList.toggle('active', isMatch);
    });

    // Scientific mode keyboard configuration
    if (mode === 'scientific') {
      scientificPad.classList.remove('hidden');
    } else if (mode === 'standard') {
      scientificPad.classList.add('hidden');
    }

    // Graph drawing trigger
    if (mode === 'graphing') {
      setTimeout(() => {
        resizeCanvas();
        drawGraph();
      }, 50); // slight delay to let DOM render
    }

    // Toggle active screen display format
    if (mode === 'programmer') {
      displayPreview.textContent = '';
      updateProgrammerKeys();
      runProgrammerCalculation();
    } else {
      updateDisplay();
    }
  }

  // --- Custom Ripple Effect ---
  function createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    
    // Support mouse click coordinates and standard layouts
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    circle.style.width = circle.style.height = `${diameter}px`;
    if (clientX && clientY) {
      circle.style.left = `${clientX - rect.left - radius}px`;
      circle.style.top = `${clientY - rect.top - radius}px`;
    } else {
      circle.style.left = `${button.clientWidth / 2 - radius}px`;
      circle.style.top = `${button.clientHeight / 2 - radius}px`;
    }
    
    circle.classList.add('btn-ripple');

    const ripple = button.getElementsByClassName('btn-ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  }

  // --- Calculator Logic & Safe Parsing ---
  function handleInput(val) {
    if (val === 'clear') {
      expressionBuffer = '';
      updateDisplay();
    } else if (val === 'backspace') {
      // Handle deletions of multi-char functions like "sin(", "cos(", etc.
      const match = expressionBuffer.match(/(sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|log\(|ln\(|sqrt\()$/);
      if (match) {
        expressionBuffer = expressionBuffer.slice(0, -match[0].length);
      } else {
        expressionBuffer = expressionBuffer.slice(0, -1);
      }
      updateDisplay();
    } else if (val === '()') {
      // Smart parentheses logic
      const openCount = (expressionBuffer.match(/\(/g) || []).length;
      const closeCount = (expressionBuffer.match(/\)/g) || []).length;
      const lastChar = expressionBuffer.slice(-1);

      if (openCount > closeCount && !isNaN(lastChar) && lastChar !== '(') {
        expressionBuffer += ')';
      } else {
        // If last char is a digit, insert implicit multiplication
        if (lastChar && (!isNaN(lastChar) || lastChar === ')' || lastChar === 'π' || lastChar === 'e')) {
          expressionBuffer += '*(';
        } else {
          expressionBuffer += '(';
        }
      }
      updateDisplay();
    } else if (val === 'neg') {
      // Toggle negation on last number
      toggleNegation();
    } else if (val === 'equals') {
      evaluateFinal();
    } else if (val === 'rad-deg') {
      angleMode = angleMode === 'RAD' ? 'DEG' : 'RAD';
      toggleAngleBtn.textContent = angleMode;
      updateDisplay();
    } else {
      // Scientific operator parsing
      let appendStr = val;
      const lastChar = expressionBuffer.slice(-1);

      // Pre-formatting scientific functions to open parenthesis
      if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt'].includes(val)) {
        if (lastChar && (!isNaN(lastChar) || lastChar === ')' || lastChar === 'π' || lastChar === 'e')) {
          appendStr = '*' + val + '(';
        } else {
          appendStr = val + '(';
        }
      } else if (val === 'π' || val === 'e') {
        if (lastChar && (!isNaN(lastChar) || lastChar === ')' || lastChar === 'π' || lastChar === 'e')) {
          appendStr = '*' + val;
        }
      } else if (!isNaN(val) || val === '.') {
        // Insert multiplication between constants/parentheses and numbers
        if (lastChar === ')' || lastChar === 'π' || lastChar === 'e') {
          appendStr = '*' + val;
        }
      }

      expressionBuffer += appendStr;
      updateDisplay();
    }
  }

  function toggleNegation() {
    // Find the last number in buffer and toggle its sign
    const regex = /(\b\d+(\.\d+)?\b|\bπ\b|\be\b)$/;
    const match = expressionBuffer.match(regex);
    if (match) {
      const lastNumIndex = expressionBuffer.lastIndexOf(match[0]);
      const prevChar = expressionBuffer.charAt(lastNumIndex - 1);
      if (prevChar === '-') {
        // Replace subtraction or negative sign
        // If it's a negative sign like (-5), remove minus
        expressionBuffer = expressionBuffer.slice(0, lastNumIndex - 1) + expressionBuffer.slice(lastNumIndex);
      } else if (prevChar === '+') {
        expressionBuffer = expressionBuffer.slice(0, lastNumIndex - 1) + '-' + expressionBuffer.slice(lastNumIndex);
      } else {
        // Insert a negative marker
        expressionBuffer = expressionBuffer.slice(0, lastNumIndex) + '-' + expressionBuffer.slice(lastNumIndex);
      }
    } else {
      // Just start a negative sign if screen is empty or ends with operator
      expressionBuffer += '-';
    }
    updateDisplay();
  }

  // --- Real-time Expression Display Formatter ---
  function formatExpression(expr) {
    if (!expr) return '0';
    return expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/-/g, '−')
      .replace(/\bMath\./g, '');
  }

  function updateDisplay() {
    displayInput.textContent = formatExpression(expressionBuffer) || '0';
    
    // Live calculation preview
    if (!expressionBuffer) {
      displayPreview.textContent = '';
      return;
    }

    try {
      const parsed = translateToJs(expressionBuffer);
      const result = runSandboxEval(parsed);
      if (result !== undefined && !isNaN(result)) {
        // Clean trailing zeros and handle rounding errors gracefully
        const rounded = parseFloat(result.toFixed(10));
        displayPreview.textContent = `= ${rounded}`;
      } else {
        displayPreview.textContent = '';
      }
    } catch (e) {
      // Silent error during active typing preview
      displayPreview.textContent = '';
    }
  }

  // Helper to ensure parentheses are balanced during preview
  function autoCloseParentheses(expr) {
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    let balanced = expr;
    if (openCount > closeCount) {
      balanced += ')'.repeat(openCount - closeCount);
    }
    return balanced;
  }

  // Safe JS conversion mapping
  function translateToJs(expr) {
    let raw = autoCloseParentheses(expr);

    // 1. Pre-insert multiplication for cases like 2(3) -> 2*(3)
    raw = raw.replace(/(\d)(\()/g, '$1*$2');
    raw = raw.replace(/(\))(\d)/g, '$1*$2');
    raw = raw.replace(/(\))(\()/g, '$1*$2');

    // 2. Constants matching
    raw = raw.replace(/π/g, 'PI');
    raw = raw.replace(/e/g, 'E');

    // 3. Exponents translation (e.g. x^y to x**y)
    raw = raw.replace(/\^/g, '**');

    // 4. Factorial matching
    // Finds instances like 5! and wraps as fact(5)
    // Matches simple numbers or brackets
    raw = raw.replace(/(\b\d+(?:\.\d+)?|\bPI\b|\bE\b|\([^)]+\))!/g, 'fact($1)');

    return raw;
  }

  // Evaluates standard mathematical input in a safe, sandboxed wrapper
  function runSandboxEval(jsCode) {
    // Basic structural security sanity check
    if (/[^0-9\+\-\*\/\(\)\.\s,a-zA-Z!%]/g.test(jsCode)) {
      return NaN;
    }

    try {
      // Evaluate in defined MathScope context
      const scopeKeys = Object.keys(MathScope);
      const scopeValues = Object.values(MathScope);
      const runner = new Function(...scopeKeys, `return (${jsCode});`);
      return runner(...scopeValues);
    } catch (err) {
      return NaN;
    }
  }

  function evaluateFinal() {
    if (!expressionBuffer) return;

    try {
      const parsed = translateToJs(expressionBuffer);
      const result = runSandboxEval(parsed);
      
      if (result !== undefined && !isNaN(result) && result !== Infinity && result !== -Infinity) {
        const finalResult = parseFloat(result.toFixed(10));
        
        // Add to history
        addHistoryEntry(expressionBuffer, finalResult);

        // Set result as new input
        expressionBuffer = finalResult.toString();
        displayInput.textContent = formatExpression(expressionBuffer);
        displayPreview.textContent = '';
      } else {
        shakeDisplay();
      }
    } catch (e) {
      shakeDisplay();
    }
  }

  function shakeDisplay() {
    displayInput.classList.add('error-shake');
    setTimeout(() => {
      displayInput.classList.remove('error-shake');
    }, 400);
  }

  // --- Calculation History Manager ---
  function addHistoryEntry(expr, result) {
    const entry = {
      id: Date.now(),
      expr: expr,
      result: result
    };
    historyData.unshift(entry);
    
    // Cap history limit
    if (historyData.length > 30) {
      historyData.pop();
    }

    localStorage.setItem('calc_history', JSON.stringify(historyData));
    renderHistory();
  }

  function renderHistory() {
    if (historyData.length === 0) {
      historyList.innerHTML = '<div class="empty-history">계산 기록이 없습니다.</div>';
      return;
    }

    historyList.innerHTML = historyData.map(item => `
      <div class="history-card" data-expr="${item.expr}" data-result="${item.result}">
        <div class="history-expr">${formatExpression(item.expr)} =</div>
        <div class="history-result">${item.result}</div>
      </div>
    `).join('');

    // Attach click events to history items
    const cards = historyList.querySelectorAll('.history-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        // Load the calculation expression or result into editor
        expressionBuffer = card.getAttribute('data-expr');
        updateDisplay();
      });
    });
  }

  function clearHistory() {
    historyData = [];
    localStorage.removeItem('calc_history');
    renderHistory();
  }

  // --- Graphing Engine & Math Coordinate Space ---
  // Coordinate boundaries
  let xMin = -10;
  let xMax = 10;
  let yMin = -10;
  let yMax = 10;

  let isPanning = false;
  let startX, startY;

  function resizeCanvas() {
    const container = canvas.parentElement;
    // Set actual canvas resolution matching display size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  // Custom function evaluator mapping variable 'x'
  function evaluateFunction(expr, xValue) {
    try {
      // Safely replace standard mathematical functions for evaluation context
      let raw = expr
        .replace(/x/g, `(${xValue})`)
        .replace(/π/g, 'PI')
        .replace(/e/g, 'E')
        .replace(/\^/g, '**');

      // Expand implicit multiplications (e.g. 2x -> 2*x)
      raw = raw.replace(/(\d)(\()/g, '$1*$2');
      raw = raw.replace(/(\))(\d)/g, '$1*$2');

      const scopeKeys = Object.keys(MathScope);
      const scopeValues = Object.values(MathScope);
      const runner = new Function(...scopeKeys, `return (${raw});`);
      return runner(...scopeValues);
    } catch (e) {
      return NaN;
    }
  }

  function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    // Convert Math coordinates to pixels
    const toScreenX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Convert Pixels to Math coordinates
    const toMathX = (px) => xMin + (px / width) * (xMax - xMin);
    const toMathY = (py) => yMax - (py / height) * (yMax - yMin);

    // Theme adaptive colors
    const isDark = currentTheme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
    const axisColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.35)';
    const labelColor = isDark ? '#9590ad' : '#6f6a8a';

    // 1. Draw Grid Lines
    ctx.lineWidth = 1;
    
    // Choose appropriate step intervals
    const rangeX = xMax - xMin;
    let step = 1;
    if (rangeX > 50) step = 10;
    if (rangeX > 200) step = 50;
    if (rangeX < 5) step = 0.5;
    if (rangeX < 1) step = 0.1;

    // Vertical Grid Lines
    const startGridX = Math.floor(xMin / step) * step;
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = labelColor;
    ctx.font = '10px Fira Code';
    ctx.textAlign = 'center';
    
    for (let x = startGridX; x <= xMax; x += step) {
      const px = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      // Labels on horizontal axis
      if (Math.abs(x) > 0.0001) {
        const py = toScreenY(0);
        // Clamp labels near center edge
        const labelY = Math.max(15, Math.min(height - 5, py + 12));
        ctx.fillText(x.toFixed(1).replace('.0', ''), px, labelY);
      }
    }

    // Horizontal Grid Lines
    const startGridY = Math.floor(yMin / step) * step;
    ctx.textAlign = 'right';
    for (let y = startGridY; y <= yMax; y += step) {
      const py = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      // Labels on vertical axis
      if (Math.abs(y) > 0.0001) {
        const px = toScreenX(0);
        const labelX = Math.max(5, Math.min(width - 5, px - 8));
        ctx.fillText(y.toFixed(1).replace('.0', ''), labelX, py + 3);
      }
    }

    // 2. Draw Main Origin Axes
    ctx.lineWidth = 2;
    ctx.strokeStyle = axisColor;
    
    // Y-Axis
    const pxZero = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(pxZero, 0);
    ctx.lineTo(pxZero, height);
    ctx.stroke();

    // X-Axis
    const pyZero = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, pyZero);
    ctx.lineTo(width, pyZero);
    ctx.stroke();

    // Origin label '0'
    ctx.fillText('0', pxZero - 8, pyZero + 12);

    // 3. Plot Function Curves
    const drawCurve = (expr, color) => {
      if (!expr.trim()) return;

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;

      let firstPoint = true;

      // Draw continuous line across canvas columns
      for (let px = 0; px <= width; px++) {
        const mx = toMathX(px);
        const my = evaluateFunction(expr, mx);

        if (!isNaN(my) && isFinite(my)) {
          const py = toScreenY(my);
          
          // Prevent wild spikes off the grid window boundary
          if (py >= -100 && py <= height + 100) {
            if (firstPoint) {
              ctx.moveTo(px, py);
              firstPoint = false;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            firstPoint = true; // disconnect curve segment
          }
        } else {
          firstPoint = true; // disconnect on asymptotes
        }
      }
      ctx.stroke();
    };

    drawCurve(fn1Input.value, '#00f0ff');
    drawCurve(fn2Input.value, '#ff007f');
  }

  // --- Zoom Controllers ---
  function zoom(factor) {
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const dx = (xMax - xMin) * factor;
    const dy = (yMax - yMin) * factor;

    xMin = cx - dx / 2;
    xMax = cx + dx / 2;
    yMin = cy - dy / 2;
    yMax = cy + dy / 2;

    drawGraph();
  }

  function resetZoom() {
    xMin = -10;
    xMax = 10;
    yMin = -10;
    yMax = 10;
    drawGraph();
  }

  // --- Interactive Canvas Mouse Coordinates & Panning ---
  canvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    
    // Pixel to coordinates
    const mx = xMin + (px / width) * (xMax - xMin);
    const my = yMax - (py / height) * (yMax - yMin);

    if (isPanning) {
      const dxPixels = e.clientX - startX;
      const dyPixels = e.clientY - startY;

      const dxMath = (dxPixels / width) * (xMax - xMin);
      const dyMath = (dyPixels / height) * (yMax - yMin);

      xMin -= dxMath;
      xMax -= dxMath;
      yMin += dyMath;
      yMax += dyMath;

      startX = e.clientX;
      startY = e.clientY;

      drawGraph();
    } else {
      // Dynamic tooltip coordinates tracing
      let tooltipContent = '';
      
      // Match active functions near cursor
      const checkDistance = (expr, colorName) => {
        if (!expr.trim()) return null;
        const fy = evaluateFunction(expr, mx);
        if (!isNaN(fy) && isFinite(fy)) {
          // If the cursor is close to the function curve, highlight
          const distance = Math.abs(my - fy);
          if (distance < (yMax - yMin) * 0.05) {
            return `<span style="color:${colorName}">y: ${fy.toFixed(3)}</span>`;
          }
        }
        return null;
      };

      const match1 = checkDistance(fn1Input.value, '#00f0ff');
      const match2 = checkDistance(fn2Input.value, '#ff007f');

      if (match1 || match2) {
        tooltipContent = `x: ${mx.toFixed(3)}<br>` + [match1, match2].filter(Boolean).join('<br>');
        graphTooltip.style.display = 'block';
        graphTooltip.style.left = `${px + 15}px`;
        graphTooltip.style.top = `${py + 15}px`;
        graphTooltip.innerHTML = tooltipContent;
      } else {
        graphTooltip.style.display = 'none';
      }
    }
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    zoom(factor);
  });

  // --- Unit Converter Formula Matrix ---
  const conversionFactors = {
    length: {
      m: 1,
      km: 0.001,
      cm: 100,
      mm: 1000,
      mile: 0.000621371,
      yard: 1.09361,
      foot: 3.28084,
      inch: 39.3701
    },
    weight: {
      kg: 1,
      g: 1000,
      lb: 2.20462,
      oz: 35.274,
      ton: 0.001
    },
    temperature: {
      // Handled with functional converters
      custom: true,
      units: ['C', 'F', 'K'],
      convert: (val, from, to) => {
        let tempInC;
        if (from === 'C') tempInC = val;
        else if (from === 'F') tempInC = (val - 32) * 5/9;
        else if (from === 'K') tempInC = val - 273.15;

        if (to === 'C') return tempInC;
        else if (to === 'F') return (tempInC * 9/5) + 32;
        else if (to === 'K') return tempInC + 273.15;
      }
    },
    area: {
      m2: 1,
      km2: 0.000001,
      acre: 0.000247105,
      hectare: 0.0001,
      ft2: 10.7639,
      inch2: 1550
    },
    speed: {
      'm/s': 1,
      'km/h': 3.6,
      mph: 2.23694,
      knot: 1.94384
    }
  };

  const koreanLabels = {
    m: '미터 (m)', km: '킬로미터 (km)', cm: '센티미터 (cm)', mm: '밀리미터 (mm)', mile: '마일 (mile)', yard: '야드 (yard)', foot: '피트 (ft)', inch: '인치 (in)',
    kg: '킬로그램 (kg)', g: '그램 (g)', lb: '파운드 (lb)', oz: '온스 (oz)', ton: '톤 (ton)',
    C: '섭씨 (°C)', F: '화씨 (°F)', K: '캘빈 (K)',
    m2: '제곱미터 (㎡)', km2: '제곱킬로미터 (㎢)', acre: '에이커 (acre)', hectare: '헥타르 (ha)', ft2: '제곱피트 (ft²)', inch2: '제곱인치 (in²)',
    'm/s': '미터/초 (m/s)', 'km/h': '킬로미터/시 (km/h)', mph: '마일/시 (mph)', knot: '노트 (kn)'
  };

  let activeCategory = 'length';

  function setupConverter(category) {
    activeCategory = category;
    
    // Clear units selector
    convInputUnit.innerHTML = '';
    convOutputUnit.innerHTML = '';

    const catData = conversionFactors[category];
    const units = catData.custom ? catData.units : Object.keys(catData);

    units.forEach(unit => {
      const label = koreanLabels[unit] || unit;
      convInputUnit.add(new Option(label, unit));
      convOutputUnit.add(new Option(label, unit));
    });

    // Pick first and second elements by default
    if (convInputUnit.options.length > 0) convInputUnit.selectedIndex = 0;
    if (convOutputUnit.options.length > 1) convOutputUnit.selectedIndex = 1;

    runUnitConversion();
  }

  function runUnitConversion() {
    const inputVal = parseFloat(convInputVal.value);
    if (isNaN(inputVal)) {
      convOutputVal.value = '';
      return;
    }

    const fromUnit = convInputUnit.value;
    const toUnit = convOutputUnit.value;
    const catData = conversionFactors[activeCategory];

    let result;
    if (catData.custom) {
      result = catData.convert(inputVal, fromUnit, toUnit);
    } else {
      // Standard conversion: convert to baseline (1) then to target unit
      const valInBaseline = inputVal / catData[fromUnit];
      result = valInBaseline * catData[toUnit];
    }

    convOutputVal.value = parseFloat(result.toFixed(6));
  }

  // --- Keyboard Bindings setup ---
  function setupEventBindings() {
    // Mode Switch clicks
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setMode(btn.getAttribute('data-mode'));
      });
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // History Toggle
    historyToggleBtn.addEventListener('click', () => {
      isHistoryOpen = !isHistoryOpen;
      historySidebar.classList.toggle('collapsed', !isHistoryOpen);
      historyToggleBtn.classList.toggle('active', isHistoryOpen);
    });

    // Calculator keyboard button clicks
    const keyButtons = document.querySelectorAll('.keyboard-grid button');
    keyButtons.forEach(btn => {
      // Support click events
      btn.addEventListener('click', (e) => {
        createRipple(e, btn);
        const value = btn.getAttribute('data-val');
        handleInput(value);
      });
    });

    // Graph Inputs change hooks
    fn1Input.addEventListener('input', drawGraph);
    fn2Input.addEventListener('input', drawGraph);

    // Zoom Buttons
    btnZoomIn.addEventListener('click', () => zoom(0.8));
    btnZoomOut.addEventListener('click', () => zoom(1.2));
    btnZoomReset.addEventListener('click', resetZoom);

    // Converter category switchers
    converterCategories.forEach(btn => {
      btn.addEventListener('click', () => {
        converterCategories.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setupConverter(btn.getAttribute('data-cat'));
      });
    });

    // Converter input changes
    convInputVal.addEventListener('input', runUnitConversion);
    convInputUnit.addEventListener('change', runUnitConversion);
    convOutputUnit.addEventListener('change', runUnitConversion);

    // Financial tabs switcher
    finTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        finTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const activeSub = btn.getAttribute('data-fin');
        finSubViews.forEach(view => {
          view.classList.toggle('active', view.id === `fin-${activeSub}-view`);
        });
        
        if (activeSub === 'savings') runSavingsCalculation();
        else runLoanCalculation();
      });
    });

    // Financial input change hooks (Savings)
    savPrincipal.addEventListener('input', runSavingsCalculation);
    savRate.addEventListener('input', runSavingsCalculation);
    savPeriod.addEventListener('input', runSavingsCalculation);
    savPeriodUnit.addEventListener('change', runSavingsCalculation);
    savCompound.addEventListener('change', runSavingsCalculation);
    savTax.addEventListener('change', runSavingsCalculation);

    // Financial input change hooks (Loan)
    loanPrincipal.addEventListener('input', runLoanCalculation);
    loanRate.addEventListener('input', runLoanCalculation);
    loanPeriod.addEventListener('input', runLoanCalculation);
    loanRepayType.addEventListener('change', runLoanCalculation);

    // History clear trigger
    btnClearHistory.addEventListener('click', clearHistory);

    // Programmer base indicator click hooks
    progBaseRows.forEach(row => {
      row.addEventListener('click', () => {
        const targetBase = row.getAttribute('data-base');
        if (targetBase === progActiveBase) return;
        switchProgrammerBase(targetBase);
      });
    });

    // Programmer keypad click hooks
    const progKeyButtons = document.querySelectorAll('.programmer-keypad button');
    progKeyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        createRipple(e, btn);
        const val = btn.getAttribute('data-prog-val');
        handleProgrammerInput(val);
      });
    });

    // Physical Keyboard typing support
    document.addEventListener('keydown', (e) => {
      // Ignore keyboard shortcuts when user typing function expressions or converter fields
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
        return;
      }

      const key = e.key;

      if (appMode === 'programmer') {
        const upperKey = key.toUpperCase();
        const isHexLetter = ['A', 'B', 'C', 'D', 'E', 'F'].includes(upperKey);
        const isDigit = key >= '0' && key <= '9';
        
        let valid = false;
        if (isDigit) {
          if (progActiveBase === 'BIN' && (key === '0' || key === '1')) valid = true;
          else if (progActiveBase === 'OCT' && key >= '0' && key <= '7') valid = true;
          else if (progActiveBase === 'DEC' || progActiveBase === 'HEX') valid = true;
        } else if (isHexLetter && progActiveBase === 'HEX') {
          valid = true;
        }

        if (valid) {
          handleProgrammerInput(upperKey);
        } else if (key === '+') {
          handleProgrammerInput('+');
        } else if (key === '-') {
          handleProgrammerInput('-');
        } else if (key === '*') {
          handleProgrammerInput('*');
        } else if (key === '/') {
          handleProgrammerInput('/');
        } else if (key === 'Enter' || key === '=') {
          e.preventDefault();
          const equalsBtn = document.getElementById('prog-btn-equals');
          createRipple(e, equalsBtn);
          handleProgrammerInput('equals');
        } else if (key === 'Backspace') {
          handleProgrammerInput('backspace');
        } else if (key === 'Escape' || key === 'Delete') {
          handleProgrammerInput('clear');
        }
        return;
      }

      if (key >= '0' && key <= '9') {
        handleInput(key);
      } else if (key === '.') {
        handleInput('.');
      } else if (key === '+') {
        handleInput('+');
      } else if (key === '-') {
        handleInput('-');
      } else if (key === '*') {
        handleInput('*');
      } else if (key === '/') {
        handleInput('/');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        // Simulate press style on equals button
        const equalsBtn = document.getElementById('btn-equals');
        createRipple(e, equalsBtn);
        handleInput('equals');
      } else if (key === 'Backspace') {
        handleInput('backspace');
      } else if (key === 'Escape' || key === 'Delete') {
        handleInput('clear');
      } else if (key === '(' || key === ')') {
        // Toggle parentheses
        handleInput('()');
      }
    });
  }

  // --- Financial Calculation Algorithms ---
  function formatKoreanCurrency(amount) {
    // Round to whole KRW currency amount
    const rounded = Math.round(amount);
    return rounded.toLocaleString('ko-KR') + '원';
  }

  function runSavingsCalculation() {
    const P = parseFloat(savPrincipal.value);
    const annualRatePercent = parseFloat(savRate.value);
    const periodVal = parseFloat(savPeriod.value);
    const periodUnit = savPeriodUnit.value;
    const compoundType = savCompound.value;
    const taxType = savTax.value;

    if (isNaN(P) || isNaN(annualRatePercent) || isNaN(periodVal) || P < 0 || annualRatePercent < 0 || periodVal <= 0) {
      savOutPrincipal.textContent = '0원';
      savOutInterestPre.textContent = '0원';
      savOutTax.textContent = '0원';
      savOutTotal.textContent = '0원';
      return;
    }

    // Convert period to months
    const totalMonths = periodUnit === 'year' ? periodVal * 12 : periodVal;
    const tYears = totalMonths / 12;
    const r = annualRatePercent / 100;

    let interestPre = 0;

    if (compoundType === 'simple') {
      // Simple Interest: P * r * t
      interestPre = P * r * tYears;
    } else if (compoundType === 'compound') {
      // Yearly Compound Interest: P * (1 + r)^t
      interestPre = P * Math.pow(1 + r, tYears) - P;
    } else if (compoundType === 'monthly-compound') {
      // Monthly Compound Interest: P * (1 + r/12)^months
      interestPre = P * Math.pow(1 + r/12, totalMonths) - P;
    }

    // Apply tax rate (General: 15.4%, Free: 0%)
    const taxRate = taxType === 'general' ? 0.154 : 0.0;
    const taxVal = interestPre * taxRate;
    const netReceived = P + interestPre - taxVal;

    // Display formatted results
    savOutPrincipal.textContent = formatKoreanCurrency(P);
    savOutInterestPre.textContent = formatKoreanCurrency(interestPre);
    savOutTax.textContent = formatKoreanCurrency(taxVal);
    savOutTotal.textContent = formatKoreanCurrency(netReceived);
  }

  function runLoanCalculation() {
    const L = parseFloat(loanPrincipal.value);
    const annualRatePercent = parseFloat(loanRate.value);
    const n = parseInt(loanPeriod.value);
    const repayType = loanRepayType.value;

    if (isNaN(L) || isNaN(annualRatePercent) || isNaN(n) || L < 0 || annualRatePercent < 0 || n <= 0) {
      loanOutPrincipal.textContent = '0원';
      loanOutInterest.textContent = '0원';
      loanOutTotal.textContent = '0원';
      loanAmortBody.innerHTML = '';
      return;
    }

    const r = annualRatePercent / 100;
    const i = r / 12; // monthly rate

    let totalInterest = 0;
    let totalRepay = 0;
    let htmlRows = '';
    let remainingBalance = L;

    if (repayType === 'equal-both') {
      // Equal Principal & Interest (원리금균등상환)
      let monthlyPayment = 0;
      if (i === 0) {
        monthlyPayment = L / n;
      } else {
        monthlyPayment = L * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      }

      for (let k = 1; k <= n; k++) {
        const interestPart = remainingBalance * i;
        const principalPart = monthlyPayment - interestPart;
        remainingBalance -= principalPart;

        // Clean final month floating-point errors
        const currentBalance = k === n ? 0 : Math.max(0, remainingBalance);

        totalInterest += interestPart;

        htmlRows += `
          <tr>
            <td>${k}회</td>
            <td>${formatKoreanCurrency(monthlyPayment)}</td>
            <td>${formatKoreanCurrency(principalPart)}</td>
            <td>${formatKoreanCurrency(interestPart)}</td>
            <td>${formatKoreanCurrency(currentBalance)}</td>
          </tr>
        `;
      }
      totalRepay = L + totalInterest;

    } else if (repayType === 'equal-principal') {
      // Equal Principal (원금균등상환)
      const principalPart = L / n;

      for (let k = 1; k <= n; k++) {
        const interestPart = remainingBalance * i;
        const monthlyPayment = principalPart + interestPart;
        remainingBalance -= principalPart;

        const currentBalance = k === n ? 0 : Math.max(0, remainingBalance);

        totalInterest += interestPart;

        htmlRows += `
          <tr>
            <td>${k}회</td>
            <td>${formatKoreanCurrency(monthlyPayment)}</td>
            <td>${formatKoreanCurrency(principalPart)}</td>
            <td>${formatKoreanCurrency(interestPart)}</td>
            <td>${formatKoreanCurrency(currentBalance)}</td>
          </tr>
        `;
      }
      totalRepay = L + totalInterest;

    } else if (repayType === 'maturity') {
      // Maturity Repayment (만기일시상환)
      const interestPart = L * i;

      for (let k = 1; k <= n; k++) {
        const isFinalMonth = k === n;
        const principalPart = isFinalMonth ? L : 0;
        const monthlyPayment = interestPart + principalPart;
        remainingBalance = isFinalMonth ? 0 : L;

        totalInterest += interestPart;

        htmlRows += `
          <tr>
            <td>${k}회</td>
            <td>${formatKoreanCurrency(monthlyPayment)}</td>
            <td>${formatKoreanCurrency(principalPart)}</td>
            <td>${formatKoreanCurrency(interestPart)}</td>
            <td>${formatKoreanCurrency(remainingBalance)}</td>
          </tr>
        `;
      }
      totalRepay = L + totalInterest;
    }

    // Display formatted results
    loanOutPrincipal.textContent = formatKoreanCurrency(L);
    loanOutInterest.textContent = formatKoreanCurrency(totalInterest);
    loanOutTotal.textContent = formatKoreanCurrency(totalRepay);
    loanAmortBody.innerHTML = htmlRows;
  }

  // --- Programmer Mode Calculations & UI ---
  function formatProgrammerInput(expr) {
    if (!expr) return '0';
    return expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/-/g, '−');
  }

  function formatBinary(binStr) {
    const clean = binStr.replace(/\s/g, '');
    const groups = [];
    for (let i = clean.length; i > 0; i -= 4) {
      groups.unshift(clean.slice(Math.max(0, i - 4), i));
    }
    return groups.join(' ');
  }

  function handleProgrammerInput(val) {
    if (val === 'clear') {
      progInputExpr = '';
      runProgrammerCalculation();
    } else if (val === 'backspace') {
      const match = progInputExpr.match(/(AND|OR|XOR|NOT|<<|>>)$/);
      if (match) {
        progInputExpr = progInputExpr.slice(0, -match[0].length);
      } else {
        progInputExpr = progInputExpr.slice(0, -1);
      }
      progInputExpr = progInputExpr.trimEnd();
      runProgrammerCalculation();
    } else if (val === 'equals') {
      evaluateProgrammerExprFinal();
    } else {
      let appendStr = val;
      const lastChar = progInputExpr.slice(-1);

      if (['AND', 'OR', 'XOR', '<<', '>>'].includes(val)) {
        appendStr = ` ${val} `;
      } else if (val === 'NOT') {
        appendStr = ` NOT `;
      }

      progInputExpr += appendStr;
      runProgrammerCalculation();
    }
  }

  function switchProgrammerBase(newBase) {
    const currentVal = parseAndEvalProgrammer(progInputExpr);
    
    progActiveBase = newBase;
    progBaseRows.forEach(row => {
      row.classList.toggle('active', row.getAttribute('data-base') === newBase);
    });

    if (currentVal !== null && !isNaN(currentVal)) {
      let formattedVal = '';
      if (newBase === 'HEX') {
        formattedVal = (currentVal >>> 0).toString(16).toUpperCase();
      } else if (newBase === 'DEC') {
        formattedVal = currentVal.toString(10);
      } else if (newBase === 'OCT') {
        formattedVal = (currentVal >>> 0).toString(8);
      } else if (newBase === 'BIN') {
        formattedVal = (currentVal >>> 0).toString(2);
      }
      progInputExpr = formattedVal === '0' ? '' : formattedVal;
    } else {
      progInputExpr = '';
    }

    updateProgrammerKeys();
    runProgrammerCalculation();
  }

  function updateProgrammerKeys() {
    const hexKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
    const decKeys = ['8', '9'];
    const octKeys = ['2', '3', '4', '5', '6', '7'];

    const allProgButtons = document.querySelectorAll('.prog-btn');
    allProgButtons.forEach(btn => {
      const val = btn.getAttribute('data-prog-val');
      if (!val) return;

      let disabled = false;
      if (progActiveBase === 'BIN') {
        if (hexKeys.includes(val) || decKeys.includes(val) || octKeys.includes(val)) {
          disabled = true;
        }
      } else if (progActiveBase === 'OCT') {
        if (hexKeys.includes(val) || decKeys.includes(val)) {
          disabled = true;
        }
      } else if (progActiveBase === 'DEC') {
        if (hexKeys.includes(val)) {
          disabled = true;
        }
      }

      if (['clear', 'backspace', 'equals', '+', '-', '*', '/', 'AND', 'OR', 'XOR', 'NOT', '<<', '>>'].includes(val)) {
        disabled = false;
      }

      btn.disabled = disabled;
    });
  }

  function parseAndEvalProgrammer(expr) {
    if (!expr.trim()) return 0;

    try {
      let raw = expr
        .replace(/\bAND\b/g, '&')
        .replace(/\bOR\b/g, '|')
        .replace(/\bXOR\b/g, '^')
        .replace(/\bNOT\b/g, '~')
        .replace(/\bLsh\b/g, '<<')
        .replace(/\bRsh\b/g, '>>');

      let radix = 10;
      if (progActiveBase === 'HEX') radix = 16;
      else if (progActiveBase === 'DEC') radix = 10;
      else if (progActiveBase === 'OCT') radix = 8;
      else if (progActiveBase === 'BIN') radix = 2;

      const tokenRegex = new RegExp(`\\b[0-9A-Fa-f]+\\b`, 'g');
      raw = raw.replace(tokenRegex, (match) => {
        const val = parseInt(match, radix);
        return isNaN(val) ? match : val.toString();
      });

      if (/[^0-9\+\-\*\/\(\)\s\&\|\^\~\<\>]/g.test(raw)) {
        return null;
      }

      const runner = new Function(`return (${raw}) | 0;`);
      return runner();
    } catch (e) {
      return null;
    }
  }

  function runProgrammerCalculation() {
    displayInput.textContent = formatProgrammerInput(progInputExpr) || '0';
    displayPreview.textContent = '';

    const val = parseAndEvalProgrammer(progInputExpr);
    if (val !== null && !isNaN(val)) {
      progValHex.textContent = (val >>> 0).toString(16).toUpperCase();
      progValDec.textContent = val.toString(10);
      progValOct.textContent = (val >>> 0).toString(8);
      progValBin.textContent = formatBinary((val >>> 0).toString(2));
    } else {
      progValHex.textContent = '0';
      progValDec.textContent = '0';
      progValOct.textContent = '0';
      progValBin.textContent = '0';
    }
  }

  function evaluateProgrammerExprFinal() {
    if (!progInputExpr) return;

    const val = parseAndEvalProgrammer(progInputExpr);
    if (val !== null && !isNaN(val)) {
      let formattedVal = '';
      if (progActiveBase === 'HEX') {
        formattedVal = (val >>> 0).toString(16).toUpperCase();
      } else if (progActiveBase === 'DEC') {
        formattedVal = val.toString(10);
      } else if (progActiveBase === 'OCT') {
        formattedVal = (val >>> 0).toString(8);
      } else if (progActiveBase === 'BIN') {
        formattedVal = (val >>> 0).toString(2);
      }

      progInputExpr = formattedVal;
      runProgrammerCalculation();
    } else {
      shakeDisplay();
    }
  }

  // Launch app
  init();
});
