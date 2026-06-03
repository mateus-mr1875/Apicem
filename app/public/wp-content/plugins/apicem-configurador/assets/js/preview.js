/* Apicem SVG Preview Engine — v4: designer SVG files with color/grain/caixa overlays */
'use strict';

window.ApicemPreview = (function () {

  // ── Element refs ──────────────────────────────────────────
  var svg, colorBg, deskImg, grainOverlay, caixaEl;
  var topdownBg, topdownDesk;

  // ── Canvas dimensions (match designer viewBox) ─────────────
  var VW = 567.24;
  var VH = 287.59;

  // ── Top-down desk parameters ───────────────────────────────
  var SCALE = 2.5;
  var PROF  = 70;
  var D_TOP = Math.round(PROF * SCALE); // 175px
  var CX    = VW / 2;                   // 283.62
  var CY    = VH / 2;                   // 143.80

  // ── Caixa elétrica positions (SVG canvas coords) ───────────
  // Values are approximate; calibrate visually if needed.
  // Key: "largura-tipo" where tipo = reta | chanfrado
  var CAIXA = {
    '120-reta':      { x: 165, y: 125, w: 100, h: 16 },
    '120-chanfrado': { x: 165, y: 105, w: 100, h: 16 },
    '140-reta':      { x: 183, y: 125, w: 116, h: 16 },
    '140-chanfrado': { x: 183, y: 105, w: 116, h: 16 },
    '160-reta':      { x: 196, y: 125, w: 128, h: 16 },
    '160-chanfrado': { x: 196, y: 105, w: 128, h: 16 },
  };

  // ── Mode state ─────────────────────────────────────────────
  var isPerspective = false;
  var lastState     = {};
  var fadeTimer     = null;
  var FADE_MS       = 500;

  // ── Public API ─────────────────────────────────────────────

  function init(container) {
    container.innerHTML = buildSVG();
    svg          = container.querySelector('svg');
    topdownBg    = svg.querySelector('#apicem-topdown-bg');
    topdownDesk  = svg.querySelector('#apicem-topdown-desk');
    colorBg      = svg.querySelector('#apicem-color-bg');
    deskImg      = svg.querySelector('#apicem-desk-img');
    grainOverlay = svg.querySelector('#apicem-grain-overlay');
    caixaEl      = svg.querySelector('#apicem-caixa');

    isPerspective = false;
    applyTopDown(true);
  }

  function update(state) {
    if (!svg) return;
    lastState = state;

    var hex    = state.acabamento ? state.acabamento.hex  : '#E7DBC9';
    var tipo   = state.acabamento ? state.acabamento.tipo : 'solido';
    var seedId = state.acabamento ? (state.acabamento.id % 20) : 2;
    var largura = state.tamanho ? state.tamanho.largura_cm : 140;
    var perfil  = state.borda   ? state.borda.perfil       : 'reta';
    var isChanf = (perfil === 'arredondada');
    var caixaKey = largura + '-' + (isChanf ? 'chanfrado' : 'reta');

    // ── Color fills ───────────────────────────────────────────
    colorBg.setAttribute('fill', hex);
    topdownDesk.setAttribute('fill', hex);

    // ── Top-down desk rect proportions ───────────────────────
    var deskW = Math.round(largura * SCALE);
    topdownDesk.setAttribute('x', r(CX - deskW / 2));
    topdownDesk.setAttribute('y', r(CY - D_TOP / 2));
    topdownDesk.setAttribute('width', deskW);
    topdownDesk.setAttribute('height', D_TOP);

    // ── Designer SVG image ───────────────────────────────────
    var pluginUrl = (window.apicemConfig && window.apicemConfig.pluginUrl) || '';
    var svgHref   = pluginUrl + 'assets/svgs/' + largura + '-' + (isChanf ? 'chanfrado' : 'reta') + '.svg';
    if (deskImg.getAttribute('href') !== svgHref) {
      deskImg.setAttribute('href', svgHref);
    }

    // ── Wood grain ────────────────────────────────────────────
    if (tipo === 'madeira' && isPerspective) {
      grainOverlay.setAttribute('fill', hex);
      svg.querySelector('#apicem-grain-filter feTurbulence').setAttribute('seed', seedId);
      grainOverlay.style.opacity = '1';
      grainOverlay.style.display = '';
    } else {
      grainOverlay.style.opacity = '0';
      grainOverlay.style.display = 'none';
    }

    // ── Caixa elétrica ────────────────────────────────────────
    if (state.caixa && isPerspective) {
      var c    = CAIXA[caixaKey] || CAIXA['140-reta'];
      var pts4 = [
        { x: c.x,       y: c.y       },
        { x: c.x + c.w, y: c.y       },
        { x: c.x + c.w, y: c.y + c.h },
        { x: c.x,       y: c.y + c.h },
      ];
      caixaEl.setAttribute('d', roundedPolygonPath(pts4, 0.12));
      caixaEl.style.display = '';
    } else {
      caixaEl.style.display = 'none';
    }
  }

  function setMode(mode) {
    var wantPersp = (mode === 'perspective');
    if (wantPersp === isPerspective) return;
    isPerspective = wantPersp;

    if (wantPersp) {
      applyPerspective();
    } else {
      applyTopDown(false);
    }
  }

  function getCaption(state) {
    var parts = [];
    if (state.tamanho)    parts.push(state.tamanho.title);
    if (state.borda)      parts.push(state.borda.title);
    if (state.acabamento) parts.push(state.acabamento.title);
    return parts.join(' · ');
  }

  // ── Private: mode transitions ──────────────────────────────

  function applyPerspective() {
    if (fadeTimer) clearTimeout(fadeTimer);

    // Make perspective elements visible (start fade-in)
    colorBg.style.display = '';
    deskImg.style.display = '';
    // requestAnimationFrame ensures display change is painted before opacity transition
    requestAnimationFrame(function() {
      colorBg.style.opacity = '1';
      deskImg.style.opacity = '1';
      topdownBg.style.opacity  = '0';
      topdownDesk.style.opacity = '0';
    });

    // Hide top-down elements after fade completes
    fadeTimer = setTimeout(function() {
      topdownBg.style.display   = 'none';
      topdownDesk.style.display = 'none';
      // Re-apply to trigger grain/caixa visibility
      update(lastState);
    }, FADE_MS);
  }

  function applyTopDown(immediate) {
    if (fadeTimer) clearTimeout(fadeTimer);

    if (immediate) {
      topdownBg.style.opacity   = '1';
      topdownDesk.style.opacity  = '1';
      topdownBg.style.display   = '';
      topdownDesk.style.display = '';
      colorBg.style.opacity    = '0';
      deskImg.style.opacity     = '0';
      colorBg.style.display    = 'none';
      deskImg.style.display     = 'none';
      grainOverlay.style.display = 'none';
      caixaEl.style.display     = 'none';
      return;
    }

    // Fade out perspective, fade in top-down
    topdownBg.style.display   = '';
    topdownDesk.style.display = '';
    requestAnimationFrame(function() {
      topdownBg.style.opacity   = '1';
      topdownDesk.style.opacity  = '1';
      colorBg.style.opacity    = '0';
      deskImg.style.opacity     = '0';
    });

    fadeTimer = setTimeout(function() {
      colorBg.style.display    = 'none';
      deskImg.style.display     = 'none';
      grainOverlay.style.display = 'none';
      caixaEl.style.display     = 'none';
    }, FADE_MS);
  }

  // ── Private: SVG template ──────────────────────────────────

  function buildSVG() {
    return [
      '<svg id="apicem-preview-svg" viewBox="0 0 567.24 287.59"',
      '     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
      '     role="img" aria-label="Preview da mesa" style="width:100%;height:auto">',
      '  <defs>',
      '    <style>',
      '      #apicem-topdown-bg, #apicem-topdown-desk,',
      '      #apicem-color-bg,   #apicem-desk-img { transition: opacity ' + FADE_MS + 'ms ease; }',
      '    </style>',
      '    <filter id="apicem-grain-filter" x="0%" y="0%" width="100%" height="100%"',
      '            color-interpolation-filters="sRGB">',
      '      <feTurbulence type="turbulence" baseFrequency="0.012 0.40" numOctaves="5"',
      '                    seed="2" result="fibers"/>',
      '      <feColorMatrix in="fibers" type="saturate" values="0" result="gray"/>',
      '      <feComponentTransfer in="gray" result="grain">',
      '        <feFuncR type="linear" slope="0.45" intercept="0.28"/>',
      '        <feFuncG type="linear" slope="0.45" intercept="0.28"/>',
      '        <feFuncB type="linear" slope="0.45" intercept="0.28"/>',
      '      </feComponentTransfer>',
      '      <feBlend in="SourceGraphic" in2="grain" mode="soft-light" result="blended"/>',
      '      <feComposite in="blended" in2="SourceGraphic" operator="in"/>',
      '    </filter>',
      '  </defs>',
      '',
      '  <!-- Top-down mode (passo Tamanho) -->',
      '  <rect id="apicem-topdown-bg"   x="0" y="0" width="567.24" height="287.59"',
      '        fill="#F5EFE6"/>',
      '  <rect id="apicem-topdown-desk" x="155" y="56" width="350" height="175"',
      '        fill="#E7DBC9" rx="4"/>',
      '',
      '  <!-- Perspective mode -->',
      '  <rect  id="apicem-color-bg" x="0" y="0" width="567.24" height="287.59"',
      '         fill="#E7DBC9" style="display:none;opacity:0"/>',
      '  <image id="apicem-desk-img" x="0" y="0" width="567.24" height="287.59"',
      '         href="" xlink:href="" style="mix-blend-mode:multiply;display:none;opacity:0"/>',
      '',
      '  <!-- Shared overlays -->',
      '  <rect  id="apicem-grain-overlay" x="0" y="0" width="567.24" height="287.59"',
      '         fill="#E7DBC9" filter="url(#apicem-grain-filter)"',
      '         style="display:none;pointer-events:none"/>',
      '  <path  id="apicem-caixa" fill="#A09B95"',
      '         stroke="rgba(43,36,32,0.45)" stroke-width="1.5" stroke-linejoin="round"',
      '         style="display:none"/>',
      '</svg>',
    ].join('\n');
  }

  // ── Private: rounded polygon path ─────────────────────────

  function roundedPolygonPath(polygon, frac) {
    var n = polygon.length;
    var d = '';
    for (var i = 0; i < n; i++) {
      var cur  = polygon[i];
      var next = polygon[(i + 1) % n];
      var prev = polygon[(i + n - 1) % n];
      var p1 = { x: prev.x + (cur.x - prev.x) * (1 - frac), y: prev.y + (cur.y - prev.y) * (1 - frac) };
      var p2 = { x: cur.x  + (next.x - cur.x) * frac,       y: cur.y  + (next.y - cur.y) * frac       };
      d += (i === 0 ? 'M' : 'L') + r(p1.x) + ',' + r(p1.y);
      d += ' Q' + r(cur.x) + ',' + r(cur.y) + ' ' + r(p2.x) + ',' + r(p2.y);
    }
    return d + 'Z';
  }

  function r(n) { return Math.round(n); }

  return { init: init, update: update, getCaption: getCaption, setMode: setMode };

})();
