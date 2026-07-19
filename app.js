(() => {
  'use strict';

  const STORAGE_KEY = 'life_compass_coach_v3';
  const BACKUP_KEY = 'life_compass_coach_v3_backup_latest';
  const LEGACY_KEYS = ['life_compass_v2', 'mind_logs', 'mind_apps', 'mind_treasures', 'mind_goals', 'mind_settings', 'mind_import_urls'];

  const nowIso = () => new Date().toISOString();
  const uid = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const fmt = (iso) => {
    try { return new Date(iso).toLocaleString('ja-JP', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); }
    catch { return ''; }
  };
  const today = () => new Date().toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'short' });
  const escapeHtml = (str = '') => String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const emptyData = () => ({
    version: 3,
    updatedAt: nowIso(),
    createdAt: nowIso(),
    profile: {
      name: '',
      coachingTone: '現実的で前向き。甘やかしすぎず、具体的な次の一手を出す。',
      aiProvider: 'gemini',
      gasUrl: '',
      gasSyncEnabled: true
    },
    current: [],
    mind: [],
    insights: [],
    reflections: [],
    premises: [],
    future: [],
    goals: [],
    aiHistory: []
  });

  let state = loadState();
  let activeTab = 'home';

  const tabs = [
    { id:'home', label:'ホーム', icon:'home' },
    { id:'current', label:'現在地', icon:'map-pin' },
    { id:'mind', label:'心の声', icon:'heart' },
    { id:'insights', label:'気づき', icon:'lightbulb' },
    { id:'reflection', label:'反省ノート', icon:'rotate-ccw' },
    { id:'premise', label:'前提ノート', icon:'scale' },
    { id:'future', label:'未来設計', icon:'mountain-snow' },
    { id:'goals', label:'目標・目的', icon:'target' },
    { id:'ai', label:'AIコーチ', icon:'sparkles' },
    { id:'backup', label:'バックアップ', icon:'database' }
  ];

  const catalogs = {
    current: ['体調', '仕事/事業', 'お金', '家族', '暮らし', '学び', '不安要素', 'その他'],
    mind: ['不安', '期待', '迷い', '怒り', '感謝', '焦り', '嬉しい', 'その他'],
    insight: ['自分の癖', '人間関係', 'お金', '健康', '仕事/事業', '学び', '生活', 'その他'],
    reflection: ['判断ミス', '先延ばし', 'お金の使い方', '体調管理', '人間関係', '仕事/事業', '生活習慣', 'その他'],
    premise: ['お金', '健康', '行動', '人間関係', '仕事/事業', '安心', '自己評価', 'その他'],
    future: ['行きたい場所', 'やりたい事', '手に入れたい物', 'お金', '健康', '安心', '暮らし', '人間関係', '仕事/事業'],
    goal: ['人生目的', '健康', 'お金', '仕事/事業', '家族', '暮らし', '学び', '旅', '安心']
  };

  function showToast(message, type = 'normal') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden', 'bg-slate-900', 'bg-red-700', 'bg-blue-700', 'bg-amber-700');
    el.classList.add(type === 'error' ? 'bg-red-700' : type === 'success' ? 'bg-blue-700' : type === 'warn' ? 'bg-amber-700' : 'bg-slate-900');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  function safeParse(json, fallback = null, key = 'unknown') {
    if (!json) return fallback;
    try { return JSON.parse(json); }
    catch (e) {
      try {
        const corruptedKey = `corrupted_${key}_${Date.now()}`;
        localStorage.setItem(corruptedKey, json);
      } catch {}
      return fallback;
    }
  }

  function loadState() {
    const base = safeParse(localStorage.getItem(STORAGE_KEY), null, STORAGE_KEY);
    if (base && typeof base === 'object') return normalizeState(base);

    const fresh = emptyData();
    migrateLegacy(fresh);
    persistState(fresh, { silent: true });
    return fresh;
  }

  function normalizeState(data) {
    const base = emptyData();
    const merged = { ...base, ...data };
    merged.profile = { ...base.profile, ...(data.profile || {}) };
    delete merged.profile.geminiKey;
    ['current','mind','insights','reflections','premises','future','goals','aiHistory'].forEach(k => {
      merged[k] = Array.isArray(data[k]) ? data[k] : [];
    });
    merged.version = 3;
    return merged;
  }

  function migrateLegacy(fresh) {
    const oldV2 = safeParse(localStorage.getItem('life_compass_v2'), null, 'life_compass_v2');
    if (oldV2 && typeof oldV2 === 'object') {
      if (Array.isArray(oldV2.logs)) fresh.mind.push(...oldV2.logs.map(x => legacyEntry(x, 'その他', x.text || x.title || '', '旧ログ')));
      if (Array.isArray(oldV2.treasures)) fresh.future.push(...oldV2.treasures.map(x => ({ id:uid(), category:x.type || 'やりたい事', title:'旧データ', body:x.text || '', reason:'旧データから移行', firstStep:'', priority:'中', status:'未着手', createdAt: nowIso(), updatedAt: nowIso() })));
    }

    const mindLogs = safeParse(localStorage.getItem('mind_logs'), [], 'mind_logs');
    if (Array.isArray(mindLogs)) fresh.mind.push(...mindLogs.map(x => legacyEntry(x, x.type || 'その他', x.text || '', '旧・思考記録')));

    const goals = safeParse(localStorage.getItem('mind_goals'), null, 'mind_goals');
    if (goals && typeof goals === 'object') {
      if (goals.life) fresh.goals.push({ id:uid(), category:'人生目的', title:'人生の目標', body:goals.life, why:'旧データから移行', success:'', deadline:'', priority:'高', createdAt: nowIso(), updatedAt: nowIso() });
      if (goals.income) fresh.goals.push({ id:uid(), category:'お金', title:'収入目標', body:goals.income, why:'旧データから移行', success:'', deadline:'', priority:'高', createdAt: nowIso(), updatedAt: nowIso() });
    }

    const treasures = safeParse(localStorage.getItem('mind_treasures'), [], 'mind_treasures');
    if (Array.isArray(treasures)) fresh.future.push(...treasures.map(x => ({ id:uid(), category:x.type || 'やりたい事', title:'宝の地図から移行', body:x.text || '', reason:'旧データから移行', firstStep:(x.actions || []).map(a => a.text).join(' / '), priority:'中', status:x.isCompleted ? '達成' : '未着手', createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : nowIso(), updatedAt: nowIso() })));
  }

  function legacyEntry(x, category, body, title) {
    const time = x.createdAt ? new Date(x.createdAt).toISOString() : nowIso();
    return { id:uid(), category, title, body, feeling:'', createdAt: time, updatedAt: nowIso() };
  }

  function persistState(next = state, options = {}) {
    next.updatedAt = nowIso();
    const text = JSON.stringify(next);
    try {
      localStorage.setItem(STORAGE_KEY, text);
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ savedAt: nowIso(), data: next }));
      return true;
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || String(e).includes('quota'))) {
        showToast('保存容量が足りません。バックアップ後、古いデータや画像を減らしてください。', 'error');
      } else {
        showToast('保存に失敗しました。ブラウザ設定や容量を確認してください。', 'error');
      }
      if (!options.silent) console.error(e);
      return false;
    }
  }

  function updateState(mutator, successMessage = '保存しました') {
    const prev = structuredCloneSafe(state);
    mutator(state);
    if (!persistState(state)) {
      state = prev;
      renderAll();
      return false;
    }
    renderAll();
    if (successMessage) showToast(successMessage, 'success');
    return true;
  }


  function sectionLabel(section) {
    const map = {
      current:'現在地', mind:'心の声', insights:'気づき', reflections:'反省',
      premises:'前提ノート', future:'未来設計', goals:'目標・目的', aiHistory:'AI履歴'
    };
    return map[section] || section;
  }

  function getGasUrl() {
    return String(state.profile?.gasUrl || '').trim();
  }

  function isGasSyncEnabled() {
    return Boolean(getGasUrl() && state.profile.gasSyncEnabled !== false);
  }

  function normalizeForSheet(section, record = {}) {
    const title = record.title || record.before || record.mode || sectionLabel(section);
    const body = record.body || record.after || record.answer || record.question || '';
    const category = record.category || record.kind || record.mode || '';
    const extra1 = record.concern || record.action || record.cause || record.reason || record.why || record.decision || '';
    const extra2 = record.lesson || record.firstStep || record.deadline || record.question || '';
    const extra3 = record.nextAction || record.priority || record.status || record.success || '';
    return { title, body, category, extra1, extra2, extra3 };
  }

  function buildSheetPayload(action, section, record = {}) {
    const normalized = normalizeForSheet(section, record);
    return {
      action,
      app: 'Life Compass Coach',
      appVersion: state.version,
      sentAt: nowIso(),
      section,
      sectionLabel: sectionLabel(section),
      id: record.id || '',
      category: normalized.category,
      title: normalized.title,
      body: normalized.body,
      extra1: normalized.extra1,
      extra2: normalized.extra2,
      extra3: normalized.extra3,
      createdAt: record.createdAt || '',
      updatedAt: record.updatedAt || '',
      raw: record
    };
  }

  async function sendToSpreadsheet(action, section, record = {}, options = {}) {
    const url = getGasUrl();
    if (!url) {
      if (options.manual) showToast('GAS WebアプリURLを先に設定してください', 'warn');
      return false;
    }
    const payload = buildSheetPayload(action, section, record);
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (options.manual) showToast('スプレッドシートへ送信しました。シート側を確認してください。', 'success');
      return true;
    } catch (e) {
      console.error('Spreadsheet sync failed', e);
      const queue = safeParse(localStorage.getItem('life_compass_gas_unsent_queue'), [], 'life_compass_gas_unsent_queue') || [];
      queue.push({ queuedAt: nowIso(), payload });
      try { localStorage.setItem('life_compass_gas_unsent_queue', JSON.stringify(queue)); } catch {}
      if (options.manual) showToast('送信に失敗しました。未送信キューに退避しました。', 'error');
      return false;
    }
  }

  function autoSendToSpreadsheet(action, section, record) {
    if (!isGasSyncEnabled()) return;
    sendToSpreadsheet(action, section, record);
  }

  async function syncAllToSpreadsheet() {
    if (!getGasUrl()) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    const all = getAllEntries();
    showToast(`全データ ${all.length}件を送信します`, 'normal');
    for (const entry of all) {
      await sendToSpreadsheet('syncAll', entry.section, entry);
    }
    for (const history of state.aiHistory) {
      await sendToSpreadsheet('syncAll', 'aiHistory', history);
    }
    showToast('全データ送信が完了しました。スプレッドシートを確認してください。', 'success');
  }

  function saveGasSettings() {
    const url = document.getElementById('gasUrlInput')?.value.trim() || '';
    const enabled = Boolean(document.getElementById('gasEnabledInput')?.checked);
    updateState(s => {
      s.profile.gasUrl = url;
      s.profile.gasSyncEnabled = enabled;
    }, 'GAS設定を保存しました');
  }

  async function testGasConnection() {
    const url = document.getElementById('gasUrlInput')?.value.trim() || getGasUrl();
    if (!url) return showToast('GAS WebアプリURLを入力してください', 'warn');
    updateState(s => { s.profile.gasUrl = url; }, null);
    await sendToSpreadsheet('test', 'system', { id: uid(), title: '接続テスト', body: 'Life Compass Coachからの接続テストです。', createdAt: nowIso(), updatedAt: nowIso() }, { manual: true });
  }

  function structuredCloneSafe(obj) {
    try { return structuredClone(obj); }
    catch { return JSON.parse(JSON.stringify(obj)); }
  }

  function mountTabs() {
    const nav = document.getElementById('tabs');
    nav.innerHTML = tabs.map(t => `<button class="tab-btn ${t.id === activeTab ? 'active' : ''} px-4 py-3.5 min-w-max transition-colors text-sm font-black flex items-center gap-2" data-tab="${t.id}"><i data-lucide="${t.icon}" class="w-4 h-4"></i>${t.label}</button>`).join('');
    nav.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  }

  function switchTab(id) {
    activeTab = id;
    tabs.forEach(t => {
      document.getElementById(`view-${t.id}`)?.classList.toggle('hidden', t.id !== id);
    });
    mountTabs();
    if (id === 'ai') renderAi();
    if (id === 'backup') renderBackup();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshIcons();
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function selectHtml(name, items, selected = '') {
    return `<select name="${name}" class="select">${items.map(x => `<option value="${escapeHtml(x)}" ${x === selected ? 'selected' : ''}>${escapeHtml(x)}</option>`).join('')}</select>`;
  }

  function inputHtml(label, name, placeholder = '', value = '', type = 'text') {
    return `<div><label class="field-label">${label}</label><input class="input" type="${type}" name="${name}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}"></div>`;
  }

  function textareaHtml(label, name, placeholder = '', value = '') {
    return `<div><label class="field-label">${label}</label><textarea class="textarea" name="${name}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea></div>`;
  }

  function submitBtn(text = '保存する', icon = 'save', extra = '') {
    return `<button class="btn-primary btn-blue w-full ${extra}" type="submit"><i data-lucide="${icon}" class="w-5 h-5"></i>${text}</button>`;
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function bindForm(id, handler) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', (e) => { e.preventDefault(); handler(e.currentTarget, formData(e.currentTarget)); });
  }

  function entryActions(section, id) {
    return `<div class="flex gap-2 shrink-0"><button class="btn-icon" data-edit="${section}:${id}" title="編集"><i data-lucide="pencil" class="w-4 h-4"></i></button><button class="btn-icon danger" data-delete="${section}:${id}" title="削除"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`;
  }

  function cardMeta(entry) {
    const parts = [];
    if (entry.category) parts.push(`<span class="badge">${escapeHtml(entry.category)}</span>`);
    if (entry.priority) parts.push(`<span class="badge">優先度: ${escapeHtml(entry.priority)}</span>`);
    if (entry.status) parts.push(`<span class="badge">${escapeHtml(entry.status)}</span>`);
    parts.push(`<span class="badge">${fmt(entry.createdAt)}</span>`);
    return `<div class="flex flex-wrap gap-2 mt-3">${parts.join('')}</div>`;
  }

  function emptyList(message) {
    return `<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center font-black text-slate-500">${message}</div>`;
  }

  function renderHome() {
    const counts = {
      current: state.current.length,
      mind: state.mind.length,
      insights: state.insights.length,
      reflections: state.reflections.length,
      premises: state.premises.length,
      future: state.future.length,
      goals: state.goals.length
    };
    const recent = getAllEntries().slice(0, 5);
    const topGoals = state.goals.slice(0, 3);
    const limiting = state.premises.filter(p => p.kind === '制限する前提').slice(0, 3);

    document.getElementById('view-home').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 space-y-6">
          <div class="panel bg-gradient-to-br from-white to-blue-50 border-blue-800">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p class="text-sm font-black text-blue-700">${today()}</p>
                <h2 class="text-2xl md:text-3xl font-black mt-1">人生の現在地を、今日の一歩に変える</h2>
                <p class="text-slate-700 font-bold mt-3 leading-relaxed">書き出した事実・心・気づき・反省・前提・未来像をAIが総合的に見て、今の相棒に必要な行動を提案します。</p>
              </div>
              <button class="btn-primary btn-blue shrink-0" onclick="LifeCompass.switchTab('ai')"><i data-lucide="sparkles" class="w-5 h-5"></i> AIコーチを開く</button>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${statCard('現在地', counts.current, 'map-pin', 'current')}
            ${statCard('心の声', counts.mind, 'heart', 'mind')}
            ${statCard('気づき', counts.insights, 'lightbulb', 'insights')}
            ${statCard('反省', counts.reflections, 'rotate-ccw', 'reflection')}
            ${statCard('前提', counts.premises, 'scale', 'premise')}
            ${statCard('未来', counts.future, 'mountain-snow', 'future')}
            ${statCard('目標', counts.goals, 'target', 'goals')}
            ${statCard('AI履歴', state.aiHistory.length, 'bot', 'ai')}
          </div>
          <div class="panel">
            <div class="panel-head"><h2 class="panel-title"><i data-lucide="clock"></i> 最近の記録</h2></div>
            <div class="space-y-3">${recent.length ? recent.map(r => `<div class="entry-card"><div class="flex justify-between gap-3"><div><span class="badge">${escapeHtml(r.sectionLabel)}</span><h3 class="font-black mt-2">${escapeHtml(r.title || r.category || '記録')}</h3><p class="text-sm font-bold text-slate-700 mt-1 whitespace-pre-wrap">${escapeHtml(shorten(r.body || r.text || r.before || '', 120))}</p></div><span class="text-xs font-black text-slate-500 shrink-0">${fmt(r.createdAt)}</span></div></div>`).join('') : emptyList('まだ記録がありません。まずは現在地か心の声から書いてみましょう。')}</div>
          </div>
        </div>
        <div class="lg:col-span-4 space-y-6">
          <div class="panel border-blue-700">
            <div class="panel-head"><h2 class="panel-title text-blue-800"><i data-lucide="flag"></i> 目標の上位</h2></div>
            <div class="space-y-3">${topGoals.length ? topGoals.map(g => `<div class="rounded-2xl bg-blue-50 border-2 border-blue-200 p-4"><p class="font-black text-blue-900">${escapeHtml(g.title)}</p><p class="text-sm font-bold text-slate-700 mt-1">${escapeHtml(shorten(g.body, 90))}</p></div>`).join('') : emptyList('目標・目的をまだ登録していません。')}</div>
          </div>
          <div class="panel border-indigo-700">
            <div class="panel-head"><h2 class="panel-title text-indigo-800"><i data-lucide="scale"></i> 見直したい前提</h2></div>
            <div class="space-y-3">${limiting.length ? limiting.map(p => `<div class="rounded-2xl bg-indigo-50 border-2 border-indigo-200 p-4"><p class="font-black text-indigo-900">${escapeHtml(p.before)}</p><p class="text-sm font-bold text-slate-700 mt-1">→ ${escapeHtml(p.after || '置き換え前提を追加しましょう')}</p></div>`).join('') : emptyList('制限する前提はまだありません。')}</div>
          </div>
        </div>
      </div>`;
  }

  function statCard(label, count, icon, tab) {
    return `<button onclick="LifeCompass.switchTab('${tab}')" class="bg-white border-2 border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-left shadow-sm transition-colors"><div class="flex items-center justify-between"><i data-lucide="${icon}" class="w-5 h-5 text-blue-700"></i><span class="text-2xl font-black">${count}</span></div><p class="text-sm font-black text-slate-600 mt-2">${label}</p></button>`;
  }

  function renderForms() {
    document.getElementById('currentForm').innerHTML = `
      <div><label class="field-label">カテゴリ</label>${selectHtml('category', catalogs.current)}</div>
      ${inputHtml('タイトル', 'title', '例：今の体調、今の仕事状況、今月のお金の状態')}
      ${textareaHtml('今ある事・事実', 'body', '感情ではなく、なるべく事実として書き出します。')}
      ${textareaHtml('気になる点', 'concern', '不安・違和感・注意点があれば書きます。')}
      ${submitBtn('現在地を保存', 'map-pin')}`;

    document.getElementById('mindForm').innerHTML = `
      <div><label class="field-label">感情カテゴリ</label>${selectHtml('category', catalogs.mind)}</div>
      ${inputHtml('一言タイトル', 'title', '例：今日は焦りが強い / 少し安心した')}
      ${textareaHtml('今考えていること・思っていること', 'body', 'まとまっていなくてOKです。頭の中をそのまま書きます。')}
      ${inputHtml('感情の強さ 1〜10', 'intensity', '例：7', '', 'number')}
      ${submitBtn('心の声を保存', 'heart')}`;

    document.getElementById('insightForm').innerHTML = `
      <div><label class="field-label">気づきカテゴリ</label>${selectHtml('category', catalogs.insight)}</div>
      ${inputHtml('気づきタイトル', 'title', '例：自分は不安な時ほど急いでしまう')}
      ${textareaHtml('気づいたこと', 'body', '今日の学び、パターン、違和感、改善のヒントなど。')}
      ${textareaHtml('活かし方', 'action', 'この気づきをどう使うか。')}
      ${submitBtn('気づきを保存', 'lightbulb')}`;

    document.getElementById('reflectionForm').innerHTML = `
      <div><label class="field-label">反省カテゴリ</label>${selectHtml('category', catalogs.reflection)}</div>
      ${inputHtml('反省タイトル', 'title', '例：疲れているのに無理して進めた')}
      ${textareaHtml('何が起きたか', 'body', '出来事を冷静に書きます。')}
      ${textareaHtml('原因・背景', 'cause', 'なぜそうなったか。体調、前提、焦り、環境など。')}
      ${textareaHtml('学び', 'lesson', 'ここから何を学ぶか。')}
      ${textareaHtml('次に変える行動', 'nextAction', '次はどうするか。小さく具体的に。')}
      ${submitBtn('反省を保存', 'rotate-ccw', 'btn-amber')}`;

    document.getElementById('premiseForm').innerHTML = `
      <div><label class="field-label">前提の種類</label>${selectHtml('kind', ['制限する前提', '力になる前提', '確認したい前提', '置き換え前提'])}</div>
      <div><label class="field-label">領域</label>${selectHtml('category', catalogs.premise)}</div>
      ${textareaHtml('今の前提', 'before', '例：お金を使うのは悪い / 今日は悪寒がないからコンビニに寄らないでおこう')}
      ${textareaHtml('置き換えたい前提・別の見方', 'after', '例：まだ数百円あるから、好きなコーヒーで安心を買ってもいい')}
      ${textareaHtml('この前提で選ぶ行動', 'decision', '例：今日は無理せず帰る / 体調が良ければ小さなご褒美を許す')}
      ${submitBtn('前提を保存', 'scale')}`;

    document.getElementById('futureForm').innerHTML = `
      <div><label class="field-label">未来カテゴリ</label>${selectHtml('category', catalogs.future)}</div>
      ${inputHtml('タイトル', 'title', '例：月1回高級旅館に泊まる / 目を守って安心して暮らす')}
      ${textareaHtml('手にしたい未来', 'body', '行きたい場所・やりたい事・欲しいもの・お金・健康・安心など。')}
      ${textareaHtml('なぜ欲しいのか', 'reason', '理由が明確だとAIの提案が良くなります。')}
      ${textareaHtml('最初の一歩', 'firstStep', '今週できる小さな一歩。')}
      <div><label class="field-label">優先度</label>${selectHtml('priority', ['高', '中', '低'])}</div>
      <div><label class="field-label">状態</label>${selectHtml('status', ['未着手', '準備中', '進行中', '達成', '保留'])}</div>
      ${submitBtn('未来を保存', 'mountain-snow')}`;

    document.getElementById('goalForm').innerHTML = `
      <div><label class="field-label">目標カテゴリ</label>${selectHtml('category', catalogs.goal)}</div>
      ${inputHtml('目標タイトル', 'title', '例：場所と時間に縛られず月150万円を目指す')}
      ${textareaHtml('目標・目的', 'body', '何を実現したいか。')}
      ${textareaHtml('なぜそれが大切か', 'why', '人生にとっての意味。')}
      ${inputHtml('期限・目安', 'deadline', '例：2027年12月 / 1年以内')}
      ${textareaHtml('達成の基準', 'success', '何ができたら達成とするか。')}
      <div><label class="field-label">優先度</label>${selectHtml('priority', ['高', '中', '低'])}</div>
      ${submitBtn('目標を保存', 'target')}`;
  }

  function renderLists() {
    renderCurrent(); renderMind(); renderInsights(); renderReflections(); renderPremises(); renderFuture(); renderGoals();
    bindActionButtons();
  }

  function renderCurrent() {
    document.getElementById('currentCount').textContent = `${state.current.length}件`;
    document.getElementById('currentList').innerHTML = state.current.length ? state.current.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><h3 class="text-lg font-black">${escapeHtml(e.title)}</h3><p class="mt-2 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(e.body)}</p>${e.concern ? `<p class="mt-3 text-sm font-bold text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl p-3">気になる点：${escapeHtml(e.concern)}</p>` : ''}${cardMeta(e)}</div>${entryActions('current', e.id)}</div></article>`).join('') : emptyList('現在地の記録はまだありません。');
  }

  function renderMind() {
    document.getElementById('mindCount').textContent = `${state.mind.length}件`;
    document.getElementById('mindList').innerHTML = state.mind.length ? state.mind.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><h3 class="text-lg font-black">${escapeHtml(e.title)}</h3><p class="mt-2 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(e.body)}</p>${e.intensity ? `<p class="mt-3 badge">感情の強さ: ${escapeHtml(e.intensity)}/10</p>` : ''}${cardMeta(e)}</div>${entryActions('mind', e.id)}</div></article>`).join('') : emptyList('心の声はまだありません。');
  }

  function renderInsights() {
    document.getElementById('insightCount').textContent = `${state.insights.length}件`;
    document.getElementById('insightList').innerHTML = state.insights.length ? state.insights.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><h3 class="text-lg font-black">${escapeHtml(e.title)}</h3><p class="mt-2 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(e.body)}</p>${e.action ? `<p class="mt-3 text-sm font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">活かし方：${escapeHtml(e.action)}</p>` : ''}${cardMeta(e)}</div>${entryActions('insights', e.id)}</div></article>`).join('') : emptyList('気づきはまだありません。');
  }

  function renderReflections() {
    document.getElementById('reflectionCount').textContent = `${state.reflections.length}件`;
    document.getElementById('reflectionList').innerHTML = state.reflections.length ? state.reflections.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><h3 class="text-lg font-black">${escapeHtml(e.title)}</h3><p class="mt-2 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(e.body)}</p><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">${smallBox('原因', e.cause)}${smallBox('学び', e.lesson)}${smallBox('次の行動', e.nextAction)}</div>${cardMeta(e)}</div>${entryActions('reflections', e.id)}</div></article>`).join('') : emptyList('反省ノートはまだありません。');
  }

  function renderPremises() {
    document.getElementById('premiseCount').textContent = `${state.premises.length}件`;
    document.getElementById('premiseList').innerHTML = state.premises.length ? state.premises.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><div class="flex flex-wrap gap-2"><span class="badge">${escapeHtml(e.kind)}</span><span class="badge">${escapeHtml(e.category)}</span></div><h3 class="text-base md:text-lg font-black mt-3 text-indigo-950">前提：${escapeHtml(e.before)}</h3>${e.after ? `<p class="mt-3 text-sm font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">別の見方：${escapeHtml(e.after)}</p>` : ''}${e.decision ? `<p class="mt-3 text-sm font-bold text-slate-700 whitespace-pre-wrap">行動：${escapeHtml(e.decision)}</p>` : ''}${cardMeta(e)}</div>${entryActions('premises', e.id)}</div></article>`).join('') : emptyList('前提ノートはまだありません。');
  }

  function renderFuture() {
    document.getElementById('futureCount').textContent = `${state.future.length}件`;
    document.getElementById('futureList').innerHTML = state.future.length ? state.future.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><h3 class="text-lg font-black">${escapeHtml(e.title)}</h3><p class="mt-2 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(e.body)}</p>${e.reason ? `<p class="mt-3 text-sm font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">理由：${escapeHtml(e.reason)}</p>` : ''}${e.firstStep ? `<p class="mt-3 text-sm font-bold text-blue-800 bg-blue-50 border-2 border-blue-200 rounded-xl p-3">最初の一歩：${escapeHtml(e.firstStep)}</p>` : ''}${cardMeta(e)}</div>${entryActions('future', e.id)}</div></article>`).join('') : emptyList('未来設計はまだありません。');
  }

  function renderGoals() {
    document.getElementById('goalCount').textContent = `${state.goals.length}件`;
    document.getElementById('goalList').innerHTML = state.goals.length ? state.goals.map(e => `
      <article class="entry-card"><div class="flex justify-between gap-3"><div><h3 class="text-lg font-black">${escapeHtml(e.title)}</h3><p class="mt-2 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(e.body)}</p><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">${smallBox('なぜ大切か', e.why)}${smallBox('期限', e.deadline)}${smallBox('達成基準', e.success)}</div>${cardMeta(e)}</div>${entryActions('goals', e.id)}</div></article>`).join('') : emptyList('人生の目標・目的はまだありません。');
  }

  function smallBox(title, value) {
    if (!value) return '';
    return `<div class="rounded-xl bg-slate-50 border-2 border-slate-200 p-3"><p class="text-[11px] font-black text-slate-500">${title}</p><p class="text-sm font-bold text-slate-800 mt-1 whitespace-pre-wrap">${escapeHtml(value)}</p></div>`;
  }

  function bindActionButtons() {
    document.querySelectorAll('[data-delete]').forEach(btn => btn.onclick = () => {
      const [section, id] = btn.dataset.delete.split(':');
      const deleted = state[section]?.find(x => x.id === id);
      if (!deleted) return;
      if (!confirm('この記録を削除しますか？')) return;
      if (updateState(s => { s[section] = s[section].filter(x => x.id !== id); }, '削除しました')) {
        autoSendToSpreadsheet('delete', section, deleted);
      }
    });
    document.querySelectorAll('[data-edit]').forEach(btn => btn.onclick = () => {
      const [section, id] = btn.dataset.edit.split(':');
      editEntry(section, id);
    });
  }

  function editEntry(section, id) {
    const item = state[section].find(x => x.id === id);
    if (!item) return;
    const labelMap = { current:'現在地', mind:'心の声', insights:'気づき', reflections:'反省', premises:'前提', future:'未来', goals:'目標' };
    const text = prompt(`${labelMap[section]}の本文を編集します。必要な部分だけ修正してください。`, item.body || item.before || item.title || '');
    if (text === null) return;
    if (updateState(s => {
      const target = s[section].find(x => x.id === id);
      if (!target) return;
      if (section === 'premises') target.before = text.trim();
      else target.body = text.trim();
      target.updatedAt = nowIso();
    }, '更新しました')) {
      const updated = state[section].find(x => x.id === id);
      autoSendToSpreadsheet('edit', section, updated);
    }
  }

  function saveEntry(section, entry, form) {
    if (updateState(s => s[section].unshift(entry), '保存しました')) {
      autoSendToSpreadsheet('create', section, entry);
      form.reset();
    }
  }

  function bindForms() {
    bindForm('currentForm', (form, d) => {
      if (!d.title && !d.body) return showToast('タイトルか本文を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '現在地', body:d.body || '', concern:d.concern || '', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('current', entry, form);
    });
    bindForm('mindForm', (form, d) => {
      if (!d.title && !d.body) return showToast('タイトルか本文を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '心の声', body:d.body || '', intensity:d.intensity || '', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('mind', entry, form);
    });
    bindForm('insightForm', (form, d) => {
      if (!d.title && !d.body) return showToast('気づきを入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '気づき', body:d.body || '', action:d.action || '', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('insights', entry, form);
    });
    bindForm('reflectionForm', (form, d) => {
      if (!d.title && !d.body) return showToast('反省内容を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '反省', body:d.body || '', cause:d.cause || '', lesson:d.lesson || '', nextAction:d.nextAction || '', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('reflections', entry, form);
    });
    bindForm('premiseForm', (form, d) => {
      if (!d.before && !d.after) return showToast('前提を入力してください', 'warn');
      const entry = { id:uid(), kind:d.kind, category:d.category, before:d.before || '', after:d.after || '', decision:d.decision || '', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('premises', entry, form);
    });
    bindForm('futureForm', (form, d) => {
      if (!d.title && !d.body) return showToast('未来像を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '未来', body:d.body || '', reason:d.reason || '', firstStep:d.firstStep || '', priority:d.priority || '中', status:d.status || '未着手', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('future', entry, form);
    });
    bindForm('goalForm', (form, d) => {
      if (!d.title && !d.body) return showToast('目標を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '目標', body:d.body || '', why:d.why || '', deadline:d.deadline || '', success:d.success || '', priority:d.priority || '中', createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('goals', entry, form);
    });
  }

  function renderAi() {
    const history = state.aiHistory.slice(0, 5);
    document.getElementById('view-ai').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4 space-y-6">
          <div class="panel border-blue-700">
            <h2 class="panel-title text-blue-800"><i data-lucide="sparkles"></i> AI人生コーチング</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">保存済みデータをまとめて読み込み、今の人生判断・前提・目標とのズレ・次の一手を整理します。</p>
            <div class="space-y-4">
              <div><label class="field-label">使用AI</label><select id="aiProvider" class="select">
                <option value="gemini" ${state.profile.aiProvider !== 'openai' ? 'selected' : ''}>Gemini 2.5 Flash（GAS側固定）</option>
                <option value="openai" ${state.profile.aiProvider === 'openai' ? 'selected' : ''}>ChatGPT 5.4 mini（GAS側固定）</option>
              </select><p class="text-[11px] font-bold text-slate-500 mt-1">APIキーは画面に入力しません。GASのスクリプトプロパティに保存します。</p></div>
              <div><label class="field-label">AIの見方</label><select id="coachMode" class="select">
                <option value="総合診断">人生総合診断</option>
                <option value="今日の一手">今日の一手を決める</option>
                <option value="前提の見直し">前提の見直し</option>
                <option value="反省から改善">反省から改善</option>
                <option value="目標とのズレ">目標とのズレ確認</option>
                <option value="ビジネス現実チェック">ビジネス現実チェック</option>
              </select></div>
              <div><label class="field-label">追加で相談したいこと</label><textarea id="coachQuestion" class="textarea" placeholder="例：今日なにを優先すべき？ この前提は変えた方がいい？"></textarea></div>
              <button id="runAiBtn" class="btn-primary btn-blue w-full"><i data-lucide="bot" class="w-5 h-5"></i> AIに総合判断してもらう</button>
              <button id="localCoachBtn" class="btn-soft w-full"><i data-lucide="brain" class="w-5 h-5"></i> APIなしで簡易コーチング</button>
            </div>
          </div>
          <div class="panel">
            <h2 class="panel-title"><i data-lucide="list-checks"></i> AIが見るデータ</h2>
            <div class="mt-4 grid grid-cols-2 gap-2 text-sm font-black text-slate-700">
              ${miniCount('現在地', state.current.length)}${miniCount('心の声', state.mind.length)}${miniCount('気づき', state.insights.length)}${miniCount('反省', state.reflections.length)}${miniCount('前提', state.premises.length)}${miniCount('未来', state.future.length)}${miniCount('目標', state.goals.length)}${miniCount('AI履歴', state.aiHistory.length)}
            </div>
          </div>
        </div>
        <div class="lg:col-span-8 space-y-6">
          <div class="panel min-h-[420px]">
            <div class="panel-head"><h2 class="panel-title"><i data-lucide="message-circle-heart"></i> コーチング結果</h2><button id="copyAiBtn" class="btn-soft text-sm"><i data-lucide="copy" class="w-4 h-4"></i> コピー</button></div>
            <div id="aiResult" class="prose-box rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 md:p-6 font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">ここにAIコーチング結果が表示されます。</div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2 class="panel-title"><i data-lucide="history"></i> 最近のAI履歴</h2></div>
            <div class="space-y-3">${history.length ? history.map(h => `<div class="entry-card"><div class="flex justify-between gap-2"><span class="badge">${escapeHtml(h.mode)}${h.model ? ' / ' + escapeHtml(h.model) : ''}</span><span class="text-xs font-black text-slate-500">${fmt(h.createdAt)}</span></div><p class="text-sm font-bold text-slate-700 mt-3 whitespace-pre-wrap">${escapeHtml(shorten(h.answer, 240))}</p></div>`).join('') : emptyList('AI履歴はまだありません。')}</div>
          </div>
        </div>
      </div>`;
    document.getElementById('runAiBtn').onclick = runAiCoach;
    document.getElementById('localCoachBtn').onclick = () => {
      const result = buildLocalCoaching();
      const historyEntry = { id:uid(), mode:'APIなし簡易コーチング', question:'', answer:result, createdAt:nowIso(), updatedAt:nowIso() };
      if (updateState(s => s.aiHistory.unshift(historyEntry), '簡易コーチングを作成しました')) {
        autoSendToSpreadsheet('create', 'aiHistory', historyEntry);
      }
      switchTab('ai');
      const out = document.getElementById('aiResult');
      if (out) out.textContent = result;
    };
    document.getElementById('copyAiBtn').onclick = async () => {
      const text = document.getElementById('aiResult').textContent || '';
      try { await navigator.clipboard.writeText(text); showToast('コピーしました', 'success'); } catch { showToast('コピーできませんでした', 'error'); }
    };
    refreshIcons();
  }

  function miniCount(label, count) {
    return `<div class="rounded-xl bg-slate-50 border-2 border-slate-200 p-3 flex justify-between"><span>${label}</span><span>${count}</span></div>`;
  }

  function buildPrompt(mode, question) {
    const bundle = buildDataBundle();
    return `あなたは、ユーザーの人生全体を現実的かつ前向きに支援するAI人生コーチです。甘い励ましだけでなく、事実・前提・目標・体調・お金・感情を総合して、具体的な行動まで落とし込んでください。医療・法律・投資の断定は避け、必要なら専門家確認を促してください。

【今回の診断モード】${mode}
【追加相談】${question || '特になし'}

【保存済みデータ】
${bundle}

【回答形式】
1. 今の人生の現在地
2. 強み・資産になっているもの
3. 注意すべき不安・ズレ・思い込み
4. 人生の前提の見直し
5. 未来目標に近づくための優先順位
6. 今日やる小さな一手 3つ
7. やらない方がいいこと
8. 最後に短いコーチングメッセージ

口調は日本語。具体的に。厳しさと温かさのバランスを取ってください。`;
  }

  function buildDataBundle() {
    const pick = (arr, fields) => arr.slice(0, 25).map((x, i) => `${i+1}. ` + fields.map(f => x[f] ? `${f}:${x[f]}` : '').filter(Boolean).join(' / ')).join('\n') || 'なし';
    return [
      `■現在地\n${pick(state.current, ['category','title','body','concern'])}`,
      `■心の声\n${pick(state.mind, ['category','title','body','intensity'])}`,
      `■気づき\n${pick(state.insights, ['category','title','body','action'])}`,
      `■反省\n${pick(state.reflections, ['category','title','body','cause','lesson','nextAction'])}`,
      `■人生の前提\n${pick(state.premises, ['kind','category','before','after','decision'])}`,
      `■未来設計\n${pick(state.future, ['category','title','body','reason','firstStep','priority','status'])}`,
      `■目標・目的\n${pick(state.goals, ['category','title','body','why','deadline','success','priority'])}`
    ].join('\n\n');
  }

  async function runAiCoach() {
    const provider = document.getElementById('aiProvider')?.value || 'gemini';
    const mode = document.getElementById('coachMode')?.value || '総合診断';
    const question = document.getElementById('coachQuestion')?.value.trim() || '';
    if (!getGasUrl()) return showToast('AI診断にはGAS WebアプリURLの設定が必要です。バックアップ画面で設定してください。', 'warn');

    updateState(s => { s.profile.aiProvider = provider; }, null);
    switchTab('ai');
    const resultEl = document.getElementById('aiResult');
    resultEl.textContent = `${provider === 'openai' ? 'ChatGPT' : 'Gemini'} がGAS経由で人生データを読んでいます。少しだけお待ちください。`;

    const prompt = buildPrompt(mode, question);
    try {
      const data = await requestAiCoachFromGas({ provider, mode, question, prompt });
      const answer = data.answer || '回答を取得できませんでした。';
      const historyEntry = {
        id: uid(),
        provider: data.provider || provider,
        model: data.model || '',
        mode,
        question,
        answer,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      if (updateState(s => s.aiHistory.unshift(historyEntry), 'AIコーチングを保存しました')) {
        // GAS側でAI履歴はすでに保存済み。ブラウザ側の履歴保存のみ行います。
      }
      switchTab('ai');
      const out = document.getElementById('aiResult');
      if (out) out.textContent = answer;
    } catch (e) {
      console.error(e);
      resultEl.textContent = 'AI連携に失敗しました。GAS URL、デプロイ権限、スクリプトプロパティのAPIキーを確認してください。下の「APIなしで簡易コーチング」も使えます。';
      showToast('AI連携に失敗しました', 'error');
    }
  }

  async function requestAiCoachFromGas({ provider, mode, question, prompt }) {
    const url = getGasUrl();
    const payload = {
      action: 'aiCoach',
      app: 'Life Compass Coach',
      appVersion: state.version,
      id: uid(),
      sentAt: nowIso(),
      provider,
      mode,
      question,
      prompt
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch { throw new Error(`GASからJSON以外の応答が返りました: ${text.slice(0, 200)}`); }
    if (!json.ok) throw new Error(json.message || 'GAS AI Error');
    return json;
  }

  function buildLocalCoaching() {
    const limiting = state.premises.filter(p => p.kind === '制限する前提');
    const helpful = state.premises.filter(p => p.kind === '力になる前提' || p.kind === '置き換え前提');
    const highGoals = state.goals.filter(g => g.priority === '高');
    const highFuture = state.future.filter(f => f.priority === '高');
    const recentMind = state.mind.slice(0, 3);
    const recentRef = state.reflections.slice(0, 3);
    const recentInsight = state.insights.slice(0, 3);

    return `【APIなし簡易コーチング】

1. 今の現在地
保存データを見る限り、現在地 ${state.current.length}件、心の声 ${state.mind.length}件、気づき ${state.insights.length}件、反省 ${state.reflections.length}件、前提 ${state.premises.length}件、未来設計 ${state.future.length}件、目標 ${state.goals.length}件が記録されています。まず「書き出せている」こと自体が大きいです。頭の中だけで戦うより、紙に出した方が勝率は上がります。

2. 目標に近いもの
${highGoals.length ? highGoals.slice(0,3).map(g => `・${g.title}：${shorten(g.body, 80)}`).join('\n') : '・高優先度の目標がまだありません。まず1つだけ決めるとAI判断が鋭くなります。'}

3. 未来の欲しいもの
${highFuture.length ? highFuture.slice(0,3).map(f => `・${f.title}：${shorten(f.body, 80)}`).join('\n') : '・高優先度の未来設計がまだありません。「お金・健康・安心・行きたい場所」から1つ書くのがおすすめです。'}

4. 見直したい前提
${limiting.length ? limiting.slice(0,3).map(p => `・${p.before}\n  → 置き換え候補：${p.after || 'まだ未設定'}`).join('\n') : '・制限する前提はまだ記録されていません。迷った時の口ぐせを書いてみると見つかります。'}

5. 力になる前提
${helpful.length ? helpful.slice(0,3).map(p => `・${p.after || p.before}`).join('\n') : '・力になる前提がまだ少ないです。「今あるもの」「できていること」「許していいこと」を書くと人生の見方が変わります。'}

6. 反省から見える改善点
${recentRef.length ? recentRef.map(r => `・${r.title}：次は「${r.nextAction || '次の行動を具体化'}」`).join('\n') : '・反省ノートがまだありません。失敗ではなく、次の作戦として1つ残しましょう。'}

7. 今日の小さな一手
・現在地を1つ追加する
・前提ノートに「今の自分を縛っている考え」を1つ書く
・未来設計に「欲しい安心」を1つ書く

8. コーチングメッセージ
大きく変える必要はありません。今日は「見える化」を1つ増やせば十分です。人生は一発逆転より、前提の微修正で方向が変わります。数百円のコーヒーも、浪費ではなく“安心を買う投資”になる日があります。`;
  }

  function renderBackup() {
    const size = new Blob([JSON.stringify(state)]).size;
    document.getElementById('view-backup').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5 space-y-6">
          <div class="panel border-blue-700">
            <h2 class="panel-title text-blue-800"><i data-lucide="file-spreadsheet"></i> スプレッドシート保存設定</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">GAS WebアプリURLを貼り付けると、新しく保存した記録をGoogleスプレッドシートにも送信します。</p>
            <div class="space-y-3">
              <div><label class="field-label">GAS WebアプリURL</label><input id="gasUrlInput" class="input font-mono text-xs" type="url" placeholder="https://script.google.com/macros/s/xxxx/exec" value="${escapeHtml(state.profile.gasUrl || '')}"></div>
              <label class="flex items-center gap-2 text-sm font-black text-slate-700"><input id="gasEnabledInput" type="checkbox" class="w-5 h-5" ${state.profile.gasSyncEnabled !== false ? 'checked' : ''}> 新規保存・編集・削除・AI履歴を自動送信する</label>
              <button id="saveGasSettingsBtn" class="btn-primary btn-blue w-full"><i data-lucide="save" class="w-5 h-5"></i> GAS設定を保存</button>
              <button id="testGasBtn" class="btn-soft w-full"><i data-lucide="send" class="w-5 h-5"></i> 接続テストを送信</button>
              <button id="syncAllGasBtn" class="btn-soft w-full"><i data-lucide="refresh-cw" class="w-5 h-5"></i> 既存データを全件スプレッドシートへ送信</button>
            </div>
          </div>
          <div class="panel">
            <h2 class="panel-title"><i data-lucide="database"></i> バックアップ・復元</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">人生データは大事です。たまにJSONを書き出してください。これは“人生のセーブポイント”です。</p>
            <div class="space-y-3">
              <button id="exportJsonBtn" class="btn-primary btn-blue w-full"><i data-lucide="download" class="w-5 h-5"></i> JSONバックアップを書き出す</button>
              <button id="exportCsvBtn" class="btn-soft w-full"><i data-lucide="file-spreadsheet" class="w-5 h-5"></i> CSVを書き出す</button>
              <button id="exportMarkdownBtn" class="btn-soft w-full"><i data-lucide="file-text" class="w-5 h-5"></i> Markdownを書き出す</button>
              <label class="btn-soft w-full cursor-pointer"><i data-lucide="upload" class="w-5 h-5"></i> JSONから復元<input id="importJsonInput" type="file" accept="application/json,.json" class="hidden"></label>
            </div>
          </div>
          <div class="panel border-amber-600">
            <h2 class="panel-title text-amber-800"><i data-lucide="triangle-alert"></i> リセット</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">必ずJSONバックアップ後に実行してください。</p>
            <button id="resetBtn" class="btn-primary btn-danger w-full"><i data-lucide="trash-2" class="w-5 h-5"></i> 全データをリセット</button>
          </div>
        </div>
        <div class="lg:col-span-7">
          <div class="panel">
            <div class="panel-head"><h2 class="panel-title"><i data-lucide="shield-check"></i> 保存状態</h2></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 font-bold text-sm">
              ${statusRow('保存キー', STORAGE_KEY)}
              ${statusRow('最終更新', new Date(state.updatedAt).toLocaleString('ja-JP'))}
              ${statusRow('推定サイズ', `${(size/1024).toFixed(1)} KB`)}
              ${statusRow('自動バックアップ', localStorage.getItem(BACKUP_KEY) ? 'あり' : 'なし')}
              ${statusRow('GAS連携', getGasUrl() ? (state.profile.gasSyncEnabled !== false ? '自動送信ON' : 'URL設定済み / 自動送信OFF') : '未設定')}
              ${statusRow('GAS URL', getGasUrl() || '未設定')}
              ${statusRow('AIモデル', 'Gemini: gemini-2.5-flash / ChatGPT: gpt-5.4-mini（GAS側固定）')}
              ${statusRow('未送信キュー', `${(safeParse(localStorage.getItem('life_compass_gas_unsent_queue'), [], 'life_compass_gas_unsent_queue') || []).length}件`)}
              ${statusRow('データバージョン', `v${state.version}`)}
              ${statusRow('旧データ移行', LEGACY_KEYS.some(k => localStorage.getItem(k)) ? '旧キー検出あり' : '旧キーなし')}
            </div>
            <div class="mt-6 rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 text-sm font-bold text-slate-700 leading-relaxed">
              <p class="font-black text-slate-900 mb-2">安全運用の目安</p>
              <p>・大きな編集前はJSONバックアップ</p>
              <p>・スマホとPCでは保存領域が別です。同じURLでもデータは端末ごとに別管理です。</p>
              <p>・GAS連携を設定すると、入力データをGoogleスプレッドシートにも保存できます。</p>
            </div>
          </div>
        </div>
      </div>`;
    document.getElementById('exportJsonBtn').onclick = exportJson;
    document.getElementById('exportCsvBtn').onclick = exportCsv;
    document.getElementById('exportMarkdownBtn').onclick = exportMarkdown;
    document.getElementById('importJsonInput').onchange = importJson;
    document.getElementById('saveGasSettingsBtn').onclick = saveGasSettings;
    document.getElementById('testGasBtn').onclick = testGasConnection;
    document.getElementById('syncAllGasBtn').onclick = syncAllToSpreadsheet;
    document.getElementById('resetBtn').onclick = resetAll;
    refreshIcons();
  }

  function statusRow(label, value) {
    return `<div class="rounded-xl bg-slate-50 border-2 border-slate-200 p-4"><p class="text-xs font-black text-slate-500">${label}</p><p class="font-black text-slate-900 mt-1 break-all">${escapeHtml(value)}</p></div>`;
  }

  function getAllEntries() {
    const map = [
      ['current','現在地'], ['mind','心の声'], ['insights','気づき'], ['reflections','反省'], ['premises','前提'], ['future','未来'], ['goals','目標']
    ];
    return map.flatMap(([key, label]) => state[key].map(x => ({ ...x, section:key, sectionLabel:label }))).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function shorten(str = '', n = 80) {
    str = String(str || '').replace(/\s+/g, ' ').trim();
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  function downloadFile(filename, content, type='application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function exportJson() {
    downloadFile(`life-compass-coach-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state, null, 2));
    showToast('JSONを書き出しました', 'success');
  }

  function exportCsv() {
    const rows = [['section','category','title','body','extra','createdAt']];
    getAllEntries().forEach(e => rows.push([e.sectionLabel, e.category || e.kind || '', e.title || e.before || '', e.body || e.after || '', e.concern || e.action || e.nextAction || e.decision || '', e.createdAt]));
    const csv = rows.map(r => r.map(v => `"${String(v || '').replaceAll('"','""')}"`).join(',')).join('\n');
    downloadFile(`life-compass-coach-${new Date().toISOString().slice(0,10)}.csv`, '\ufeff' + csv, 'text/csv;charset=utf-8');
    showToast('CSVを書き出しました', 'success');
  }

  function exportMarkdown() {
    const lines = [`# Life Compass Coach Export`, ``, `Exported: ${new Date().toLocaleString('ja-JP')}`, ``];
    getAllEntries().forEach(e => {
      lines.push(`## ${e.sectionLabel}｜${e.title || e.before || e.category || '記録'}`);
      lines.push(`- カテゴリ: ${e.category || e.kind || ''}`);
      lines.push(`- 日時: ${new Date(e.createdAt).toLocaleString('ja-JP')}`);
      lines.push('');
      lines.push(e.body || e.before || '');
      if (e.after) lines.push(`\n置き換え: ${e.after}`);
      if (e.nextAction) lines.push(`\n次の行動: ${e.nextAction}`);
      lines.push('\n---\n');
    });
    downloadFile(`life-compass-coach-${new Date().toISOString().slice(0,10)}.md`, lines.join('\n'), 'text/markdown;charset=utf-8');
    showToast('Markdownを書き出しました', 'success');
  }

  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = safeParse(reader.result, null, 'imported_json');
      if (!imported) return showToast('JSONを読み込めませんでした', 'error');
      if (!confirm('現在のデータを読み込んだJSONで置き換えます。続けますか？')) return;
      const next = normalizeState(imported.data || imported);
      if (persistState(next)) {
        state = next;
        renderAll();
        showToast('復元しました', 'success');
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirm('本当に全データをリセットしますか？')) return;
    if (!confirm('最後の確認です。JSONバックアップは取りましたか？')) return;
    const backup = JSON.stringify({ resetAt: nowIso(), data: state });
    try { localStorage.setItem(`life_compass_reset_backup_${Date.now()}`, backup); } catch {}
    state = emptyData();
    persistState(state);
    renderAll();
    showToast('リセットしました。直前バックアップはlocalStorage内に退避しています。', 'warn');
  }

  function renderAll() {
    mountTabs();
    renderHome();
    renderForms();
    renderLists();
    if (activeTab === 'ai') renderAi();
    if (activeTab === 'backup') renderBackup();
    refreshIcons();
  }

  function setupHeaderButtons() {
    document.getElementById('quickBackupBtn').onclick = () => { switchTab('backup'); setTimeout(exportJson, 100); };
    document.getElementById('quickAiBtn').onclick = () => switchTab('ai');
    document.getElementById('quickSaveBtn').onclick = () => showToast(`最終保存：${new Date(state.updatedAt).toLocaleString('ja-JP')} / GAS：${isGasSyncEnabled() ? 'ON' : 'OFF'}`, 'success');
  }

  window.LifeCompass = { switchTab, exportJson, syncAllToSpreadsheet, state: () => state };

  document.addEventListener('DOMContentLoaded', () => {
    setupHeaderButtons();
    renderAll();
    bindForms();
    switchTab('home');
  });
})();
