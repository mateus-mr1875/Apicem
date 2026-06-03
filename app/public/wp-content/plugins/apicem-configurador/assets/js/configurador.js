/* Apicem Configurador — Wizard Controller */
'use strict';

(function () {

  var cfg = window.apicemConfig || {};
  var steps       = (cfg.wizard && cfg.wizard.steps) || [];
  var tamanhos    = cfg.tamanhos    || [];
  var bordas      = cfg.bordas      || [];
  var acabamentos = cfg.acabamentos || [];

  // Wizard state
  var state = {
    currentStep:  0,
    tamanho:      null,
    borda:        null,
    acabamento:   null,
    caixa:        false,
    caixaChosen:  false,
    cep:          '',
    rua:          '',
    numero:       '',
    complemento:  '',
    cidade:       '',
    uf:           '',
    lgpdConsent:  false,
  };

  var activeSteps = steps.filter(function(s){ return s.ativo; });

  // DOM refs
  var root, stepperEl, stepContentEl, previewWrap, captionEl, modalEl, modalBody;
  var trackingEnabled = false;

  function init() {
    root = document.getElementById('apicem-configurador');
    if (!root) return;

    stepperEl     = root.querySelector('.apicem-stepper');
    stepContentEl = root.querySelector('.apicem-step-content');
    previewWrap   = root.querySelector('.apicem-preview-wrap');
    captionEl     = root.querySelector('.apicem-preview-caption');
    modalEl       = root.querySelector('.apicem-modal-overlay');
    modalBody     = root.querySelector('.apicem-modal-body');

    ApicemPreview.init(previewWrap);
    ApicemPreview.update(state);

    setupTracking();
    renderStepper();
    renderStep(0);

    root.querySelector('.apicem-modal-close').addEventListener('click', closeModal);
    modalEl.addEventListener('click', function(e){ if (e.target === modalEl) closeModal(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !modalEl.hidden) closeModal(); });

    fireEvent('page_view');
  }

  // ── Stepper ────────────────────────────────────────────────
  // Shows steps 1–6 (excludes 'hero'). Numbering starts at 1.

  function renderStepper() {
    stepperEl.innerHTML = '';
    var visibleSteps  = activeSteps.filter(function(s){ return s.slug !== 'hero'; });
    var currentSlug   = activeSteps[state.currentStep] ? activeSteps[state.currentStep].slug : '';

    visibleSteps.forEach(function(step, i) {
      var origIndex = activeSteps.indexOf(step);

      if (i > 0) {
        var sep = document.createElement('span');
        sep.className = 'apicem-stepper-sep';
        sep.setAttribute('aria-hidden', 'true');
        stepperEl.appendChild(sep);
      }

      var item = document.createElement('button');
      item.type = 'button';
      var cls = 'apicem-stepper-item ';
      if (step.slug === currentSlug)    cls += 'is-active';
      else if (origIndex < state.currentStep) cls += 'is-done';
      else                              cls += 'is-future';
      item.className = cls;
      item.setAttribute('aria-label', 'Passo ' + (i + 1) + ': ' + step.titulo);
      if (origIndex > state.currentStep) item.setAttribute('aria-disabled', 'true');

      var dot = document.createElement('span');
      dot.className = 'apicem-stepper-dot';
      dot.textContent = i + 1;
      item.appendChild(dot);

      item.addEventListener('click', function() {
        if (origIndex <= state.currentStep) goToStep(origIndex);
      });
      stepperEl.appendChild(item);
    });
  }

  function stepClass(i) {
    if (i === state.currentStep) return 'is-active';
    if (i < state.currentStep)  return 'is-done';
    return 'is-future';
  }

  // ── Step rendering ─────────────────────────────────────────

  function renderStep(index) {
    state.currentStep = index;
    var step = activeSteps[index];
    if (!step) return;

    // Hero gets its own full-width layout; all others show the split layout
    root.classList.toggle('is-hero', step.slug === 'hero');

    renderStepper();

    var el = document.createElement('div');
    el.className = 'apicem-step';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Passo ' + step.numero);

    switch (step.slug) {
      case 'hero':       renderHero(el, step);       break;
      case 'tamanho':    renderTamanho(el, step);    break;
      case 'borda':      renderBorda(el, step);      break;
      case 'acabamento': renderAcabamento(el, step); break;
      case 'caixa':      renderCaixa(el, step);      break;
      case 'cep':        renderCep(el, step);        break;
      case 'resumo':
        openModal();
        // Keep currentStep at resumo so stepper reflects it, but don't
        // overwrite the step content (keep last visible step in background)
        return;
      default: renderGeneric(el, step);
    }

    stepContentEl.innerHTML = '';
    stepContentEl.appendChild(el);

    fireEvent('passo_visto', { passo_numero: step.numero });
  }

  function stepHeader(el, step) {
    if (step.kicker) {
      var k = document.createElement('p');
      k.className = 'apicem-kicker';
      k.textContent = step.kicker;
      el.appendChild(k);
    }
    var h = document.createElement('h2');
    h.className = 'apicem-step-title';
    h.textContent = step.titulo;
    el.appendChild(h);
    if (step.texto_apoio) {
      var p = document.createElement('p');
      p.className = 'apicem-step-text';
      p.textContent = step.texto_apoio;
      el.appendChild(p);
    }
  }

  // ── Step: Hero (Passo 0 — layout aspiracional full-width) ──

  function renderHero(el, step) {
    var hero = cfg.hero || {};

    // Text block (with its own internal padding via CSS)
    var content = document.createElement('div');
    content.className = 'apicem-hero-content';

    if (step.kicker) {
      var k = document.createElement('p');
      k.className = 'apicem-kicker';
      k.textContent = step.kicker;
      content.appendChild(k);
    }

    var h1 = document.createElement('h1');
    h1.className = 'apicem-hero-h1';
    h1.textContent = hero.h1 || step.titulo || 'A sua mesa, do seu jeito.';
    content.appendChild(h1);

    if (hero.h2 || step.texto_apoio) {
      var lead = document.createElement('p');
      lead.className = 'apicem-hero-lead';
      lead.textContent = hero.h2 || step.texto_apoio;
      content.appendChild(lead);
    }

    var nav = document.createElement('div');
    nav.className = 'apicem-nav';
    var btn = makeBtn('primary', hero.cta_texto || 'Monte a sua');
    btn.addEventListener('click', function() {
      fireEvent('configurador_iniciado');
      goToStep(1);
    });
    nav.appendChild(btn);
    content.appendChild(nav);
    el.appendChild(content);

    // Full-width media — no horizontal constraints
    if (hero.media_url) {
      var mediaWrap = document.createElement('div');
      mediaWrap.className = 'apicem-hero-media--full';
      var mediaEl;
      if (hero.media_type && hero.media_type.indexOf('video') === 0) {
        mediaEl = document.createElement('video');
        mediaEl.src = hero.media_url;
        mediaEl.autoplay = true;
        mediaEl.muted = true;
        mediaEl.loop = true;
        mediaEl.playsInline = true;
      } else {
        mediaEl = document.createElement('img');
        mediaEl.src = hero.media_url;
        mediaEl.alt = 'Mesa Apicem';
      }
      mediaWrap.appendChild(mediaEl);
      el.appendChild(mediaWrap);
    } else {
      var ph = document.createElement('div');
      ph.className = 'apicem-hero-video-placeholder';
      ph.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 3l14 9-14 9V3z" fill="currentColor" opacity=".4"/></svg><span>Vídeo em breve</span>';
      el.appendChild(ph);
    }
  }

  // ── Step: Tamanho ──────────────────────────────────────────

  function renderTamanho(el, step) {
    stepHeader(el, step);
    var grid = document.createElement('div');
    grid.className = 'apicem-options apicem-options--cards';

    tamanhos.forEach(function(t) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'apicem-option-card' + (state.tamanho && state.tamanho.id === t.id ? ' is-selected' : '');
      card.setAttribute('aria-pressed', !!(state.tamanho && state.tamanho.id === t.id));
      card.innerHTML = '<p class="apicem-option-card-title">' + esc(t.title) + '</p>' +
                       '<p class="apicem-option-card-desc">' + t.largura_cm + ' × ' + t.profundidade_cm + ' cm</p>';
      card.addEventListener('click', function() {
        state.tamanho = t;
        ApicemPreview.update(state);
        captionEl.textContent = ApicemPreview.getCaption(state);
        grid.querySelectorAll('.apicem-option-card').forEach(function(c){ c.classList.remove('is-selected'); c.setAttribute('aria-pressed','false'); });
        card.classList.add('is-selected');
        card.setAttribute('aria-pressed', 'true');
        fireEvent('tamanho_selecionado', { tamanho: t.title });
        var nextBtn = el.querySelector('.apicem-btn--primary');
        if (nextBtn) nextBtn.disabled = false;
      });
      grid.appendChild(card);
    });
    el.appendChild(grid);
    el.appendChild(navButtons(true));
  }

  // ── Step: Borda (Bisel removido; Curva com descrição completa) ──

  function renderBorda(el, step) {
    stepHeader(el, step);
    var grid = document.createElement('div');
    grid.className = 'apicem-options apicem-options--cards';

    var bordasVisiveis = bordas.filter(function(b){ return b.perfil !== 'chanfrada'; });

    bordasVisiveis.forEach(function(b) {
      var desc = b.descricao;
      if (b.perfil === 'arredondada') {
        desc = 'Cantos arredondados, bordas chanfradas e emborrachadas — toque suave e seguro.';
      }

      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'apicem-option-card' + (state.borda && state.borda.id === b.id ? ' is-selected' : '');
      card.setAttribute('aria-pressed', !!(state.borda && state.borda.id === b.id));
      card.innerHTML = '<p class="apicem-option-card-title">' + esc(b.title) + '</p>' +
                       '<p class="apicem-option-card-desc">' + esc(desc) + '</p>';
      card.addEventListener('click', function() {
        state.borda = b;
        ApicemPreview.update(state);
        captionEl.textContent = ApicemPreview.getCaption(state);
        grid.querySelectorAll('.apicem-option-card').forEach(function(c){ c.classList.remove('is-selected'); c.setAttribute('aria-pressed','false'); });
        card.classList.add('is-selected');
        card.setAttribute('aria-pressed', 'true');
        fireEvent('borda_selecionada', { borda: b.title });
        var nextBtn = el.querySelector('.apicem-btn--primary');
        if (nextBtn) nextBtn.disabled = false;
      });
      grid.appendChild(card);
    });
    el.appendChild(grid);
    el.appendChild(navButtons(true));
  }

  // ── Step: Acabamento ───────────────────────────────────────

  function renderAcabamento(el, step) {
    stepHeader(el, step);

    var swatchContainer = document.createElement('div');
    swatchContainer.className = 'apicem-swatches';
    swatchContainer.setAttribute('role', 'listbox');
    swatchContainer.setAttribute('aria-label', 'Acabamentos disponíveis');

    var nameDisplay = document.createElement('p');
    nameDisplay.className = 'apicem-acabamento-selected-name';
    nameDisplay.textContent = state.acabamento ? state.acabamento.title : 'Selecione um acabamento';

    acabamentos.forEach(function(a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apicem-swatch' + (state.acabamento && state.acabamento.id === a.id ? ' is-selected' : '');
      btn.style.backgroundColor = a.hex;
      btn.setAttribute('aria-label', a.title);
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', !!(state.acabamento && state.acabamento.id === a.id));
      btn.setAttribute('title', a.title);

      if (a.tipo === 'madeira') {
        btn.style.backgroundImage = 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px)';
      }

      var label = document.createElement('span');
      label.className = 'apicem-swatch-label';
      label.textContent = a.title;
      label.setAttribute('aria-hidden', 'true');
      btn.appendChild(label);

      btn.addEventListener('click', function() {
        state.acabamento = a;
        ApicemPreview.update(state);
        captionEl.textContent = ApicemPreview.getCaption(state);
        nameDisplay.textContent = a.title;
        swatchContainer.querySelectorAll('.apicem-swatch').forEach(function(s){ s.classList.remove('is-selected'); s.setAttribute('aria-selected','false'); });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-selected', 'true');
        fireEvent('acabamento_selecionado', { acabamento: a.title });
        var nextBtn = el.querySelector('.apicem-btn--primary');
        if (nextBtn) nextBtn.disabled = false;
      });
      swatchContainer.appendChild(btn);
    });

    el.appendChild(swatchContainer);
    el.appendChild(nameDisplay);
    el.appendChild(navButtons(true));
  }

  // ── Step: Caixa elétrica ───────────────────────────────────

  function renderCaixa(el, step) {
    var caixaCfg = cfg.caixa_eletrica || {};
    if (!caixaCfg.ativo) { goToStep(state.currentStep + 1); return; }

    stepHeader(el, step);

    var group = document.createElement('div');
    group.className = 'apicem-toggle-group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Caixa elétrica');

    ['Sim', 'Não'].forEach(function(label, i) {
      var val = i === 0;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'apicem-toggle-btn' + (state.caixaChosen && state.caixa === val ? ' is-selected' : '');
      btn.textContent = label;
      btn.setAttribute('aria-pressed', state.caixaChosen && state.caixa === val);
      btn.addEventListener('click', function() {
        state.caixa = val;
        state.caixaChosen = true;
        ApicemPreview.update(state);
        group.querySelectorAll('.apicem-toggle-btn').forEach(function(b){ b.classList.remove('is-selected'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        fireEvent('caixa_eletrica_selecionada', { caixa: val ? 'sim' : 'não' });
        var nextBtn = el.querySelector('.apicem-btn--primary');
        if (nextBtn) nextBtn.disabled = false;
      });
      group.appendChild(btn);
    });

    el.appendChild(group);
    el.appendChild(navButtons(true));
  }

  // ── Step: CEP / Endereço ───────────────────────────────────

  function renderCep(el, step) {
    var entrega = cfg.entrega || {};
    stepHeader(el, step);

    var group = document.createElement('div');
    group.className = 'apicem-cep-group';

    // CEP
    group.appendChild(fieldLabel('CEP', 'apicem-cep'));
    var cepInput = makeInput('apicem-cep', 'text', state.cep ? (state.cep.slice(0,5) + (state.cep.length > 5 ? '-' + state.cep.slice(5) : '')) : '');
    cepInput.placeholder = '00000-000';
    cepInput.maxLength = 9;
    cepInput.setAttribute('inputmode', 'numeric');
    group.appendChild(cepInput);

    // Rua (readonly)
    group.appendChild(fieldLabel('Rua', 'apicem-rua'));
    var ruaInput = makeInput('apicem-rua', 'text', state.rua || '');
    ruaInput.readOnly = true;
    ruaInput.placeholder = 'Preenchido automaticamente';
    group.appendChild(ruaInput);

    // Número + Complemento inline
    var inlineRow = document.createElement('div');
    inlineRow.className = 'apicem-cep-inline';

    var numGroup = document.createElement('div');
    numGroup.appendChild(fieldLabel('Número', 'apicem-numero'));
    var numInput = makeInput('apicem-numero', 'text', state.numero || '');
    numInput.placeholder = '000';
    numInput.setAttribute('inputmode', 'numeric');
    numGroup.appendChild(numInput);

    var compGroup = document.createElement('div');
    compGroup.appendChild(fieldLabel('Complemento', 'apicem-complemento'));
    var compInput = makeInput('apicem-complemento', 'text', state.complemento || '');
    compInput.placeholder = 'Apto, bloco…';
    compGroup.appendChild(compInput);

    inlineRow.appendChild(numGroup);
    inlineRow.appendChild(compGroup);
    group.appendChild(inlineRow);

    // Cidade / Estado (readonly)
    group.appendChild(fieldLabel('Cidade / Estado', 'apicem-cidade'));
    var locationInput = makeInput('apicem-cidade', 'text', state.cidade ? state.cidade + ' / ' + state.uf : '');
    locationInput.readOnly = true;
    locationInput.placeholder = 'Preenchido automaticamente';
    group.appendChild(locationInput);

    // Hint
    var hint = document.createElement('p');
    hint.className = 'apicem-cep-hint';
    group.appendChild(hint);

    el.appendChild(group);

    // Listeners
    numInput.addEventListener('input',  function(){ state.numero      = this.value; });
    compInput.addEventListener('input', function(){ state.complemento = this.value; });

    if (entrega.cep_autocomplete !== false) {
      cepInput.addEventListener('input', function() {
        var raw = this.value.replace(/\D/g,'');
        this.value = raw.length > 5 ? raw.slice(0,5) + '-' + raw.slice(5,8) : raw;
        state.cep = raw;
        if (raw.length === 8) {
          fetchCep(raw, ruaInput, locationInput, hint);
        } else {
          ruaInput.value    = '';
          locationInput.value = '';
          state.rua    = '';
          state.cidade = '';
          state.uf     = '';
        }
      });
    }

    el.appendChild(navButtons(false));
  }

  function fieldLabel(text, forId) {
    var lbl = document.createElement('label');
    lbl.className = 'apicem-form-label';
    lbl.htmlFor   = forId;
    lbl.textContent = text;
    return lbl;
  }

  function makeInput(id, type, value) {
    var inp = document.createElement('input');
    inp.type      = type;
    inp.id        = id;
    inp.className = 'apicem-input';
    inp.value     = value;
    return inp;
  }

  function fetchCep(cep, ruaEl, locationEl, hintEl) {
    var timeout = new Promise(function(_, reject){ setTimeout(function(){ reject(new Error('timeout')); }, 3000); });
    var request = fetch('https://viacep.com.br/ws/' + cep + '/json/').then(function(r){ return r.json(); });

    Promise.race([request, timeout]).then(function(data) {
      if (data.erro) {
        hintEl.textContent    = 'CEP não encontrado. Você pode continuar assim mesmo.';
        ruaEl.value           = '';
        locationEl.value      = '';
        return;
      }
      state.rua    = data.logradouro || '';
      state.cidade = data.localidade || '';
      state.uf     = data.uf         || '';
      ruaEl.value       = state.rua;
      locationEl.value  = state.cidade + ' / ' + state.uf;
      hintEl.textContent = '';
      fireEvent('cep_preenchido', { cep: cep, cidade: state.cidade, uf: state.uf });
    }).catch(function() {
      hintEl.textContent = 'Não foi possível consultar o CEP. Você pode continuar assim mesmo.';
    });
  }

  // ── Generic step ───────────────────────────────────────────

  function renderGeneric(el, step) {
    stepHeader(el, step);
    el.appendChild(navButtons(false));
  }

  // ── Navigation ─────────────────────────────────────────────

  function navButtons(requiresChoice) {
    var nav = document.createElement('div');
    nav.className = 'apicem-nav';

    if (state.currentStep > 0) {
      var back = makeBtn('secondary', '← Voltar');
      back.addEventListener('click', function(){ goToStep(state.currentStep - 1); });
      nav.appendChild(back);
    }

    var next = makeBtn('primary', state.currentStep >= activeSteps.length - 2 ? 'Ver resumo →' : 'Continuar →');
    if (requiresChoice) {
      next.disabled = !canAdvance(state.currentStep);
    }
    next.addEventListener('click', function() {
      if (!canAdvance(state.currentStep)) return;
      goToStep(state.currentStep + 1);
    });
    nav.appendChild(next);

    return nav;
  }

  function canAdvance(stepIndex) {
    var slug = activeSteps[stepIndex] ? activeSteps[stepIndex].slug : '';
    if (slug === 'tamanho')    return !!state.tamanho;
    if (slug === 'borda')      return !!state.borda;
    if (slug === 'acabamento') return !!state.acabamento;
    if (slug === 'caixa')      return state.caixaChosen;
    return true;
  }

  function goToStep(index) {
    if (index < 0 || index >= activeSteps.length) return;
    var slug = activeSteps[index] ? activeSteps[index].slug : '';
    var isTopView = (slug === 'hero' || slug === 'tamanho');
    ApicemPreview.setMode(isTopView ? 'top' : 'perspective');
    renderStep(index);
    stepContentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function makeBtn(type, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'apicem-btn apicem-btn--' + type;
    btn.textContent = label;
    return btn;
  }

  // ── Modal (step Resumo + envio) ────────────────────────────

  function openModal() {
    modalBody.innerHTML = '';

    var h = document.createElement('h2');
    h.id = 'apicem-modal-title';
    h.className = 'apicem-step-title';
    h.style.margin = '0';
    h.textContent = 'O seu orçamento';
    modalBody.appendChild(h);

    var previewClone = document.createElement('div');
    previewClone.className = 'apicem-modal-preview';
    ApicemPreview.init(previewClone);
    ApicemPreview.update(state);
    modalBody.appendChild(previewClone);

    modalBody.appendChild(buildSummary());
    modalBody.appendChild(buildForm());

    modalEl.removeAttribute('hidden');
    modalEl.querySelector('.apicem-modal-close').focus();
  }

  function closeModal() {
    modalEl.setAttribute('hidden', '');
    // Restore main preview (modal's init() overwrites the singleton refs)
    ApicemPreview.init(previewWrap);
    ApicemPreview.update(state);
    // Go back to the step before resumo so user can re-open the modal
    var resumoIdx = activeSteps.findIndex(function(s){ return s.slug === 'resumo'; });
    if (resumoIdx > 0 && state.currentStep >= resumoIdx) {
      renderStep(resumoIdx - 1);
    }
  }

  function buildSummary() {
    var div = document.createElement('div');
    div.className = 'apicem-summary';

    var enderecoVal = '—';
    if (state.rua || state.cidade) {
      enderecoVal = (state.rua || '') +
                    (state.numero ? ', ' + state.numero : '') +
                    (state.complemento ? ' — ' + state.complemento : '');
      if (state.cidade) enderecoVal += ' · ' + state.cidade + '/' + state.uf;
    } else if (state.cep) {
      enderecoVal = state.cep;
    }

    var rows = [
      ['Tamanho',        state.tamanho    ? state.tamanho.title    : '—'],
      ['Borda',          state.borda      ? state.borda.title      : '—'],
      ['Acabamento',     state.acabamento ? state.acabamento.title : '—'],
      ['Caixa elétrica', state.caixaChosen ? (state.caixa ? 'Sim' : 'Não') : '—'],
      ['Endereço',       enderecoVal],
    ];

    rows.forEach(function(r) {
      var row = document.createElement('div');
      row.className = 'apicem-summary-row';
      row.innerHTML = '<span class="apicem-summary-label">' + esc(r[0]) + '</span>' +
                      '<span class="apicem-summary-value">' + esc(r[1]) + '</span>';
      div.appendChild(row);
    });
    return div;
  }

  function buildForm() {
    var leadCfg = cfg.lead || {};
    var campos  = leadCfg.campos  || ['nome','telefone','email'];
    var labels  = leadCfg.labels  || {};

    var form = document.createElement('div');
    form.className = 'apicem-form';

    var inputs = {};

    campos.forEach(function(key) {
      var label = labels[key] || key;
      var field = document.createElement('div');
      field.className = 'apicem-form-field';

      var lbl = document.createElement('label');
      lbl.className = 'apicem-form-label';
      lbl.htmlFor = 'apicem-field-' + key;
      lbl.innerHTML = esc(label) + ' <span class="apicem-required" aria-hidden="true">*</span>';

      var inp = document.createElement('input');
      inp.type  = key === 'email' ? 'email' : key === 'telefone' ? 'tel' : 'text';
      inp.id    = 'apicem-field-' + key;
      inp.className = 'apicem-input';
      inp.required  = true;
      inp.setAttribute('aria-required', 'true');

      var err = document.createElement('span');
      err.className = 'apicem-form-error';
      err.setAttribute('role', 'alert');

      inputs[key] = { el: inp, err: err };
      field.appendChild(lbl);
      field.appendChild(inp);
      field.appendChild(err);
      form.appendChild(field);
    });

    // LGPD
    var lgpdField = document.createElement('div');
    lgpdField.className = 'apicem-form-field';
    var lgpdLabel = document.createElement('label');
    lgpdLabel.className = 'apicem-lgpd';
    var lgpdCheck = document.createElement('input');
    lgpdCheck.type = 'checkbox';
    lgpdCheck.id   = 'apicem-lgpd';
    lgpdCheck.required = true;
    var lgpdText = document.createElement('span');
    var politicaUrl = esc(leadCfg.politica_url || '/politica-de-privacidade');
    var lgpdTxt     = esc(leadCfg.lgpd_texto   || 'Li e aceito a Política de Privacidade.');
    lgpdText.innerHTML = lgpdTxt.replace('Política de Privacidade',
      '<a href="' + politicaUrl + '" target="_blank">Política de Privacidade</a>');
    lgpdLabel.appendChild(lgpdCheck);
    lgpdLabel.appendChild(lgpdText);
    var lgpdErr = document.createElement('span');
    lgpdErr.className = 'apicem-form-error';
    lgpdErr.setAttribute('role', 'alert');
    lgpdField.appendChild(lgpdLabel);
    lgpdField.appendChild(lgpdErr);
    form.appendChild(lgpdField);

    // Submit
    var waCfg     = cfg.whatsapp || {};
    var submitBtn = makeBtn('primary', 'Receber meu orçamento no WhatsApp');
    submitBtn.style.width     = '100%';
    submitBtn.style.marginTop = '8px';
    if (!waCfg.telefone) {
      submitBtn.disabled = true;
      submitBtn.title    = 'Número de WhatsApp não configurado.';
    }

    submitBtn.addEventListener('click', function() {
      var valid = true;

      Object.values(inputs).forEach(function(f){ f.err.textContent = ''; });
      lgpdErr.textContent = '';

      campos.forEach(function(key) {
        var f = inputs[key];
        if (!f.el.value.trim()) {
          f.err.textContent = 'Campo obrigatório.';
          valid = false;
        } else if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.el.value)) {
          f.err.textContent = 'E-mail inválido.';
          valid = false;
        }
      });
      if (!lgpdCheck.checked) {
        lgpdErr.textContent = 'Você precisa aceitar a Política de Privacidade.';
        valid = false;
      }
      if (!valid) return;

      trackingEnabled      = true;
      state.lgpdConsent    = true;

      var leadData = {};
      campos.forEach(function(k){ leadData[k] = inputs[k].el.value.trim(); });

      fireEvent('lead_enviado', {
        tamanho:    state.tamanho    ? state.tamanho.title    : '',
        borda:      state.borda      ? state.borda.title      : '',
        acabamento: state.acabamento ? state.acabamento.title : '',
      });
      firePixel('Lead');
      firePixel('Contact');
      sendToWhatsapp(leadData);
    });
    form.appendChild(submitBtn);

    return form;
  }

  // ── WhatsApp ───────────────────────────────────────────────

  function sendToWhatsapp(lead) {
    var waCfg = cfg.whatsapp || {};
    var tel   = waCfg.telefone || '';
    if (!tel) return;

    var msg = (waCfg.template || '')
      .replace('{tamanho}',      state.tamanho    ? state.tamanho.title    : '')
      .replace('{borda}',        state.borda      ? state.borda.title      : '')
      .replace('{acabamento}',   state.acabamento ? state.acabamento.title : '')
      .replace('{sim_nao}',      state.caixa ? 'Sim' : 'Não')
      .replace('{rua}',          state.rua          || '')
      .replace('{numero}',       state.numero       || '')
      .replace('{complemento}',  state.complemento  || '')
      .replace('{cep}',          state.cep          || '')
      .replace('{cidade}',       state.cidade       || '')
      .replace('{uf}',           state.uf           || '')
      .replace('{nome}',         lead.nome          || '')
      .replace('{email}',        lead.email         || '')
      .replace('{telefone}',     lead.telefone      || '');

    window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  }

  // ── Tracking ───────────────────────────────────────────────

  function setupTracking() {}

  function fireEvent(name, params) {
    var preCons = (name === 'page_view');
    if (!preCons && !trackingEnabled) return;
    var integr = cfg.integracoes || {};
    if (integr.ga4_id && window.gtag) window.gtag('event', name, params || {});
  }

  function firePixel(eventName) {
    if (!trackingEnabled) return;
    var integr = cfg.integracoes || {};
    if (integr.pixel_id && window.fbq) window.fbq('track', eventName);
  }

  // ── Utility ────────────────────────────────────────────────

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Bootstrap ──────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
