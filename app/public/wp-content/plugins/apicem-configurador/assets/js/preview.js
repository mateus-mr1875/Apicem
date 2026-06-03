/* Apicem SVG Preview Engine — Cabinet Oblique Perspective */
'use strict';

window.ApicemPreview = (function () {

  // ── Elements ───────────────────────────────────────────────
  var svg, topFace, grainOverlay, frontFace, frontFacePath, frontChamfer, rightFace, shadowEl, caixaEl;

  // ── Projection constants ───────────────────────────────────
  var CANVAS_W   = 560;
  var CANVAS_H   = 280;
  var SCALE      = 2.5;                         // px per cm
  var ANGLE_RAD  = 25 * Math.PI / 180;          // cabinet angle
  var DEPTH_F    = 0.5;                         // foreshortening factor
  var EDGE_H     = 30;                          // front face height (px)
  var CHAMFER_H  = 8;                           // chamfer strip height for bisel (px)
  var ROUND_DIP  = 10;                          // bezier control dip for arredondada (px)

  // Fixed depth geometry — profundidade = 70cm always
  var PROF = 70;
  var dx   = Math.round(PROF * DEPTH_F * Math.cos(ANGLE_RAD) * SCALE); // ≈ 79px
  var dy   = Math.round(PROF * DEPTH_F * Math.sin(ANGLE_RAD) * SCALE); // ≈ 37px

  // frontY = Y coordinate of the top edge of the front face (desk meets viewer)
  var frontY = CANVAS_H - EDGE_H - 28; // ≈ 222

  // ── Public API ─────────────────────────────────────────────

  function init(container) {
    container.innerHTML = buildSVG();
    svg           = container.querySelector('svg');
    shadowEl      = svg.querySelector('#apicem-shadow');
    rightFace     = svg.querySelector('#apicem-right-face');
    frontFace     = svg.querySelector('#apicem-front-face');
    frontFacePath = svg.querySelector('#apicem-front-face-path');
    frontChamfer  = svg.querySelector('#apicem-front-chamfer');
    topFace       = svg.querySelector('#apicem-top-face');
    grainOverlay  = svg.querySelector('#apicem-grain-overlay');
    caixaEl       = svg.querySelector('#apicem-caixa');
  }

  function update(state) {
    if (!svg) return;

    var largura = state.tamanho ? state.tamanho.largura_cm : 140;
    var hex     = state.acabamento ? state.acabamento.hex  : '#E7DBC9';
    var tipo    = state.acabamento ? state.acabamento.tipo : 'solido';
    var seedId  = state.acabamento ? (state.acabamento.id % 20) : 2;
    var perfil  = state.borda     ? state.borda.perfil     : 'reta';

    // ── Geometry ─────────────────────────────────────────────
    var W  = Math.round(largura * SCALE);
    var cx = Math.round(CANVAS_W / 2 - dx / 2); // center compensated for depth offset

    var FL = { x: cx - Math.floor(W / 2), y: frontY };       // front-left
    var FR = { x: cx + Math.ceil(W / 2),  y: frontY };       // front-right
    var BR = { x: FR.x + dx, y: frontY - dy };               // back-right
    var BL = { x: FL.x + dx, y: frontY - dy };               // back-left

    // ── Shadow (ellipse below front face) ────────────────────
    shadowEl.setAttribute('cx', Math.round((FL.x + FR.x) / 2));
    shadowEl.setAttribute('cy', frontY + EDGE_H + 6);
    shadowEl.setAttribute('rx', Math.round(W * 0.44));
    shadowEl.setAttribute('ry', 7);

    // ── Right face (darkest — in deepest shadow) ─────────────
    var FRb = { x: FR.x, y: FR.y + EDGE_H };
    var BRb = { x: BR.x, y: BR.y + EDGE_H };
    rightFace.setAttribute('points', pts([FR, BR, BRb, FRb]));
    rightFace.setAttribute('fill', shade(hex, -38));

    // ── Top face (tampo surface) ─────────────────────────────
    topFace.setAttribute('points', pts([FL, FR, BR, BL]));
    topFace.setAttribute('fill', hex);

    // ── Wood grain overlay ───────────────────────────────────
    if (tipo === 'madeira') {
      grainOverlay.setAttribute('points', pts([FL, FR, BR, BL]));
      svg.querySelector('#apicem-grain-filter feTurbulence').setAttribute('seed', seedId);
      grainOverlay.style.display = '';
    } else {
      grainOverlay.style.display = 'none';
    }

    // ── Front face — borda profile ───────────────────────────
    applyBorda(perfil, FL, FR, hex);

    // ── Caixa elétrica ───────────────────────────────────────
    if (state.caixa) {
      caixaEl.setAttribute('points', pts(computeCaixa(FL, W)));
      caixaEl.setAttribute('fill', shade(hex, -32));
      caixaEl.style.display = '';
    } else {
      caixaEl.style.display = 'none';
    }
  }

  function getCaption(state) {
    var parts = [];
    if (state.tamanho)    parts.push(state.tamanho.title);
    if (state.borda)      parts.push(state.borda.title);
    if (state.acabamento) parts.push(state.acabamento.title);
    return parts.join(' · ');
  }

  // ── Private helpers ────────────────────────────────────────

  function buildSVG() {
    return [
      '<svg id="apicem-preview-svg" viewBox="0 0 560 280" xmlns="http://www.w3.org/2000/svg"',
      '     role="img" aria-label="Preview da mesa">',
      '  <defs>',
      '    <filter id="apicem-grain-filter" x="0%" y="0%" width="100%" height="100%">',
      '      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" stitchTiles="stitch" result="noise"/>',
      '      <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>',
      '      <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blend"/>',
      '      <feComponentTransfer in="blend">',
      '        <feFuncA type="linear" slope="0.15"/>',
      '      </feComponentTransfer>',
      '      <feComposite in2="SourceGraphic" operator="over"/>',
      '    </filter>',
      '  </defs>',
      '  <ellipse id="apicem-shadow" fill="rgba(43,36,32,.15)"/>',
      '  <polygon id="apicem-right-face"     style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-front-face"     style="transition:fill .3s ease"/>',
      '  <path    id="apicem-front-face-path" style="display:none;transition:fill .3s ease"/>',
      '  <polygon id="apicem-front-chamfer"  style="display:none;transition:fill .3s ease"/>',
      '  <polygon id="apicem-top-face"       style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-grain-overlay"  filter="url(#apicem-grain-filter)"',
      '           style="display:none;pointer-events:none;will-change:opacity"/>',
      '  <polygon id="apicem-caixa"          style="display:none;transition:fill .3s ease"/>',
      '</svg>',
    ].join('\n');
  }

  function applyBorda(perfil, FL, FR, hex) {
    var faceColor    = shade(hex, -20);
    var chamferColor = shade(hex, -8);

    var FLb = { x: FL.x, y: FL.y + EDGE_H };
    var FRb = { x: FR.x, y: FR.y + EDGE_H };

    // Reset all variants
    frontFace.style.display     = 'none';
    frontFacePath.style.display = 'none';
    frontChamfer.style.display  = 'none';

    if (perfil === 'reta') {
      // ── Reta: clean straight rectangle ──────────────────────
      // The edge is a perfect 90° angle — flat face, no detail on top
      frontFace.setAttribute('points', pts([FL, FR, FRb, FLb]));
      frontFace.setAttribute('fill', faceColor);
      frontFace.style.display = '';

    } else if (perfil === 'chanfrada') {
      // ── Bisel: chamfer strip visible at the top of the face ──
      // The angled cut catches more light → lighter strip at top
      var FLc = { x: FL.x, y: FL.y + CHAMFER_H };
      var FRc = { x: FR.x, y: FR.y + CHAMFER_H };

      // Chamfer strip (light — facing partially upward)
      frontChamfer.setAttribute('points', pts([FL, FR, FRc, FLc]));
      frontChamfer.setAttribute('fill', chamferColor);
      frontChamfer.style.display = '';

      // Main front face below the chamfer (darker — facing viewer)
      frontFace.setAttribute('points', pts([FLc, FRc, FRb, FLb]));
      frontFace.setAttribute('fill', faceColor);
      frontFace.style.display = '';

    } else if (perfil === 'arredondada') {
      // ── Arredondada: bezier curve at the top of the face ─────
      // The round profile rolls away from the viewer → the top curves inward
      var midX = Math.round((FL.x + FR.x) / 2);
      var midY = FL.y + ROUND_DIP;
      var d = [
        'M', FL.x, ',', FL.y,
        ' Q', midX, ',', midY, ' ', FR.x, ',', FR.y,
        ' L', FRb.x, ',', FRb.y,
        ' L', FLb.x, ',', FLb.y, 'Z',
      ].join('');
      frontFacePath.setAttribute('d', d);
      frontFacePath.setAttribute('fill', faceColor);
      frontFacePath.style.display = '';
    }
  }

  function computeCaixa(FL, W) {
    // Electrical box as a perspective parallelogram on the top face
    // Positioned near the back edge, centered horizontally
    var cW_ratio = 0.28;
    var t_front  = 0.55; // depth fraction (0=front edge, 1=back edge)
    var t_back   = 0.80;
    var u_left   = (1 - cW_ratio) / 2;
    var u_right  = u_left + cW_ratio;

    // Any point (u, t) on the top face in perspective:
    //   x = FL.x + u*W + t*dx
    //   y = FL.y - t*dy
    function tp(u, t) {
      return { x: Math.round(FL.x + u * W + t * dx), y: Math.round(FL.y - t * dy) };
    }

    return [
      tp(u_left,  t_front),
      tp(u_right, t_front),
      tp(u_right, t_back),
      tp(u_left,  t_back),
    ];
  }

  function pts(arr) {
    return arr.map(function(p) { return p.x + ',' + p.y; }).join(' ');
  }

  function shade(hex, amount) {
    if (!hex || hex.length < 4) return '#888';
    var full = hex.replace('#', '');
    if (full.length === 3) full = full[0]+full[0]+full[1]+full[1]+full[2]+full[2];
    var n = parseInt(full, 16);
    var r = Math.max(0, Math.min(255, (n >> 16)        + amount));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 0xFF) + amount));
    var b = Math.max(0, Math.min(255, (n & 0xFF)        + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  return { init: init, update: update, getCaption: getCaption };

})();
