/* Apicem SVG Preview Engine */
'use strict';

window.ApicemPreview = (function () {

  var svg, tampo, grainOverlay, caixaRect, shadowRect, legsGroup, clipChanfrada, clipPath;
  var currentState = {};

  // Canvas baseline width
  var CANVAS_W = 560;

  function init(container) {
    container.innerHTML = buildSVG();
    svg          = container.querySelector('svg');
    tampo        = svg.querySelector('#apicem-tampo');
    grainOverlay = svg.querySelector('#apicem-grain-overlay');
    caixaRect    = svg.querySelector('#apicem-caixa');
    shadowRect   = svg.querySelector('#apicem-shadow');
    legsGroup    = svg.querySelector('#apicem-legs');
    clipChanfrada = svg.querySelector('#apicem-clip-chanfrada polygon');
    clipPath     = svg.querySelector('#apicem-clip-use');
  }

  function buildSVG() {
    return [
      '<svg id="apicem-preview-svg" viewBox="0 0 560 350" xmlns="http://www.w3.org/2000/svg"',
      '     role="img" aria-label="Preview da mesa">',
      '  <defs>',
      '    <filter id="apicem-grain-filter" x="0" y="0" width="100%" height="100%">',
      '      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" stitchTiles="stitch" result="noise"/>',
      '      <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>',
      '      <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blend"/>',
      '      <feComponentTransfer in="blend">',
      '        <feFuncA type="linear" slope="0.15"/>',
      '      </feComponentTransfer>',
      '      <feComposite in2="SourceGraphic" operator="over"/>',
      '    </filter>',
      '    <clipPath id="apicem-clip-chanfrada">',
      '      <polygon id="apicem-clip-chanfrada" points=""/>',
      '    </clipPath>',
      '  </defs>',
      '  <!-- Shadow -->',
      '  <rect id="apicem-shadow" rx="0" fill="rgba(43,36,32,.12)" />',
      '  <!-- Desk surface -->',
      '  <rect id="apicem-tampo" rx="0" fill="#FFFFFF" style="transition:fill .3s ease,rx .3s ease;"/>',
      '  <!-- Wood grain overlay (madeira only) -->',
      '  <rect id="apicem-grain-overlay" rx="0" fill="#2B2420" filter="url(#apicem-grain-filter)"',
      '        style="display:none;pointer-events:none;will-change:opacity;transition:opacity .3s ease;" opacity="1"/>',
      '  <!-- Electrical box -->',
      '  <rect id="apicem-caixa" rx="5" fill="rgba(43,36,32,.22)"',
      '        style="display:none;transition:opacity .3s ease;"/>',
      '  <!-- Leg dots (top-down hints) -->',
      '  <g id="apicem-legs" opacity="0.5">',
      '    <rect class="apicem-leg" width="28" height="12" rx="6" fill="rgba(43,36,32,.35)"/>',
      '    <rect class="apicem-leg" width="28" height="12" rx="6" fill="rgba(43,36,32,.35)"/>',
      '    <rect class="apicem-leg" width="28" height="12" rx="6" fill="rgba(43,36,32,.35)"/>',
      '    <rect class="apicem-leg" width="28" height="12" rx="6" fill="rgba(43,36,32,.35)"/>',
      '  </g>',
      '</svg>',
    ].join('\n');
  }

  function update(state) {
    if (!svg) return;
    currentState = Object.assign({}, state);

    var tampoW, tampoH, tampoX, tampoY;

    // Size
    var largura = state.tamanho ? state.tamanho.largura_cm : 140;
    var prof    = state.tamanho ? state.tamanho.profundidade_cm : 70;

    // Scale: 160cm maps to CANVAS_W; maintain aspect ratio
    var scale   = CANVAS_W / 160;
    tampoW = Math.round(largura * scale);
    tampoH = Math.round(prof * scale);

    // Center desk on a 560×350 canvas (allow room for legs below)
    tampoX = Math.round((CANVAS_W - tampoW) / 2);
    tampoY = Math.round((350 - tampoH) / 2) - 16;

    // Shadow (offset slightly)
    shadowRect.setAttribute('x',      tampoX + 4);
    shadowRect.setAttribute('y',      tampoY + 8);
    shadowRect.setAttribute('width',  tampoW);
    shadowRect.setAttribute('height', tampoH);

    // Main tampo rect
    tampo.setAttribute('x',      tampoX);
    tampo.setAttribute('y',      tampoY);
    tampo.setAttribute('width',  tampoW);
    tampo.setAttribute('height', tampoH);

    // Grain overlay (same coords)
    grainOverlay.setAttribute('x',      tampoX);
    grainOverlay.setAttribute('y',      tampoY);
    grainOverlay.setAttribute('width',  tampoW);
    grainOverlay.setAttribute('height', tampoH);

    // Border style
    var perfil = state.borda ? state.borda.perfil : 'reta';
    applyBorder(perfil, tampoX, tampoY, tampoW, tampoH);

    // Acabamento
    var hex  = state.acabamento ? state.acabamento.hex : '#FFFFFF';
    var tipo = state.acabamento ? state.acabamento.tipo : 'solido';
    var seedId = state.acabamento ? state.acabamento.id : 2;
    tampo.setAttribute('fill', hex);
    shadowRect.setAttribute('fill', shadeColor(hex, -25));

    // Grain
    if (tipo === 'madeira') {
      svg.querySelector('#apicem-grain-filter feTurbulence').setAttribute('seed', seedId % 20);
      grainOverlay.style.display = '';
    } else {
      grainOverlay.style.display = 'none';
    }

    // Caixa elétrica
    var caixa = !!state.caixa;
    if (caixa) {
      var cW = Math.round(tampoW * 0.28);
      var cH = Math.round(tampoH * 0.10);
      var cX = tampoX + Math.round((tampoW - cW) / 2);
      var cY = tampoY + Math.round(tampoH * 0.08);
      caixaRect.setAttribute('x',      cX);
      caixaRect.setAttribute('y',      cY);
      caixaRect.setAttribute('width',  cW);
      caixaRect.setAttribute('height', cH);
      caixaRect.setAttribute('fill', shadeColor(hex, -30));
      caixaRect.style.display = '';
    } else {
      caixaRect.style.display = 'none';
    }

    // Leg positions (4 corners, slightly inside)
    var legs    = legsGroup.querySelectorAll('.apicem-leg');
    var legInX  = Math.round(tampoW * 0.06);
    var legInY  = Math.round(tampoH * 0.10);
    var legW    = parseInt(legs[0].getAttribute('width'));
    var legH    = parseInt(legs[0].getAttribute('height'));
    var positions = [
      [tampoX + legInX, tampoY + legInY],
      [tampoX + tampoW - legInX - legW, tampoY + legInY],
      [tampoX + legInX, tampoY + tampoH - legInY - legH],
      [tampoX + tampoW - legInX - legW, tampoY + tampoH - legInY - legH],
    ];
    legs.forEach(function(leg, i) {
      leg.setAttribute('x', positions[i][0]);
      leg.setAttribute('y', positions[i][1]);
    });
  }

  function applyBorder(perfil, x, y, w, h) {
    var chanfrada = svg.querySelector('clipPath');
    if (perfil === 'reta') {
      tampo.setAttribute('rx', 0);
      tampo.removeAttribute('clip-path');
      grainOverlay.setAttribute('rx', 0);
      grainOverlay.removeAttribute('clip-path');
      chanfrada.style.display = 'none';
    } else if (perfil === 'arredondada') {
      var rx = Math.round(Math.min(w, h) * 0.12);
      tampo.setAttribute('rx', rx);
      tampo.removeAttribute('clip-path');
      grainOverlay.setAttribute('rx', rx);
      grainOverlay.removeAttribute('clip-path');
      chanfrada.style.display = 'none';
    } else if (perfil === 'chanfrada') {
      tampo.setAttribute('rx', 0);
      grainOverlay.setAttribute('rx', 0);
      var cut = Math.round(Math.min(w, h) * 0.08);
      var pts = [
        (x + cut) + ',' + y,
        (x + w - cut) + ',' + y,
        (x + w) + ',' + (y + cut),
        (x + w) + ',' + (y + h - cut),
        (x + w - cut) + ',' + (y + h),
        (x + cut) + ',' + (y + h),
        x + ',' + (y + h - cut),
        x + ',' + (y + cut),
      ].join(' ');
      svg.querySelector('#apicem-clip-chanfrada polygon').setAttribute('points', pts);
      chanfrada.style.display = '';
      tampo.setAttribute('clip-path', 'url(#apicem-clip-chanfrada)');
      grainOverlay.setAttribute('clip-path', 'url(#apicem-clip-chanfrada)');
    }
  }

  function shadeColor(hex, percent) {
    if (!hex || hex.length < 4) return '#888';
    var num = parseInt(hex.replace('#',''), 16);
    var r = Math.max(0, Math.min(255, (num >> 16) + percent));
    var g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + percent));
    var b = Math.max(0, Math.min(255, (num & 0x0000FF) + percent));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function getCaption(state) {
    var parts = [];
    if (state.tamanho) parts.push(state.tamanho.title);
    if (state.borda)   parts.push(state.borda.title);
    if (state.acabamento) parts.push(state.acabamento.title);
    return parts.join(' · ');
  }

  return { init: init, update: update, getCaption: getCaption };

})();
