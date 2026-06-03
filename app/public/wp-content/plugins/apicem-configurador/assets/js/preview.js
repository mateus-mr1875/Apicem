/* Apicem SVG Preview Engine — Dual View (top-down ↔ perspective) with animated transition */
'use strict';

window.ApicemPreview = (function () {

  // ── SVG element refs ──────────────────────────────────────────
  var svg, topFace, topFaceRounded, grainOverlay;
  var frontFace, frontFacePath, frontChamfer, rightFace;
  var shadowEl, caixaEl;

  // ── Projection constants ──────────────────────────────────────
  var CANVAS_W      = 560;
  var CANVAS_H      = 280;
  var SCALE         = 2.5;                        // px / cm
  var ANGLE_RAD     = 25 * Math.PI / 180;         // cabinet projection angle
  var DEPTH_F       = 0.5;                        // foreshortening factor
  var PROF          = 70;                         // depth = 70 cm always
  var EDGE_H        = 30;                         // front face height at t=1 (px)
  var CHAMFER_H     = 12;                         // bisel chamfer strip height (px) ≈40% of EDGE_H
  var ROUND_DIP     = 10;                         // bezier dip for arredondada top curve (px)
  var CORNER_R      = 18;                         // corner radius for arredondada (px)
  var ANIM_DURATION = 600;                        // ms

  // Fixed depth geometry (profundidade = 70 cm always)
  var dx = Math.round(PROF * DEPTH_F * Math.cos(ANGLE_RAD) * SCALE); // ≈79 px
  var dy = Math.round(PROF * DEPTH_F * Math.sin(ANGLE_RAD) * SCALE); // ≈37 px

  // Top-down anchors
  var D_TOP  = Math.round(PROF * SCALE); // = 175 px
  var CX_TOP = CANVAS_W / 2;             // = 280
  var CY_TOP = CANVAS_H / 2;             // = 140

  // Perspective anchors
  var CX_PERSP = CANVAS_W / 2 - dx / 2; // ≈ 241
  var FRONT_Y  = CANVAS_H - EDGE_H - 28; // ≈ 222

  // ── Animation state ──────────────────────────────────────────
  var currentT  = 0;    // 0 = top-down, 1 = perspective
  var targetT   = 0;
  var lastState = {};
  var animFrame = null;

  // ── Public API ────────────────────────────────────────────────

  function init(container) {
    container.innerHTML = buildSVG();
    svg            = container.querySelector('svg');
    shadowEl       = svg.querySelector('#apicem-shadow');
    rightFace      = svg.querySelector('#apicem-right-face');
    frontFace      = svg.querySelector('#apicem-front-face');
    frontFacePath  = svg.querySelector('#apicem-front-face-path');
    frontChamfer   = svg.querySelector('#apicem-front-chamfer');
    topFace        = svg.querySelector('#apicem-top-face');
    topFaceRounded = svg.querySelector('#apicem-top-face-rounded');
    grainOverlay   = svg.querySelector('#apicem-grain-overlay');
    caixaEl        = svg.querySelector('#apicem-caixa');
  }

  function update(state) {
    if (!svg) return;
    lastState = state;
    updateGeometry(currentT, state);
  }

  function setMode(mode) {
    var t = (mode === 'perspective') ? 1 : 0;
    if (t === targetT && Math.abs(currentT - t) < 0.01) return;
    targetT = t;
    animateT();
  }

  function getCaption(state) {
    var parts = [];
    if (state.tamanho)    parts.push(state.tamanho.title);
    if (state.borda)      parts.push(state.borda.title);
    if (state.acabamento) parts.push(state.acabamento.title);
    return parts.join(' · ');
  }

  // ── Animation ─────────────────────────────────────────────────

  function animateT() {
    if (animFrame) cancelAnimationFrame(animFrame);
    var startT     = currentT;
    var startTime  = null;
    animFrame = requestAnimationFrame(function step(now) {
      if (!startTime) startTime = now;
      var p = Math.min((now - startTime) / ANIM_DURATION, 1);
      var e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // easeInOut
      currentT = startT + (targetT - startT) * e;
      updateGeometry(currentT, lastState);
      if (p < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        currentT  = targetT;
        animFrame = null;
      }
    });
  }

  // ── Core geometry update ──────────────────────────────────────

  function updateGeometry(t, state) {
    if (!svg) return;

    var largura = state.tamanho ? state.tamanho.largura_cm : 140;
    var hex     = state.acabamento ? state.acabamento.hex  : '#E7DBC9';
    var tipo    = state.acabamento ? state.acabamento.tipo : 'solido';
    var seedId  = state.acabamento ? (state.acabamento.id % 20) : 2;
    var perfil  = state.borda ? state.borda.perfil : 'reta';

    var W = Math.round(largura * SCALE);

    // ── Vertices in each mode ─────────────────────────────────────

    // Top-down (t = 0) — plain rectangle, centred in canvas
    var FL_td = { x: CX_TOP - Math.floor(W / 2), y: CY_TOP - Math.floor(D_TOP / 2) };
    var FR_td = { x: CX_TOP + Math.ceil(W / 2),  y: CY_TOP - Math.floor(D_TOP / 2) };
    var BR_td = { x: CX_TOP + Math.ceil(W / 2),  y: CY_TOP + Math.ceil(D_TOP / 2) };
    var BL_td = { x: CX_TOP - Math.floor(W / 2), y: CY_TOP + Math.ceil(D_TOP / 2) };

    // Perspective (t = 1) — cabinet oblique
    var FL_p = { x: CX_PERSP - Math.floor(W / 2), y: FRONT_Y };
    var FR_p = { x: CX_PERSP + Math.ceil(W / 2),  y: FRONT_Y };
    var BR_p = { x: FR_p.x + dx, y: FRONT_Y - dy };
    var BL_p = { x: FL_p.x + dx, y: FRONT_Y - dy };

    // Interpolated current vertices
    var FL    = lerpPt(FL_td, FL_p, t);
    var FR    = lerpPt(FR_td, FR_p, t);
    var BR    = lerpPt(BR_td, BR_p, t);
    var BL    = lerpPt(BL_td, BL_p, t);
    var edgeH = lerp(0, EDGE_H, t);

    // ── Shadow ────────────────────────────────────────────────────
    shadowEl.setAttribute('cx', Math.round(lerp(CX_TOP, (FL_p.x + FR_p.x) / 2, t)));
    shadowEl.setAttribute('cy', Math.round(lerp(CY_TOP + D_TOP / 2 + 10, FRONT_Y + EDGE_H + 6, t)));
    shadowEl.setAttribute('rx', Math.round(lerp(W * 0.36, W * 0.44, t)));
    shadowEl.setAttribute('ry', Math.round(lerp(4, 7, t)));
    shadowEl.setAttribute('fill-opacity', lerp(0.07, 0.15, t).toFixed(3));

    // ── Right face (fades in with t) ─────────────────────────────
    var FRb = { x: FR.x, y: FR.y + edgeH };
    var BRb = { x: BR.x, y: BR.y + edgeH };
    rightFace.setAttribute('points', pts([FR, BR, BRb, FRb]));
    rightFace.setAttribute('fill', shade(hex, -38));
    rightFace.setAttribute('opacity', t.toFixed(3));

    // ── Top face ─────────────────────────────────────────────────
    if (perfil === 'arredondada') {
      topFace.style.display        = 'none';
      topFaceRounded.style.display = '';
      topFaceRounded.setAttribute('d',    roundedTopPath(FL, FR, BR, BL, t));
      topFaceRounded.setAttribute('fill', hex);
    } else {
      topFace.style.display        = '';
      topFaceRounded.style.display = 'none';
      topFace.setAttribute('points', pts([FL, FR, BR, BL]));
      topFace.setAttribute('fill',   hex);
    }

    // ── Wood grain overlay ────────────────────────────────────────
    if (tipo === 'madeira') {
      grainOverlay.setAttribute('points', pts([FL, FR, BR, BL]));
      svg.querySelector('#apicem-grain-filter feTurbulence').setAttribute('seed', seedId);
      grainOverlay.style.display = '';
    } else {
      grainOverlay.style.display = 'none';
    }

    // ── Front face — borda profile (fades in with t) ──────────────
    applyBorda(perfil, FL, FR, hex, edgeH, t);

    // ── Caixa elétrica ────────────────────────────────────────────
    if (state.caixa) {
      caixaEl.setAttribute('points', pts(computeCaixa(FL_td, FL_p, W, t)));
      caixaEl.setAttribute('fill',   shade(hex, -32));
      caixaEl.style.display = '';
    } else {
      caixaEl.style.display = 'none';
    }
  }

  // ── Border profiles ───────────────────────────────────────────

  function applyBorda(perfil, FL, FR, hex, edgeH, t) {
    var faceColor    = shade(hex, -20);
    var chamferColor = shade(hex, +5);  // lighter than top face — catches light at angle
    var op           = t.toFixed(3);

    var FLb = { x: FL.x, y: FL.y + edgeH };
    var FRb = { x: FR.x, y: FR.y + edgeH };

    // Reset opacities
    frontFace.setAttribute('opacity',     '0');
    frontFacePath.setAttribute('opacity', '0');
    frontChamfer.setAttribute('opacity',  '0');

    if (perfil === 'reta') {
      // Clean straight edge — no chamfer, no curve
      frontFace.setAttribute('points', pts([FL, FR, FRb, FLb]));
      frontFace.setAttribute('fill',   faceColor);
      frontFace.setAttribute('opacity', op);

    } else if (perfil === 'chanfrada') {
      // Prominent chamfer strip (≈40% of face height) — clearly lighter (light-catching surface)
      var ch  = Math.min(CHAMFER_H, edgeH * 0.40);
      var FLc = { x: FL.x, y: FL.y + ch };
      var FRc = { x: FR.x, y: FR.y + ch };

      frontChamfer.setAttribute('points', pts([FL, FR, FRc, FLc]));
      frontChamfer.setAttribute('fill',   chamferColor);
      frontChamfer.setAttribute('opacity', op);

      frontFace.setAttribute('points', pts([FLc, FRc, FRb, FLb]));
      frontFace.setAttribute('fill',   faceColor);
      frontFace.setAttribute('opacity', op);

    } else if (perfil === 'arredondada') {
      // Rounded profile: curved top edge + rounded side corners
      var CR   = Math.max(2, Math.min(CORNER_R, edgeH * 0.60));
      var midX = (FL.x + FR.x) / 2;
      var d = [
        'M', r(FL.x + CR), ',', r(FL.y),
        ' Q', r(midX), ',', r(FL.y + ROUND_DIP), ' ', r(FR.x - CR), ',', r(FR.y),
        ' L', r(FR.x), ',', r(FR.y + CR),
        ' L', r(FRb.x), ',', r(FRb.y),
        ' L', r(FLb.x), ',', r(FLb.y),
        ' L', r(FL.x),  ',', r(FL.y + CR),
        ' Z',
      ].join('');
      frontFacePath.setAttribute('d',       d);
      frontFacePath.setAttribute('fill',    faceColor);
      frontFacePath.setAttribute('opacity', op);
    }
  }

  // Top face path with rounded corners for arredondada
  function roundedTopPath(FL, FR, BR, BL, t) {
    var CR      = CORNER_R;
    var CR_back = Math.round(CORNER_R * (1 - t)); // back corners rounded at t=0, straight at t=1

    if (CR_back < 1) {
      // Perspective: only front corners rounded
      return [
        'M', r(BL.x), ',', r(BL.y),
        ' L', r(BR.x), ',', r(BR.y),
        ' L', r(FR.x), ',', r(FR.y - CR),
        ' Q', r(FR.x), ',', r(FR.y), ' ', r(FR.x - CR), ',', r(FR.y),
        ' L', r(FL.x + CR), ',', r(FL.y),
        ' Q', r(FL.x), ',', r(FL.y), ' ', r(FL.x), ',', r(FL.y - CR),
        ' Z',
      ].join('');
    }

    // Top-down or mid-animation: all four corners rounded (CR_back fades out as t increases)
    return [
      'M', r(FL.x + CR),  ',', r(FL.y),
      ' Q', r(FL.x), ',', r(FL.y),       ' ', r(FL.x), ',', r(FL.y + CR_back),
      ' L', r(FL.x), ',', r(BL.y - CR_back),
      ' Q', r(FL.x), ',', r(BL.y),       ' ', r(FL.x + CR_back), ',', r(BL.y),
      ' L', r(BR.x - CR_back), ',', r(BR.y),
      ' Q', r(BR.x), ',', r(BR.y),       ' ', r(BR.x), ',', r(BR.y - CR_back),
      ' L', r(FR.x), ',', r(FR.y + CR_back),
      ' Q', r(FR.x), ',', r(FR.y),       ' ', r(FR.x - CR), ',', r(FR.y),
      ' L', r(FL.x + CR), ',', r(FL.y),
      ' Z',
    ].join('');
  }

  // ── Caixa elétrica — interpolated position ────────────────────

  function computeCaixa(FL_td, FL_p, W, t) {
    var cW_ratio = 0.28;
    var u_left   = (1 - cW_ratio) / 2;
    var u_right  = u_left + cW_ratio;

    // Top-down: small rect near back edge (top of top-down rect)
    var cW = Math.round(W * cW_ratio);
    var cH = Math.round(D_TOP * 0.10);
    var cX = Math.round(FL_td.x + u_left * W);
    var cY = Math.round(FL_td.y + D_TOP * 0.08);
    var td = [
      { x: cX,      y: cY },
      { x: cX + cW, y: cY },
      { x: cX + cW, y: cY + cH },
      { x: cX,      y: cY + cH },
    ];

    // Perspective: parallelogram foreshortened on the top face
    var t_front = 0.55, t_back = 0.80;
    function tp(u, td_depth) {
      return { x: FL_p.x + u * W + td_depth * dx, y: FL_p.y - td_depth * dy };
    }
    var persp = [
      tp(u_left,  t_front),
      tp(u_right, t_front),
      tp(u_right, t_back),
      tp(u_left,  t_back),
    ];

    return td.map(function(p, i) { return lerpPt(p, persp[i], t); });
  }

  // ── SVG template ──────────────────────────────────────────────

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
      '  <ellipse id="apicem-shadow" fill="rgba(43,36,32,1)" fill-opacity="0.07"/>',
      '  <polygon id="apicem-right-face"      opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-front-face"      opacity="0" style="transition:fill .3s ease"/>',
      '  <path    id="apicem-front-face-path" opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-front-chamfer"   opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-top-face"        style="transition:fill .3s ease"/>',
      '  <path    id="apicem-top-face-rounded" style="display:none;transition:fill .3s ease"/>',
      '  <polygon id="apicem-grain-overlay"   filter="url(#apicem-grain-filter)"',
      '           style="display:none;pointer-events:none;will-change:opacity"/>',
      '  <polygon id="apicem-caixa"           style="display:none;transition:fill .3s ease"/>',
      '</svg>',
    ].join('\n');
  }

  // ── Utilities ─────────────────────────────────────────────────

  function lerp(a, b, t)         { return a + (b - a) * t; }
  function lerpPt(p0, p1, t)     { return { x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) }; }
  function r(n)                  { return Math.round(n); }
  function pts(arr)              { return arr.map(function(p){ return r(p.x)+','+r(p.y); }).join(' '); }

  function shade(hex, amount) {
    if (!hex || hex.length < 4) return '#888';
    var full = hex.replace('#', '');
    if (full.length === 3) full = full[0]+full[0]+full[1]+full[1]+full[2]+full[2];
    var n = parseInt(full, 16);
    var rv = Math.max(0, Math.min(255, (n >> 16)         + amount));
    var gv = Math.max(0, Math.min(255, ((n >> 8) & 0xFF) + amount));
    var bv = Math.max(0, Math.min(255, (n & 0xFF)         + amount));
    return '#' + ((1 << 24) + (rv << 16) + (gv << 8) + bv).toString(16).slice(1);
  }

  return { init: init, update: update, getCaption: getCaption, setMode: setMode };

})();
