(() => {
  'use strict';

  const LIFE_COMPASS_UI_VERSION = 'life-compare-v4_5_1-20260727';

  const STORAGE_KEY = 'life_compass_coach_v3';
  const BACKUP_KEY = 'life_compass_coach_v3_backup_latest';
  const PROFILE_SAFETY_KEY = 'life_compass_profile_safety_latest';
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
    version: 4.5,
    updatedAt: nowIso(),
    createdAt: nowIso(),
    profile: {
      name: '',
      age: '',
      familyStructure: '',
      medicalHistory: '',
      likedThings: '',
      strongThings: '',
      workHistory: '',
      traumaHistory: '',
      values: '',
      personalityTraits: '',
      lifeTimeline: '',
      currentConstraints: '',
      supportNeeded: '',
      memo: '',
      coachingTone: '現実的で前向き。甘やかしすぎず、具体的な次の一手を出す。',
      aiProvider: 'gemini',
      gasUrl: '',
      gasSyncEnabled: true,
      syncPullEnabled: true,
      lastSyncAt: '',
      notebookDocUrl: '',
      notebookDocUpdatedAt: '',
      profileUpdatedAt: '',
      pastIdealLife: '',
      pastIdealReason: '',
      currentReality: '',
      currentSatisfaction: '50',
      newDesiredLife: '',
      newIdealReason: '',
      lifeGapHealth: '',
      lifeGapWork: '',
      lifeGapMoney: '',
      lifeGapFamily: '',
      lifeGapFreedom: '',
      lifeComparisonAnalysis: '',
      lifeComparisonUpdatedAt: ''
    },
    current: [],
    mind: [],
    insights: [],
    reflections: [],
    premises: [],
    future: [],
    goals: [],
    imports: [],
    aiHistory: []
  });

  let state = loadState();
  let activeTab = 'home';

  const tabs = [
    { id:'home', label:'ホーム', icon:'home' },
    { id:'profile', label:'プロフィール', icon:'user-round-cog' },
    { id:'comparison', label:'人生比較', icon:'split-square-horizontal' },
    { id:'current', label:'現在地', icon:'map-pin' },
    { id:'mind', label:'心の声', icon:'heart' },
    { id:'insights', label:'気づき', icon:'lightbulb' },
    { id:'reflection', label:'反省ノート', icon:'rotate-ccw' },
    { id:'premise', label:'前提ノート', icon:'scale' },
    { id:'future', label:'未来設計', icon:'mountain-snow' },
    { id:'goals', label:'目標・目的', icon:'target' },
    { id:'import', label:'履歴インポート', icon:'file-input' },
    { id:'map', label:'マインドマップ', icon:'git-branch' },
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
    goal: ['人生目的', '健康', 'お金', '仕事/事業', '家族', '暮らし', '学び', '旅', '安心'],
    history: ['人生履歴', '過去ログ', '会話メモ', '病歴・健康', '実績', '家族・介護', '仕事・事業', '学習記録', '自由メモ']
  };


  // --- UIテーマ：各フレームの薄色背景・大きめアイコン・スマホ最適化 ---
  const frameThemes = {
    profile: { className: 'frame-theme-profile', label: 'プロフィール' },
    comparison: { className: 'frame-theme-future', label: '人生比較' },
    current: { className: 'frame-theme-current', label: '現在地' },
    mind: { className: 'frame-theme-mind', label: '心の声' },
    insights: { className: 'frame-theme-insights', label: '気づき' },
    reflection: { className: 'frame-theme-reflection', label: '反省' },
    reflections: { className: 'frame-theme-reflection', label: '反省' },
    premise: { className: 'frame-theme-premise', label: '前提' },
    premises: { className: 'frame-theme-premise', label: '前提' },
    future: { className: 'frame-theme-future', label: '未来' },
    goals: { className: 'frame-theme-goal', label: '目標' },
    goal: { className: 'frame-theme-goal', label: '目標' },
    imports: { className: 'frame-theme-import', label: '履歴' },
    import: { className: 'frame-theme-import', label: '履歴' },
    map: { className: 'frame-theme-map', label: 'マップ' },
    ai: { className: 'frame-theme-ai', label: 'AI履歴' },
    aiHistory: { className: 'frame-theme-ai', label: 'AI履歴' },
    backup: { className: 'frame-theme-backup', label: 'バックアップ' },
    system: { className: 'frame-theme-backup', label: 'システム' }
  };

  function frameThemeClass(key) {
    return frameThemes[key]?.className || 'frame-theme-default';
  }

  // CSSが効かない環境でも確実に色を反映するため、主要カードにはinline styleも付与する。
  function frameThemeStyle(keyOrLabel) {
    const key = String(keyOrLabel || '');
    const map = {
      profile: { bg: '#eef6ff', bg2: '#dbeafe', border: '#7dd3fc', icon: '#0369a1' },
      current: { bg: '#eef6ff', bg2: '#dbeafe', border: '#93c5fd', icon: '#1d4ed8' },
      mind: { bg: '#fff1f5', bg2: '#ffe4e6', border: '#f9a8d4', icon: '#db2777' },
      insights: { bg: '#fffbeb', bg2: '#fef3c7', border: '#fcd34d', icon: '#ca8a04' },
      reflection: { bg: '#fff7ed', bg2: '#ffedd5', border: '#fdba74', icon: '#ea580c' },
      reflections: { bg: '#fff7ed', bg2: '#ffedd5', border: '#fdba74', icon: '#ea580c' },
      premise: { bg: '#f5f3ff', bg2: '#ede9fe', border: '#c4b5fd', icon: '#7c3aed' },
      premises: { bg: '#f5f3ff', bg2: '#ede9fe', border: '#c4b5fd', icon: '#7c3aed' },
      future: { bg: '#ecfdf5', bg2: '#dcfce7', border: '#86efac', icon: '#16a34a' },
      goals: { bg: '#eff6ff', bg2: '#dbeafe', border: '#60a5fa', icon: '#1d4ed8' },
      goal: { bg: '#eff6ff', bg2: '#dbeafe', border: '#60a5fa', icon: '#1d4ed8' },
      imports: { bg: '#f0fdfa', bg2: '#ccfbf1', border: '#5eead4', icon: '#0f766e' },
      import: { bg: '#f0fdfa', bg2: '#ccfbf1', border: '#5eead4', icon: '#0f766e' },
      map: { bg: '#faf5ff', bg2: '#f3e8ff', border: '#d8b4fe', icon: '#9333ea' },
      ai: { bg: '#f1f5f9', bg2: '#e2e8f0', border: '#94a3b8', icon: '#475569' },
      aiHistory: { bg: '#f1f5f9', bg2: '#e2e8f0', border: '#94a3b8', icon: '#475569' },
      backup: { bg: '#eff6ff', bg2: '#e0f2fe', border: '#7dd3fc', icon: '#0369a1' },
      default: { bg: '#ffffff', bg2: '#f8fafc', border: '#cbd5e1', icon: '#2563eb' }
    };
    let s = map[key];
    if (!s) {
      if (key.includes('プロフィール')) s = map.profile;
      else if (key.includes('現在地')) s = map.current;
      else if (key.includes('心')) s = map.mind;
      else if (key.includes('気づき')) s = map.insights;
      else if (key.includes('反省')) s = map.reflection;
      else if (key.includes('前提')) s = map.premise;
      else if (key.includes('未来')) s = map.future;
      else if (key.includes('目標')) s = map.goals;
      else if (key.includes('履歴')) s = map.imports;
      else if (key.includes('マップ')) s = map.map;
      else if (key.includes('AI')) s = map.ai;
      else s = map.default;
    }
    return {
      card: `background:linear-gradient(135deg, ${s.bg} 0%, ${s.bg2} 100%) !important;border-color:${s.border} !important;`,
      icon: `color:${s.icon} !important;`,
      iconBox: `background:rgba(255,255,255,.76) !important;border:1.5px solid ${s.border} !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 4px 10px rgba(15,23,42,.06) !important;`
    };
  }

  function frameThemeClassByLabel(label = '') {
    const text = String(label);
    if (text.includes('プロフィール')) return frameThemeClass('profile');
    if (text.includes('現在地')) return frameThemeClass('current');
    if (text.includes('心')) return frameThemeClass('mind');
    if (text.includes('気づき')) return frameThemeClass('insights');
    if (text.includes('反省')) return frameThemeClass('reflection');
    if (text.includes('前提')) return frameThemeClass('premise');
    if (text.includes('未来')) return frameThemeClass('future');
    if (text.includes('目標')) return frameThemeClass('goals');
    if (text.includes('履歴')) return frameThemeClass('imports');
    if (text.includes('マップ')) return frameThemeClass('map');
    if (text.includes('AI')) return frameThemeClass('ai');
    return 'frame-theme-default';
  }

  function injectEnhancedUiStyles() {
    if (document.getElementById('life-compass-enhanced-ui')) return;
    const style = document.createElement('style');
    style.id = 'life-compass-enhanced-ui';
    style.textContent = `
      .dashboard-card {
        width: 100%;
        min-height: 116px;
        border-radius: 1.35rem;
        border: 2px solid #cbd5e1;
        padding: 1.2rem;
        text-align: left;
        box-shadow: 0 5px 15px rgba(15, 23, 42, .065);
        transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
      }
      .dashboard-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(15, 23, 42, .11);
      }
      .frame-theme-profile { background: linear-gradient(135deg, #eef6ff 0%, #e0f2fe 100%); border-color: #7dd3fc; }
      .frame-theme-current { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #93c5fd; }
      .frame-theme-mind { background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border-color: #fda4af; }
      .frame-theme-insights { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-color: #fcd34d; }
      .frame-theme-reflection { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #fdba74; }
      .frame-theme-premise { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-color: #c4b5fd; }
      .frame-theme-future { background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%); border-color: #86efac; }
      .frame-theme-goal { background: linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%); border-color: #60a5fa; }
      .frame-theme-import { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border-color: #5eead4; }
      .frame-theme-map { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-color: #d8b4fe; }
      .frame-theme-ai { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-color: #94a3b8; }
      .frame-theme-backup { background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%); border-color: #7dd3fc; }
      .frame-theme-default { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-color: #cbd5e1; }

      /* 強制適用版：GitHub/Tailwind/既存CSSの影響を受けても色が出るようにする */
      .dashboard-card.frame-theme-profile, .home-info-card.frame-theme-profile, .mini-count-card.frame-theme-profile { background: linear-gradient(135deg, #eef6ff 0%, #e0f2fe 100%) !important; border-color: #7dd3fc !important; }
      .dashboard-card.frame-theme-current, .home-info-card.frame-theme-current, .mini-count-card.frame-theme-current { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important; border-color: #93c5fd !important; }
      .dashboard-card.frame-theme-mind, .home-info-card.frame-theme-mind, .mini-count-card.frame-theme-mind { background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%) !important; border-color: #fda4af !important; }
      .dashboard-card.frame-theme-insights, .home-info-card.frame-theme-insights, .mini-count-card.frame-theme-insights { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important; border-color: #fcd34d !important; }
      .dashboard-card.frame-theme-reflection, .home-info-card.frame-theme-reflection, .mini-count-card.frame-theme-reflection { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important; border-color: #fdba74 !important; }
      .dashboard-card.frame-theme-premise, .home-info-card.frame-theme-premise, .mini-count-card.frame-theme-premise { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%) !important; border-color: #c4b5fd !important; }
      .dashboard-card.frame-theme-future, .home-info-card.frame-theme-future, .mini-count-card.frame-theme-future { background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%) !important; border-color: #86efac !important; }
      .dashboard-card.frame-theme-goal, .home-info-card.frame-theme-goal, .mini-count-card.frame-theme-goal { background: linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%) !important; border-color: #60a5fa !important; }
      .dashboard-card.frame-theme-import, .home-info-card.frame-theme-import, .mini-count-card.frame-theme-import { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%) !important; border-color: #5eead4 !important; }
      .dashboard-card.frame-theme-map, .home-info-card.frame-theme-map, .mini-count-card.frame-theme-map { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%) !important; border-color: #d8b4fe !important; }
      .dashboard-card.frame-theme-ai, .home-info-card.frame-theme-ai, .mini-count-card.frame-theme-ai { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important; border-color: #94a3b8 !important; }
      .dashboard-card.frame-theme-backup, .home-info-card.frame-theme-backup, .mini-count-card.frame-theme-backup { background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%) !important; border-color: #7dd3fc !important; }
      .dashboard-card .frame-icon-wrap, .mini-count-card .mini-icon { background: rgba(255,255,255,.72) !important; }

      .frame-icon-wrap {
        width: 58px;
        height: 58px;
        min-width: 58px;
        min-height: 58px;
        border-radius: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, .68);
        border: 1.5px solid rgba(148, 163, 184, .28);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.72), 0 4px 10px rgba(15, 23, 42, .055);
        margin-bottom: .85rem;
      }
      .frame-icon { display: flex; align-items: center; justify-content: center; line-height: 1; }
      .frame-icon svg { width: 31px; height: 31px; stroke-width: 2.45; }
      .frame-title { font-size: .98rem; line-height: 1.35; font-weight: 900; color: #1e293b; }
      .frame-count { font-size: 2.85rem; line-height: .95; font-weight: 950; letter-spacing: -.04em; color: #020617; }
      .frame-theme-profile .frame-icon, .frame-theme-profile .frame-title { color: #0369a1; }
      .frame-theme-current .frame-icon, .frame-theme-current .frame-title { color: #1d4ed8; }
      .frame-theme-mind .frame-icon, .frame-theme-mind .frame-title { color: #be123c; }
      .frame-theme-insights .frame-icon, .frame-theme-insights .frame-title { color: #a16207; }
      .frame-theme-reflection .frame-icon, .frame-theme-reflection .frame-title { color: #c2410c; }
      .frame-theme-premise .frame-icon, .frame-theme-premise .frame-title { color: #6d28d9; }
      .frame-theme-future .frame-icon, .frame-theme-future .frame-title { color: #15803d; }
      .frame-theme-goal .frame-icon, .frame-theme-goal .frame-title { color: #1e40af; }
      .frame-theme-import .frame-icon, .frame-theme-import .frame-title { color: #0f766e; }
      .frame-theme-map .frame-icon, .frame-theme-map .frame-title { color: #9333ea; }
      .frame-theme-ai .frame-icon, .frame-theme-ai .frame-title { color: #334155; }
      .frame-theme-backup .frame-icon, .frame-theme-backup .frame-title { color: #0369a1; }

      .home-info-card, .mini-count-card {
        border: 2px solid #cbd5e1;
        border-radius: 1.1rem;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(15, 23, 42, .045);
      }
      .mini-count-card { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
      .mini-count-card .mini-icon {
        width: 38px; height: 38px; min-width: 38px; border-radius: .9rem;
        display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,.65);
        border: 1px solid rgba(148, 163, 184, .25);
      }
      .mini-count-card .mini-icon svg { width: 22px; height: 22px; stroke-width: 2.4; }
      .tab-icon, .tab-icon svg { width: 22px; height: 22px; stroke-width: 2.35; }


      .tab-btn { border-radius: 1rem 1rem 0 0; border: 2px solid transparent; border-bottom-width: 4px; margin-top: .25rem; }
      .tab-btn.active { transform: translateY(1px); box-shadow: inset 0 -3px 0 rgba(29,78,216,.9); }
      .entry-media { display:grid; grid-template-columns: 1fr; gap:.75rem; margin-top:.85rem; }
      @media (min-width: 640px) { .entry-media { grid-template-columns: 140px 1fr; align-items:start; } }
      .entry-media img { width:100%; max-height:180px; object-fit:cover; border-radius:1rem; border:2px solid #cbd5e1; background:#f8fafc; }
      .media-link { display:inline-flex; align-items:center; gap:.35rem; font-size:.82rem; font-weight:900; color:#1d4ed8; background:#eff6ff; border:2px solid #bfdbfe; border-radius:.8rem; padding:.45rem .65rem; word-break:break-all; }
      .mindmap-wrap { position:relative; min-height:660px; overflow:auto; border-radius:1.5rem; border:2px solid #cbd5e1; background: radial-gradient(circle at center, #ffffff 0%, #eff6ff 45%, #eef2ff 100%); }
      .mindmap-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
      .mind-node { position:absolute; transform:translate(-50%, -50%); min-width:150px; max-width:220px; border:2px solid #cbd5e1; border-radius:1.2rem; padding:.8rem; background:#fff; box-shadow:0 10px 24px rgba(15,23,42,.10); font-weight:900; text-align:center; }
      .mind-node.center { min-width:180px; background:linear-gradient(135deg,#1d4ed8,#38bdf8); color:white; border-color:#1e3a8a; }
      .mind-node.child { min-width:120px; max-width:170px; font-size:.72rem; font-weight:800; padding:.55rem; opacity:.96; }
      .mind-node .node-count { display:inline-flex; align-items:center; justify-content:center; min-width:2rem; height:2rem; border-radius:999px; background:rgba(255,255,255,.72); color:#0f172a; margin-top:.4rem; font-size:.95rem; }
      @media (max-width: 768px) { .mindmap-wrap { min-height:760px; } .mind-node { min-width:125px; max-width:170px; font-size:.78rem; } .mind-node.center { min-width:145px; } .mind-node.child { min-width:100px; max-width:130px; } }

      @media (max-width: 768px) {
        .dashboard-card { min-height: 104px; padding: 1rem; border-radius: 1.15rem; }
        .frame-icon-wrap { width: 53px; height: 53px; min-width: 53px; min-height: 53px; border-radius: 1rem; margin-bottom: .7rem; }
        .frame-icon svg { width: 29px; height: 29px; stroke-width: 2.55; }
        .frame-title { font-size: .9rem; }
        .frame-count { font-size: 2.25rem; }
        .tab-icon, .tab-icon svg { width: 21px; height: 21px; }
      }
      @media (max-width: 480px) {
        .dashboard-card { min-height: 98px; padding: .9rem; }
        .frame-icon-wrap { width: 49px; height: 49px; min-width: 49px; min-height: 49px; }
        .frame-icon svg { width: 27px; height: 27px; }
        .frame-count { font-size: 2.05rem; }
      }

      .edit-modal-backdrop { position:fixed; inset:0; z-index:120; background:rgba(15,23,42,.68); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:1rem; }
      .edit-modal-backdrop.hidden { display:none; }
      .edit-modal-panel { width:min(920px,100%); max-height:94vh; overflow:hidden; background:#fff; border:2px solid #94a3b8; border-radius:1.5rem; box-shadow:0 28px 80px rgba(15,23,42,.35); display:flex; flex-direction:column; }
      .edit-modal-head { flex:0 0 auto; display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; padding:.9rem 1.15rem; border-bottom:2px solid #e2e8f0; background:linear-gradient(135deg,#eff6ff,#f8fafc); }
      .edit-modal-body { flex:1 1 auto; min-height:0; overflow:auto; padding:1rem 1.15rem 1.25rem; scroll-padding-bottom:100px; }
      .edit-modal-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
      .edit-modal-grid .full { grid-column:1/-1; }
      .edit-basic-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
      .edit-basic-grid .full { grid-column:1/-1; }
      .edit-modal-body .textarea { min-height:120px; }
      .edit-modal-body .textarea.long { min-height:clamp(300px,46vh,520px); line-height:1.75; resize:vertical; }
      .edit-details { margin-top:1rem; border:2px solid #dbeafe; border-radius:1rem; background:#f8fbff; overflow:hidden; }
      .edit-details summary { cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.9rem 1rem; font-weight:900; color:#1e3a8a; list-style:none; user-select:none; }
      .edit-details summary::-webkit-details-marker { display:none; }
      .edit-details summary::after { content:'＋'; font-size:1.2rem; line-height:1; }
      .edit-details[open] summary::after { content:'−'; }
      .edit-details-content { padding:0 1rem 1rem; }
      .edit-modal-foot { flex:0 0 auto; display:flex; gap:.75rem; justify-content:flex-end; padding:.85rem 1.15rem; border-top:2px solid #e2e8f0; background:rgba(248,250,252,.97); box-shadow:0 -10px 24px rgba(15,23,42,.08); }
      .edit-modal-foot .btn-primary { min-width:190px; }
      .edit-char-count { margin-top:.35rem; text-align:right; font-size:.75rem; font-weight:900; color:#64748b; }
      .edit-image-preview { max-width:220px; max-height:160px; object-fit:cover; border-radius:1rem; border:2px solid #cbd5e1; }
      body.modal-open { overflow:hidden; }
      @media (max-width: 700px) {
        .edit-modal-backdrop { padding:0; align-items:stretch; }
        .edit-modal-panel { max-height:none; height:100dvh; border-radius:0; border-width:0; }
        .edit-modal-head { padding-top:max(.75rem,env(safe-area-inset-top)); }
        .edit-modal-grid, .edit-basic-grid { grid-template-columns:1fr; }
        .edit-modal-grid .full, .edit-basic-grid .full { grid-column:auto; }
        .edit-modal-head, .edit-modal-body, .edit-modal-foot { padding-left:.85rem; padding-right:.85rem; }
        .edit-modal-body { padding-top:.75rem; padding-bottom:1rem; }
        .edit-modal-body .textarea.long { min-height:48dvh; }
        .edit-modal-foot { padding-bottom:max(.8rem,env(safe-area-inset-bottom)); }
        .edit-modal-foot .btn-soft { flex:.8; }
        .edit-modal-foot .btn-primary { flex:1.2; min-width:0; }
      }
    `;
    document.head.appendChild(style);
  }

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

  function profileDataScore(profile = {}) {
    const keys = ['name','age','familyStructure','medicalHistory','likedThings','strongThings','workHistory','traumaHistory','values','personalityTraits','lifeTimeline','currentConstraints','supportNeeded','memo'];
    return keys.reduce((score, key) => score + (String(profile?.[key] || '').trim() ? 1 : 0), 0);
  }

  function extractProfileCandidate(value) {
    if (!value || typeof value !== 'object') return null;
    if (value.data && typeof value.data === 'object' && value.data.profile) return value.data.profile;
    if (value.profile && typeof value.profile === 'object') return value.profile;
    return null;
  }

  function recoverBestLocalProfile(currentProfile = {}) {
    const candidates = [{ profile: currentProfile, source: 'current' }];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key || (!key.includes('life_compass') && !key.includes('corrupted_'))) continue;
        const parsed = safeParse(localStorage.getItem(key), null, key);
        const profile = extractProfileCandidate(parsed);
        if (profile) candidates.push({ profile, source: key });
      }
    } catch (e) {
      console.warn('プロフィール退避データの探索に失敗しました', e);
    }
    candidates.sort((a, b) => {
      const scoreDiff = profileDataScore(b.profile) - profileDataScore(a.profile);
      if (scoreDiff) return scoreDiff;
      return dateValue(b.profile?.profileUpdatedAt || b.profile?.updatedAt) - dateValue(a.profile?.profileUpdatedAt || a.profile?.updatedAt);
    });
    return candidates[0]?.profile || currentProfile;
  }

  function saveProfileSafety(profile = state?.profile) {
    if (!profile || profileDataScore(profile) === 0) return;
    try {
      localStorage.setItem(PROFILE_SAFETY_KEY, JSON.stringify({ savedAt: nowIso(), profile }));
    } catch (e) {
      console.warn('プロフィール安全バックアップの保存に失敗しました', e);
    }
  }

  function loadState() {
    const base = safeParse(localStorage.getItem(STORAGE_KEY), null, STORAGE_KEY);
    if (base && typeof base === 'object') {
      const normalized = normalizeState(base);
      const recovered = recoverBestLocalProfile(normalized.profile);
      if (profileDataScore(recovered) > profileDataScore(normalized.profile)) {
        normalized.profile = { ...normalized.profile, ...recovered };
        persistState(normalized, { silent: true });
      }
      saveProfileSafety(normalized.profile);
      return normalized;
    }

    const fresh = emptyData();
    migrateLegacy(fresh);
    fresh.profile = { ...fresh.profile, ...recoverBestLocalProfile(fresh.profile) };
    persistState(fresh, { silent: true });
    saveProfileSafety(fresh.profile);
    return fresh;
  }

  function normalizeState(data) {
    const base = emptyData();
    const merged = { ...base, ...data };
    merged.profile = { ...base.profile, ...(data.profile || {}) };
    delete merged.profile.geminiKey;
    ['current','mind','insights','reflections','premises','future','goals','imports','aiHistory'].forEach(k => {
      merged[k] = Array.isArray(data[k]) ? data[k] : [];
    });
    merged.version = 4.5;
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
    dedupeLocalState(next);
    next.updatedAt = nowIso();
    const text = JSON.stringify(next);
    try {
      localStorage.setItem(STORAGE_KEY, text);
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ savedAt: nowIso(), data: next }));
      if (next?.profile && profileDataScore(next.profile) > 0) {
        localStorage.setItem(PROFILE_SAFETY_KEY, JSON.stringify({ savedAt: nowIso(), profile: next.profile }));
      }
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
      profile:'プロフィール', current:'現在地', mind:'心の声', insights:'気づき', reflections:'反省',
      premises:'前提ノート', future:'未来設計', goals:'目標・目的', imports:'履歴インポート', aiHistory:'AI履歴'
    };
    return map[section] || section;
  }

  function getGasUrl() {
    return String(state.profile?.gasUrl || '').trim();
  }

  function isGasSyncEnabled() {
    return Boolean(getGasUrl() && state.profile.gasSyncEnabled !== false);
  }


  function isPullSyncEnabled() {
    return Boolean(getGasUrl() && state.profile.syncPullEnabled !== false);
  }

  function dateValue(value) {
    const t = value ? new Date(value).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  }

  function gasJsonp(action, params = {}, timeoutMs = 35000) {
    const url = getGasUrl();
    if (!url) return Promise.reject(new Error('GAS WebアプリURLが未設定です。'));
    return new Promise((resolve, reject) => {
      const callbackName = `lifeCompassJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('GASからの同期応答がタイムアウトしました。'));
      }, timeoutMs);
      function cleanup() {
        clearTimeout(timer);
        try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
        script.remove();
      }
      window[callbackName] = (data) => {
        cleanup();
        if (!data || data.ok === false) reject(new Error(data?.message || 'GAS同期に失敗しました。'));
        else resolve(data);
      };
      const qs = new URLSearchParams({ action, callback: callbackName, _: String(Date.now()) });
      Object.entries(params || {}).forEach(([k, v]) => qs.set(k, String(v ?? '')));
      script.onerror = () => {
        cleanup();
        reject(new Error('GAS同期スクリプトの読み込みに失敗しました。/exec URL、Webアプリ公開設定、再デプロイ、初回承認を確認してください。'));
      };
      script.src = `${url}${url.includes('?') ? '&' : '?'}${qs.toString()}`;
      document.head.appendChild(script);
    });
  }

  const syncSections = ['current','mind','insights','reflections','premises','future','goals','imports','aiHistory'];

  function dedupeSectionArray(arr = []) {
    const map = new Map();
    (Array.isArray(arr) ? arr : []).forEach(item => {
      if (!item || !item.id) return;
      const current = map.get(item.id);
      const itemTime = dateValue(item.updatedAt || item.createdAt || item.receivedAt);
      const currentTime = current ? dateValue(current.updatedAt || current.createdAt || current.receivedAt) : -1;
      if (!current || itemTime >= currentTime) map.set(item.id, item);
    });
    return Array.from(map.values()).sort((a,b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt));
  }

  function dedupeLocalState(next = state) {
    syncSections.forEach(section => {
      if (Array.isArray(next[section])) next[section] = dedupeSectionArray(next[section]);
    });
    return next;
  }

  function sectionCountsOf(data = state) {
    const counts = {};
    syncSections.forEach(section => counts[section] = Array.isArray(data[section]) ? dedupeSectionArray(data[section]).length : 0);
    counts.entries = ['current','mind','insights','reflections','premises','future','goals','imports'].reduce((sum, k) => sum + (counts[k] || 0), 0);
    counts.profile = hasProfileData(data.profile || {}) ? 1 : 0;
    return counts;
  }

  function mergeEntryArrays(localArr = [], remoteArr = [], section = '', deletions = {}) {
    const map = new Map();
    const add = (item, origin) => {
      if (!item || !item.id) return;
      const copy = { ...item };
      const key = copy.id;
      const existing = map.get(key);
      const copyTime = dateValue(copy.updatedAt || copy.createdAt || copy.receivedAt);
      const existingTime = existing ? dateValue(existing.updatedAt || existing.createdAt || existing.receivedAt) : -1;
      if (!existing || copyTime >= existingTime || origin === 'remote') map.set(key, copy);
    };
    localArr.forEach(x => add(x, 'local'));
    remoteArr.forEach(x => add(x, 'remote'));

    const tombstones = deletions?.[section] || {};
    Object.entries(tombstones).forEach(([id, deletedAt]) => {
      const item = map.get(id);
      const itemTime = item ? dateValue(item.updatedAt || item.createdAt || item.receivedAt) : 0;
      if (!item || dateValue(deletedAt) >= itemTime) map.delete(id);
    });

    return Array.from(map.values()).sort((a,b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt));
  }

  function mergeProfileSafely(localProfile = {}, remoteProfile = {}) {
    const localScore = profileDataScore(localProfile);
    const remoteScore = profileDataScore(remoteProfile);
    const localTime = dateValue(localProfile.profileUpdatedAt || localProfile.updatedAt);
    const remoteTime = dateValue(remoteProfile.profileUpdatedAt || remoteProfile.updatedAt);

    // 空のクラウドプロフィールで、端末に保存済みのプロフィールを消さない。
    if (remoteScore === 0 && localScore > 0) return { ...remoteProfile, ...localProfile };
    if (localScore === 0 && remoteScore > 0) return { ...localProfile, ...remoteProfile };

    // 両方に内容がある場合のみ、更新日時が新しい方を優先する。
    if (remoteScore > 0 && remoteTime > localTime) return { ...localProfile, ...remoteProfile };
    return { ...remoteProfile, ...localProfile };
  }

  function mergeRemoteState(remoteState = {}, deletions = {}) {
    const remote = normalizeState(remoteState || {});
    const keepSettings = {
      gasUrl: state.profile.gasUrl || '',
      gasSyncEnabled: state.profile.gasSyncEnabled !== false,
      syncPullEnabled: state.profile.syncPullEnabled !== false,
      aiProvider: state.profile.aiProvider || remote.profile.aiProvider || 'gemini',
      notebookDocUrl: state.profile.notebookDocUrl || remote.profile.notebookDocUrl || '',
      notebookDocUpdatedAt: state.profile.notebookDocUpdatedAt || remote.profile.notebookDocUpdatedAt || ''
    };

    const profile = mergeProfileSafely(state.profile || {}, remote.profile || {});

    const merged = { ...state, ...remote, profile: { ...profile, ...keepSettings, lastSyncAt: nowIso() }, updatedAt: nowIso(), version: 4.5 };
    syncSections.forEach(section => {
      merged[section] = mergeEntryArrays(state[section] || [], remote[section] || [], section, deletions);
    });
    return normalizeState(merged);
  }

  async function pullFromSpreadsheet(options = {}) {
    if (!getGasUrl()) {
      if (options.manual) showToast('GAS WebアプリURLを先に設定してください', 'warn');
      return false;
    }
    try {
      if (options.manual) showToast('スプレッドシートから同期データを取得しています…', 'normal');
      const res = await gasJsonp('syncPull');
      const next = mergeRemoteState(res.state || {}, res.deletions || {});
      if (!persistState(next)) return false;
      state = next;
      renderAll();
      if (options.manual) {
        const counts = res.counts || {};
        showToast(`同期しました：スプレッドシート記録${counts.entries ?? '-'}件 / AI${counts.aiHistory ?? '-'}件 → 端末内 記録${sectionCountsOf(state).entries}件 / AI${sectionCountsOf(state).aiHistory}件`, 'success');
      }
      return true;
    } catch (e) {
      console.error('Pull sync failed', e);
      if (options.manual) showToast(`同期に失敗しました：${e.message || e}`, 'error');
      return false;
    }
  }

  async function twoWaySync() {
    if (!getGasUrl()) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    showToast('完全同期を開始します。先にスプレッドシートを取得し、端末データと統合してから再送信します…', 'normal');
    const pulled = await pullFromSpreadsheet({ manual: false });
    if (!pulled) {
      showToast('完全同期を中止しました。先にスプレッドシートから取得できる状態にしてください。', 'error');
      return false;
    }
    dedupeLocalState(state);
    persistState(state, { silent: true });
    await syncAllToSpreadsheet({ silent: true });
    await new Promise(resolve => setTimeout(resolve, 2600));
    await pullFromSpreadsheet({ manual: false });
    const c = sectionCountsOf(state);
    showToast(`完全同期完了：記録${c.entries}件 / AI${c.aiHistory}件 / プロフィール${c.profile ? 'あり' : '未入力'}。端末ごとに件数が違う場合は「クラウド正本で取り込み」を押してください。`, 'success');
    return true;
  }

  function applyRemoteAsAuthoritative(remoteState = {}) {
    const remote = normalizeState(remoteState || {});
    const keepSettings = {
      gasUrl: state.profile.gasUrl || '',
      gasSyncEnabled: state.profile.gasSyncEnabled !== false,
      syncPullEnabled: state.profile.syncPullEnabled !== false,
      aiProvider: state.profile.aiProvider || remote.profile.aiProvider || 'gemini',
      notebookDocUrl: state.profile.notebookDocUrl || remote.profile.notebookDocUrl || '',
      notebookDocUpdatedAt: state.profile.notebookDocUpdatedAt || remote.profile.notebookDocUpdatedAt || ''
    };
    const safeProfile = mergeProfileSafely(state.profile || {}, remote.profile || {});
    const next = { ...remote, profile: { ...safeProfile, ...keepSettings, lastSyncAt: nowIso() }, updatedAt: nowIso(), version: 4.5 };
    dedupeLocalState(next);
    return normalizeState(next);
  }

  async function pullCloudAsSourceOfTruth(options = {}) {
    if (!getGasUrl()) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    const ok = options.skipConfirm || confirm(`この端末の表示データを、スプレッドシート側のデータでそろえます。

端末だけに残っていて、まだスプレッドシートへ送っていない記録は表示から消える可能性があります。先に「完全同期」を実行してから使うのがおすすめです。

続けますか？`);
    if (!ok) return false;
    try {
      showToast('クラウド正本を取得して、この端末の件数をそろえています…', 'normal');
      const res = await gasJsonp('syncPull', {}, 45000);
      const next = applyRemoteAsAuthoritative(res.state || {});
      if (!persistState(next)) return false;
      state = next;
      renderAll();
      const c = sectionCountsOf(state);
      showToast(`クラウド正本で取り込み完了：記録${c.entries}件 / AI${c.aiHistory}件 / プロフィール${c.profile ? 'あり' : '未入力'}`, 'success');
      return true;
    } catch (e) {
      console.error('Cloud authoritative pull failed', e);
      showToast(`クラウド正本取り込みに失敗：${e.message || e}`, 'error');
      return false;
    }
  }

  async function repairDeviceMismatch() {
    if (!getGasUrl()) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    const ok = confirm(`件数ずれ修復を実行します。

手順：
1. この端末の全データをスプレッドシートへ送信
2. 反映を待つ
3. スプレッドシート側を正本としてこの端末へ取り込み

PCとスマホの両方で1回ずつ実行すると件数がそろいやすくなります。続けますか？`);
    if (!ok) return false;
    showToast('件数ずれ修復中：この端末の全データを送信しています…', 'normal');
    await syncAllToSpreadsheet({ silent: true });
    showToast('送信後の反映待ちです…', 'normal');
    await new Promise(resolve => setTimeout(resolve, 3600));
    return pullCloudAsSourceOfTruth({ skipConfirm: true });
  }

  async function checkCloudCounts() {
    if (!getGasUrl()) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    try {
      const res = await gasJsonp('syncPull', {}, 45000);
      const cloud = res.counts || {};
      const local = sectionCountsOf(state);
      const sec = cloud.sections || {};
      const lines = [
        `端末: 記録${local.entries}件 / AI${local.aiHistory}件 / プロフィール${local.profile ? 'あり' : '未入力'}`,
        `シート: 記録${cloud.entries ?? '-'}件 / AI${cloud.aiHistory ?? '-'}件 / プロフィール${cloud.profile ? 'あり' : '未入力'}`,
        `内訳: 現在地${sec.current ?? '-'} / 心${sec.mind ?? '-'} / 気づき${sec.insights ?? '-'} / 反省${sec.reflections ?? '-'} / 前提${sec.premises ?? '-'} / 未来${sec.future ?? '-'} / 目標${sec.goals ?? '-'} / 履歴${sec.imports ?? '-'}`
      ];
      alert(lines.join('\n'));
    } catch (e) {
      showToast(`同期診断に失敗：${e.message || e}`, 'error');
    }
  }

  function scheduleAutoPull() {
    if (!isPullSyncEnabled()) return;
    setTimeout(() => pullFromSpreadsheet({ manual: false }), 800);
  }

  function normalizeForSheet(section, record = {}) {
    if (section === 'profile') {
      return {
        title: 'プロフィール',
        body: profileSummary(record),
        category: 'basicProfile',
        extra1: `age:${record.age || ''} / family:${record.familyStructure || ''}`,
        extra2: `medical:${shorten(record.medicalHistory || '', 180)}`,
        extra3: `trauma:${shorten(record.traumaHistory || '', 180)}`
      };
    }
    const title = record.title || record.before || record.mode || sectionLabel(section);
    const body = record.body || record.after || record.answer || record.question || '';
    const category = record.category || record.kind || record.mode || '';
    const extra1 = record.concern || record.action || record.cause || record.reason || record.why || record.decision || record.period || '';
    const extra2 = record.lesson || record.firstStep || record.deadline || record.question || record.linkUrl || '';
    const extra3 = record.nextAction || record.priority || record.status || record.success || record.tags || '';
    return { title, body, category, extra1, extra2, extra3 };
  }

  function sanitizeRecordForSheet(record = {}) {
    const copy = { ...record };
    if (copy.imageData) copy.imageData = `[base64 image omitted: ${String(record.imageData).length} chars]`;
    return copy;
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
      id: record.id || (section === 'profile' ? 'profile_main' : ''),
      category: normalized.category,
      title: normalized.title,
      body: normalized.body,
      extra1: normalized.extra1,
      extra2: normalized.extra2,
      extra3: normalized.extra3,
      createdAt: record.createdAt || '',
      updatedAt: record.updatedAt || '',
      linkUrl: record.linkUrl || '',
      imageUrl: record.imageUrl || '',
      tags: record.tags || '',
      hasImage: Boolean(record.imageData || record.imageUrl),
      imageData: record.imageData || '',
      imageName: record.imageName || '',
      imageMimeType: record.imageMimeType || '',
      raw: sanitizeRecordForSheet(record)
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

  async function syncAllToSpreadsheet(options = {}) {
    if (!getGasUrl()) {
      if (!options.silent) showToast('GAS WebアプリURLを先に設定してください', 'warn');
      return false;
    }
    dedupeLocalState(state);
    persistState(state, { silent: true });
    const all = getAllEntries();
    if (!options.silent) showToast(`全データ ${all.length + (hasProfileData() ? 1 : 0)}件を送信します`, 'normal');
    if (hasProfileData()) await sendToSpreadsheet('syncAll', 'profile', buildProfileRecord());
    for (const entry of all) {
      await sendToSpreadsheet('syncAll', entry.section, entry);
    }
    for (const history of dedupeSectionArray(state.aiHistory)) {
      await sendToSpreadsheet('syncAll', 'aiHistory', history);
    }
    if (!options.silent) showToast('全データ送信が完了しました。NotebookLM_Sourceシートにも反映されます。', 'success');
    return true;
  }

  function saveGasSettings() {
    const url = document.getElementById('gasUrlInput')?.value.trim() || '';
    const enabled = Boolean(document.getElementById('gasEnabledInput')?.checked);
    const pullEnabled = Boolean(document.getElementById('gasPullEnabledInput')?.checked);
    updateState(s => {
      s.profile.gasUrl = url;
      s.profile.gasSyncEnabled = enabled;
      s.profile.syncPullEnabled = pullEnabled;
    }, 'GAS設定を保存しました');
  }

  async function testGasConnection() {
    const url = document.getElementById('gasUrlInput')?.value.trim() || getGasUrl();
    if (!url) return showToast('GAS WebアプリURLを入力してください', 'warn');
    updateState(s => { s.profile.gasUrl = url; }, null);
    try {
      const ping = await gasJsonp('ping', {}, 15000);
      if (!ping || ping.ok === false) throw new Error(ping?.message || 'GAS pingに失敗しました。');
      showToast('GAS公開URLの読み込み確認OK。続けて保存テストを送信します。', 'success');
    } catch (e) {
      showToast(`GAS公開URLの読み込み確認に失敗：${e.message || e}`, 'error');
      return;
    }
    await sendToSpreadsheet('test', 'system', { id: uid(), title: '接続テスト', body: 'Life Compass Coachからの接続テストです。', createdAt: nowIso(), updatedAt: nowIso() }, { manual: true });
  }

  function openNotebookDocGenerator() {
    const url = getGasUrl();
    if (!url) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    const actionUrl = `${url}${url.includes('?') ? '&' : '?'}action=updateNotebookDoc`;
    window.open(actionUrl, '_blank', 'noopener');
    showToast('別タブでNotebookLM用まとめDocsの更新を実行します。表示されたdocUrlをNotebookLMに追加してください。', 'success');
  }

  async function requestNotebookSourceRefresh() {
    if (!getGasUrl()) return showToast('GAS WebアプリURLを先に設定してください', 'warn');
    await sendToSpreadsheet('refreshNotebookSource', 'system', { id: uid(), title: 'NotebookLM_Source更新依頼', body: 'Life CompassのNotebookLM向け整理シートを更新するためのリクエストです。', createdAt: nowIso(), updatedAt: nowIso() }, { manual: true });
    showToast('NotebookLM向け整理シート更新をGASへ送信しました。', 'success');
  }

  function structuredCloneSafe(obj) {
    try { return structuredClone(obj); }
    catch { return JSON.parse(JSON.stringify(obj)); }
  }

  function mountTabs() {
    const nav = document.getElementById('tabs');
    nav.innerHTML = tabs.map(t => {
      const key = t.id === 'reflection' ? 'reflection' : t.id === 'premise' ? 'premise' : t.id;
      const style = frameThemeStyle(key);
      const active = t.id === activeTab;
      const activeStyle = active ? `${style.card}${style.icon}border-bottom-color:${style.icon.match(/#[0-9a-fA-F]{6}/)?.[0] || '#1d4ed8'} !important;` : `background:rgba(255,255,255,.86);${style.icon}border-color:transparent;border-bottom-color:transparent;`;
      return `<button class="tab-btn ${active ? 'active' : ''} px-4 py-3.5 min-w-max transition-colors text-sm font-black flex items-center gap-2 ${frameThemeClass(key)}" style="${activeStyle}" data-tab="${t.id}"><span class="tab-icon"><i data-lucide="${t.icon}"></i></span>${t.label}</button>`;
    }).join('');
    nav.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  }

  function switchTab(id) {
    activeTab = id;
    tabs.forEach(t => {
      document.getElementById(`view-${t.id}`)?.classList.toggle('hidden', t.id !== id);
    });
    mountTabs();
    if (id === 'profile') renderProfile();
    if (id === 'comparison') renderLifeComparison();
    if (id === 'import') renderImport();
    if (id === 'map') renderMindMap();
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


  function mediaFields(section) {
    return `<div class="rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 space-y-3">
      <p class="text-sm font-black text-slate-700 flex items-center gap-2"><i data-lucide="paperclip" class="w-4 h-4"></i> 写真・URL添付</p>
      ${inputHtml('参考URL', 'linkUrl', 'https://... 参考記事・商品ページ・旅館URLなど')}
      ${inputHtml('写真URL', 'imageUrl', 'https://... 画像URLがある場合')}
      <div><label class="field-label">写真ファイル（任意・ブラウザ内保存）</label><input class="input" type="file" name="imageFile" accept="image/*"><p class="text-[11px] font-bold text-slate-500 mt-1">写真ファイルは圧縮してブラウザ内に保存します。大量に入れる場合はJSONバックアップを推奨。</p></div>
      ${inputHtml('タグ', 'tags', '例：旅,健康,安心,WEBRICH')}
    </div>`;
  }

  function pickMedia(d = {}) {
    return {
      linkUrl: d.linkUrl || '',
      imageUrl: d.imageUrl || '',
      imageData: d.imageData || '',
      imageName: d.imageName || '',
      tags: d.tags || ''
    };
  }

  function renderMedia(entry = {}) {
    const img = entry.imageData || entry.imageUrl;
    const link = entry.linkUrl;
    const tags = String(entry.tags || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!img && !link && !tags.length) return '';
    return `<div class="entry-media">
      ${img ? `<a href="${escapeHtml(entry.imageUrl || entry.imageData)}" target="_blank" rel="noopener"><img src="${escapeHtml(img)}" alt="添付画像"></a>` : '<div></div>'}
      <div class="space-y-2">
        ${link ? `<a class="media-link" href="${escapeHtml(link)}" target="_blank" rel="noopener"><i data-lucide="external-link" class="w-4 h-4"></i>${escapeHtml(shorten(link, 80))}</a>` : ''}
        ${tags.length ? `<div class="flex flex-wrap gap-2">${tags.map(t => `<span class="badge">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  async function prepareMedia(form, d) {
    const file = form.querySelector('input[type="file"][name="imageFile"]')?.files?.[0];
    if (!file) return { linkUrl: d.linkUrl || '', imageUrl: d.imageUrl || '', tags: d.tags || '' };
    try {
      const imageData = await compressImageFile(file, 900, .72);
      return { linkUrl: d.linkUrl || '', imageUrl: d.imageUrl || '', tags: d.tags || '', imageData, imageName: file.name };
    } catch (err) {
      console.error(err);
      showToast('写真の読み込みに失敗しました。URL添付で保存してください。', 'error');
      return { linkUrl: d.linkUrl || '', imageUrl: d.imageUrl || '', tags: d.tags || '' };
    }
  }

  function compressImageFile(file, max = 900, quality = .72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
          else if (height > max) { width = Math.round(width * max / height); height = max; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function submitBtn(text = '保存する', icon = 'save', extra = '') {
    return `<button class="btn-primary btn-blue w-full ${extra}" type="submit"><i data-lucide="${icon}" class="w-5 h-5"></i>${text}</button>`;
  }

  function formData(form) {
    const out = {};
    new FormData(form).forEach((v, k) => { if (!(v instanceof File)) out[k] = v; });
    return out;
  }

  function bindForm(id, handler) {
    const form = document.getElementById(id);
    if (!form) return;
    if (form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = formData(e.currentTarget);
      Object.assign(d, await prepareMedia(e.currentTarget, d));
      await handler(e.currentTarget, d);
    });
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
    return `${renderMedia(entry)}<div class="flex flex-wrap gap-2 mt-3">${parts.join('')}</div>`;
  }

  function emptyList(message) {
    return `<div class="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center font-black text-slate-500">${message}</div>`;
  }

  const profileFields = [
    ['name', '名前・呼び名'], ['age', '年齢'], ['familyStructure', '家族構成'], ['medicalHistory', '既往歴・健康上の注意'],
    ['likedThings', '好きだったこと'], ['strongThings', '得意だったこと'], ['workHistory', '仕事歴・実績'], ['traumaHistory', '自分にとってのトラウマ'],
    ['values', '大切にしたい価値観'], ['personalityTraits', '性格・考え方の傾向'], ['lifeTimeline', '人生年表・大きな出来事'],
    ['currentConstraints', '今の制約・配慮してほしいこと'], ['supportNeeded', 'AIにしてほしい支援'], ['memo', '自由メモ'], ['pastIdealLife', '昔理想としていた人生'], ['pastIdealReason', '当時その人生を望んだ理由'], ['currentReality', '現在の現実'], ['newDesiredLife', 'これから手にしたい人生'], ['newIdealReason', '今その人生を望む理由'], ['lifeGapHealth', '健康の理想と現実'], ['lifeGapWork', '仕事の理想と現実'], ['lifeGapMoney', 'お金の理想と現実'], ['lifeGapFamily', '家族・人間関係の理想と現実'], ['lifeGapFreedom', '自由・暮らしの理想と現実']
  ];

  function hasProfileData(profile = state.profile) {
    return profileFields.some(([key]) => String(profile?.[key] || '').trim());
  }

  function profileCompleteness(profile = state.profile) {
    const filled = profileFields.filter(([key]) => String(profile?.[key] || '').trim()).length;
    return { filled, total: profileFields.length, percent: Math.round((filled / profileFields.length) * 100) };
  }

  function profileSummary(profile = state.profile) {
    return profileFields
      .map(([key, label]) => String(profile?.[key] || '').trim() ? `【${label}】\n${String(profile[key]).trim()}` : '')
      .filter(Boolean)
      .join('\n\n') || 'プロフィール未入力';
  }

  function buildProfileRecord() {
    return {
      id: 'profile_main',
      category: 'basicProfile',
      title: 'プロフィール',
      body: profileSummary(),
      ...profileFields.reduce((acc, [key]) => { acc[key] = state.profile[key] || ''; return acc; }, {}),
      createdAt: state.createdAt || nowIso(),
      updatedAt: state.profile.profileUpdatedAt || state.updatedAt || nowIso()
    };
  }



  function lifeComparisonSummary(profile = state.profile) {
    const p = profile || {};
    const parts = [
      p.pastIdealLife ? `【昔理想としていた人生】\n${p.pastIdealLife}` : '',
      p.pastIdealReason ? `【当時そう望んだ理由】\n${p.pastIdealReason}` : '',
      p.currentReality ? `【現在の現実】\n${p.currentReality}` : '',
      p.currentSatisfaction ? `【現在の満足度】\n${p.currentSatisfaction}/100` : '',
      p.newDesiredLife ? `【これから手にしたい人生】\n${p.newDesiredLife}` : '',
      p.newIdealReason ? `【今そう望む理由】\n${p.newIdealReason}` : '',
      p.lifeGapHealth ? `【健康】\n${p.lifeGapHealth}` : '',
      p.lifeGapWork ? `【仕事・役割】\n${p.lifeGapWork}` : '',
      p.lifeGapMoney ? `【お金】\n${p.lifeGapMoney}` : '',
      p.lifeGapFamily ? `【家族・人間関係】\n${p.lifeGapFamily}` : '',
      p.lifeGapFreedom ? `【自由・暮らし】\n${p.lifeGapFreedom}` : ''
    ].filter(Boolean);
    return parts.join('\n\n') || '人生比較は未入力です。';
  }

  function renderLifeComparison() {
    const root = document.getElementById('view-comparison');
    if (!root) return;
    const p = state.profile || {};
    const analysis = p.lifeComparisonAnalysis || 'まだAI分析はありません。3つの人生を書き出してから「AIで比較分析」を押してください。';
    root.innerHTML = `
      <div class="space-y-6">
        <div class="panel border-indigo-600">
          <div class="panel-head">
            <div>
              <h2 class="panel-title text-indigo-800"><i data-lucide="split-square-horizontal"></i> 3つの人生を比較する</h2>
              <p class="text-sm font-bold text-slate-600 mt-2">昔の理想、現在の現実、新しく手にしたい人生を並べることで、価値観の変化と本当の課題を見つけます。</p>
            </div>
          </div>
          <form id="lifeComparisonForm" class="space-y-5 mt-5">
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div class="rounded-3xl border-2 border-amber-300 bg-amber-50 p-4">
                <h3 class="font-black text-amber-900 flex items-center gap-2"><i data-lucide="history" class="w-5 h-5"></i> 昔、理想としていた人生</h3>
                <p class="text-xs font-bold text-amber-800 mt-1 mb-3">子どもの頃、若い頃、会社員時代など、その当時の理想を書きます。</p>
                ${textareaHtml('昔の理想', 'pastIdealLife', '例：安定した会社で定年まで働き、家族を守る人生', p.pastIdealLife || '')}
                <div class="mt-3">${textareaHtml('なぜ、それを理想だと思っていたか', 'pastIdealReason', '周囲の価値観、安心、憧れ、家族の期待など', p.pastIdealReason || '')}</div>
              </div>
              <div class="rounded-3xl border-2 border-sky-300 bg-sky-50 p-4">
                <h3 class="font-black text-sky-900 flex items-center gap-2"><i data-lucide="map-pin" class="w-5 h-5"></i> 今の現実</h3>
                <p class="text-xs font-bold text-sky-800 mt-1 mb-3">良い面も厳しい面も、評価せず事実として書きます。</p>
                ${textareaHtml('現在の生活・仕事・健康・お金・人間関係', 'currentReality', '例：療養中。AIツール開発に挑戦中。時間の自由はあるが収入は未確立', p.currentReality || '')}
                <div class="mt-3"><label class="field-label">現在の人生への満足度：<span id="lifeSatisfactionValue">${escapeHtml(p.currentSatisfaction || '50')}</span>/100</label><input id="lifeSatisfaction" name="currentSatisfaction" type="range" min="0" max="100" step="5" value="${escapeHtml(p.currentSatisfaction || '50')}" class="w-full accent-blue-600"></div>
              </div>
              <div class="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-4">
                <h3 class="font-black text-emerald-900 flex items-center gap-2"><i data-lucide="sparkles" class="w-5 h-5"></i> これから手にしたい人生</h3>
                <p class="text-xs font-bold text-emerald-800 mt-1 mb-3">昔の理想に縛られず、今の自分が本当に望む人生を書きます。</p>
                ${textareaHtml('新しい理想の人生', 'newDesiredLife', '例：体調を守りながら、場所と時間に縛られずAI事業で収入を得る', p.newDesiredLife || '')}
                <div class="mt-3">${textareaHtml('なぜ、今はそれを望むのか', 'newIdealReason', '経験、病気、家族、価値観の変化など', p.newIdealReason || '')}</div>
              </div>
            </div>

            <details class="rounded-3xl border-2 border-slate-300 bg-white p-4" open>
              <summary class="cursor-pointer font-black text-slate-800 flex items-center gap-2"><i data-lucide="scan-search" class="w-5 h-5"></i> 分野別に理想と現実を書く</summary>
              <p class="text-sm font-bold text-slate-600 mt-2">各欄には「理想／現実／妨げていること」をまとめて書いてください。</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                ${textareaHtml('健康', 'lifeGapHealth', '理想：旅行できる体力／現実：腰や目に制約／妨げ：...', p.lifeGapHealth || '')}
                ${textareaHtml('仕事・役割', 'lifeGapWork', '理想：...／現実：...／妨げ：...', p.lifeGapWork || '')}
                ${textareaHtml('お金', 'lifeGapMoney', '理想：...／現実：...／妨げ：...', p.lifeGapMoney || '')}
                ${textareaHtml('家族・人間関係', 'lifeGapFamily', '理想：...／現実：...／妨げ：...', p.lifeGapFamily || '')}
                ${textareaHtml('自由・暮らし', 'lifeGapFreedom', '理想：...／現実：...／妨げ：...', p.lifeGapFreedom || '')}
              </div>
            </details>

            <div class="sticky-actions rounded-2xl border-2 border-slate-300 bg-white/95 backdrop-blur p-3 shadow-xl flex flex-col sm:flex-row gap-3">
              <button class="btn-primary btn-blue flex-1" type="submit"><i data-lucide="save" class="w-5 h-5"></i> 人生比較を保存</button>
              <button id="lifeCompareAiBtn" class="btn-primary flex-1" type="button"><i data-lucide="brain-circuit" class="w-5 h-5"></i> AIで比較分析</button>
            </div>
          </form>
        </div>

        <div class="panel border-violet-600">
          <div class="panel-head"><h2 class="panel-title text-violet-800"><i data-lucide="brain-circuit"></i> AIによる人生ギャップ分析</h2><span class="count-pill">プロフィール・記録も参照</span></div>
          <div id="lifeComparisonAnalysis" class="prose-box rounded-2xl bg-violet-50 border-2 border-violet-200 p-4 md:p-6 font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(analysis)}</div>
        </div>
      </div>`;

    const form = document.getElementById('lifeComparisonForm');
    const range = document.getElementById('lifeSatisfaction');
    const rangeValue = document.getElementById('lifeSatisfactionValue');
    range?.addEventListener('input', () => { rangeValue.textContent = range.value; });
    form.onsubmit = (e) => {
      e.preventDefault();
      const d = formData(form);
      if (updateState(st => {
        Object.assign(st.profile, d);
        st.profile.lifeComparisonUpdatedAt = nowIso();
        st.profile.profileUpdatedAt = nowIso();
      }, '人生比較を保存しました')) {
        autoSendToSpreadsheet('create', 'profile', buildProfileRecord());
      }
    };
    document.getElementById('lifeCompareAiBtn').onclick = runLifeComparisonAnalysis;
    refreshIcons();
  }

  async function runLifeComparisonAnalysis() {
    const p = state.profile || {};
    if (!String(p.pastIdealLife || '').trim() || !String(p.currentReality || '').trim() || !String(p.newDesiredLife || '').trim()) {
      showToast('「昔の理想」「今の現実」「新しい理想」の3つを入力して保存してください。', 'warn');
      return;
    }
    if (!getGasUrl()) {
      showToast('AI分析にはGAS WebアプリURLの設定が必要です。', 'warn');
      return;
    }
    const out = document.getElementById('lifeComparisonAnalysis');
    if (out) out.textContent = 'AIが3つの人生とプロフィール・記録を比較しています。少しお待ちください。';
    const provider = state.profile.aiProvider || 'gemini';
    const mode = '昔の理想・現在・新しい理想の人生比較分析';
    const question = '昔理想としていた人生、現在の現実、新しく望む人生を比較し、最大の問題と優先順位を分析してください。';
    const prompt = `あなたは現実的で誠実なAI人生コーチです。以下の3つの人生と、保存済みプロフィール・現在地・心の声・目標を比較してください。\n\n${lifeComparisonSummary()}\n\n${buildDataBundle()}\n\n【回答形式】\n1. 昔の理想から変化した価値観\n2. 現在と新しい理想の最大ギャップ\n3. 表面上の問題と根本問題を分ける\n4. 健康・仕事・お金・家族・自由の5分野評価（各100点）\n5. 今もっとも大きな問題を1つ\n6. 優先順位トップ3\n7. 90日で行う現実的な行動\n8. 手放した方がよい昔の前提\n9. 守るべき強み・人生資産\n10. 厳しさと温かさのある短い総括\n\n断定しすぎず、医療・法律・投資は専門家確認を促してください。`;
    try {
      const data = await requestAiCoachFromGas({ provider, mode, question, prompt });
      const answer = data.answer || '分析結果を取得できませんでした。';
      updateState(st => {
        st.profile.lifeComparisonAnalysis = answer;
        st.profile.lifeComparisonUpdatedAt = nowIso();
        st.profile.profileUpdatedAt = nowIso();
        st.aiHistory.unshift({ id:uid(), provider:data.provider || provider, model:data.model || '', mode, question, answer, createdAt:nowIso(), updatedAt:nowIso() });
      }, '人生比較のAI分析を保存しました');
      autoSendToSpreadsheet('create', 'profile', buildProfileRecord());
      switchTab('comparison');
    } catch (e) {
      console.error(e);
      if (out) out.textContent = 'AI分析に失敗しました。GAS URL、デプロイ、APIキーを確認してください。';
      showToast('人生比較のAI分析に失敗しました', 'error');
    }
  }

  function renderProfile() {
    const p = state.profile || {};
    const c = profileCompleteness(p);
    const field = (label, name, placeholder = '') => textareaHtml(label, name, placeholder, p[name] || '');
    document.getElementById('view-profile').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5 space-y-6">
          <div class="panel border-sky-600">
            <h2 class="panel-title text-sky-800"><i data-lucide="user-round-cog"></i> 自分のプロフィール</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">AIコーチが人生全体を判断するための土台です。無理に全部書かず、必要なところからでOKです。トラウマや既往歴は慎重に扱う大切な情報なので、保存先と共有範囲を確認して使ってください。</p>
            <form id="profileForm" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${inputHtml('名前・呼び名', 'name', '例：相棒', p.name || '')}
                ${inputHtml('年齢', 'age', '例：61歳', p.age || '')}
              </div>
              ${field('家族構成', 'familyStructure', '例：母、子ども、介護経験など')}
              ${field('既往歴・健康上の注意', 'medicalHistory', '例：目、腰、血圧、通院歴、日常生活で配慮すること')}
              ${field('好きだったこと', 'likedThings', '例：子どもの頃好きだったこと、今も心が動くこと')}
              ${field('得意だったこと', 'strongThings', '例：人に褒められたこと、自然にできたこと、売上・管理・接客など')}
              ${field('仕事歴・実績', 'workHistory', '例：職歴、成果、役割、売上、経験年数')}
              ${field('自分にとってのトラウマ', 'traumaHistory', '例：人生に影響した出来事、避けたい状況、触れ方に注意してほしいこと')}
              ${field('大切にしたい価値観', 'values', '例：自由、安心、家族、誠実、健康、挑戦')}
              ${field('性格・考え方の傾向', 'personalityTraits', '例：慎重、考えすぎる、追い込まれると強い、など')}
              ${field('人生年表・大きな出来事', 'lifeTimeline', '例：幼少期、学生時代、仕事、家族、転機、病気、独立準備')}
              ${field('今の制約・配慮してほしいこと', 'currentConstraints', '例：体調、視力、運転、時間、お金、家族事情')}
              ${field('AIにしてほしい支援', 'supportNeeded', '例：現実的に背中を押してほしい、危ない時は止めてほしい')}
              ${field('自由メモ', 'memo', 'その他AIに知っておいてほしいこと')}
              <button class="btn-primary btn-blue w-full" type="submit"><i data-lucide="save" class="w-5 h-5"></i> プロフィールを保存する</button>
            </form>
          </div>
        </div>
        <div class="lg:col-span-7 space-y-6">
          <div class="panel border-sky-700">
            <div class="panel-head"><h2 class="panel-title text-sky-800"><i data-lucide="clipboard-check"></i> 入力状況</h2><span class="count-pill">${c.filled}/${c.total}項目</span></div>
            <div class="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
              <div class="h-4 rounded-full bg-white border-2 border-sky-200 overflow-hidden"><div class="h-full bg-sky-500" style="width:${c.percent}%"></div></div>
              <p class="text-sm font-black text-sky-800 mt-3">プロフィール充実度：${c.percent}%</p>
            </div>
          </div>
          <div class="panel">
            <div class="panel-head"><h2 class="panel-title"><i data-lucide="user-search"></i> AIが見るプロフィール要約</h2><button id="sendProfileGasBtn" class="btn-soft text-sm"><i data-lucide="cloud-upload" class="w-4 h-4"></i> GASへ送信</button></div>
            <div class="prose-box rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 md:p-6 font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(profileSummary(p))}</div>
          </div>
          <div class="panel border-amber-500">
            <h2 class="panel-title text-amber-800"><i data-lucide="shield-alert"></i> 大切な注意</h2>
            <p class="text-sm font-bold text-slate-700 mt-3 leading-relaxed">既往歴やトラウマはとても個人的な情報です。このツールではAI分析の質を上げる材料になりますが、GAS URLやスプレッドシートの共有範囲は必ず非公開で運用してください。書きたくない項目は空欄で大丈夫です。</p>
          </div>
        </div>
      </div>`;
    const form = document.getElementById('profileForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const d = formData(form);
      if (updateState(st => { Object.assign(st.profile, d); st.profile.profileUpdatedAt = nowIso(); }, 'プロフィールを保存しました')) {
        autoSendToSpreadsheet('create', 'profile', buildProfileRecord());
      }
    };
    document.getElementById('sendProfileGasBtn').onclick = async () => {
      await sendToSpreadsheet('manual', 'profile', buildProfileRecord(), { manual: true });
    };
    refreshIcons();
  }

  function renderHome() {
    const counts = {
      profile: profileCompleteness().filled,
      current: state.current.length,
      mind: state.mind.length,
      insights: state.insights.length,
      reflections: state.reflections.length,
      premises: state.premises.length,
      future: state.future.length,
      goals: state.goals.length,
      imports: state.imports.length
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
                <p class="text-slate-700 font-bold mt-3 leading-relaxed">プロフィール・事実・心・気づき・反省・前提・未来像をAIが総合的に見て、今の相棒に必要な行動を提案します。</p>
              </div>
              <button class="btn-primary btn-blue shrink-0" onclick="LifeCompass.switchTab('ai')"><i data-lucide="sparkles" class="w-5 h-5"></i> AIコーチを開く</button>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${statCard('プロフィール', counts.profile, 'user-round-cog', 'profile')}
            ${statCard('現在地', counts.current, 'map-pin', 'current')}
            ${statCard('心の声', counts.mind, 'heart', 'mind')}
            ${statCard('気づき', counts.insights, 'lightbulb', 'insights')}
            ${statCard('反省', counts.reflections, 'rotate-ccw', 'reflection')}
            ${statCard('前提', counts.premises, 'scale', 'premise')}
            ${statCard('未来', counts.future, 'mountain-snow', 'future')}
            ${statCard('目標', counts.goals, 'target', 'goals')}
            ${statCard('履歴', counts.imports, 'file-input', 'import')}
            ${statCard('マップ', getAllEntries().length + state.aiHistory.length, 'git-branch', 'map')}
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
            <div class="space-y-3">${topGoals.length ? topGoals.map(g => `<div class="home-info-card frame-theme-goal" style="${frameThemeStyle('goals').card}"><p class="font-black text-blue-900">${escapeHtml(g.title)}</p><p class="text-sm font-bold text-slate-700 mt-1">${escapeHtml(shorten(g.body, 90))}</p></div>`).join('') : emptyList('目標・目的をまだ登録していません。')}</div>
          </div>
          <div class="panel border-indigo-700">
            <div class="panel-head"><h2 class="panel-title text-indigo-800"><i data-lucide="scale"></i> 見直したい前提</h2></div>
            <div class="space-y-3">${limiting.length ? limiting.map(p => `<div class="home-info-card frame-theme-premise" style="${frameThemeStyle('premise').card}"><p class="font-black text-indigo-900">${escapeHtml(p.before)}</p><p class="text-sm font-bold text-slate-700 mt-1">→ ${escapeHtml(p.after || '置き換え前提を追加しましょう')}</p></div>`).join('') : emptyList('制限する前提はまだありません。')}</div>
          </div>
        </div>
      </div>`;
  }

  function statCard(label, count, icon, tab) {
    const theme = frameThemeClass(tab);
    const style = frameThemeStyle(tab);
    return `<button onclick="LifeCompass.switchTab('${tab}')" class="dashboard-card ${theme}" style="${style.card}">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="frame-icon-wrap" style="${style.iconBox}"><div class="frame-icon" style="${style.icon}"><i data-lucide="${icon}"></i></div></div>
          <p class="frame-title" style="${style.icon}">${label}</p>
        </div>
        <span class="frame-count">${count}</span>
      </div>
    </button>`;
  }

  function renderForms() {
    document.getElementById('currentForm').innerHTML = `
      <div><label class="field-label">カテゴリ</label>${selectHtml('category', catalogs.current)}</div>
      ${inputHtml('タイトル', 'title', '例：今の体調、今の仕事状況、今月のお金の状態')}
      ${textareaHtml('今ある事・事実', 'body', '感情ではなく、なるべく事実として書き出します。')}
      ${textareaHtml('気になる点', 'concern', '不安・違和感・注意点があれば書きます。')}
      ${mediaFields('current')}
      ${submitBtn('現在地を保存', 'map-pin')}`;

    document.getElementById('mindForm').innerHTML = `
      <div><label class="field-label">感情カテゴリ</label>${selectHtml('category', catalogs.mind)}</div>
      ${inputHtml('一言タイトル', 'title', '例：今日は焦りが強い / 少し安心した')}
      ${textareaHtml('今考えていること・思っていること', 'body', 'まとまっていなくてOKです。頭の中をそのまま書きます。')}
      ${inputHtml('感情の強さ 1〜10', 'intensity', '例：7', '', 'number')}
      ${mediaFields('mind')}
      ${submitBtn('心の声を保存', 'heart')}`;

    document.getElementById('insightForm').innerHTML = `
      <div><label class="field-label">気づきカテゴリ</label>${selectHtml('category', catalogs.insight)}</div>
      ${inputHtml('気づきタイトル', 'title', '例：自分は不安な時ほど急いでしまう')}
      ${textareaHtml('気づいたこと', 'body', '今日の学び、パターン、違和感、改善のヒントなど。')}
      ${textareaHtml('活かし方', 'action', 'この気づきをどう使うか。')}
      ${mediaFields('insights')}
      ${submitBtn('気づきを保存', 'lightbulb')}`;

    document.getElementById('reflectionForm').innerHTML = `
      <div><label class="field-label">反省カテゴリ</label>${selectHtml('category', catalogs.reflection)}</div>
      ${inputHtml('反省タイトル', 'title', '例：疲れているのに無理して進めた')}
      ${textareaHtml('何が起きたか', 'body', '出来事を冷静に書きます。')}
      ${textareaHtml('原因・背景', 'cause', 'なぜそうなったか。体調、前提、焦り、環境など。')}
      ${textareaHtml('学び', 'lesson', 'ここから何を学ぶか。')}
      ${textareaHtml('次に変える行動', 'nextAction', '次はどうするか。小さく具体的に。')}
      ${mediaFields('reflections')}
      ${submitBtn('反省を保存', 'rotate-ccw', 'btn-amber')}`;

    document.getElementById('premiseForm').innerHTML = `
      <div><label class="field-label">前提の種類</label>${selectHtml('kind', ['制限する前提', '力になる前提', '確認したい前提', '置き換え前提'])}</div>
      <div><label class="field-label">領域</label>${selectHtml('category', catalogs.premise)}</div>
      ${textareaHtml('今の前提', 'before', '例：お金を使うのは悪い / 今日は悪寒がないからコンビニに寄らないでおこう')}
      ${textareaHtml('置き換えたい前提・別の見方', 'after', '例：まだ数百円あるから、好きなコーヒーで安心を買ってもいい')}
      ${textareaHtml('この前提で選ぶ行動', 'decision', '例：今日は無理せず帰る / 体調が良ければ小さなご褒美を許す')}
      ${mediaFields('premises')}
      ${submitBtn('前提を保存', 'scale')}`;

    document.getElementById('futureForm').innerHTML = `
      <div><label class="field-label">未来カテゴリ</label>${selectHtml('category', catalogs.future)}</div>
      ${inputHtml('タイトル', 'title', '例：月1回高級旅館に泊まる / 目を守って安心して暮らす')}
      ${textareaHtml('手にしたい未来', 'body', '行きたい場所・やりたい事・欲しいもの・お金・健康・安心など。')}
      ${textareaHtml('なぜ欲しいのか', 'reason', '理由が明確だとAIの提案が良くなります。')}
      ${textareaHtml('最初の一歩', 'firstStep', '今週できる小さな一歩。')}
      <div><label class="field-label">優先度</label>${selectHtml('priority', ['高', '中', '低'])}</div>
      <div><label class="field-label">状態</label>${selectHtml('status', ['未着手', '準備中', '進行中', '達成', '保留'])}</div>
      ${mediaFields('future')}
      ${submitBtn('未来を保存', 'mountain-snow')}`;

    document.getElementById('goalForm').innerHTML = `
      <div><label class="field-label">目標カテゴリ</label>${selectHtml('category', catalogs.goal)}</div>
      ${inputHtml('目標タイトル', 'title', '例：場所と時間に縛られず月150万円を目指す')}
      ${textareaHtml('目標・目的', 'body', '何を実現したいか。')}
      ${textareaHtml('なぜそれが大切か', 'why', '人生にとっての意味。')}
      ${inputHtml('期限・目安', 'deadline', '例：2027年12月 / 1年以内')}
      ${textareaHtml('達成の基準', 'success', '何ができたら達成とするか。')}
      <div><label class="field-label">優先度</label>${selectHtml('priority', ['高', '中', '低'])}</div>
      ${mediaFields('goals')}
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

  const editSchemas = {
    current: [
      ['select','category','カテゴリ', catalogs.current], ['text','title','タイトル'], ['textarea','body','現在の状況','long'], ['textarea','concern','気になる点'],
    ],
    mind: [
      ['select','category','カテゴリ', catalogs.mind], ['text','title','タイトル'], ['textarea','body','考えていること・気持ち','long'], ['number','intensity','感情の強さ（1〜10）'],
    ],
    insights: [
      ['select','category','カテゴリ', catalogs.insight], ['text','title','タイトル'], ['textarea','body','気づいたこと','long'], ['textarea','action','活かし方'],
    ],
    reflections: [
      ['select','category','カテゴリ', catalogs.reflection], ['text','title','タイトル'], ['textarea','body','何が起きたか','long'], ['textarea','cause','原因・背景'], ['textarea','lesson','学び'], ['textarea','nextAction','次に変える行動'],
    ],
    premises: [
      ['select','kind','前提の種類',['制限する前提','力になる前提','確認したい前提','置き換え前提']], ['select','category','領域', catalogs.premise], ['textarea','before','今の前提','long'], ['textarea','after','置き換えたい前提・別の見方'], ['textarea','decision','この前提で選ぶ行動'],
    ],
    future: [
      ['select','category','カテゴリ', catalogs.future], ['text','title','タイトル'], ['textarea','body','手にしたい未来','long'], ['textarea','reason','なぜ欲しいのか'], ['textarea','firstStep','最初の一歩'], ['select','priority','優先度',['高','中','低']], ['select','status','状態',['未着手','準備中','進行中','達成','保留']],
    ],
    goals: [
      ['select','category','カテゴリ', catalogs.goal], ['text','title','タイトル'], ['textarea','body','目標・目的','long'], ['textarea','why','なぜそれが大切か'], ['text','deadline','期限・目安'], ['textarea','success','達成の基準'], ['select','priority','優先度',['高','中','低']],
    ],
    imports: [
      ['select','category','カテゴリ', catalogs.history], ['text','title','タイトル'], ['text','period','時期・期間'], ['textarea','body','履歴・メモ本文','long'],
    ]
  };

  function editFieldHtml(field, item) {
    const [type, name, label, optionsOrClass] = field;
    const value = item[name] ?? '';
    if (type === 'select') return `<div><label class="field-label">${escapeHtml(label)}</label>${selectHtml(name, optionsOrClass || [], value)}</div>`;
    if (type === 'textarea') {
      const extra = optionsOrClass === 'long' ? ' long' : '';
      return `<div class="${extra ? 'full' : ''}"><label class="field-label">${escapeHtml(label)}</label><textarea class="textarea${extra}" name="${name}" data-count-field="${name}">${escapeHtml(value)}</textarea><div class="edit-char-count" data-count-for="${name}">${String(value).length}文字</div></div>`;
    }
    const attrs = type === 'number' ? ' min="1" max="10" step="1"' : '';
    return `<div><label class="field-label">${escapeHtml(label)}</label><input class="input" type="${type}" name="${name}" value="${escapeHtml(value)}"${attrs}></div>`;
  }

  function ensureEditModal() {
    let modal = document.getElementById('entryEditModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'entryEditModal';
    modal.className = 'edit-modal-backdrop hidden';
    modal.innerHTML = `<section class="edit-modal-panel" role="dialog" aria-modal="true" aria-labelledby="entryEditTitle">
      <div class="edit-modal-head"><div><p class="text-xs font-black text-blue-700">完全編集モード</p><h2 id="entryEditTitle" class="text-xl font-black mt-1">記録を編集</h2><p class="text-xs font-bold text-slate-600 mt-1">基本項目はすぐ編集でき、補足・タグ・URL・日時は「詳細設定」から必要なときだけ開けます。</p></div><button type="button" class="btn-icon" data-edit-close aria-label="閉じる"><i data-lucide="x"></i></button></div>
      <form id="entryEditForm" class="contents"><div class="edit-modal-body"><div id="entryEditFields" class="edit-modal-grid"></div></div><div class="edit-modal-foot"><button type="button" class="btn-soft" data-edit-close>キャンセル</button><button type="submit" class="btn-primary btn-blue"><i data-lucide="save" class="w-5 h-5"></i>変更を保存</button></div></form>
    </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-edit-close]').forEach(btn => btn.onclick = closeEditModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeEditModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeEditModal(); });
    return modal;
  }

  function closeEditModal() {
    const modal = document.getElementById('entryEditModal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }

  function editEntry(section, id) {
    const item = state[section]?.find(x => x.id === id);
    const schema = editSchemas[section];
    if (!item || !schema) return;
    const labelMap = { current:'現在地', mind:'心の声', insights:'気づき', reflections:'反省', premises:'前提', future:'未来', goals:'目標', imports:'履歴' };
    const modal = ensureEditModal();
    modal.dataset.section = section;
    modal.dataset.id = id;
    document.getElementById('entryEditTitle').textContent = `${labelMap[section]}を完全編集`;
    const mediaImage = item.imageData || item.imageUrl || '';
    const primaryFields = schema.slice(0, 3);
    const detailFields = schema.slice(3);
    document.getElementById('entryEditFields').innerHTML = `
      <div class="full edit-basic-grid">${primaryFields.map(f => editFieldHtml(f, item)).join('')}</div>
      <details class="full edit-details">
        <summary><span>詳細設定・添付情報</span><span class="text-xs text-slate-500">必要なときだけ開く</span></summary>
        <div class="edit-details-content"><div class="edit-modal-grid">
          ${detailFields.map(f => editFieldHtml(f, item)).join('')}
          <div><label class="field-label">参考URL</label><input class="input" type="url" name="linkUrl" value="${escapeHtml(item.linkUrl || '')}" placeholder="https://..."></div>
          <div><label class="field-label">写真URL</label><input class="input" type="url" name="imageUrl" value="${escapeHtml(item.imageUrl || '')}" placeholder="https://..."></div>
          <div class="full"><label class="field-label">タグ（カンマ区切り）</label><input class="input" type="text" name="tags" value="${escapeHtml(item.tags || '')}"></div>
          <div><label class="field-label">写真を差し替える</label><input class="input" type="file" name="imageFile" accept="image/*"></div>
          <div><label class="field-label">記録日時</label><input class="input" type="datetime-local" name="createdAt" value="${toDateTimeLocal(item.createdAt)}"></div>
          ${mediaImage ? `<div class="full"><img class="edit-image-preview" src="${escapeHtml(mediaImage)}" alt="現在の添付画像"><label class="flex items-center gap-2 mt-2 text-sm font-black"><input type="checkbox" name="removeImage" value="1" class="w-5 h-5"> 現在の写真を削除する</label></div>` : ''}
        </div></div>
      </details>`;
    const form = document.getElementById('entryEditForm');
    form.onsubmit = saveEditedEntry;
    document.querySelectorAll('[data-count-field]').forEach(area => area.addEventListener('input', () => {
      const out = document.querySelector(`[data-count-for="${area.dataset.countField}"]`);
      if (out) out.textContent = `${area.value.length}文字`;
    }));
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    refreshIcons();
    setTimeout(() => modal.querySelector('input,textarea,select')?.focus(), 50);
  }

  function toDateTimeLocal(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function saveEditedEntry(e) {
    e.preventDefault();
    const modal = document.getElementById('entryEditModal');
    const section = modal.dataset.section;
    const id = modal.dataset.id;
    const original = state[section]?.find(x => x.id === id);
    if (!original) return closeEditModal();
    const form = e.currentTarget;
    const d = formData(form);
    const file = form.querySelector('input[name="imageFile"]')?.files?.[0];
    let newImageData = original.imageData || '';
    let newImageName = original.imageName || '';
    if (d.removeImage === '1') { newImageData = ''; newImageName = ''; d.imageUrl = ''; }
    if (file) {
      try { newImageData = await compressImageFile(file, 900, .72); newImageName = file.name; }
      catch { return showToast('写真の読み込みに失敗しました', 'error'); }
    }
    const next = { ...original };
    (editSchemas[section] || []).forEach(([,name]) => { next[name] = String(d[name] ?? '').trim(); });
    next.linkUrl = String(d.linkUrl || '').trim();
    next.imageUrl = String(d.imageUrl || '').trim();
    next.tags = String(d.tags || '').trim();
    next.imageData = newImageData;
    next.imageName = newImageName;
    if (d.createdAt) next.createdAt = new Date(d.createdAt).toISOString();
    next.updatedAt = nowIso();
    if (updateState(s => {
      const index = s[section].findIndex(x => x.id === id);
      if (index >= 0) s[section][index] = next;
    }, 'すべての変更を保存しました')) {
      closeEditModal();
      autoSendToSpreadsheet('edit', section, next);
      if (section === 'imports') renderImport();
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
      const entry = { id:uid(), category:d.category, title:d.title || '現在地', body:d.body || '', concern:d.concern || '', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('current', entry, form);
    });
    bindForm('mindForm', (form, d) => {
      if (!d.title && !d.body) return showToast('タイトルか本文を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '心の声', body:d.body || '', intensity:d.intensity || '', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('mind', entry, form);
    });
    bindForm('insightForm', (form, d) => {
      if (!d.title && !d.body) return showToast('気づきを入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '気づき', body:d.body || '', action:d.action || '', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('insights', entry, form);
    });
    bindForm('reflectionForm', (form, d) => {
      if (!d.title && !d.body) return showToast('反省内容を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '反省', body:d.body || '', cause:d.cause || '', lesson:d.lesson || '', nextAction:d.nextAction || '', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('reflections', entry, form);
    });
    bindForm('premiseForm', (form, d) => {
      if (!d.before && !d.after) return showToast('前提を入力してください', 'warn');
      const entry = { id:uid(), kind:d.kind, category:d.category, before:d.before || '', after:d.after || '', decision:d.decision || '', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('premises', entry, form);
    });
    bindForm('futureForm', (form, d) => {
      if (!d.title && !d.body) return showToast('未来像を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '未来', body:d.body || '', reason:d.reason || '', firstStep:d.firstStep || '', priority:d.priority || '中', status:d.status || '未着手', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('future', entry, form);
    });
    bindForm('goalForm', (form, d) => {
      if (!d.title && !d.body) return showToast('目標を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || '目標', body:d.body || '', why:d.why || '', deadline:d.deadline || '', success:d.success || '', priority:d.priority || '中', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('goals', entry, form);
    });
  }


  function renderImport() {
    const tendencies = analyzeTendencies();
    document.getElementById('view-import').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4 space-y-6">
          <div class="panel border-teal-600">
            <h2 class="panel-title text-teal-800"><i data-lucide="file-input"></i> 自分の履歴をインポート</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">過去の経歴、実績、病歴、会話ログ、メモ、物語作成用の人生履歴を貼り付けます。AIコーチが傾向分析に使います。</p>
            <form id="importForm" class="space-y-4">
              <div><label class="field-label">履歴カテゴリ</label>${selectHtml('category', catalogs.history)}</div>
              ${inputHtml('タイトル', 'title', '例：これまでの人生履歴 / 仕事の実績 / 健康履歴')}
              ${inputHtml('時期・期間', 'period', '例：幼少期〜現在 / 2020〜2026')}
              ${textareaHtml('インポートする履歴・メモ', 'body', 'ここに自分の履歴、過去メモ、年表、会話ログ、実績を書き込む、または下のファイルから読み込みます。')}
              <div><label class="field-label">テキスト/Markdown/CSVファイルを読み込み</label><input id="historyTextFile" class="input" type="file" accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"><p class="text-[11px] font-bold text-slate-500 mt-1">読み込むと本文欄に入ります。保存ボタンで確定します。</p></div>
              ${mediaFields('imports')}
              ${submitBtn('履歴を保存してAI分析に使う', 'file-input')}
            </form>
          </div>
          <div class="panel border-purple-600">
            <h2 class="panel-title text-purple-800"><i data-lucide="activity"></i> 簡易傾向分析</h2>
            <div class="space-y-3 mt-4">
              ${tendencyBox('よく出る領域', tendencies.topCategories.join(' / ') || 'まだ分析データ不足')}
              ${tendencyBox('感情・前提の傾向', tendencies.emotionHint)}
              ${tendencyBox('未来志向の傾向', tendencies.futureHint)}
              ${tendencyBox('AIに見せる材料', `履歴 ${state.imports.length}件 / 全記録 ${getAllEntries().length}件`)}
            </div>
            <button class="btn-primary btn-blue w-full mt-4" onclick="LifeCompass.switchTab('ai')"><i data-lucide="sparkles" class="w-5 h-5"></i> AIで深く分析する</button>
          </div>
        </div>
        <div class="lg:col-span-8">
          <div class="panel">
            <div class="panel-head"><h2 class="panel-title"><i data-lucide="archive"></i> インポート済み履歴</h2><span class="count-pill">${state.imports.length}件</span></div>
            <div class="list-grid">${state.imports.length ? state.imports.map(e => `<article class="entry-card"><div class="flex justify-between gap-3"><div><span class="badge">${escapeHtml(e.category)}</span><h3 class="text-lg font-black mt-2">${escapeHtml(e.title)}</h3><p class="text-sm font-bold text-slate-600 mt-1">${escapeHtml(e.period || '')}</p><p class="mt-3 text-sm font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">${escapeHtml(shorten(e.body, 700))}</p>${cardMeta(e)}</div>${entryActions('imports', e.id)}</div></article>`).join('') : emptyList('履歴インポートはまだありません。過去の経歴や実績を貼り付けると、AIの分析が一段深くなります。')}</div>
          </div>
        </div>
      </div>`;
    const fileInput = document.getElementById('historyTextFile');
    fileInput.onchange = readHistoryTextFile;
    bindForm('importForm', (form, d) => {
      if (!d.title && !d.body) return showToast('履歴のタイトルか本文を入力してください', 'warn');
      const entry = { id:uid(), category:d.category, title:d.title || 'インポート履歴', period:d.period || '', body:d.body || '', ...pickMedia(d), createdAt:nowIso(), updatedAt:nowIso() };
      saveEntry('imports', entry, form);
      setTimeout(renderImport, 80);
    });
    bindActionButtons();
    refreshIcons();
  }

  function readHistoryTextFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const area = document.querySelector('#importForm textarea[name="body"]');
      if (area) area.value = String(reader.result || '');
      showToast('ファイル内容を本文に読み込みました。保存ボタンで確定してください。', 'success');
    };
    reader.readAsText(file);
  }

  function tendencyBox(title, body) {
    return `<div class="rounded-2xl bg-slate-50 border-2 border-slate-200 p-4"><p class="text-xs font-black text-slate-500">${escapeHtml(title)}</p><p class="font-black text-slate-900 mt-1 whitespace-pre-wrap">${escapeHtml(body || '未分析')}</p></div>`;
  }

  function analyzeTendencies() {
    const entries = getAllEntries();
    const categoryCounts = {};
    entries.forEach(e => { const k = e.category || e.kind || e.sectionLabel; categoryCounts[k] = (categoryCounts[k] || 0) + 1; });
    const topCategories = Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v]) => `${k}(${v})`);
    const text = entries.map(e => `${e.title || ''} ${e.body || ''} ${e.before || ''} ${e.after || ''}`).join(' ');
    const emotionHint = (text.match(/不安|心配|焦り|迷い|怖/g) || []).length > (text.match(/安心|嬉しい|感謝|できる|大丈夫/g) || []).length
      ? '不安・迷いの言葉がやや多めです。前提ノートで「別の見方」に置き換えるとAIコーチングが効きます。'
      : '安心・前向きな言葉も見えています。力になる前提として保存すると判断の土台になります。';
    const futureHint = state.future.length || state.goals.length
      ? '未来・目標の記録があります。次は「最初の一歩」と「期限」を増やすと行動に変わります。'
      : '未来・目標がまだ少なめです。行きたい場所、欲しい安心、健康、お金から1つ書くのがおすすめです。';
    return { topCategories, emotionHint, futureHint };
  }

  function renderMindMap() {
    const mode = document.getElementById('mindMapMode')?.value || 'all';
    const data = buildMindMapData(mode);
    document.getElementById('view-map').innerHTML = `
      <div class="space-y-6">
        <div class="panel border-purple-700">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div><h2 class="panel-title text-purple-800"><i data-lucide="git-branch"></i> 人生マインドマップ</h2><p class="text-sm font-bold text-slate-600 mt-2">保存データ・AI分析・インポート履歴を、文章だけでなく視覚的に眺めます。</p></div>
            <div class="flex flex-wrap gap-2"><select id="mindMapMode" class="select w-auto"><option value="all" ${mode==='all'?'selected':''}>自分全体</option><option value="future" ${mode==='future'?'selected':''}>未来設計</option><option value="premise" ${mode==='premise'?'selected':''}>前提の整理</option><option value="history" ${mode==='history'?'selected':''}>履歴傾向</option><option value="ai" ${mode==='ai'?'selected':''}>AI分析</option></select><button id="refreshMapBtn" class="btn-soft"><i data-lucide="refresh-cw" class="w-4 h-4"></i>更新</button></div>
          </div>
        </div>
        <div class="mindmap-wrap" id="mindMapCanvas">
          <svg class="mindmap-svg" viewBox="0 0 1000 700" preserveAspectRatio="none">${data.lines.join('')}</svg>
          ${data.nodes.join('')}
        </div>
        <div class="panel"><h2 class="panel-title"><i data-lucide="list-tree"></i> マップの読み方</h2><p class="text-sm font-bold text-slate-700 mt-3 leading-relaxed">中心が「自分」。周辺が現在地・心・気づき・反省・前提・未来・目標・履歴・AI履歴です。数が多い枝ほど、今の人生で意識を使っている領域です。AI分析後はAI履歴もマップに反映されます。</p></div>
      </div>`;
    document.getElementById('mindMapMode').onchange = renderMindMap;
    document.getElementById('refreshMapBtn').onclick = renderMindMap;
    refreshIcons();
  }

  function buildMindMapData(mode) {
    const profileGroup = hasProfileData() ? [buildProfileRecord()] : [];
    const allGroups = [
      ['profile','プロフィール','user-round-cog',profileGroup],
      ['current','現在地','map-pin',state.current], ['mind','心の声','heart',state.mind], ['insights','気づき','lightbulb',state.insights],
      ['reflection','反省', 'rotate-ccw', state.reflections], ['premise','前提','scale',state.premises], ['future','未来','mountain-snow',state.future],
      ['goals','目標','target',state.goals], ['imports','履歴','file-input',state.imports], ['ai','AI履歴','bot',state.aiHistory]
    ];
    let groups = allGroups;
    if (mode === 'future') groups = allGroups.filter(g => ['future','goals','premise','insights'].includes(g[0]));
    if (mode === 'premise') groups = allGroups.filter(g => ['premise','mind','reflection','insights'].includes(g[0]));
    if (mode === 'history') groups = allGroups.filter(g => ['profile','imports','current','future','goals','insights'].includes(g[0]));
    if (mode === 'ai') groups = allGroups.filter(g => ['profile','ai','premise','goals','future','imports'].includes(g[0]));
    const cx = 50, cy = 50;
    const nodes = [`<div class="mind-node center" style="left:${cx}%;top:${cy}%;"><div class="text-lg">自分</div><div class="text-xs mt-1 opacity-90">Life Compass</div><span class="node-count">${getAllEntries().length}</span></div>`];
    const lines = [];
    const radius = mode === 'all' ? 36 : 32;
    groups.forEach((g, i) => {
      const angle = (-90 + i * 360 / groups.length) * Math.PI / 180;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const style = frameThemeStyle(g[0]);
      lines.push(`<line x1="${cx*10}" y1="${cy*7}" x2="${x*10}" y2="${y*7}" stroke="${extractColor(style.icon)}" stroke-width="3" opacity=".35"/>`);
      nodes.push(`<button onclick="LifeCompass.switchTab('${tabIdFromGroup(g[0])}')" class="mind-node ${frameThemeClass(g[0])}" style="left:${x}%;top:${y}%;${style.card}"><i data-lucide="${g[2]}" style="${style.icon}" class="w-7 h-7 mx-auto mb-1"></i><div>${g[1]}</div><span class="node-count">${g[3].length}</span></button>`);
      g[3].slice(0,2).forEach((e, j) => {
        const childAngle = angle + (j === 0 ? -.28 : .28);
        const cx2 = x + 16 * Math.cos(childAngle);
        const cy2 = y + 16 * Math.sin(childAngle);
        lines.push(`<line x1="${x*10}" y1="${y*7}" x2="${cx2*10}" y2="${cy2*7}" stroke="${extractColor(style.icon)}" stroke-width="2" opacity=".25"/>`);
        nodes.push(`<div class="mind-node child" style="left:${Math.max(8, Math.min(92, cx2))}%;top:${Math.max(8, Math.min(92, cy2))}%;${style.card}">${escapeHtml(shorten(e.title || e.before || e.mode || e.category || '記録', 34))}</div>`);
      });
    });
    return { nodes, lines };
  }

  function extractColor(styleText) {
    return String(styleText).match(/#[0-9a-fA-F]{6}/)?.[0] || '#2563eb';
  }

  function tabIdFromGroup(group) {
    if (group === 'reflection') return 'reflection';
    if (group === 'premise') return 'premise';
    if (group === 'imports') return 'import';
    if (group === 'ai') return 'ai';
    return group;
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
                <option value="履歴から傾向分析">履歴から傾向分析</option>
                <option value="マインドマップ用整理">マインドマップ用整理</option>
              </select></div>
              <div><label class="field-label">追加で相談したいこと</label><textarea id="coachQuestion" class="textarea" placeholder="例：今日なにを優先すべき？ この前提は変えた方がいい？"></textarea></div>
              <button id="runAiBtn" class="btn-primary btn-blue w-full"><i data-lucide="bot" class="w-5 h-5"></i> AIに総合判断してもらう</button>
              <button id="localCoachBtn" class="btn-soft w-full"><i data-lucide="brain" class="w-5 h-5"></i> APIなしで簡易コーチング</button>
            </div>
          </div>
          <div class="panel">
            <h2 class="panel-title"><i data-lucide="list-checks"></i> AIが見るデータ</h2>
            <div class="mt-4 grid grid-cols-2 gap-2 text-sm font-black text-slate-700">
              ${miniCount('プロフィール', profileCompleteness().filled)}${miniCount('現在地', state.current.length)}${miniCount('心の声', state.mind.length)}${miniCount('気づき', state.insights.length)}${miniCount('反省', state.reflections.length)}${miniCount('前提', state.premises.length)}${miniCount('未来', state.future.length)}${miniCount('目標', state.goals.length)}${miniCount('履歴', state.imports.length)}${miniCount('AI履歴', state.aiHistory.length)}
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
    const theme = frameThemeClassByLabel(label);
    const style = frameThemeStyle(label);
    const iconMap = { 'プロフィール':'user-round-cog', '現在地':'map-pin', '心の声':'heart', '気づき':'lightbulb', '反省':'rotate-ccw', '前提':'scale', '未来':'mountain-snow', '目標':'target', '履歴':'file-input', 'AI履歴':'bot' };
    const icon = iconMap[label] || 'circle';
    return `<div class="mini-count-card ${theme}" style="${style.card}"><span class="inline-flex items-center gap-2"><span class="mini-icon frame-icon" style="${style.iconBox}${style.icon}"><i data-lucide="${icon}"></i></span><span style="${style.icon}">${label}</span></span><span class="text-lg font-black">${count}</span></div>`;
  }

  function buildPrompt(mode, question) {
    const bundle = buildDataBundle();
    return `あなたは、ユーザーの人生全体を現実的かつ前向きに支援するAI人生コーチです。甘い励ましだけでなく、プロフィール・既往歴・家族構成・仕事歴・トラウマ・事実・前提・目標・体調・お金・感情・インポートされた人生履歴を総合して、本人の傾向、繰り返しパターン、強み、注意点、具体的な行動まで落とし込んでください。医療・法律・投資の断定は避け、必要なら専門家確認を促してください。

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
8. 履歴から見える本人の傾向
9. マインドマップ化すると中心に置くべきテーマ
10. 最後に短いコーチングメッセージ

口調は日本語。具体的に。厳しさと温かさのバランスを取ってください。`;
  }

  function buildDataBundle() {
    const pick = (arr, fields) => arr.slice(0, 25).map((x, i) => `${i+1}. ` + fields.map(f => x[f] ? `${f}:${x[f]}` : '').filter(Boolean).join(' / ')).join('\n') || 'なし';
    return [
      `■プロフィール\n${profileSummary()}`,
      `■人生比較（昔の理想・現在・新しい理想）\n${lifeComparisonSummary()}`,
      `■現在地\n${pick(state.current, ['category','title','body','concern'])}`,
      `■心の声\n${pick(state.mind, ['category','title','body','intensity'])}`,
      `■気づき\n${pick(state.insights, ['category','title','body','action'])}`,
      `■反省\n${pick(state.reflections, ['category','title','body','cause','lesson','nextAction'])}`,
      `■人生の前提\n${pick(state.premises, ['kind','category','before','after','decision'])}`,
      `■未来設計\n${pick(state.future, ['category','title','body','reason','firstStep','priority','status'])}`,
      `■目標・目的\n${pick(state.goals, ['category','title','body','why','deadline','success','priority'])}`,
      `■インポート履歴\n${pick(state.imports, ['category','title','period','body','tags'])}`,
      `■最近のAI履歴\n${pick(state.aiHistory, ['mode','question','answer'])}`
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
    const recentImports = state.imports.slice(0, 3);
    const tendencies = analyzeTendencies();

    return `【APIなし簡易コーチング】

1. 今の現在地
プロフィール ${profileCompleteness().filled}/${profileCompleteness().total}項目、保存データを見る限り、現在地 ${state.current.length}件、心の声 ${state.mind.length}件、気づき ${state.insights.length}件、反省 ${state.reflections.length}件、前提 ${state.premises.length}件、未来設計 ${state.future.length}件、目標 ${state.goals.length}件が記録されています。まず「書き出せている」こと自体が大きいです。頭の中だけで戦うより、紙に出した方が勝率は上がります。

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

7. インポート履歴から見える材料
${recentImports.length ? recentImports.map(r => `・${r.title}：${shorten(r.body, 90)}`).join('\n') : '・履歴インポートはまだありません。これまでの人生履歴・仕事実績・健康履歴を入れると、傾向分析が深くなります。'}

8. 今の傾向
・よく出る領域：${tendencies.topCategories.join(' / ') || 'データ不足'}
・${tendencies.emotionHint}
・${tendencies.futureHint}

9. 今日の小さな一手
・現在地を1つ追加する
・前提ノートに「今の自分を縛っている考え」を1つ書く
・未来設計に「欲しい安心」を1つ書く

10. コーチングメッセージ
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
              <label class="flex items-center gap-2 text-sm font-black text-slate-700"><input id="gasPullEnabledInput" type="checkbox" class="w-5 h-5" ${state.profile.syncPullEnabled !== false ? 'checked' : ''}> 起動時にスプレッドシートから自動取得する</label>
              <button id="saveGasSettingsBtn" class="btn-primary btn-blue w-full"><i data-lucide="save" class="w-5 h-5"></i> GAS設定を保存</button>
              <button id="testGasBtn" class="btn-soft w-full"><i data-lucide="send" class="w-5 h-5"></i> 接続テストを送信</button>
              <button id="syncAllGasBtn" class="btn-soft w-full"><i data-lucide="cloud-upload" class="w-5 h-5"></i> この端末のデータを全件送信</button>
              <button id="pullGasBtn" class="btn-soft w-full"><i data-lucide="cloud-download" class="w-5 h-5"></i> スプレッドシートからこの端末へ同期</button>
              <button id="twoWaySyncBtn" class="btn-primary btn-blue w-full"><i data-lucide="refresh-cw" class="w-5 h-5"></i> 完全同期（送信→取得）</button>
              <button id="repairSyncBtn" class="btn-soft w-full border-amber-300 bg-amber-50 text-amber-900"><i data-lucide="wrench" class="w-5 h-5"></i> 件数ずれを修復する</button>
              <button id="cloudTruthBtn" class="btn-soft w-full border-indigo-300 bg-indigo-50 text-indigo-900"><i data-lucide="cloud-check" class="w-5 h-5"></i> クラウド正本で取り込み</button>
              <button id="checkCloudCountsBtn" class="btn-soft w-full"><i data-lucide="list-checks" class="w-5 h-5"></i> 端末とシートの件数を確認</button>
            </div>
          </div>
          <div class="panel border-sky-700">
            <h2 class="panel-title text-sky-800"><i data-lucide="book-open-check"></i> NotebookLM連携</h2>
            <p class="text-sm font-bold text-slate-600 mt-2 mb-4">NotebookLMには保存用スプレッドシートをそのままソース追加できます。さらにGAS側で読みやすい <span class="font-black">LifeCompass_NotebookLM_Source</span> シートと、必要な時だけ使うまとめGoogle Docsも作れます。</p>
            <div class="space-y-3">
              <button id="refreshNotebookSourceBtn" class="btn-soft w-full"><i data-lucide="table-properties" class="w-5 h-5"></i> NotebookLM向け整理シートを更新依頼</button>
              <button id="openNotebookDocBtn" class="btn-primary btn-blue w-full"><i data-lucide="file-text" class="w-5 h-5"></i> NotebookLM用まとめDocsを作成/更新</button>
              <div class="rounded-2xl bg-sky-50 border-2 border-sky-200 p-4 text-xs md:text-sm font-bold text-slate-700 leading-relaxed">
                <p class="font-black text-sky-900 mb-1">おすすめ運用</p>
                <p>1. NotebookLMにはスプレッドシート本体をソース追加</p>
                <p>2. 深く整理したい時だけ、このボタンでまとめDocsを更新</p>
                <p>3. 写真はDrive保存、シートにはDrive URLと参考URLを保存</p>
              </div>
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
              ${statusRow('端末同期', getGasUrl() ? (state.profile.syncPullEnabled !== false ? '起動時自動取得ON' : '手動取得のみ') : 'GAS URL未設定')}
              ${statusRow('最終同期', state.profile.lastSyncAt ? new Date(state.profile.lastSyncAt).toLocaleString('ja-JP') : '未同期')}
              ${statusRow('NotebookLM連携', getGasUrl() ? 'NotebookLM_Source自動追記 / Docs生成可' : 'GAS URL未設定')}
              ${statusRow('GAS URL', getGasUrl() || '未設定')}
              ${statusRow('AIモデル', 'Gemini: gemini-2.5-flash / ChatGPT: gpt-5.4-mini（GAS側固定）')}
              ${statusRow('未送信キュー', `${(safeParse(localStorage.getItem('life_compass_gas_unsent_queue'), [], 'life_compass_gas_unsent_queue') || []).length}件`)}
              ${statusRow('データバージョン', `v${state.version}`)}
              ${statusRow('旧データ移行', LEGACY_KEYS.some(k => localStorage.getItem(k)) ? '旧キー検出あり' : '旧キーなし')}
            </div>
            <div class="mt-6 rounded-2xl bg-slate-50 border-2 border-slate-200 p-4 text-sm font-bold text-slate-700 leading-relaxed">
              <p class="font-black text-slate-900 mb-2">安全運用の目安</p>
              <p>・大きな編集前はJSONバックアップ</p>
              <p>・v4.3.5では、通常の完全同期に加えて「件数ずれ修復」と「クラウド正本で取り込み」を追加しています。PCとスマホの数字が違う時は、両端末で件数ずれ修復を1回ずつ実行してください。</p>
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
    document.getElementById('pullGasBtn').onclick = () => pullFromSpreadsheet({ manual: true });
    document.getElementById('twoWaySyncBtn').onclick = twoWaySync;
    document.getElementById('repairSyncBtn').onclick = repairDeviceMismatch;
    document.getElementById('cloudTruthBtn').onclick = pullCloudAsSourceOfTruth;
    document.getElementById('checkCloudCountsBtn').onclick = checkCloudCounts;
    document.getElementById('refreshNotebookSourceBtn').onclick = requestNotebookSourceRefresh;
    document.getElementById('openNotebookDocBtn').onclick = openNotebookDocGenerator;
    document.getElementById('resetBtn').onclick = resetAll;
    refreshIcons();
  }

  function statusRow(label, value) {
    return `<div class="rounded-xl bg-slate-50 border-2 border-slate-200 p-4"><p class="text-xs font-black text-slate-500">${label}</p><p class="font-black text-slate-900 mt-1 break-all">${escapeHtml(value)}</p></div>`;
  }

  function getAllEntries() {
    const map = [
      ['current','現在地'], ['mind','心の声'], ['insights','気づき'], ['reflections','反省'], ['premises','前提'], ['future','未来'], ['goals','目標'], ['imports','履歴']
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
    if (hasProfileData()) rows.push(['プロフィール', 'basicProfile', 'プロフィール', profileSummary(), '', state.profile.profileUpdatedAt || state.updatedAt]);
    getAllEntries().forEach(e => rows.push([e.sectionLabel, e.category || e.kind || '', e.title || e.before || '', e.body || e.after || '', e.concern || e.action || e.nextAction || e.decision || '', e.createdAt]));
    const csv = rows.map(r => r.map(v => `"${String(v || '').replaceAll('"','""')}"`).join(',')).join('\n');
    downloadFile(`life-compass-coach-${new Date().toISOString().slice(0,10)}.csv`, '\ufeff' + csv, 'text/csv;charset=utf-8');
    showToast('CSVを書き出しました', 'success');
  }

  function exportMarkdown() {
    const lines = [`# Life Compass Coach Export`, ``, `Exported: ${new Date().toLocaleString('ja-JP')}`, ``, `## プロフィール`, profileSummary(), ``, `---`, ``];
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

  function restoreProtectedProfile() {
    const recovered = recoverBestLocalProfile(state.profile || {});
    if (profileDataScore(recovered) === 0) {
      showToast('この端末内には復元できるプロフィールが見つかりませんでした。GAS同期からの取得を試してください。', 'warn');
      return false;
    }
    updateState(s => {
      s.profile = { ...s.profile, ...recovered, profileUpdatedAt: recovered.profileUpdatedAt || nowIso() };
    }, '保護バックアップからプロフィールを復元しました');
    autoSendToSpreadsheet('create', 'profile', buildProfileRecord());
    return true;
  }

  function renderAll() {
    injectEnhancedUiStyles();
    mountTabs();
    renderHome();
    renderForms();
    bindForms();
    renderLists();
    if (activeTab === 'profile') renderProfile();
    if (activeTab === 'comparison') renderLifeComparison();
    if (activeTab === 'import') renderImport();
    if (activeTab === 'map') renderMindMap();
    if (activeTab === 'ai') renderAi();
    if (activeTab === 'backup') renderBackup();
    refreshIcons();
  }

  function setupHeaderButtons() {
    document.getElementById('quickBackupBtn').onclick = () => { switchTab('backup'); setTimeout(exportJson, 100); };
    document.getElementById('quickAiBtn').onclick = () => switchTab('ai');
    document.getElementById('quickSaveBtn').onclick = () => showToast(`最終保存：${new Date(state.updatedAt).toLocaleString('ja-JP')} / GAS：${isGasSyncEnabled() ? 'ON' : 'OFF'} / 同期：${isPullSyncEnabled() ? 'ON' : 'OFF'}`, 'success');
  }

  window.LifeCompass = { switchTab, exportJson, syncAllToSpreadsheet, pullFromSpreadsheet, twoWaySync, repairDeviceMismatch, pullCloudAsSourceOfTruth, checkCloudCounts, restoreProtectedProfile, renderMindMap, renderLifeComparison, runLifeComparisonAnalysis, openNotebookDocGenerator, state: () => state };

  document.addEventListener('DOMContentLoaded', () => {
    injectEnhancedUiStyles();
    setupHeaderButtons();
    renderAll();
    bindForms();
    switchTab('home');
    scheduleAutoPull();
  });
})();
