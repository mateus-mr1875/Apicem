/* Apicem SVG Preview Engine — v5: designer SVGs + mix-blend-mode:color */
'use strict';

window.ApicemPreview = (function () {

  // ── Element refs ──────────────────────────────────────────
  var svg, deskImg, colorOverlay, caixaEl;

  // ── Designer SVG canvas dimensions ────────────────────────
  var VW = 567.24;
  var VH = 287.59;

  // ── Caixa elétrica positions (SVG canvas coords) ───────────
  // Key: "largura-tipo" (tipo = reta | chanfrado)
  var CAIXA = {
    '120-reta':      { x: 165, y: 125, w: 100, h: 16 },
    '120-chanfrado': { x: 165, y: 105, w: 100, h: 16 },
    '140-reta':      { x: 183, y: 125, w: 116, h: 16 },
    '140-chanfrado': { x: 183, y: 105, w: 116, h: 16 },
    '160-reta':      { x: 196, y: 125, w: 128, h: 16 },
    '160-chanfrado': { x: 196, y: 105, w: 128, h: 16 },
  };

  var lastState = {};

  // ── Public API ─────────────────────────────────────────────

  function init(container) {
    container.innerHTML = buildSVG();
    svg          = container.querySelector('svg');
    deskImg      = svg.querySelector('#apicem-desk-img');
    colorOverlay = svg.querySelector('#apicem-color-overlay');
    caixaEl      = svg.querySelector('#apicem-caixa');
  }

  function update(state) {
    if (!svg) return;
    lastState = state;

    var hex     = state.acabamento ? state.acabamento.hex  : '#E7DBC9';
    var tipo    = state.acabamento ? state.acabamento.tipo : 'solido';
    var seedId  = state.acabamento ? (state.acabamento.id % 20) : 2;
    var largura = state.tamanho ? state.tamanho.largura_cm : 140;
    var perfil  = state.borda   ? state.borda.perfil       : 'reta';
    var isChanf = (perfil === 'arredondada');
    var caixaKey = largura + '-' + (isChanf ? 'chanfrado' : 'reta');

    // ── Color overlay (colorizes the desk via HSL color blend) ──
    colorOverlay.setAttribute('fill', hex);

    // ── Designer SVG (tamanho + borda determine which file) ─────
    var pluginUrl = (window.apicemConfig && window.apicemConfig.pluginUrl) || '';
    var svgHref   = pluginUrl + 'assets/svgs/' + largura + '-' + (isChanf ? 'chanfrado' : 'reta') + '.svg';
    if (deskImg.getAttribute('href') !== svgHref) {
      deskImg.setAttribute('href',       svgHref);
      deskImg.setAttribute('xlink:href', svgHref);
    }

    // ── Grain: applied directly to deskImg (madeira only) ──────
    if (tipo === 'madeira') {
      var turbEl = svg.querySelector('#apicem-grain-filter feTurbulence');
      if (turbEl) turbEl.setAttribute('seed', seedId);
      deskImg.setAttribute('filter', 'url(#apicem-grain-filter)');
    } else {
      deskImg.removeAttribute('filter');
    }

    // ── Caixa elétrica ─────────────────────────────────────────
    if (state.caixa) {
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

  // setMode() is kept for API compatibility with configurador.js,
  // but no transition is needed — the desk always appears in perspective.
  function setMode(mode) {
    update(lastState);
  }

  function getCaption(state) {
    var parts = [];
    if (state.tamanho)    parts.push(state.tamanho.title);
    if (state.borda)      parts.push(state.borda.title);
    if (state.acabamento) parts.push(state.acabamento.title);
    return parts.join(' · ');
  }

  // ── SVG template ───────────────────────────────────────────

  function buildSVG() {
    return [
      '<svg id="apicem-preview-svg" viewBox="0 0 567.24 287.59"',
      '     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
      '     role="img" aria-label="Preview da mesa" style="width:100%;height:auto">',
      '  <defs>',
      '    <!-- Wood grain: directional turbulence, soft-light blend, values clamped to [0.28,0.73] -->',
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
      '  <!-- Designer SVG (gray PNG). Grain filter applied dynamically for madeira. -->',
      '  <image id="apicem-desk-img"',
      '         x="0" y="0" width="567.24" height="287.59"',
      '         href="" xlink:href=""',
      '         preserveAspectRatio="xMidYMid meet"/>',
      '',
      '  <!-- Color overlay: mix-blend-mode:color maps hex hue/sat onto the gray desk -->',
      '  <rect id="apicem-color-overlay"',
      '        x="0" y="0" width="567.24" height="287.59"',
      '        fill="#E7DBC9"',
      '        style="mix-blend-mode: color"/>',
      '',
      '  <!-- Caixa elétrica -->',
      '  <path id="apicem-caixa" fill="#A09B95"',
      '        stroke="rgba(43,36,32,0.45)" stroke-width="1.5" stroke-linejoin="round"',
      '        style="display:none"/>',
      '</svg>',
    ].join('\n');
  }

  // ── Rounded polygon path (reused for caixa) ────────────────

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
