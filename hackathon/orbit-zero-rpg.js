(() => {
  'use strict';

  const SCHEMA_VERSION = 3;
  const ACTIVE_USER_KEY = 'orbitzero:active-user';
  const PROFILE_PREFIX = 'orbitzero:profile:';
  const WORLD = { width: 1600, height: 1000, viewWidth: 960, viewHeight: 600, playerRadius: 15, spawn: { x: 800, y: 500 } };
  const $ = (id) => document.getElementById(id);
  const ui = {
    avatarOptions: $('avatar-options'), colorOptions: $('color-options'), avatarPreview: $('avatar-preview'),
    avatarName: $('avatar-name'), avatarAura: $('avatar-aura'), userId: $('user-id'), accountStatus: $('account-status'),
    returningUser: $('returning-user'), start: $('start-button'), resume: $('resume-profile'),
    missionCount: $('mission-count'), collisionCount: $('collision-count'), activeMission: $('active-mission'),
    missionList: $('mission-list'), worldTip: $('world-tip'), prompt: $('interaction-prompt'), promptText: $('interaction-text'),
    miniAvatar: $('mini-avatar'), miniName: $('mini-name'), playerId: $('player-id-display'),
    viewProfile: $('view-profile'), modalLayer: $('modal-layer'), toast: $('toast'), canvas: $('world-canvas'),
    resultLede: $('result-lede'), puzzleStat: $('puzzle-stat'), resetStat: $('reset-stat'), idStat: $('id-stat'),
    careerList: $('career-list'), profileJson: $('profile-json')
  };
  const ctx = ui.canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const avatars = [
    { emoji: '👾', name: 'Void Sprite' }, { emoji: '👽', name: 'Lunar Scout' },
    { emoji: '🤖', name: 'Bolt Buddy' }, { emoji: '🐙', name: 'Nebula Noodle' },
    { emoji: '🦠', name: 'Cosmic Blob' }, { emoji: '🛸', name: 'Tiny Saucer' }
  ];
  const colors = [
    { hex: '#b888f8', name: 'Starlight lilac' }, { hex: '#f58acb', name: 'Comet pink' },
    { hex: '#74e7df', name: 'Mint signal' }, { hex: '#f5c76b', name: 'Solar gold' },
    { hex: '#8b72ff', name: 'Orbit violet' }, { hex: '#ff8d8d', name: 'Coral flare' }
  ];
  const signalKeys = ['analyticalThinking', 'creativeProblemFraming', 'planning', 'collaboration', 'evidenceSeeking', 'riskPreference'];
  const valueMeta = [
    { key: 'stability', icon: '▣', name: 'Stability', note: 'steady ground and predictable systems' },
    { key: 'growth', icon: '↗', name: 'Growth', note: 'learning, challenge, and possibility' },
    { key: 'creativity', icon: '✦', name: 'Creativity', note: 'making unusual things and ideas' },
    { key: 'autonomy', icon: '⌁', name: 'Autonomy', note: 'room to choose your own route' },
    { key: 'balance', icon: '◒', name: 'Balance', note: 'time, energy, and sustainable pace' },
    { key: 'socialImpact', icon: '♥', name: 'Social impact', note: 'helping people or communities' }
  ];
  const beacons = [
    { id: 'archive', title: 'Silent Archive', subtitle: 'mismatch mosaic', x: 210, y: 730, color: '#a98bff', icon: '⌁' },
    { id: 'bridge', title: 'Market Bridge', subtitle: 'ten energy blocks', x: 1335, y: 225, color: '#f5c76b', icon: '═' },
    { id: 'council', title: 'Council of Three', subtitle: 'shared city puzzle', x: 1360, y: 775, color: '#f58acb', icon: '△' },
    { id: 'vault', title: 'Career Compass Vault', subtitle: 'final calibration', x: 800, y: 500, color: '#b888f8', icon: '✦' }
  ];
  const planets = [
    { name: 'Plum Gloop', x: 475, y: 290, r: 76, color: '#5c2777', light: '#a65bd1', crater: '#31103f' },
    { name: 'The Big Grape', x: 1030, y: 215, r: 92, color: '#43215e', light: '#9c65c6', crater: '#250d36' },
    { name: 'Bloop 7', x: 1230, y: 610, r: 72, color: '#623463', light: '#d071c0', crater: '#351638' },
    { name: 'Moon Potato', x: 655, y: 825, r: 67, color: '#523668', light: '#9b7bb3', crater: '#301b45' },
    { name: 'Purple Pebble', x: 1480, y: 390, r: 48, color: '#4a285d', light: '#af70cc', crater: '#2c123a' }
  ];
  const routes = [
    { color: '#a98bff', points: [[800, 500], [620, 570], [430, 650], [210, 730]] },
    { color: '#f5c76b', points: [[800, 500], [970, 450], [1140, 330], [1335, 225]] },
    { color: '#f58acb', points: [[800, 500], [960, 610], [1130, 710], [1360, 775]] }
  ];
  const stars = Array.from({ length: 220 }, (_, index) => ({
    x: (index * 149 + (index % 7) * 23) % WORLD.width,
    y: (index * 89 + (index % 13) * 17) % WORLD.height,
    size: index % 15 === 0 ? 3 : index % 5 === 0 ? 2 : 1,
    tint: index % 9 === 0 ? '#d6a4ff' : index % 13 === 0 ? '#f5c76b' : '#f3eaff'
  }));

  const bridgeItems = [
    { key: 'anchors', name: 'Gravity anchors', note: 'keep the bridge from becoming spaghetti' },
    { key: 'rails', name: 'Safety rails', note: 'keep the shoppers on the bridge' },
    { key: 'scouts', name: 'Snail scout drones', note: 'slow, accurate, adorable' },
    { key: 'glue', name: 'Wormhole glue', note: 'very exciting; sometimes sticks to time' },
    { key: 'reserve', name: 'Emergency snacks', note: 'the crew calls this “contingency planning”' }
  ];
  const councilPolicies = [
    { id: 'safety', name: 'Safety review', note: 'test the bridge rails before launch', scores: [3, 0, 1] },
    { id: 'prototype', name: 'Open prototype', note: 'let inventors test a reversible version', scores: [0, 3, 0] },
    { id: 'community', name: 'Community seats', note: 'give local families a real vote', scores: [1, 0, 3] },
    { id: 'pilot', name: 'Small pilot', note: 'launch a tiny version, learn, then expand', scores: [1, 2, 1] },
    { id: 'charter', name: 'Shared charter', note: 'publish promises, metrics, and review dates', scores: [2, 1, 2] }
  ];

  const careers = [
    {
      id: 'computer_science_ai', icon: '⌘', title: 'Computer Science & AI',
      overview: 'Design, build, and operate software, data systems, and AI applications.',
      prep: ['Basic programming', 'Math and logic', 'Build a small project'],
      tradeoff: 'Often rewards long problem-solving sessions and continuous learning.',
      traits: { analyticalThinking: 5, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 4, growth: 5, creativity: 3, autonomy: 3, balance: 3, socialImpact: 3 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['city', 'remote'], urgency: ['soon', 'flexible'] }, market: 0.84
    },
    {
      id: 'engineering_automation', icon: '⚙', title: 'Engineering, Mechanics & Automation',
      overview: 'Design and improve machinery, robotics, equipment, and manufacturing systems.',
      prep: ['Math and physics', 'Technical sketches', 'Robotics or IoT projects'],
      tradeoff: 'Hands-on paths can require equipment access or location flexibility.',
      traits: { analyticalThinking: 5, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 4, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 3 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.78
    },
    {
      id: 'business_finance', icon: '◈', title: 'Business, Finance & Commerce',
      overview: 'Manage resources, understand organizations, and make well-framed decisions.',
      prep: ['Spreadsheets', 'Data-driven thinking', 'Market awareness'],
      tradeoff: 'The work can be deadline-heavy and often values careful communication.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 3, planning: 5, collaboration: 4, evidenceSeeking: 4, riskPreference: 3 },
      values: { stability: 4, growth: 4, creativity: 2, autonomy: 3, balance: 3, socialImpact: 2 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['low', 'medium', 'flexible'], location: ['city', 'remote'], urgency: ['needsNow', 'soon', 'flexible'] }, market: 0.76
    },
    {
      id: 'health_sciences', icon: '✚', title: 'Health Sciences',
      overview: 'Support healthcare, prevention, treatment, and patient-focused systems.',
      prep: ['Biology and chemistry', 'Patience', 'Evidence-based habits'],
      tradeoff: 'Many roles have structured training routes and location-specific placements.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 2, planning: 4, collaboration: 5, evidenceSeeking: 5, riskPreference: 1 },
      values: { stability: 4, growth: 4, creativity: 2, autonomy: 2, balance: 2, socialImpact: 5 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['flexible'] }, market: 0.81
    },
    {
      id: 'psychology_social_work', icon: '☍', title: 'Psychology & Social Work',
      overview: 'Study human behavior and support individuals, groups, and communities.',
      prep: ['Active listening', 'Research skills', 'Professional ethics'],
      tradeoff: 'Meaningful work can require patient, emotionally sustainable practice.',
      traits: { analyticalThinking: 3, creativeProblemFraming: 3, planning: 3, collaboration: 5, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 3, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 5 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.70
    },
    {
      id: 'education_learning', icon: '✎', title: 'Education & Learning',
      overview: 'Help others learn through teaching, coaching, learning design, and edtech.',
      prep: ['Communication', 'Lesson design', 'Present a concept clearly'],
      tradeoff: 'Impact comes through people, feedback cycles, and sustained preparation.',
      traits: { analyticalThinking: 3, creativeProblemFraming: 4, planning: 4, collaboration: 5, evidenceSeeking: 3, riskPreference: 2 },
      values: { stability: 4, growth: 4, creativity: 4, autonomy: 3, balance: 3, socialImpact: 5 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['low', 'medium', 'flexible'], location: ['home', 'city', 'remote'], urgency: ['soon', 'flexible'] }, market: 0.69
    },
    {
      id: 'law_public_policy', icon: '⚖', title: 'Law & Public Policy',
      overview: 'Analyze rules, protect rights, and develop policy solutions for public systems.',
      prep: ['Reading closely', 'Logical reasoning', 'Research and writing'],
      tradeoff: 'It often needs patience with complex rules and long evidence trails.',
      traits: { analyticalThinking: 5, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 5, riskPreference: 1 },
      values: { stability: 4, growth: 4, creativity: 2, autonomy: 3, balance: 3, socialImpact: 4 },
      constraints: { time: ['twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['city', 'remote'], urgency: ['flexible'] }, market: 0.66
    },
    {
      id: 'environment_energy', icon: '♲', title: 'Environment & Energy',
      overview: 'Solve problems around climate, resources, renewable energy, and sustainability.',
      prep: ['Natural sciences', 'Data analysis', 'A local sustainability project'],
      tradeoff: 'Routes can combine fieldwork, systems thinking, and long-term impact.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 4, planning: 4, collaboration: 4, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 3, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 5 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.73
    },
    {
      id: 'agriculture_food', icon: '☘', title: 'Agriculture & Food Technology',
      overview: 'Develop better food systems, modern agriculture, and biotechnology.',
      prep: ['Biology and chemistry', 'Practical experiments', 'Process thinking'],
      tradeoff: 'Some roles are practical or site-based rather than fully remote.',
      traits: { analyticalThinking: 4, creativeProblemFraming: 3, planning: 4, collaboration: 3, evidenceSeeking: 4, riskPreference: 2 },
      values: { stability: 3, growth: 4, creativity: 3, autonomy: 3, balance: 3, socialImpact: 4 },
      constraints: { time: ['oneYear', 'twoYears', 'fourYears'], budget: ['medium', 'flexible'], location: ['home', 'city'], urgency: ['soon', 'flexible'] }, market: 0.67
    },
    {
      id: 'creative_design_media', icon: '✦', title: 'Creative Design & Media',
      overview: 'Create visuals, experiences, stories, and media products people can use.',
      prep: ['A small portfolio', 'Visual practice', 'Learn from feedback'],
      tradeoff: 'It can offer autonomy, while asking for visible work samples and iteration.',
      traits: { analyticalThinking: 2, creativeProblemFraming: 5, planning: 3, collaboration: 4, evidenceSeeking: 2, riskPreference: 4 },
      values: { stability: 2, growth: 4, creativity: 5, autonomy: 4, balance: 3, socialImpact: 3 },
      constraints: { time: ['threeMonths', 'oneYear', 'twoYears'], budget: ['low', 'medium', 'flexible'], location: ['city', 'remote'], urgency: ['needsNow', 'soon', 'flexible'] }, market: 0.71
    }
  ];

  let state = null;
  let draft = { avatarId: 0, color: colors[0].hex };
  let mode = 'welcome';
  let modal = null;
  let priorFocus = null;
  let pressed = new Set();
  let camera = { x: 0, y: 0 };
  let lastFrame = 0;
  let worldTime = 0;
  let lastMoveSave = 0;
  let collisionCooldown = 0;
  let collisionFlash = 0;
  let toastTimer = 0;

  function freshState(userId) {
    return {
      schemaVersion: SCHEMA_VERSION,
      user: { id: userId, createdAt: new Date().toISOString(), lastPlayedAt: new Date().toISOString() },
      avatar: { id: 0, color: colors[0].hex },
      player: { x: WORLD.spawn.x, y: WORLD.spawn.y, checkpoint: 'Orbit Zero Hub' },
      progress: { archive: false, bridge: false, council: false, vault: false },
      answers: {
        archive: { opening: null, mosaicSolved: false, mosaicMoves: 0, priority: null, priorityCorrect: false },
        bridge: { opening: null, allocation: { anchors: 0, rails: 0, scouts: 0, glue: 0, reserve: 0 }, guardrail: null, guardrailCorrect: false },
        council: { opening: null, policies: [], boardSolved: false, outcome: null },
        values: { stability: 0, growth: 0, creativity: 0, autonomy: 0, balance: 0, socialImpact: 0 },
        constraints: { time: null, budget: null, location: null, urgency: null }
      },
      signals: { analyticalThinking: 0.4, creativeProblemFraming: 0.4, planning: 0.4, collaboration: 0.4, evidenceSeeking: 0.4, riskPreference: 0.4 },
      collisionCount: 0,
      results: null
    };
  }

  function isRecord(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
  function normalNumber(value, fallback, low, high) {
    return typeof value === 'number' && Number.isFinite(value) ? clamp(value, low, high) : fallback;
  }
  function normalizeId(value) {
    return String(value || '').trim().toLowerCase().split(' ').join('-').replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  }
  function profileKey(userId) { return PROFILE_PREFIX + normalizeId(userId); }
  function currentAvatar() {
    const selected = state ? state.avatar : draft;
    return avatars[clamp(Number(selected.id || selected.avatarId || 0), 0, avatars.length - 1)];
  }
  function currentColor() {
    const selected = state ? state.avatar : draft;
    return colors.some((color) => color.hex === selected.color) ? selected.color : colors[0].hex;
  }

  function hydrateProfile(raw, userId) {
    const base = freshState(userId);
    if (!isRecord(raw) || raw.schemaVersion !== SCHEMA_VERSION) return base;
    const answers = isRecord(raw.answers) ? raw.answers : {};
    const avatarId = Number(raw.avatar && raw.avatar.id);
    const safeColor = raw.avatar && colors.some((color) => color.hex === raw.avatar.color) ? raw.avatar.color : base.avatar.color;
    const profile = {
      ...base,
      user: { ...base.user, ...(isRecord(raw.user) ? raw.user : {}), id: userId },
      avatar: { id: Number.isInteger(avatarId) && avatarId >= 0 && avatarId < avatars.length ? avatarId : 0, color: safeColor },
      player: { ...base.player, ...(isRecord(raw.player) ? raw.player : {}) },
      progress: { ...base.progress, ...(isRecord(raw.progress) ? raw.progress : {}) },
      answers: {
        archive: { ...base.answers.archive, ...(isRecord(answers.archive) ? answers.archive : {}) },
        bridge: { ...base.answers.bridge, ...(isRecord(answers.bridge) ? answers.bridge : {}) },
        council: { ...base.answers.council, ...(isRecord(answers.council) ? answers.council : {}) },
        values: { ...base.answers.values, ...(isRecord(answers.values) ? answers.values : {}) },
        constraints: { ...base.answers.constraints, ...(isRecord(answers.constraints) ? answers.constraints : {}) }
      },
      signals: { ...base.signals, ...(isRecord(raw.signals) ? raw.signals : {}) },
      collisionCount: normalNumber(raw.collisionCount, 0, 0, 9999),
      results: isRecord(raw.results) && Array.isArray(raw.results.recommendations) ? raw.results : null
    };
    profile.player.x = normalNumber(profile.player.x, WORLD.spawn.x, WORLD.playerRadius, WORLD.width - WORLD.playerRadius);
    profile.player.y = normalNumber(profile.player.y, WORLD.spawn.y, WORLD.playerRadius, WORLD.height - WORLD.playerRadius);
    if (!isRecord(profile.answers.bridge.allocation)) profile.answers.bridge.allocation = { ...base.answers.bridge.allocation };
    if (!isRecord(profile.answers.values)) profile.answers.values = { ...base.answers.values };
    if (!isRecord(profile.answers.constraints)) profile.answers.constraints = { ...base.answers.constraints };
    signalKeys.forEach((key) => { profile.signals[key] = normalNumber(profile.signals[key], 0.4, 0, 1); });
    valueMeta.forEach((item) => { profile.answers.values[item.key] = normalNumber(profile.answers.values[item.key], 0, 0, 10); });
    bridgeItems.forEach((item) => { profile.answers.bridge.allocation[item.key] = normalNumber(profile.answers.bridge.allocation[item.key], 0, 0, 10); });
    if (!Array.isArray(profile.answers.council.policies)) profile.answers.council.policies = [];
    profile.answers.council.policies = profile.answers.council.policies.filter((id) => councilPolicies.some((policy) => policy.id === id)).slice(0, 3);
    return profile;
  }

  function readProfile(userId) {
    if (!userId) return null;
    try {
      const stored = localStorage.getItem(profileKey(userId));
      return stored ? hydrateProfile(JSON.parse(stored), userId) : null;
    } catch (_) {
      return null;
    }
  }
  function saveState() {
    if (!state) return;
    state.user.lastPlayedAt = new Date().toISOString();
    try {
      localStorage.setItem(profileKey(state.user.id), JSON.stringify(state));
      localStorage.setItem(ACTIVE_USER_KEY, state.user.id);
    } catch (_) {
      toast('This browser would not save the profile. You can still play this session.');
    }
  }
  function readActiveUserId() {
    try {
      return normalizeId(localStorage.getItem(ACTIVE_USER_KEY) || '');
    } catch (_) {
      return '';
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }
  function toast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 2800);
  }
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === screenId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function allMissionsComplete() {
    return Boolean(state && state.progress.archive && state.progress.bridge && state.progress.council);
  }
  function missionTotal() {
    return state ? ['archive', 'bridge', 'council'].filter((id) => state.progress[id]).length : 0;
  }
  function nudge(signal, amount) {
    state.signals[signal] = clamp((state.signals[signal] || 0.4) + amount, 0, 1);
  }

  function renderCustomization() {
    const selectedId = draft.avatarId;
    ui.avatarOptions.innerHTML = avatars.map((avatar, index) => '<button class="avatar-choice ' + (index === selectedId ? 'selected' : '') + '" type="button" data-avatar="' + index + '" aria-label="Choose ' + escapeHtml(avatar.name) + '" aria-pressed="' + (index === selectedId) + '">' + avatar.emoji + '</button>').join('');
    ui.colorOptions.innerHTML = colors.map((color) => '<button class="color-choice ' + (color.hex === draft.color ? 'selected' : '') + '" type="button" data-color="' + color.hex + '" style="--choice-color:' + color.hex + '" aria-label="Choose ' + escapeHtml(color.name) + ' glow" aria-pressed="' + (color.hex === draft.color) + '"><span class="sr-only">' + escapeHtml(color.name) + '</span></button>').join('');
    applyAvatarVisuals(false);
  }
  function applyAvatarVisuals(includeGame) {
    const selected = includeGame && state ? state.avatar : { id: draft.avatarId, color: draft.color };
    const avatar = avatars[clamp(Number(selected.id), 0, avatars.length - 1)];
    const color = colors.some((item) => item.hex === selected.color) ? selected.color : colors[0].hex;
    ui.avatarPreview.textContent = avatar.emoji;
    ui.avatarName.textContent = avatar.name;
    ui.avatarAura.style.setProperty('--avatar-color', color);
    if (includeGame && state) {
      ui.miniAvatar.textContent = avatar.emoji;
      ui.miniName.textContent = avatar.name;
      ui.playerId.textContent = state.user.id;
    }
  }
  function updateReturningUser() {
    const userId = normalizeId(ui.userId.value);
    const saved = readProfile(userId);
    if (!saved) {
      ui.accountStatus.textContent = 'NEW SIGNAL';
      ui.returningUser.hidden = true;
      ui.resume.hidden = true;
      return;
    }
    draft = { avatarId: saved.avatar.id, color: saved.avatar.color };
    renderCustomization();
    ui.accountStatus.textContent = saved.results ? 'PROFILE FOUND' : 'ORBIT FOUND';
    ui.returningUser.hidden = false;
    ui.returningUser.textContent = saved.results ? 'Welcome back, ' + userId + '. Your saved top-three paths are ready.' : 'Welcome back, ' + userId + '. ' + missionCountFrom(saved) + ' of 3 missions are saved.';
    ui.resume.hidden = false;
    ui.resume.textContent = saved.results ? 'VIEW SAVED PATHFINDER PROFILE' : 'CONTINUE SAVED TIMELINE';
  }
  function missionCountFrom(profile) {
    return ['archive', 'bridge', 'council'].filter((id) => profile.progress && profile.progress[id]).length;
  }
  function enterOrbit() {
    const userId = normalizeId(ui.userId.value);
    if (!userId) {
      toast('Choose a short navigator user_id first.');
      ui.userId.focus();
      return;
    }
    ui.userId.value = userId;
    const saved = readProfile(userId);
    state = saved || freshState(userId);
    state.avatar = { id: draft.avatarId, color: draft.color };
    saveState();
    mode = 'world';
    closeModal(false);
    showScreen('game-screen');
    applyAvatarVisuals(true);
    updateHud();
    camera = {
      x: clamp(state.player.x - WORLD.viewWidth / 2, 0, WORLD.width - WORLD.viewWidth),
      y: clamp(state.player.y - WORLD.viewHeight / 2, 0, WORLD.height - WORLD.viewHeight)
    };
    ui.canvas.focus({ preventScroll: true });
    toast(saved ? 'Saved orbit loaded. The planets still have no patience.' : 'WASD or arrows to fly. Press E at a glowing beacon.');
  }
  function resumeSaved() {
    const userId = normalizeId(ui.userId.value);
    const saved = readProfile(userId);
    if (!saved) {
      toast('No saved signal found for that user_id.');
      return;
    }
    state = saved;
    draft = { avatarId: state.avatar.id, color: state.avatar.color };
    if (state.results) showResults();
    else enterOrbit();
  }

  function updateHud() {
    if (!state) return;
    const complete = missionTotal();
    ui.missionCount.textContent = complete + ' / 3';
    ui.collisionCount.textContent = String(state.collisionCount);
    ui.activeMission.textContent = String(Math.min(complete + 1, 3)).padStart(2, '0') + ' / 03';
    const missionMeta = [
      { id: 'archive', title: 'Silent Archive', detail: 'Solve the scrambled constellation record.' },
      { id: 'bridge', title: 'Market Bridge', detail: 'Spend exactly ten energy blocks wisely.' },
      { id: 'council', title: 'Council of Three', detail: 'Build a shared answer for strange neighbors.' }
    ];
    ui.missionList.innerHTML = missionMeta.map((mission) => {
      const done = state.progress[mission.id];
      const current = !done && mission.id === firstOpenMission();
      return '<li class="mission-item ' + (done ? 'complete' : current ? 'current' : '') + '"><span>' + (done ? '✓' : current ? '✦' : '○') + '</span><div><b>' + mission.title + '</b><small>' + (done ? 'Signal secured' : mission.detail) + '</small></div></li>';
    }).join('');
    ui.viewProfile.disabled = !state.progress.vault;
    if (allMissionsComplete() && !state.progress.vault) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> The Career Compass Vault is unlocked at the hub.';
    else if (!state.progress.archive) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> Follow the lilac lane west to the Silent Archive.';
    else if (!state.progress.bridge) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> The gold lane rises toward the Market Bridge.';
    else if (!state.progress.council) ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> The pink lane bends southeast to the Council of Three.';
    else ui.worldTip.innerHTML = '<span aria-hidden="true">✦</span> Planets reset you to the hub; completed missions stay safe.';
  }
  function firstOpenMission() {
    if (!state.progress.archive) return 'archive';
    if (!state.progress.bridge) return 'bridge';
    return 'council';
  }

  function worldToCanvas(x, y) { return { x: x - camera.x, y: y - camera.y }; }
  function inView(x, y, pad) {
    const extra = pad || 120;
    return x >= camera.x - extra && x <= camera.x + WORLD.viewWidth + extra && y >= camera.y - extra && y <= camera.y + WORLD.viewHeight + extra;
  }
  function pointHitsPlanet(x, y) {
    return planets.some((planet) => Math.hypot(x - planet.x, y - planet.y) < planet.r + WORLD.playerRadius - 2);
  }
  function nearestBeacon() {
    if (!state) return null;
    let closest = null;
    beacons.forEach((beacon) => {
      const distance = Math.hypot(state.player.x - beacon.x, state.player.y - beacon.y);
      if (distance < 65 && (!closest || distance < closest.distance)) closest = { ...beacon, distance };
    });
    return closest;
  }
  function updatePrompt() {
    const beacon = nearestBeacon();
    if (!beacon) {
      ui.prompt.hidden = true;
      return;
    }
    ui.prompt.hidden = false;
    if (beacon.id === 'vault' && !allMissionsComplete()) ui.promptText.textContent = 'Vault needs 3 secured signals';
    else if (beacon.id === 'vault' && state.progress.vault) ui.promptText.textContent = 'Open saved Pathfinder Profile';
    else if (state.progress[beacon.id]) ui.promptText.textContent = 'Replay transmission';
    else ui.promptText.textContent = 'Start ' + beacon.title;
  }
  function crashToHub() {
    if (collisionCooldown > 0 || !state) return;
    collisionCooldown = 800;
    collisionFlash = 1;
    state.player.x = WORLD.spawn.x;
    state.player.y = WORLD.spawn.y;
    state.player.checkpoint = 'Orbit Zero Hub';
    state.collisionCount += 1;
    saveState();
    updateHud();
    toast('Planet bonk! You warped safely back to Orbit Zero Hub.');
  }
  function updateWorld(delta) {
    if (!state || mode !== 'world' || modal) return;
    collisionCooldown = Math.max(0, collisionCooldown - delta * 1000);
    collisionFlash = Math.max(0, collisionFlash - delta * 2.7);
    let dx = 0;
    let dy = 0;
    if (pressed.has('w') || pressed.has('arrowup')) dy -= 1;
    if (pressed.has('s') || pressed.has('arrowdown')) dy += 1;
    if (pressed.has('a') || pressed.has('arrowleft')) dx -= 1;
    if (pressed.has('d') || pressed.has('arrowright')) dx += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      const speed = 185;
      const nextX = clamp(state.player.x + (dx / length) * speed * delta, WORLD.playerRadius, WORLD.width - WORLD.playerRadius);
      const nextY = clamp(state.player.y + (dy / length) * speed * delta, WORLD.playerRadius, WORLD.height - WORLD.playerRadius);
      if (pointHitsPlanet(nextX, nextY)) crashToHub();
      else {
        state.player.x = nextX;
        state.player.y = nextY;
        if (worldTime - lastMoveSave > 1200) {
          saveState();
          lastMoveSave = worldTime;
        }
      }
    }
    camera.x = clamp(state.player.x - WORLD.viewWidth / 2, 0, WORLD.width - WORLD.viewWidth);
    camera.y = clamp(state.player.y - WORLD.viewHeight / 2, 0, WORLD.height - WORLD.viewHeight);
    updatePrompt();
  }
  function drawWorld() {
    if (!state || mode !== 'world') return;
    ctx.clearRect(0, 0, WORLD.viewWidth, WORLD.viewHeight);
    ctx.fillStyle = '#0b0510';
    ctx.fillRect(0, 0, WORLD.viewWidth, WORLD.viewHeight);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawNebula();
    stars.forEach((star) => {
      if (!inView(star.x, star.y, 5)) return;
      const flicker = Math.floor(worldTime / 260 + star.x) % 5 === 0;
      ctx.fillStyle = star.tint;
      ctx.globalAlpha = flicker ? 0.95 : 0.48;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;
    routes.forEach(drawRoute);
    drawHub();
    planets.forEach(drawPlanet);
    beacons.forEach(drawBeacon);
    drawPlayer();
    ctx.restore();
    if (collisionFlash > 0) {
      ctx.fillStyle = 'rgba(245, 138, 203, ' + (collisionFlash * 0.24) + ')';
      ctx.fillRect(0, 0, WORLD.viewWidth, WORLD.viewHeight);
    }
  }
  function drawNebula() {
    const blocks = [
      [80, 130, 210, 120, '#1a0c2b'], [1160, 690, 260, 150, '#160824'],
      [850, 70, 175, 90, '#210d36'], [280, 820, 250, 90, '#12091d']
    ];
    blocks.forEach((block) => {
      if (!inView(block[0] + block[2] / 2, block[1] + block[3] / 2, 150)) return;
      ctx.fillStyle = block[4];
      ctx.fillRect(block[0], block[1], block[2], block[3]);
      ctx.fillStyle = '#2b123a';
      for (let x = block[0] + 8; x < block[0] + block[2]; x += 26) {
        const y = block[1] + 10 + ((x * 7) % Math.max(20, block[3] - 20));
        ctx.fillRect(x, y, 12, 6);
      }
    });
  }
  function drawRoute(route) {
    ctx.save();
    ctx.fillStyle = route.color;
    ctx.globalAlpha = 0.28;
    for (let index = 1; index < route.points.length; index += 1) {
      const from = route.points[index - 1];
      const to = route.points[index];
      const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const steps = Math.floor(distance / 12);
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps;
        const x = Math.round((from[0] + (to[0] - from[0]) * ratio) / 4) * 4;
        const y = Math.round((from[1] + (to[1] - from[1]) * ratio) / 4) * 4;
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }
    ctx.restore();
  }
  function drawHub() {
    const x = WORLD.spawn.x;
    const y = WORLD.spawn.y;
    if (!inView(x, y, 150)) return;
    ctx.save();
    ctx.strokeStyle = '#6c3b92';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(x, y, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#2b123a';
    ctx.fillRect(x - 24, y - 18, 48, 36);
    ctx.fillStyle = '#b888f8';
    ctx.fillRect(x - 16, y - 10, 32, 20);
    ctx.fillStyle = '#f4e9ff';
    ctx.fillRect(x - 7, y - 4, 14, 8);
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#e6d9ff';
    ctx.textAlign = 'center';
    ctx.fillText('ORBIT ZERO HUB', x, y + 130);
    ctx.restore();
  }
  function drawPlanet(planet) {
    if (!inView(planet.x, planet.y, planet.r + 70)) return;
    const grid = 4;
    ctx.save();
    for (let row = -planet.r; row <= planet.r; row += grid) {
      const half = Math.floor(Math.sqrt(Math.max(0, planet.r * planet.r - row * row)) / grid) * grid;
      const shade = row < -planet.r * 0.28 ? planet.light : row > planet.r * 0.38 ? planet.crater : planet.color;
      ctx.fillStyle = shade;
      ctx.fillRect(planet.x - half, planet.y + row, half * 2 + grid, grid);
    }
    ctx.fillStyle = planet.light;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(planet.x - planet.r * 0.45, planet.y - planet.r * 0.34, 17, 10);
    ctx.fillRect(planet.x - planet.r * 0.16, planet.y - planet.r * 0.54, 10, 8);
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = planet.crater;
    ctx.fillRect(planet.x + planet.r * 0.18, planet.y + planet.r * 0.14, 20, 12);
    ctx.fillRect(planet.x - planet.r * 0.43, planet.y + planet.r * 0.32, 13, 9);
    ctx.globalAlpha = 1;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8dcf7';
    ctx.fillText(planet.name.toUpperCase(), planet.x, planet.y + planet.r + 22);
    ctx.fillStyle = '#f58acb';
    ctx.fillText('TOUCH = WARP', planet.x, planet.y + planet.r + 35);
    ctx.restore();
  }
  function drawBeacon(beacon) {
    if (!inView(beacon.x, beacon.y, 100)) return;
    const unlocked = beacon.id !== 'vault' || allMissionsComplete();
    const done = beacon.id === 'vault' ? state.progress.vault : state.progress[beacon.id];
    const pulse = Math.floor(worldTime / 170) % 2 === 0 ? 2 : 0;
    ctx.save();
    ctx.globalAlpha = unlocked ? 1 : 0.38;
    ctx.fillStyle = beacon.color;
    ctx.fillRect(beacon.x - 5 - pulse, beacon.y - 31 - pulse, 10 + pulse * 2, 10 + pulse * 2);
    ctx.globalAlpha = unlocked ? 0.24 : 0.08;
    ctx.fillRect(beacon.x - 23 - pulse, beacon.y - 47 - pulse, 46 + pulse * 2, 40 + pulse * 2);
    ctx.globalAlpha = unlocked ? 1 : 0.45;
    ctx.fillStyle = '#2b123a';
    ctx.fillRect(beacon.x - 19, beacon.y - 2, 38, 12);
    ctx.fillStyle = beacon.color;
    ctx.fillRect(beacon.x - 13, beacon.y + 10, 26, 8);
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = done ? '#74e7df' : '#fff5ff';
    ctx.fillText(done ? '✓' : beacon.icon, beacon.x, beacon.y - 26);
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f0e5f9';
    ctx.fillText(beacon.title.toUpperCase(), beacon.x, beacon.y + 40);
    ctx.font = '9px monospace';
    ctx.fillStyle = beacon.color;
    ctx.fillText(done ? 'SIGNAL SECURED' : unlocked ? beacon.subtitle.toUpperCase() : 'VAULT LOCKED', beacon.x, beacon.y + 53);
    ctx.restore();
  }
  function drawPlayer() {
    const player = state.player;
    const moving = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].some((key) => pressed.has(key));
    const bounce = moving ? Math.floor(worldTime / 120) % 2 : 0;
    const color = currentColor();
    ctx.save();
    ctx.translate(player.x, player.y - bounce);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(-24, -24, 48, 48);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(-17, -17, 34, 34);
    ctx.fillStyle = '#2b123a';
    ctx.fillRect(-13, -13, 26, 26);
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentAvatar().emoji, 0, -1);
    ctx.textBaseline = 'alphabetic';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#fff4ff';
    ctx.fillText(currentAvatar().name.toUpperCase(), 0, 38);
    ctx.restore();
  }
  function frame(timestamp) {
    const delta = Math.min(0.05, (timestamp - lastFrame) / 1000 || 0);
    lastFrame = timestamp;
    worldTime = timestamp;
    updateWorld(delta);
    drawWorld();
    window.requestAnimationFrame(frame);
  }

  function interact() {
    const beacon = nearestBeacon();
    if (!beacon) {
      toast('Fly closer to a blinking mission beacon.');
      return;
    }
    if (beacon.id === 'vault') {
      if (!allMissionsComplete()) {
        toast('The Career Compass needs three mission signals.');
        return;
      }
      if (state.progress.vault) {
        showResults();
        return;
      }
      setModal({ type: 'vaultValues' });
      return;
    }
    if (state.progress[beacon.id]) {
      setModal({ type: 'info', title: beacon.title + ' stabilized', text: 'That signal is already safe. Your choices were saved in the Pathfinder Profile.' });
      return;
    }
    if (beacon.id === 'archive') setModal({ type: 'archiveIntro' });
    if (beacon.id === 'bridge') setModal({ type: 'bridgeIntro' });
    if (beacon.id === 'council') setModal({ type: 'councilIntro' });
  }

  function modalShell(eyebrow, chip, title, body, closeLabel) {
    return '<article class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="modal-top"><div><span>' + eyebrow + '</span><b>' + chip + '</b></div><button class="modal-close" type="button" data-action="close-modal" aria-label="' + (closeLabel || 'Close transmission') + '">×</button></div><div class="modal-body"><h2 id="modal-title">' + title + '</h2>' + body + '</div></article>';
  }
  function optionButtons(options, action) {
    return '<div class="modal-options">' + options.map((option) => '<button type="button" class="modal-option" data-action="' + action + '" data-value="' + option.id + '"><b>' + option.title + '</b><span>' + option.detail + '</span></button>').join('') + '</div>';
  }
  function setModal(next) {
    if (!modal) priorFocus = document.activeElement;
    modal = next;
    renderModal();
  }
  function closeModal(returnFocus) {
    const wasOpen = Boolean(modal);
    modal = null;
    ui.modalLayer.hidden = true;
    ui.modalLayer.innerHTML = '';
    updatePrompt();
    if (wasOpen && returnFocus !== false && priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus({ preventScroll: true });
    priorFocus = null;
  }
  function renderModal() {
    if (!modal) return;
    let html = '';
    if (modal.type === 'info') {
      html = modalShell('STATION TRANSMISSION', 'INFO', escapeHtml(modal.title), '<p>' + escapeHtml(modal.text) + '</p><div class="modal-footer"><span>Read it, absorb it, pretend you are very wise.</span><button class="secondary-btn" type="button" data-action="close-modal">RETURN</button></div>');
    }
    if (modal.type === 'archiveIntro') {
      const options = [
        { id: 'scan', title: 'Run a spectrum scan', detail: 'Map the scrambled clues before touching a single file.' },
        { id: 'ask', title: 'Ask the librarian squid', detail: 'It has eight arms, eight opinions, and one useful clue.' },
        { id: 'breach', title: 'Kick the archive door', detail: 'Fast, loud, dramatic. The door is probably insured.' }
      ];
      html = modalShell('MISSION 01 // SILENT ARCHIVE', 'DIALOGUE', 'The files have stage fright.', '<p>An interstellar librarian has mixed up the constellation records. Its safety rule is simple: <strong>do not restore what you cannot verify.</strong> How do you enter?</p>' + optionButtons(options, 'archive-opening'));
    }
    if (modal.type === 'archiveStory') {
      html = modalShell('MISSION 01 // SILENT ARCHIVE', 'PUZZLE', 'A constellation fell apart.', '<p>The librarian presents a 3×3 mismatch mosaic. Slide the empty tile with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys until the glyphs match the reference constellation.</p><div class="story-box">On-screen arrows are here too, because even galaxy heroes sometimes use thumbs.</div><div class="modal-footer"><span>Rebuild the picture, then verify it.</span><button class="primary-btn" type="button" data-action="start-mosaic">OPEN MOSAIC</button></div>');
    }
    if (modal.type === 'mosaic') html = renderMosaic();
    if (modal.type === 'archiveQuestion') {
      const options = [
        { id: 'medical', title: 'Medical archive — 42 people × risk 4 = 168', detail: 'Critical risk multiplier: 4' },
        { id: 'shelter', title: 'Shelter records — 79 people × risk 2 = 158', detail: 'Medium risk multiplier: 2' },
        { id: 'habitat', title: 'Habitat registry — 150 people × risk 1 = 150', detail: 'Low risk multiplier: 1' }
      ];
      html = modalShell('MISSION 01 // SILENT ARCHIVE', 'EVIDENCE CHECK', 'Which file wakes up first?', '<p>Use the archive rule: <strong>priority = people affected × risk multiplier.</strong> The files are loud, but the numbers are louder.</p>' + optionButtons(options, 'archive-priority'));
    }
    if (modal.type === 'bridgeIntro') {
      const options = [
        { id: 'plan', title: 'Draw the boring-safe plan', detail: 'List the safety needs before choosing shiny extras.' },
        { id: 'pilot', title: 'Build a tiny test bridge', detail: 'Learn from a reversible version before full launch.' },
        { id: 'spark', title: 'Use maximum wormhole glue', detail: 'It says “non-toxic” in six very small languages.' }
      ];
      html = modalShell('MISSION 02 // MARKET BRIDGE', 'DIALOGUE', 'The market is floating away.', '<p>A bridge between two asteroid markets needs exactly ten energy blocks. The merchants would like speed. The safety inspector would like everyone to remain in one piece.</p>' + optionButtons(options, 'bridge-opening'));
    }
    if (modal.type === 'bridgeAllocation') html = renderBridgeAllocation();
    if (modal.type === 'bridgeQuestion') {
      const options = [
        { id: 'stable', title: '3 anchors, 2 rails, 3 scouts, 1 glue, 1 reserve', detail: 'Uses exactly 10 and meets every stated safety need.' },
        { id: 'wobbly', title: '4 anchors, 1 rail, 4 scouts, 1 glue, 0 reserve', detail: 'Looks confident, but misses two safety needs.' },
        { id: 'gooey', title: '3 anchors, 2 rails, 0 scouts, 5 glue, 0 reserve', detail: 'The bridge may become a museum piece.' }
      ];
      html = modalShell('MISSION 02 // MARKET BRIDGE', 'CONSTRAINT CHECK', 'Pick the bridge that survives lunch rush.', '<p>Safety protocol demands <strong>at least 3 anchors, 2 rails, and 1 reserve</strong>; total energy must equal 10. Which plan qualifies?</p>' + optionButtons(options, 'bridge-guardrail'));
    }
    if (modal.type === 'councilIntro') {
      const options = [
        { id: 'listen', title: 'Ask what each neighbor cannot lose', detail: 'Find needs before proposing a solution.' },
        { id: 'rule', title: 'Set a decision rule', detail: 'Give the discussion an orderly frame immediately.' },
        { id: 'pilot', title: 'Offer a reversible pilot', detail: 'Try a shared path before deciding forever.' }
      ];
      html = modalShell('MISSION 03 // COUNCIL OF THREE', 'DIALOGUE', 'Three aliens; one bridge; zero chill.', '<p>The Architect wants safety. The Dreamer wants experiments. The Guardian wants fairness. All three are technically correct, which is extremely inconvenient.</p>' + optionButtons(options, 'council-opening'));
    }
    if (modal.type === 'councilBoard') html = renderCouncilBoard();
    if (modal.type === 'councilOutcome') {
      const options = [
        { id: 'charter', title: 'Publish a shared charter', detail: 'Make the promises and review dates visible to everyone.' },
        { id: 'pilot', title: 'Launch a phased pilot', detail: 'Test, learn, and revise with clear safety guardrails.' },
        { id: 'services', title: 'Secure core services first', detail: 'Stabilize the basics before adding experimental layers.' }
      ];
      html = modalShell('MISSION 03 // COUNCIL OF THREE', 'FINAL CHOICE', 'How does the city keep its promise?', '<p>' + (state.answers.council.boardSolved ? 'Your policy board gives every council a voice. ' : 'The board did not meet every threshold, but you can still choose a thoughtful next step. ') + 'Pick the kind of promise you would make public.</p>' + optionButtons(options, 'council-outcome'));
    }
    if (modal.type === 'vaultValues') html = renderVaultValues();
    if (modal.type === 'vaultConstraints') html = renderVaultConstraints();
    ui.modalLayer.hidden = false;
    ui.modalLayer.innerHTML = html;
    const card = ui.modalLayer.querySelector('.modal-card');
    if (card) card.focus({ preventScroll: true });
  }

  function renderMosaic() {
    const glyphs = { 1: '▲', 2: '●', 3: '■', 4: '◆', 5: '★', 6: '⬟', 7: '☾', 8: '✚', 0: '' };
    const tiles = modal.board.map((tile) => '<div class="mosaic-tile ' + (tile === 0 ? 'empty' : '') + '" aria-label="' + (tile === 0 ? 'empty space' : 'fragment ' + tile) + '">' + glyphs[tile] + '</div>').join('');
    const done = modal.solved;
    const status = done ? 'Constellation synced in ' + modal.moves + ' moves. The squid performs a tiny victory wiggle.' : 'Moves: ' + modal.moves + '. Move the empty tile toward the lower-right corner.';
    const controls = '<div class="direction-pad" aria-label="Mosaic controls"><button type="button" data-action="mosaic-move" data-value="up" aria-label="Move empty tile up">↑</button><button type="button" data-action="mosaic-move" data-value="left" aria-label="Move empty tile left">←</button><button type="button" data-action="mosaic-move" data-value="down" aria-label="Move empty tile down">↓</button><button type="button" data-action="mosaic-move" data-value="right" aria-label="Move empty tile right">→</button></div>';
    const footer = done ? '<button class="primary-btn" type="button" data-action="archive-verify">VERIFY PATTERN</button>' : '<button class="secondary-btn" type="button" data-action="mosaic-reset">RESET MOSAIC</button>';
    const target = [1, 2, 3, 4, 5, 6, 7, 8, 0].map((tile) => '<span aria-label="' + (tile === 0 ? 'empty space' : 'target glyph ' + tile) + '">' + (tile === 0 ? '□' : glyphs[tile]) + '</span>').join('');
    return modalShell('MISSION 01 // SILENT ARCHIVE', 'KEYBOARD PUZZLE', 'Put the star crumbs back in order.', '<p>Move the tiles until they match the reference constellation.</p><div class="puzzle-layout"><div class="mosaic-grid" aria-live="polite">' + tiles + '</div><div><div class="target-grid" aria-label="Target constellation order">' + target + '</div>' + controls + '</div></div><p class="puzzle-status ' + (done ? 'success' : '') + '" aria-live="polite">' + status + '</p><div class="modal-footer"><span>WASD and arrows work here.</span>' + footer + '</div>');
  }
  function renderBridgeAllocation() {
    const allocation = state.answers.bridge.allocation;
    const total = bridgeTotal();
    const rows = bridgeItems.map((item) => '<div class="allocation-row"><div><b>' + item.name + '</b><small>' + item.note + '</small></div><div class="stepper"><button type="button" data-action="bridge-change" data-key="' + item.key + '" data-delta="-1" aria-label="Remove energy from ' + item.name + '">−</button><strong>' + allocation[item.key] + '</strong><button type="button" data-action="bridge-change" data-key="' + item.key + '" data-delta="1" aria-label="Add energy to ' + item.name + '">+</button></div></div>').join('');
    const ready = total === 10;
    return modalShell('MISSION 02 // MARKET BRIDGE', 'RESOURCE PUZZLE', 'Build with exactly ten blocks.', '<p>Spend every energy block. The bridge is a real bridge, not a metaphor, though it is being very metaphorical about it.</p><div class="allocation-total"><span>ENERGY ALLOCATED</span><b>' + total + ' / 10</b></div><div class="allocation-list">' + rows + '</div><div class="story-box">For the next check, remember: 3 anchors + 2 rails + 1 reserve are non-negotiable.</div><div class="modal-footer"><span>' + (ready ? 'Ten blocks allocated. Time to test the safety logic.' : 'Allocate ' + (10 - total) + ' more energy block' + (10 - total === 1 ? '' : 's') + '.') + '</span><button class="primary-btn" type="button" data-action="bridge-next" ' + (ready ? '' : 'disabled') + '>CHECK BRIDGE</button></div>');
  }
  function renderCouncilBoard() {
    const selected = state.answers.council.policies;
    const totals = councilTotals();
    const cards = councilPolicies.map((policy) => '<button type="button" class="policy-card ' + (selected.includes(policy.id) ? 'selected' : '') + '" data-action="toggle-policy" data-value="' + policy.id + '" aria-pressed="' + selected.includes(policy.id) + '"><b>' + policy.name + '</b><span>' + policy.note + '</span><small>Architect +' + policy.scores[0] + ' · Dreamer +' + policy.scores[1] + ' · Guardian +' + policy.scores[2] + '</small></button>').join('');
    const ready = selected.length === 3;
    return modalShell('MISSION 03 // COUNCIL OF THREE', 'SHARED PUZZLE', 'Pick exactly three promises.', '<p>Every council needs a score of at least 3. Combine three policies so nobody is left outside the airlock.</p><div class="council-scoreboard"><div><span>ARCHITECT</span><b>' + totals[0] + ' / 3</b></div><div><span>DREAMER</span><b>' + totals[1] + ' / 3</b></div><div><span>GUARDIAN</span><b>' + totals[2] + ' / 3</b></div></div><div class="policy-grid">' + cards + '</div><div class="modal-footer"><span>' + (ready ? 'Three promises selected. Check whether everyone can sign.' : 'Choose ' + (3 - selected.length) + ' more promise' + (3 - selected.length === 1 ? '' : 's') + '.') + '</span><button class="primary-btn" type="button" data-action="council-next" ' + (ready ? '' : 'disabled') + '>CHECK TREATY</button></div>');
  }
  function renderVaultValues() {
    const values = state.answers.values;
    const total = valueTotal();
    const rows = valueMeta.map((item) => '<div class="allocation-row value-row"><div><b><i>' + item.icon + '</i> ' + item.name + '</b><small>' + item.note + '</small></div><div class="stepper"><button type="button" data-action="value-change" data-key="' + item.key + '" data-delta="-1" aria-label="Remove a vision token from ' + item.name + '">−</button><strong>' + values[item.key] + '</strong><button type="button" data-action="value-change" data-key="' + item.key + '" data-delta="1" aria-label="Add a vision token to ' + item.name + '">+</button></div></div>').join('');
    const ready = total === 10;
    return modalShell('CAREER COMPASS VAULT', 'VISION TOKENS', 'What pulls your future forward?', '<p>Give your ten Vision Tokens to the things you want a route to offer. There is no ideal pattern—only an honest one.</p><div class="allocation-total"><span>VISION TOKENS</span><b>' + total + ' / 10</b></div><div class="allocation-list">' + rows + '</div><div class="modal-footer"><span>' + (ready ? 'The compass can now read your priorities.' : 'Place ' + (10 - total) + ' more token' + (10 - total === 1 ? '' : 's') + '.') + '</span><button class="primary-btn" type="button" data-action="vault-values-next" ' + (ready ? '' : 'disabled') + '>NEXT: REAL-WORLD TOOLS</button></div>');
  }
  function renderVaultConstraints() {
    const constraints = state.answers.constraints;
    const groups = [
      { key: 'time', title: '⌛ Hourglass', detail: 'How much learning time feels realistic?', options: [{ id: 'threeMonths', name: '3 months' }, { id: 'oneYear', name: '1 year' }, { id: 'twoYears', name: '2 years' }, { id: 'fourYears', name: '4+ years' }] },
      { key: 'budget', title: '◉ Coin Pouch', detail: 'What study-budget shape fits right now?', options: [{ id: 'low', name: 'Low' }, { id: 'medium', name: 'Medium' }, { id: 'flexible', name: 'Flexible' }] },
      { key: 'location', title: '⌂ Home Compass', detail: 'Where could a route realistically happen?', options: [{ id: 'home', name: 'Near home' }, { id: 'city', name: 'Big city' }, { id: 'remote', name: 'Remote-friendly' }] },
      { key: 'urgency', title: '◒ Pressure Shield', detail: 'How urgent is reliable income?', options: [{ id: 'needsNow', name: 'Need it now' }, { id: 'soon', name: 'Within 6 months' }, { id: 'flexible', name: 'Flexible' }] }
    ];
    const blocks = groups.map((group) => '<section class="constraint-group"><h3>' + group.title + '</h3><p>' + group.detail + '</p><div class="constraint-grid">' + group.options.map((option) => '<button type="button" class="constraint-button ' + (constraints[group.key] === option.id ? 'selected' : '') + '" data-action="constraint" data-key="' + group.key + '" data-value="' + option.id + '" aria-pressed="' + (constraints[group.key] === option.id) + '">' + option.name + '</button>').join('') + '</div></section>').join('');
    const ready = Object.values(constraints).every(Boolean);
    return modalShell('CAREER COMPASS VAULT', 'PRACTICAL TOOLS', 'Give the compass real-world coordinates.', '<p>These choices keep recommendations grounded in your current situation. You can change them whenever you start a new timeline.</p><div class="constraint-list">' + blocks + '</div><div class="modal-footer"><span>' + (ready ? 'Coordinates complete. Ready to stabilize the profile.' : 'Choose one option in each of the four tools.') + '</span><button class="primary-btn" type="button" data-action="finish-profile" ' + (ready ? '' : 'disabled') + '>STABILIZE PROFILE</button></div>');
  }

  function bridgeTotal() {
    return bridgeItems.reduce((sum, item) => sum + Number(state.answers.bridge.allocation[item.key] || 0), 0);
  }
  function valueTotal() {
    return valueMeta.reduce((sum, item) => sum + Number(state.answers.values[item.key] || 0), 0);
  }
  function councilTotals() {
    const totals = [0, 0, 0];
    state.answers.council.policies.forEach((id) => {
      const policy = councilPolicies.find((item) => item.id === id);
      if (policy) policy.scores.forEach((score, index) => { totals[index] += score; });
    });
    return totals;
  }
  function bridgeQuality() {
    const allocation = state.answers.bridge.allocation;
    let score = 0.35;
    if (allocation.anchors >= 3) score += 0.2;
    if (allocation.rails >= 2) score += 0.2;
    if (allocation.reserve >= 1) score += 0.15;
    if (allocation.scouts >= 1) score += 0.1;
    return clamp(score, 0, 1);
  }
  function completeMission(id, title, text) {
    state.progress[id] = true;
    saveState();
    updateHud();
    setModal({ type: 'info', title: title + ' — signal secured', text: text + ' Return to Orbit Zero and find the next blinking beacon.' });
  }
  function moveMosaic(direction) {
    if (!modal || modal.type !== 'mosaic' || modal.solved) return;
    const empty = modal.board.indexOf(0);
    const row = Math.floor(empty / 3);
    const column = empty % 3;
    let next = -1;
    if (direction === 'up' && row > 0) next = empty - 3;
    if (direction === 'down' && row < 2) next = empty + 3;
    if (direction === 'left' && column > 0) next = empty - 1;
    if (direction === 'right' && column < 2) next = empty + 1;
    if (next < 0) return;
    modal.board[empty] = modal.board[next];
    modal.board[next] = 0;
    modal.moves += 1;
    modal.solved = modal.board.every((value, index) => value === (index === 8 ? 0 : index + 1));
    renderModal();
  }
  function handleAction(action, element) {
    if (!action) return;
    const value = element.dataset.value;
    const key = element.dataset.key;
    if (action === 'close-modal') { closeModal(); return; }
    if (action === 'archive-opening') {
      state.answers.archive.opening = value;
      if (value === 'scan') { nudge('evidenceSeeking', 0.2); nudge('analyticalThinking', 0.13); }
      if (value === 'ask') { nudge('evidenceSeeking', 0.13); nudge('collaboration', 0.12); }
      if (value === 'breach') { nudge('riskPreference', 0.2); nudge('creativeProblemFraming', 0.1); }
      saveState();
      setModal({ type: 'archiveStory' });
      return;
    }
    if (action === 'start-mosaic') {
      setModal({ type: 'mosaic', board: [1, 3, 6, 5, 0, 2, 4, 7, 8], moves: 0, solved: false });
      return;
    }
    if (action === 'mosaic-move') { moveMosaic(value); return; }
    if (action === 'mosaic-reset') {
      modal.board = [1, 3, 6, 5, 0, 2, 4, 7, 8];
      modal.moves = 0;
      modal.solved = false;
      renderModal();
      return;
    }
    if (action === 'archive-verify') {
      state.answers.archive.mosaicSolved = true;
      state.answers.archive.mosaicMoves = modal.moves;
      nudge('analyticalThinking', 0.22);
      nudge('creativeProblemFraming', modal.moves <= 14 ? 0.16 : 0.09);
      saveState();
      setModal({ type: 'archiveQuestion' });
      return;
    }
    if (action === 'archive-priority') {
      const correct = value === 'medical';
      state.answers.archive.priority = value;
      state.answers.archive.priorityCorrect = correct;
      nudge('evidenceSeeking', correct ? 0.22 : 0.05);
      nudge('analyticalThinking', correct ? 0.12 : 0.03);
      completeMission('archive', 'Silent Archive', correct ? 'You followed the evidence instead of the loudest file. The librarian squid is delighted.' : 'The librarian squid logs the answer and gives you a gentle eight-armed reminder to check the formula next time.');
      return;
    }
    if (action === 'bridge-opening') {
      state.answers.bridge.opening = value;
      if (value === 'plan') { nudge('planning', 0.18); nudge('evidenceSeeking', 0.08); }
      if (value === 'pilot') { nudge('creativeProblemFraming', 0.15); nudge('riskPreference', 0.09); }
      if (value === 'spark') { nudge('riskPreference', 0.2); nudge('creativeProblemFraming', 0.1); }
      saveState();
      setModal({ type: 'bridgeAllocation' });
      return;
    }
    if (action === 'bridge-change') {
      const delta = Number(element.dataset.delta);
      const allocation = state.answers.bridge.allocation;
      if (delta > 0 && bridgeTotal() >= 10) { toast('The battery crate is empty. Ten is the limit.'); return; }
      if (delta < 0 && allocation[key] <= 0) return;
      allocation[key] = clamp(allocation[key] + delta, 0, 10);
      saveState();
      renderModal();
      return;
    }
    if (action === 'bridge-next') {
      if (bridgeTotal() !== 10) { toast('Spend all ten energy blocks first.'); return; }
      setModal({ type: 'bridgeQuestion' });
      return;
    }
    if (action === 'bridge-guardrail') {
      const correct = value === 'stable';
      state.answers.bridge.guardrail = value;
      state.answers.bridge.guardrailCorrect = correct;
      nudge('planning', correct ? 0.23 : 0.07);
      nudge('analyticalThinking', correct ? 0.12 : 0.04);
      nudge('riskPreference', state.answers.bridge.opening === 'spark' ? 0.04 : 0.08);
      completeMission('bridge', 'Market Bridge', correct ? 'Your bridge is sturdy, funded, and only a little bit snack-powered.' : 'The inspector accepts your prototype notes, but circles the missing constraints in very purple ink.');
      return;
    }
    if (action === 'council-opening') {
      state.answers.council.opening = value;
      if (value === 'listen') { nudge('collaboration', 0.2); nudge('evidenceSeeking', 0.06); }
      if (value === 'rule') { nudge('planning', 0.16); nudge('analyticalThinking', 0.07); }
      if (value === 'pilot') { nudge('creativeProblemFraming', 0.18); nudge('riskPreference', 0.12); }
      saveState();
      setModal({ type: 'councilBoard' });
      return;
    }
    if (action === 'toggle-policy') {
      const selected = state.answers.council.policies;
      const index = selected.indexOf(value);
      if (index >= 0) selected.splice(index, 1);
      else if (selected.length < 3) selected.push(value);
      else { toast('The council only lets you promise three things at once.'); return; }
      saveState();
      renderModal();
      return;
    }
    if (action === 'council-next') {
      if (state.answers.council.policies.length !== 3) { toast('Choose exactly three policies.'); return; }
      const totals = councilTotals();
      const solved = totals.every((score) => score >= 3);
      state.answers.council.boardSolved = solved;
      nudge('collaboration', solved ? 0.24 : 0.09);
      nudge('planning', solved ? 0.12 : 0.05);
      nudge('creativeProblemFraming', solved ? 0.1 : 0.06);
      saveState();
      setModal({ type: 'councilOutcome' });
      return;
    }
    if (action === 'council-outcome') {
      state.answers.council.outcome = value;
      if (value === 'charter') { nudge('collaboration', 0.1); nudge('evidenceSeeking', 0.07); }
      if (value === 'pilot') { nudge('creativeProblemFraming', 0.1); nudge('riskPreference', 0.08); }
      if (value === 'services') { nudge('planning', 0.1); }
      completeMission('council', 'Council of Three', state.answers.council.boardSolved ? 'Every council signs the treaty. The Dreamer immediately asks if the signature can glitter.' : 'The council accepts your proposed next step and asks you to keep listening as the city iterates.');
      return;
    }
    if (action === 'value-change') {
      const delta = Number(element.dataset.delta);
      const values = state.answers.values;
      if (delta > 0 && valueTotal() >= 10) { toast('All ten Vision Tokens are already in orbit.'); return; }
      if (delta < 0 && values[key] <= 0) return;
      values[key] = clamp(values[key] + delta, 0, 10);
      saveState();
      renderModal();
      return;
    }
    if (action === 'vault-values-next') {
      if (valueTotal() !== 10) { toast('Place all ten Vision Tokens first.'); return; }
      setModal({ type: 'vaultConstraints' });
      return;
    }
    if (action === 'constraint') {
      state.answers.constraints[key] = value;
      saveState();
      renderModal();
      return;
    }
    if (action === 'finish-profile') {
      if (!Object.values(state.answers.constraints).every(Boolean)) { toast('Choose one option in every practical tool.'); return; }
      finishProfile();
    }
  }

  function vectorFit(player, weights) {
    let weighted = 0;
    let total = 0;
    Object.keys(weights).forEach((key) => {
      weighted += (player[key] || 0) * weights[key];
      total += weights[key];
    });
    return total ? weighted / total : 0.5;
  }
  function missionProblemVector() {
    const archiveScore = state.answers.archive.mosaicSolved ? (state.answers.archive.priorityCorrect ? 1 : 0.72) : 0.35;
    const bridgeScore = state.answers.bridge.guardrailCorrect ? Math.max(0.85, bridgeQuality()) : bridgeQuality() * 0.76;
    const councilScore = state.answers.council.boardSolved ? 0.94 : 0.62;
    return {
      analyticalThinking: archiveScore,
      creativeProblemFraming: clamp((state.answers.archive.mosaicMoves && state.answers.archive.mosaicMoves <= 14 ? 0.9 : 0.68) + (state.answers.bridge.opening === 'pilot' ? 0.1 : 0), 0, 1),
      planning: bridgeScore,
      collaboration: councilScore,
      evidenceSeeking: archiveScore,
      riskPreference: state.signals.riskPreference
    };
  }
  function constraintFit(career) {
    const chosen = state.answers.constraints;
    const keys = ['time', 'budget', 'location', 'urgency'];
    const score = keys.reduce((sum, key) => sum + (career.constraints[key].includes(chosen[key]) ? 1 : 0.45), 0);
    return score / keys.length;
  }
  function rankCareers() {
    const values = {};
    valueMeta.forEach((item) => { values[item.key] = state.answers.values[item.key] / 10; });
    const problem = missionProblemVector();
    return careers.map((career) => {
      const components = {
        problemSolving: Math.round(vectorFit(problem, career.traits) * 100),
        skills: Math.round(vectorFit(state.signals, career.traits) * 100),
        values: Math.round(vectorFit(values, career.values) * 100),
        constraints: Math.round(constraintFit(career) * 100),
        market: Math.round(career.market * 100)
      };
      const score = Math.round(components.problemSolving * 0.3 + components.skills * 0.25 + components.values * 0.2 + components.constraints * 0.15 + components.market * 0.1);
      return { id: career.id, icon: career.icon, title: career.title, overview: career.overview, prep: career.prep, tradeoff: career.tradeoff, score: score, components: components };
    }).sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
  }
  function profilePayload(recommendations) {
    return {
      user_id: state.user.id,
      completed_at: state.results ? state.results.completedAt : new Date().toISOString(),
      scoring_weights: { problem_solving: 30, skills: 25, values: 20, constraints: 15, demo_market_signal: 10 },
      mission_evidence: {
        silent_archive: { mosaic_solved: state.answers.archive.mosaicSolved, evidence_check_correct: state.answers.archive.priorityCorrect },
        market_bridge: { energy_blocks: bridgeTotal(), guardrail_check_correct: state.answers.bridge.guardrailCorrect },
        council_of_three: { treaty_board_solved: state.answers.council.boardSolved }
      },
      signals: state.signals,
      vision_tokens: state.answers.values,
      practical_constraints: state.answers.constraints,
      top_paths: recommendations.map((career, index) => ({ rank: index + 1, id: career.id, title: career.title, score: career.score, components: career.components }))
    };
  }
  function finishProfile() {
    const recommendations = rankCareers().slice(0, 3);
    state.progress.vault = true;
    state.results = { completedAt: new Date().toISOString(), recommendations: recommendations, payload: profilePayload(recommendations) };
    saveState();
    closeModal(false);
    showResults();
  }
  function showResults() {
    if (!state || !state.results) {
      toast('Finish the Career Compass Vault to unlock the Pathfinder Profile.');
      return;
    }
    mode = 'results';
    closeModal(false);
    showScreen('results-screen');
    renderResults();
  }
  function renderResults() {
    const recommendations = state.results.recommendations || rankCareers().slice(0, 3);
    ui.resultLede.textContent = 'Navigator ' + state.user.id + ', your choices point to routes where your current problem-solving style, values, and practical coordinates overlap.';
    ui.puzzleStat.textContent = missionTotal() + ' / 3';
    ui.resetStat.textContent = String(state.collisionCount);
    ui.idStat.textContent = state.user.id;
    ui.careerList.innerHTML = recommendations.map((career, index) => '<article class="career-card"><div class="career-rank">0' + (index + 1) + '</div><div class="career-main"><p class="career-icon">' + career.icon + '</p><h3>' + escapeHtml(career.title) + '</h3><p>' + escapeHtml(career.overview) + '</p><p class="career-prep"><b>Try next:</b> ' + career.prep.map(escapeHtml).join(' · ') + '</p><p class="career-tradeoff"><b>Trade-off:</b> ' + escapeHtml(career.tradeoff) + '</p></div><div class="career-score"><div><span>PATH ALIGNMENT</span><b>' + career.score + '/100</b></div><div class="score-meter" role="progressbar" aria-label="' + escapeHtml(career.title) + ' path alignment" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + career.score + '"><span style="width:' + career.score + '%"></span></div><small>Problem ' + career.components.problemSolving + ' · Skills ' + career.components.skills + ' · Values ' + career.components.values + ' · Constraints ' + career.components.constraints + ' · Demo market ' + career.components.market + '</small></div></article>').join('');
    ui.profileJson.textContent = JSON.stringify(state.results.payload || profilePayload(recommendations), null, 2);
  }
  function newTimeline() {
    if (!state) return;
    if (!window.confirm('Start a new timeline for ' + state.user.id + '? This replaces the saved mission choices for this user_id.')) return;
    const userId = state.user.id;
    state = freshState(userId);
    draft = { avatarId: state.avatar.id, color: state.avatar.color };
    saveState();
    mode = 'welcome';
    ui.userId.value = userId;
    renderCustomization();
    updateReturningUser();
    showScreen('welcome-screen');
    toast('New timeline ready. The galaxy has conveniently re-scrambled itself.');
  }

  function isTextEntry(element) {
    return element && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  }
  function keyToDirection(key) {
    const normalized = key.toLowerCase();
    if (normalized === 'w' || normalized === 'arrowup') return 'up';
    if (normalized === 's' || normalized === 'arrowdown') return 'down';
    if (normalized === 'a' || normalized === 'arrowleft') return 'left';
    if (normalized === 'd' || normalized === 'arrowright') return 'right';
    return null;
  }
  function trapFocus(event) {
    const focusable = Array.from(ui.modalLayer.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function attachEvents() {
    ui.avatarOptions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-avatar]');
      if (!button) return;
      draft.avatarId = Number(button.dataset.avatar);
      renderCustomization();
    });
    ui.colorOptions.addEventListener('click', (event) => {
      const button = event.target.closest('[data-color]');
      if (!button) return;
      draft.color = button.dataset.color;
      renderCustomization();
    });
    ui.userId.addEventListener('input', updateReturningUser);
    $('generate-id').addEventListener('click', () => {
      const code = Math.random().toString(36).slice(2, 7).toUpperCase();
      ui.userId.value = 'oz-' + code;
      updateReturningUser();
      ui.userId.focus();
    });
    ui.start.addEventListener('click', enterOrbit);
    ui.resume.addEventListener('click', resumeSaved);
    $('return-to-dock').addEventListener('click', () => {
      mode = 'welcome';
      closeModal(false);
      ui.userId.value = state ? state.user.id : ui.userId.value;
      draft = state ? { avatarId: state.avatar.id, color: state.avatar.color } : draft;
      renderCustomization();
      updateReturningUser();
      showScreen('welcome-screen');
    });
    $('brand-home').addEventListener('click', () => {
      if (mode === 'welcome') return;
      mode = 'welcome';
      closeModal(false);
      if (state) {
        ui.userId.value = state.user.id;
        draft = { avatarId: state.avatar.id, color: state.avatar.color };
      }
      renderCustomization();
      updateReturningUser();
      showScreen('welcome-screen');
    });
    ui.viewProfile.addEventListener('click', showResults);
    $('back-to-world').addEventListener('click', () => {
      mode = 'world';
      showScreen('game-screen');
      updateHud();
      ui.canvas.focus({ preventScroll: true });
    });
    $('new-timeline').addEventListener('click', newTimeline);
    ui.modalLayer.addEventListener('click', (event) => {
      if (event.target === ui.modalLayer) { closeModal(); return; }
      const actionElement = event.target.closest('[data-action]');
      if (actionElement) handleAction(actionElement.dataset.action, actionElement);
    });
    document.addEventListener('keydown', (event) => {
      const direction = keyToDirection(event.key);
      if (modal) {
        if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
        if (event.key === 'Tab') { trapFocus(event); return; }
        if (modal.type === 'mosaic' && direction) { event.preventDefault(); moveMosaic(direction); }
        return;
      }
      if (mode !== 'world' || isTextEntry(event.target)) return;
      const normalized = event.key.toLowerCase();
      if (direction) {
        pressed.add(normalized);
        event.preventDefault();
      }
      if (normalized === 'e' && !event.repeat) {
        event.preventDefault();
        interact();
      }
    });
    document.addEventListener('keyup', (event) => pressed.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => pressed.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
  }
  function init() {
    const activeUser = readActiveUserId();
    if (activeUser) ui.userId.value = activeUser;
    renderCustomization();
    updateReturningUser();
    attachEvents();
    window.requestAnimationFrame(frame);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
