/* Apicem SVG Preview Engine — v3: proportions and border profiles faithful to sketch */
'use strict';

window.ApicemPreview = (function () {

  var svg, topFace, topFaceRounded, grainOverlay;
  var frontFace, frontFacePath, frontChamfer;
  var rightFace, rightChamfer;
  var cornerCapLeft, cornerCapRight;
  var shadowEl, caixaEl;

  // ── Constants ──────────────────────────────────────────────────
  var CANVAS_W      = 560;
  var CANVAS_H      = 280;
  var SCALE         = 2.5;
  var ANGLE_RAD     = 32 * Math.PI / 180;  // steeper angle → more top surface visible
  var DEPTH_F       = 0.65;
  var PROF          = 70;
  var EDGE_H        = 28;                   // thinner edge (matches sketch)
  var CHAMFER_H     = 10;                   // ≈36% of EDGE_H
  var CORNER_R      = 40;                   // large corner radius (matches sketch)
  var ROUND_DIP     = 6;
  var ANIM_DURATION = 600;

  // dx ≈ 97px, dy ≈ 60px (top face dominates 2× the edge height)
  var dx = Math.round(PROF * DEPTH_F * Math.cos(ANGLE_RAD) * SCALE);
  var dy = Math.round(PROF * DEPTH_F * Math.sin(ANGLE_RAD) * SCALE);

  var D_TOP    = Math.round(PROF * SCALE);  // 175px — top-down depth
  var CX_TOP   = CANVAS_W / 2;             // 280
  var CY_TOP   = CANVAS_H / 2;             // 140
  var CX_PERSP = CANVAS_W / 2 - dx / 2;   // ≈232
  var FRONT_Y  = 160;                       // recentered for better canvas balance

  var currentT  = 0;
  var targetT   = 0;
  var lastState = {};
  var animFrame = null;

  // ── Public API ─────────────────────────────────────────────────

  function init(container) {
    container.innerHTML = buildSVG();
    svg            = container.querySelector('svg');
    shadowEl       = svg.querySelector('#apicem-shadow');
    rightFace      = svg.querySelector('#apicem-right-face');
    rightChamfer   = svg.querySelector('#apicem-right-chamfer');
    frontFace      = svg.querySelector('#apicem-front-face');
    frontFacePath  = svg.querySelector('#apicem-front-face-path');
    frontChamfer   = svg.querySelector('#apicem-front-chamfer');
    cornerCapLeft  = svg.querySelector('#apicem-corner-cap-left');
    cornerCapRight = svg.querySelector('#apicem-corner-cap-right');
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

  // ── Animation ──────────────────────────────────────────────────

  function animateT() {
    if (animFrame) cancelAnimationFrame(animFrame);
    var startT    = currentT;
    var startTime = null;
    animFrame = requestAnimationFrame(function step(now) {
      if (!startTime) startTime = now;
      var p = Math.min((now - startTime) / ANIM_DURATION, 1);
      var e = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
      currentT = startT + (targetT - startT) * e;
      updateGeometry(currentT, lastState);
      if (p < 1) animFrame = requestAnimationFrame(step);
      else { currentT = targetT; animFrame = null; }
    });
  }

  // ── Geometry update ────────────────────────────────────────────

  function updateGeometry(t, state) {
    if (!svg) return;

    var largura = state.tamanho ? state.tamanho.largura_cm : 140;
    var hex     = state.acabamento ? state.acabamento.hex  : '#E7DBC9';
    var tipo    = state.acabamento ? state.acabamento.tipo : 'solido';
    var seedId  = state.acabamento ? (state.acabamento.id % 20) : 2;
    var perfil  = state.borda ? state.borda.perfil : 'reta';

    var W = Math.round(largura * SCALE);

    // Top-down vertices (rectangle centred in canvas)
    var FL_td = { x: CX_TOP - Math.floor(W/2), y: CY_TOP - Math.floor(D_TOP/2) };
    var FR_td = { x: CX_TOP + Math.ceil(W/2),  y: CY_TOP - Math.floor(D_TOP/2) };
    var BR_td = { x: CX_TOP + Math.ceil(W/2),  y: CY_TOP + Math.ceil(D_TOP/2) };
    var BL_td = { x: CX_TOP - Math.floor(W/2), y: CY_TOP + Math.ceil(D_TOP/2) };

    // Perspective vertices (cabinet oblique)
    var FL_p = { x: CX_PERSP - Math.floor(W/2), y: FRONT_Y };
    var FR_p = { x: CX_PERSP + Math.ceil(W/2),  y: FRONT_Y };
    var BR_p = { x: FR_p.x + dx, y: FRONT_Y - dy };
    var BL_p = { x: FL_p.x + dx, y: FRONT_Y - dy };

    // Interpolated
    var FL    = lerpPt(FL_td, FL_p, t);
    var FR    = lerpPt(FR_td, FR_p, t);
    var BR    = lerpPt(BR_td, BR_p, t);
    var BL    = lerpPt(BL_td, BL_p, t);
    var edgeH = lerp(0, EDGE_H, t);

    var FLb = { x: FL.x, y: FL.y + edgeH };
    var FRb = { x: FR.x, y: FR.y + edgeH };
    var BRb = { x: BR.x, y: BR.y + edgeH };

    // Shadow
    shadowEl.setAttribute('cx', r(lerp(CX_TOP, (FL_p.x+FR_p.x)/2, t)));
    shadowEl.setAttribute('cy', r(lerp(CY_TOP+D_TOP/2+10, FRONT_Y+EDGE_H+8, t)));
    shadowEl.setAttribute('rx', r(lerp(W*0.36, W*0.44, t)));
    shadowEl.setAttribute('ry', r(lerp(4, 7, t)));
    shadowEl.setAttribute('fill-opacity', lerp(0.07, 0.15, t).toFixed(3));

    // Top face
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

    // Wood grain overlay — fill must match the tampo hex so multiply() works correctly
    if (tipo === 'madeira') {
      grainOverlay.setAttribute('points', pts([FL, FR, BR, BL]));
      grainOverlay.setAttribute('fill', hex);
      svg.querySelector('#apicem-grain-filter feTurbulence').setAttribute('seed', seedId);
      grainOverlay.style.display = '';
    } else {
      grainOverlay.style.display = 'none';
    }

    // All face/edge rendering — borda-specific
    applyBorda(perfil, FL, FR, BR, FLb, FRb, BRb, hex, edgeH, t);

    // Caixa elétrica — always neutral warm-gray, slightly rounded corners
    if (state.caixa) {
      caixaEl.setAttribute('d',    roundedPolygonPath(computeCaixa(FL_td, FL_p, W, t), 0.12));
      caixaEl.setAttribute('fill', '#A09B95');
      caixaEl.style.display = '';
    } else {
      caixaEl.style.display = 'none';
    }
  }

  // ── Border profiles ────────────────────────────────────────────

  function applyBorda(perfil, FL, FR, BR, FLb, FRb, BRb, hex, edgeH, t) {
    var op = t.toFixed(3);

    // Reset all face elements
    [frontFace, frontFacePath, frontChamfer, rightFace, rightChamfer,
     cornerCapLeft, cornerCapRight].forEach(function(el) {
      el.setAttribute('opacity', '0');
    });

    if (perfil === 'reta') {
      rightFace.setAttribute('points', pts([FR, BR, BRb, FRb]));
      rightFace.setAttribute('fill',   shade(hex, -50));
      rightFace.setAttribute('opacity', op);

      frontFace.setAttribute('points', pts([FL, FR, FRb, FLb]));
      frontFace.setAttribute('fill',   shade(hex, -30));
      frontFace.setAttribute('opacity', op);

    } else if (perfil === 'chanfrada') {
      var ch  = Math.min(CHAMFER_H, edgeH * 0.36);
      var FLc = { x: FL.x, y: FL.y + ch };
      var FRc = { x: FR.x, y: FR.y + ch };
      var BRc = { x: BR.x, y: BR.y + ch };

      // Right face: chamfer strip (lighter) + main face (darker)
      rightChamfer.setAttribute('points', pts([FR, BR, BRc, FRc]));
      rightChamfer.setAttribute('fill',   shade(hex, +8));
      rightChamfer.setAttribute('opacity', op);

      rightFace.setAttribute('points', pts([FRc, BRc, BRb, FRb]));
      rightFace.setAttribute('fill',   shade(hex, -50));
      rightFace.setAttribute('opacity', op);

      // Front face: chamfer strip (clearly lighter) + main face
      frontChamfer.setAttribute('points', pts([FL, FR, FRc, FLc]));
      frontChamfer.setAttribute('fill',   shade(hex, +18));
      frontChamfer.setAttribute('opacity', op);

      frontFace.setAttribute('points', pts([FLc, FRc, FRb, FLb]));
      frontFace.setAttribute('fill',   shade(hex, -30));
      frontFace.setAttribute('opacity', op);

    } else if (perfil === 'arredondada') {
      // Corner radius capped at edge height so arcs don't exceed the face
      var CR   = Math.min(CORNER_R, edgeH);
      var midX = (FL.x + FR.x) / 2;

      // Right face — corner caps overlay the junction
      rightFace.setAttribute('points', pts([FR, BR, BRb, FRb]));
      rightFace.setAttribute('fill',   shade(hex, -50));
      rightFace.setAttribute('opacity', op);

      // Front face: curved top + corner arcs at sides
      var d = [
        'M', r(FL.x + CR), ',', r(FL.y),
        ' Q', r(midX), ',', r(FL.y + ROUND_DIP), ' ', r(FR.x - CR), ',', r(FR.y),
        ' A', CR, ',', CR, ',0,0,1,', r(FR.x), ',', r(FR.y + CR),
        ' L', r(FRb.x), ',', r(FRb.y),
        ' L', r(FLb.x), ',', r(FLb.y),
        ' L', r(FL.x), ',', r(FL.y + CR),
        ' Z',
      ].join('');
      frontFacePath.setAttribute('d',       d);
      frontFacePath.setAttribute('fill',    shade(hex, -30));
      frontFacePath.setAttribute('opacity', op);

      // Corner cap left — pie-wedge at FL showing 3D rounded corner
      // Arc: clockwise from (FL.x+CR, FL.y) to (FL.x, FL.y+CR), centre = FL
      var capL = [
        'M', r(FL.x), ',', r(FL.y),
        ' L', r(FL.x + CR), ',', r(FL.y),
        ' A', CR, ',', CR, ',0,0,1,', r(FL.x), ',', r(FL.y + CR),
        ' Z',
      ].join('');
      cornerCapLeft.setAttribute('d',       capL);
      cornerCapLeft.setAttribute('fill',    shade(hex, -40));
      cornerCapLeft.setAttribute('opacity', op);

      // Corner cap right — pie-wedge at FR
      // Arc: counter-clockwise from (FR.x-CR, FR.y) to (FR.x, FR.y+CR), centre = FR
      var capR = [
        'M', r(FR.x), ',', r(FR.y),
        ' L', r(FR.x - CR), ',', r(FR.y),
        ' A', CR, ',', CR, ',0,0,0,', r(FR.x), ',', r(FR.y + CR),
        ' Z',
      ].join('');
      cornerCapRight.setAttribute('d',       capR);
      cornerCapRight.setAttribute('fill',    shade(hex, -40));
      cornerCapRight.setAttribute('opacity', op);
    }
  }

  // Top face with rounded corners (arredondada)
  function roundedTopPath(FL, FR, BR, BL, t) {
    var CR      = CORNER_R;
    var CR_back = Math.round(CORNER_R * (1 - t)); // back corners fade to sharp in perspective

    if (CR_back < 1) {
      // Perspective: front corners rounded, back corners sharp
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

    // Top-down or mid-animation: all four corners rounded
    return [
      'M', r(FL.x + CR), ',', r(FL.y),
      ' Q', r(FL.x), ',', r(FL.y),   ' ', r(FL.x), ',', r(FL.y + CR_back),
      ' L', r(FL.x), ',', r(BL.y - CR_back),
      ' Q', r(FL.x), ',', r(BL.y),   ' ', r(FL.x + CR_back), ',', r(BL.y),
      ' L', r(BR.x - CR_back), ',', r(BR.y),
      ' Q', r(BR.x), ',', r(BR.y),   ' ', r(BR.x), ',', r(BR.y - CR_back),
      ' L', r(FR.x), ',', r(FR.y + CR_back),
      ' Q', r(FR.x), ',', r(FR.y),   ' ', r(FR.x - CR), ',', r(FR.y),
      ' L', r(FL.x + CR), ',', r(FL.y),
      ' Z',
    ].join('');
  }

  // Caixa elétrica — interpolated between top-down rect and perspective parallelogram
  function computeCaixa(FL_td, FL_p, W, t) {
    var cW_ratio = 0.28;
    var u_left   = (1 - cW_ratio) / 2;
    var u_right  = u_left + cW_ratio;

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

    function tp(u, depth) {
      return { x: FL_p.x + u * W + depth * dx, y: FL_p.y - depth * dy };
    }
    var persp = [
      tp(u_left,  0.55), tp(u_right, 0.55),
      tp(u_right, 0.80), tp(u_left,  0.80),
    ];

    return td.map(function(p, i) { return lerpPt(p, persp[i], t); });
  }

  // ── SVG template ───────────────────────────────────────────────
  // Z-order (painter's): shadow, right-face, right-chamfer, front-face/path,
  // front-chamfer, corner-caps, top-face/rounded, grain, caixa

  function buildSVG() {
    return [
      '<svg id="apicem-preview-svg" viewBox="0 0 560 280" xmlns="http://www.w3.org/2000/svg"',
      '     role="img" aria-label="Preview da mesa">',
      '  <defs>',
      '    <!-- Organic wood grain: directional fibers + knot noise, soft-light blend clipped to polygon shape -->',
      '    <filter id="apicem-grain-filter" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">',
      '      <feTurbulence type="turbulence"   baseFrequency="0.012 0.40" numOctaves="5" seed="2" result="fibers"/>',
      '      <feTurbulence type="fractalNoise" baseFrequency="0.06 0.06"  numOctaves="3" seed="7" result="knots"/>',
      '      <feBlend in="fibers" in2="knots" mode="screen" result="combined"/>',
      '      <feColorMatrix in="combined" type="saturate" values="0" result="gray"/>',
      '      <feComponentTransfer in="gray" result="grain">',
      '        <feFuncR type="gamma" amplitude="1" exponent="0.85" offset="0"/>',
      '        <feFuncG type="gamma" amplitude="1" exponent="0.85" offset="0"/>',
      '        <feFuncB type="gamma" amplitude="1" exponent="0.85" offset="0"/>',
      '      </feComponentTransfer>',
      '      <feBlend in="SourceGraphic" in2="grain" mode="soft-light" result="blended"/>',
      '      <feComposite in="blended" in2="SourceGraphic" operator="in"/>',
      '    </filter>',
      '  </defs>',
      '  <ellipse id="apicem-shadow"          fill="rgba(43,36,32,1)" fill-opacity="0.07"/>',
      '  <polygon id="apicem-right-face"       opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-right-chamfer"    opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-front-face"       opacity="0" style="transition:fill .3s ease"/>',
      '  <path    id="apicem-front-face-path"  opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-front-chamfer"    opacity="0" style="transition:fill .3s ease"/>',
      '  <path    id="apicem-corner-cap-left"  opacity="0" style="transition:fill .3s ease"/>',
      '  <path    id="apicem-corner-cap-right" opacity="0" style="transition:fill .3s ease"/>',
      '  <polygon id="apicem-top-face"         style="transition:fill .3s ease"/>',
      '  <path    id="apicem-top-face-rounded"  style="display:none;transition:fill .3s ease"/>',
      '  <polygon id="apicem-grain-overlay"    filter="url(#apicem-grain-filter)"',
      '           style="display:none;pointer-events:none;will-change:opacity"/>',
      '  <path    id="apicem-caixa"            style="display:none;transition:fill .3s ease"/>',
      '</svg>',
    ].join('\n');
  }

  // ── Utilities ──────────────────────────────────────────────────

  function lerp(a, b, t)     { return a + (b - a) * t; }
  function lerpPt(p0, p1, t) { return { x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) }; }
  function r(n)              { return Math.round(n); }
  function pts(arr)          { return arr.map(function(p){ return r(p.x)+','+r(p.y); }).join(' '); }

  function shade(hex, amount) {
    if (!hex || hex.length < 4) return '#888';
    var full = hex.replace('#', '');
    if (full.length === 3) full = full[0]+full[0]+full[1]+full[1]+full[2]+full[2];
    var n  = parseInt(full, 16);
    var rv = Math.max(0, Math.min(255, (n >> 16)         + amount));
    var gv = Math.max(0, Math.min(255, ((n >> 8) & 0xFF) + amount));
    var bv = Math.max(0, Math.min(255, (n & 0xFF)         + amount));
    return '#' + ((1 << 24) + (rv << 16) + (gv << 8) + bv).toString(16).slice(1);
  }

  // Rounded polygon path — bezier arcs at each vertex (works for rect and parallelogram)
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

  return { init: init, update: update, getCaption: getCaption, setMode: setMode };

})();
