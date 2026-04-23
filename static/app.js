// ── Globals ───────────────────────────────────────────────────────────────────
let currentSubject = null;
let questions = [];
let questionIndex = 0;
let score = 0;
let wrongAnswers = [];
let allAnswers = [];  // {question, chosen, correct}
let chatHistory = [];
let simpleMode = false;
let ttsEnabled = false;
let currentMode = "quiz";
let timerInterval = null;
let timerTotal = 30;
let flashQuestions = [];
let flashIndex = 0;
let flashKnown = [];
let flashSpeedMode = false;
let flashSpeedTimer = null;

function startFlashSpeedTimer() {
  if (!flashSpeedMode) return;
  clearInterval(flashSpeedTimer);
  let secs = 5;
  const el = document.getElementById("flash-speed-countdown");
  if (el) el.textContent = secs;
  flashSpeedTimer = setInterval(() => {
    secs--;
    if (el) el.textContent = secs;
    if (secs <= 0) {
      clearInterval(flashSpeedTimer);
      // Auto-click "Keep studying"
      document.getElementById("flash-review-it")?.click();
    }
  }, 1000);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok && res.status !== 401) throw new Error(await res.text());
  return res.json();
}

function mdToHtml(text) {
  return text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/^### (.+)$/gm,"<h3>$1</h3>")
    .replace(/^## (.+)$/gm,"<h2>$1</h2>")
    .replace(/^# (.+)$/gm,"<h1>$1</h1>")
    .replace(/^\d+\. (.+)$/gm,"<li>$1</li>")
    .replace(/^[-*] (.+)$/gm,"<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g,"<ul>$1</ul>")
    .replace(/\n\n/g,"</p><p>")
    .replace(/^(?!<[hul])(.+)/gm,"<p>$1</p>");
}

function renderMath(el) {
  if (typeof renderMathInElement !== "undefined") {
    renderMathInElement(el, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false},
      ],
      throwOnError: false,
    });
  }
}

function getISOWeek(d) {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

let _currentAudio = null;
let _ttsAbort = null;

async function speak(text) {
  if (!ttsEnabled) return;
  const clean = text.replace(/<[^>]+>/g, "").trim();
  if (!clean) return;
  // Stop any playing audio and cancel any in-flight fetch
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  if (_ttsAbort) { _ttsAbort.abort(); }
  _ttsAbort = new AbortController();
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text: clean.slice(0, 1500)}),
      signal: _ttsAbort.signal,
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    _currentAudio = new Audio(url);
    _currentAudio.play();
    _currentAudio.onended = () => { URL.revokeObjectURL(url); _currentAudio = null; };
  } catch (e) { if (e?.name !== "AbortError") console.warn("TTS:", e); }
}

function ttsOn() {
  ttsEnabled = true;
  _setAccessBtn("tts", true);
  saveAccessibility();
  speak("Read aloud is on.");
}

function ttsOff() {
  ttsEnabled = false;
  if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
  if (_ttsAbort) { _ttsAbort.abort(); _ttsAbort = null; }
  _setAccessBtn("tts", false);
  saveAccessibility();
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function initDashboard() {
  loadAccessibility();
  setupAccessButtons();
  setupDarkMode();

  // Check login status first
  let user = null;
  try { user = await api("/auth/me"); } catch {}

  if (!user) {
    $("auth-section").classList.remove("hidden");
    $("dashboard-section").classList.add("hidden");
    setupAuthForms();
    // Default to signup mode for new visitors
    $("auth-toggle")?.click();
    return;
  }

  $("auth-section").classList.add("hidden");
  $("dashboard-section").classList.remove("hidden");

  loadExamCountdown();
  loadSmartSuggestion();

  loadSubjectGrid("subject-grid", subjectId => {
    window.location.href = `/study?subject=${subjectId}`;
  });

  checkOnboarding();
  setupNotificationBanner();
  loadLeaderboard();
  loadDailyPlan();
  loadXpBar();

  loadStudyTimeBadge();
  loadPredictedScores();
  loadDailyChallenge();
  loadWeeklyQuests();
  loadExamDateSetter();

  if (user) {
    $("user-name").textContent = user.name.split(" ")[0];
    $("streak-count").textContent = user.streak || 0;
    // Show streak freeze status
    const freezeEl = $("streak-freeze-badge");
    if (freezeEl) {
      const today = new Date();
      const week = today.getFullYear() + "-" + String(getISOWeek(today)).padStart(2, "0");
      const freezeUsed = user.streak_freeze_week === week;
      freezeEl.textContent = freezeUsed ? "❄️ Freeze used" : "🛡️ Freeze available";
      freezeEl.style.color = freezeUsed ? "var(--muted)" : "#059669";
      freezeEl.style.display = "block";
    }
    loadBadges();
    loadProgress();
  } else {
    $("user-name").textContent = "there";
  }

  $("logout-btn")?.addEventListener("click", async () => {
    await api("/auth/logout", {method:"POST"});
    window.location.reload();
  });

  setupTonightMode();
  initInstallPrompt();
}

async function loadSubjectGrid(containerId, onClick) {
  const subjects = await api("/api/subjects");
  const grid = $(containerId);
  if (!grid) return;
  grid.innerHTML = subjects.map(s => `
    <div class="subject-card" style="background:${s.color}" data-id="${s.id}">
      <div class="emoji">${s.emoji}</div>
      <h3>${s.name}</h3>
    </div>`).join("");
  grid.querySelectorAll(".subject-card").forEach(el => {
    el.addEventListener("click", () => onClick(el.dataset.id));
  });
}

async function loadBadges() {
  try {
    const badges = await api("/api/badges");
    const BADGE_INFO = {
      first_correct: "⭐ First Answer",
      ten_correct: "🔥 10 Correct",
      fifty_correct: "🏆 50 Correct",
    };
    const row = $("badge-row");
    if (badges.length > 0) {
      row.innerHTML = badges.map(b => `<span class="badge-chip">${BADGE_INFO[b.badge] || b.badge}</span>`).join("");
    }
  } catch {}
}

async function loadProgress() {
  try {
    const progress = await api("/api/progress");
    const list = $("progress-list");
    if (!progress.length) {
      list.innerHTML = `<p style="color:var(--muted);font-size:0.9rem">No progress yet — start a quiz! 📝</p>`;
      return;
    }
    const bySubject = {};
    progress.forEach(p => {
      if (!bySubject[p.subject]) bySubject[p.subject] = {correct:0, attempts:0};
      bySubject[p.subject].correct += p.correct;
      bySubject[p.subject].attempts += p.attempts;
    });
    list.innerHTML = Object.entries(bySubject).map(([sub, data]) => {
      const pct = data.attempts ? Math.round(data.correct / data.attempts * 100) : 0;
      return `<div class="card" style="padding:12px 16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <strong style="text-transform:capitalize">${sub}</strong>
          <span style="color:var(--primary);font-weight:700">${pct}%</span>
        </div>
        <div style="background:var(--border);border-radius:6px;height:6px">
          <div style="background:var(--primary);width:${pct}%;height:6px;border-radius:6px;transition:width 0.5s"></div>
        </div>
        <div style="font-size:0.8rem;color:var(--muted);margin-top:4px">${data.correct}/${data.attempts} correct</div>
      </div>`;
    }).join("");
  } catch {}
}

// ── Predicted Scores ──────────────────────────────────────────────────────────
async function loadPredictedScores() {
  const el = $("predicted-scores");
  if (!el) return;
  try {
    const data = await api("/api/predicted-score");
    if (!data.length) {
      el.innerHTML = `<span style="color:var(--muted);font-size:0.85rem">Complete at least 5 questions per subject to see your predicted score</span>`;
      return;
    }
    el.innerHTML = data.map(d => {
      const color = d.predicted_score >= 80 ? "#059669" : d.predicted_score >= 65 ? "#d97706" : "#dc2626";
      const status = d.on_track ? "On track ✅" : "Needs work ⚠️";
      return `<div class="card" style="padding:12px 16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <strong style="text-transform:capitalize">${esc(d.subject)}</strong>
          <span style="font-size:1.6rem;font-weight:800;color:${color}">${d.predicted_score}</span>
        </div>
        <div style="background:var(--border);border-radius:6px;height:8px;margin-bottom:6px">
          <div style="background:${color};width:${d.predicted_score}%;height:8px;border-radius:6px;transition:width 0.5s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--muted)">
          <span>${d.questions_done} questions done</span>
          <span style="font-weight:600;color:${color}">${status}</span>
        </div>
      </div>`;
    }).join("");
  } catch {
    el.innerHTML = `<span style="color:var(--muted);font-size:0.85rem">Sign in to see your predicted score</span>`;
  }
}

// ── Study Time Tracker ────────────────────────────────────────────────────────
function startStudyTimer() {
  localStorage.setItem("bp_study_start", Date.now());
}

function stopStudyTimer() {
  const start = parseInt(localStorage.getItem("bp_study_start") || "0");
  if (!start) return;
  localStorage.removeItem("bp_study_start");
  const mins = Math.round((Date.now() - start) / 60000);
  if (mins < 1) return;
  const today = new Date().toISOString().slice(0, 10);
  const times = JSON.parse(localStorage.getItem("bp_study_times") || "{}");
  times[today] = (times[today] || 0) + mins;
  // Keep only last 7 days
  const keys = Object.keys(times).sort().slice(-7);
  const trimmed = {};
  keys.forEach(k => trimmed[k] = times[k]);
  localStorage.setItem("bp_study_times", JSON.stringify(trimmed));
}

function getStudyTimeThisWeek() {
  const times = JSON.parse(localStorage.getItem("bp_study_times") || "{}");
  return Object.values(times).reduce((a, b) => a + b, 0);
}

function loadStudyTimeBadge() {
  const mins = getStudyTimeThisWeek();
  const el = $("study-time-badge");
  if (!el) return;
  if (mins <= 0) return;
  el.textContent = mins >= 60
    ? `⏱️ ${Math.round(mins/60)}h ${mins%60}m this week`
    : `⏱️ ${mins}m studied this week`;
  el.style.display = "block";
  const bCount = getBookmarks().length;
  const bEl = $("bookmarks-count");
  if (bEl) bEl.textContent = bCount > 0 ? `⭐ ${bCount} bookmarked` : "";
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────
function getBookmarks() {
  return JSON.parse(localStorage.getItem("bp_bookmarks") || "[]");
}

function toggleBookmark(q) {
  let bookmarks = getBookmarks();
  const idx = bookmarks.findIndex(b => b.id === q.id);
  if (idx >= 0) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.push(q);
  }
  localStorage.setItem("bp_bookmarks", JSON.stringify(bookmarks.slice(-50))); // max 50
  return idx < 0; // returns true if now bookmarked
}

function isBookmarked(q) {
  return getBookmarks().some(b => b.id === q.id);
}

// ── AI Question Generator Tracking ───────────────────────────────────────────
function getAnsweredCount(subjectId) {
  try { return parseInt(localStorage.getItem(`bp_answered_${subjectId}`) || "0"); } catch { return 0; }
}
function incrementAnsweredCount(subjectId) {
  const n = getAnsweredCount(subjectId) + 1;
  localStorage.setItem(`bp_answered_${subjectId}`, n.toString());
}

// ── Spaced Repetition ─────────────────────────────────────────────────────────
function getSRQueue(subjectId) {
  try { return JSON.parse(localStorage.getItem(`bp_sr_${subjectId}`) || "[]"); } catch { return []; }
}
function saveSRQueue(subjectId, queue) {
  localStorage.setItem(`bp_sr_${subjectId}`, JSON.stringify(queue.slice(0, 30)));
}
function addToSRQueue(subjectId, question) {
  const q = getSRQueue(subjectId);
  if (!q.find(x => x.question === question.question)) {
    q.unshift({...question, sr_due: Date.now() + 24*3600*1000});
  }
  saveSRQueue(subjectId, q);
}
function removeFromSRQueue(subjectId, questionText) {
  const q = getSRQueue(subjectId).filter(x => x.question !== questionText);
  saveSRQueue(subjectId, q);
}
function getDueSRQuestions(subjectId) {
  return getSRQueue(subjectId).filter(x => x.sr_due <= Date.now() + 60000);
}

// ── Auth Forms ────────────────────────────────────────────────────────────────
function setupAuthForms() {
  let isSignup = false;
  $("auth-toggle").addEventListener("click", e => {
    e.preventDefault();
    isSignup = !isSignup;
    $("signup-fields").classList.toggle("hidden", !isSignup);
    $("auth-submit").textContent = isSignup ? "Create Account" : "Log In";
    $("auth-toggle-text").textContent = isSignup ? "Already have an account?" : "Don't have an account?";
    $("auth-toggle").textContent = isSignup ? " Log in" : " Sign up";
  });

  $("auth-submit").addEventListener("click", async () => {
    const email = $("email").value.trim();
    const password = $("password").value;
    const errorEl = $("auth-error");
    errorEl.classList.add("hidden");
    try {
      if (isSignup) {
        await api("/auth/signup", {method:"POST", body:{name:$("name").value.trim(), email, password, role:$("role").value}});
      } else {
        await api("/auth/login", {method:"POST", body:{email, password}});
      }
      window.location.reload();
    } catch(e) {
      errorEl.textContent = isSignup ? "Could not create account. Email may already be used." : "Wrong email or password.";
      errorEl.classList.remove("hidden");
    }
  });

  [$("email"), $("password"), $("name")].forEach(el => {
    el?.addEventListener("keydown", e => { if(e.key==="Enter") $("auth-submit").click(); });
  });
}

// ── Tonight Mode ──────────────────────────────────────────────────────────────
async function setupTonightMode() {
  const btn = $("tonight-btn");
  const modal = $("tonight-modal");
  if (!btn || !modal) return;

  btn.addEventListener("click", async () => {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
    const subjects = await api("/api/subjects");
    $("tonight-subjects").innerHTML = subjects.map(s =>
      `<button class="btn btn-outline btn-sm" style="width:100%;justify-content:flex-start;gap:8px" data-sid="${s.id}">${s.emoji} ${s.name}</button>`
    ).join("");
    $("tonight-subjects").querySelectorAll("button").forEach(b => {
      b.addEventListener("click", async () => {
        b.textContent = "Generating your plan…";
        b.disabled = true;
        try {
          const data = await api("/api/tonight", {method:"POST", body:{subject:b.dataset.sid}});
          $("tonight-plan").classList.remove("hidden");
          $("tonight-plan").innerHTML = `<h3>🔥 Your Tonight Plan</h3>${mdToHtml(data.plan)}`;
        } catch { b.textContent = "Error — try again"; b.disabled = false; }
      });
    });
  });
  $("close-tonight").addEventListener("click", () => {
    modal.style.display = "none";
    $("tonight-plan").classList.add("hidden");
  });
}

// ── Accessibility ─────────────────────────────────────────────────────────────
function setupAccessButtons() {
  $("btn-tts")?.addEventListener("click", () => ttsEnabled ? ttsOff() : ttsOn());
  $("btn-simple")?.addEventListener("click", () => {
    simpleMode = !simpleMode;
    _setAccessBtn("simple", simpleMode);
    saveAccessibility();
  });
}

// Mark both mobile (btn-*) and sidebar (sb-*) variants
function _setAccessBtn(key, on) {
  [`btn-${key}`, `sb-${key}`].forEach(id => $(id)?.classList.toggle("active", on));
}

function toggleBodyClass(cls, key) {
  const on = document.body.classList.toggle(cls);
  _setAccessBtn(key, on);
  saveAccessibility();
}

function saveAccessibility() {
  localStorage.setItem("bp_access", JSON.stringify({
    tts:    ttsEnabled,
    simple: simpleMode,
  }));
}

function loadAccessibility() {
  try {
    const s = JSON.parse(localStorage.getItem("bp_access") || "{}");
    if (s.tts)    { ttsEnabled = true; _setAccessBtn("tts", true); }
    if (s.simple) { simpleMode = true; _setAccessBtn("simple", true); }
  } catch {}
}

// ── Study Page ────────────────────────────────────────────────────────────────
async function initStudy() {
  loadAccessibility();
  const bCount = getBookmarks().length;
  const bEl = $("bookmarks-count");
  if (bEl) bEl.textContent = bCount > 0 ? `⭐ ${bCount} bookmarked` : "";
  const params = new URLSearchParams(location.search);
  const subjectParam = params.get("subject");
  const modeParam = params.get("mode") || "quiz";

  const subjects = await api("/api/subjects");
  const grid = $("selector-grid");
  grid.innerHTML = subjects.map(s => `
    <div class="subject-card" style="background:${s.color}" data-id="${s.id}" data-name="${esc(s.name)}">
      <div class="emoji">${s.emoji}</div>
      <h3>${s.name}</h3>
    </div>`).join("");
  grid.querySelectorAll(".subject-card").forEach(el => {
    el.addEventListener("click", () => selectSubject(el.dataset.id, el.dataset.name, currentMode));
  });

  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentMode = tab.dataset.mode;
      if (currentMode === "photo") {
        $("subject-selector").classList.add("hidden");
        $("flash-section")?.classList.add("hidden");
        initPhotoMode();
      } else {
        $("photo-section")?.classList.add("hidden");
        $("flash-section")?.classList.add("hidden");
        $("subject-selector").classList.remove("hidden");
      }
    });
  });

  if (modeParam === "photo") {
    $("subject-selector").classList.add("hidden");
    initPhotoMode();
    return;
  }

  if (subjectParam) {
    const s = subjects.find(s => s.id === subjectParam);
    if (s) selectSubject(s.id, s.name, modeParam);
  }
  initInstallPrompt();

  // Wire up AI generate button
  $("gen-questions-btn")?.addEventListener("click", async () => {
    const btn = $("gen-questions-btn");
    if (!btn || !currentSubject) return;
    btn.disabled = true;
    btn.textContent = "🤖 Generating questions…";
    try {
      const generated = await api("/api/generate-questions", {
        method: "POST",
        body: { subject: currentSubject.id, topic: "", count: 5 }
      });
      if (generated && generated.length > 0) {
        questions = generated;
        questionIndex = 0;
        score = 0;
        wrongAnswers = [];
        allAnswers = [];
        $("score-section").classList.add("hidden");
        $("quiz-section").classList.remove("hidden");
        showQuestion();
      }
    } catch {
      btn.textContent = "❌ Failed — try again";
    } finally {
      btn.disabled = false;
    }
  });
}

async function showWeakTopicsBanner(subjectId) {
  try {
    const prog = await api("/api/progress");
    const subjectProg = prog.filter(p => p.subject === subjectId && p.attempts >= 3);
    if (!subjectProg.length) return;
    subjectProg.sort((a,b) => (a.correct/a.attempts) - (b.correct/b.attempts));
    const worst = subjectProg[0];
    const pct = Math.round(worst.correct/worst.attempts*100);
    if (pct >= 70) return; // no banner if doing well
    const banner = document.createElement("div");
    banner.style.cssText = "background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center";
    banner.innerHTML = `<span>📉 Weak topic: <strong>${worst.topic}</strong> (${pct}% correct) — we'll prioritize it!</span><button onclick="this.parentNode.remove()" style="background:none;border:none;cursor:pointer;font-size:1rem;opacity:0.5">✕</button>`;
    const quizSection = document.getElementById("quiz-section");
    if (quizSection) quizSection.insertBefore(banner, quizSection.firstChild);
  } catch {}
}

function selectSubject(id, name, mode) {
  currentSubject = {id, name};
  $("subject-selector").classList.add("hidden");
  const refLink = document.getElementById("ref-link");
  if (refLink) refLink.href = "/reference?subject=" + id;
  if (mode === "chat") {
    startChat(id, name);
  } else if (mode === "flash") {
    startFlashcards(id, name);
  } else if (mode === "bookmarks") {
    const saved = getBookmarks();
    if (saved.length === 0) {
      alert("No bookmarked questions yet! Tap ☆ during a quiz to save tough ones.");
      $("subject-selector").classList.remove("hidden");
      return;
    }
    questions = saved.sort(() => Math.random() - 0.5);
    questionIndex = 0; score = 0; wrongAnswers = []; allAnswers = [];
    $("quiz-section").classList.remove("hidden");
    $("subject-selector").classList.add("hidden");
    showQuestion();
  } else {
    startQuiz(id, name);
  }
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
async function startQuiz(subjectId, subjectName) {
  $("quiz-section").classList.remove("hidden");
  $("score-section").classList.add("hidden");
  $("review-section")?.classList.add("hidden");
  showWeakTopicsBanner(subjectId);
  questions = await api(`/api/questions/${subjectId}?limit=10`);
  // Prepend spaced repetition questions due for review
  if (currentSubject) {
    const srDue = getDueSRQuestions(currentSubject.id);
    if (srDue.length > 0) {
      questions = [...srDue.slice(0,3), ...questions].slice(0, questions.length);
    }
  }
  questionIndex = 0;
  score = 0;
  wrongAnswers = [];
  allAnswers = [];
  updateQuestMetric("subjects", subjectId);
  startStudyTimer();
  showQuestion();
}

function showQuestion() {
  if (questionIndex >= questions.length) { showScore(); return; }
  const q = questions[questionIndex];
  const pct = (questionIndex / questions.length) * 100;
  $("quiz-progress").style.width = pct + "%";
  $("question-num").textContent = `Question ${questionIndex+1} of ${questions.length}`;
  $("topic-tag").textContent = q.topic || "";
  $("question-text").textContent = q.question;
  renderMath($("question-text"));
  $("explanation").classList.add("hidden");
  $("explanation").innerHTML = "";
  $("video-embed")?.classList.add("hidden");
  $("feedback-row").classList.add("hidden");
  $("next-btn").classList.add("hidden");
  speak(q.question);

  const labels = ["A","B","C","D"];
  $("choices").innerHTML = q.choices.map((c, i) => `
    <button class="choice-btn" data-answer="${esc(c)}">
      <div class="choice-label">${labels[i]}</div>
      ${esc(c)}
    </button>`).join("");
  renderMath($("choices"));

  $("choices").querySelectorAll(".choice-btn").forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(btn, q));
  });

  // Bookmark button
  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.style.cssText = "background:none;border:none;font-size:1.3rem;cursor:pointer;position:absolute;top:12px;right:12px;opacity:0.5;transition:opacity 0.15s";
  bookmarkBtn.textContent = isBookmarked(q) ? "⭐" : "☆";
  bookmarkBtn.title = "Bookmark this question";
  bookmarkBtn.onclick = () => {
    const saved = toggleBookmark(q);
    bookmarkBtn.textContent = saved ? "⭐" : "☆";
    bookmarkBtn.style.opacity = saved ? "1" : "0.5";
  };
  const questionCard = document.querySelector(".question-card");
  if (questionCard) {
    questionCard.style.position = "relative";
    const existing = questionCard.querySelector(".bookmark-btn");
    if (existing) existing.remove();
    bookmarkBtn.className = "bookmark-btn";
    questionCard.appendChild(bookmarkBtn);
  }

  $("tts-btn").onclick = () => speak(q.question + ". " + q.choices.join(". "));

  // Show hint button
  const hintBtn = $("hint-btn");
  const hintBox = $("hint-box");
  if (hintBtn) {
    hintBtn.style.display = "block";
    hintBox?.classList.add("hidden");
    hintBox && (hintBox.innerHTML = "");
    hintBtn.onclick = () => { hintBtn.style.display = "none"; showHint(q); };
  }

  startTimer(timerTotal);
}

async function handleAnswer(btn, q) {
  clearTimer();
  $("choices").querySelectorAll(".choice-btn").forEach(b => b.disabled = true);
  const chosen = btn.dataset.answer;
  const correct = chosen === q.answer;
  if (correct) score++;
  else wrongAnswers.push({question: q, chosen});
  allAnswers.push({question: q, chosen, correct});
  if (currentSubject) incrementAnsweredCount(currentSubject.id);
  updateQuestMetric("questions", 1);
  // Save study date for streak calendar
  (function(){
    const today = new Date().toISOString().split("T")[0];
    try {
      let dates = JSON.parse(localStorage.getItem("bp_study_dates") || "[]");
      if (!dates.includes(today)) { dates.push(today); if (dates.length > 60) dates = dates.slice(-60); localStorage.setItem("bp_study_dates", JSON.stringify(dates)); }
    } catch {}
  })();

  btn.classList.add(correct ? "correct" : "wrong");
  playSound(correct ? "correct" : "wrong");
  if (!correct) {
    $("choices").querySelectorAll(".choice-btn").forEach(b => {
      if (b.dataset.answer === q.answer) b.classList.add("reveal-correct");
    });
  }

  const expBox = $("explanation");
  expBox.innerHTML = `<div class="loading-spinner">🤖 Thinking…</div>`;
  expBox.className = correct ? "explanation-box" : "explanation-box wrong-exp";
  expBox.classList.remove("hidden");

  try {
    const data = await api("/api/quiz/check", {method:"POST", body:{
      subject: currentSubject.id,
      question_id: q.id,
      student_answer: chosen,
      question_text: q.question,
      correct_answer: q.answer,
      simple_mode: simpleMode,
    }});
    expBox.innerHTML = `${correct ? "✅" : "❌"} ${mdToHtml(data.explanation)}`;
    renderMath(expBox);
    speak(data.explanation);
    if (data.xp_earned > 0) {
      showXpPopup(`+${data.xp_earned} XP`, btn);
      updateXpBar(data.total_xp);
    }
  } catch {
    expBox.innerHTML = `${correct ? "✅ Correct!" : "❌ Wrong."} ${esc(q.explanation)}`;
  }

  // Show video for topic if available
  const videoEl = $("video-embed");
  if (videoEl && typeof getVideoForTopic !== "undefined") {
    const vid = getVideoForTopic(currentSubject.id, q.topic);
    if (vid) {
      videoEl.classList.remove("hidden");
      videoEl.innerHTML = renderVideoEmbed(vid, q.topic);
      if (typeof initNewVideoPlayers !== "undefined") setTimeout(initNewVideoPlayers, 500);
    } else {
      videoEl.classList.add("hidden");
    }
  }

  $("feedback-row").classList.remove("hidden");
  $("next-btn").classList.remove("hidden");

  $("thumb-up").onclick = () => submitFeedback(q.id, 1);
  $("thumb-down").onclick = () => submitFeedback(q.id, 0);
  $("next-btn").onclick = () => {
    if (videoEl) videoEl.classList.add("hidden");
    questionIndex++;
    showQuestion();
  };
}

async function submitFeedback(qid, rating) {
  try { await api("/api/feedback", {method:"POST", body:{question_id:qid, rating, comment:""}}); } catch {}
  $("feedback-row").innerHTML = `<span style="color:var(--success)">Thanks for your feedback! 🙏</span>`;
}

async function showScore() {
  stopStudyTimer();
  $("quiz-section").classList.add("hidden");
  $("score-section").classList.remove("hidden");
  $("quiz-progress").style.width = "100%";
  const pct = Math.round(score / questions.length * 100);
  $("score-display").textContent = `${score}/${questions.length}`;
  const msgs = [
    [80, "Amazing work! You're crushing it! 🔥"],
    [60, "Good job! Keep practicing and you'll ace it! 💪"],
    [40, "You're learning! Every question makes you better! 📈"],
    [0, "Don't give up! Practice makes perfect! 🌱"],
  ];
  $("score-msg").textContent = msgs.find(([min]) => pct >= min)[1];
  $("retry-btn").onclick = () => startQuiz(currentSubject.id, currentSubject.name);

  // Update spaced repetition queue
  allAnswers.forEach(a => {
    if (!a.correct && currentSubject) addToSRQueue(currentSubject.id, a.question);
    else if (a.correct && currentSubject) removeFromSRQueue(currentSubject.id, a.question.question);
  });

  // Show SR badge if there are queued questions
  const srCount = currentSubject ? getSRQueue(currentSubject.id).length : 0;
  if (srCount > 0 && $("score-msg")) {
    const srNote = document.createElement("p");
    srNote.style.cssText = "font-size:0.82rem;color:var(--primary);margin-top:8px";
    srNote.textContent = `🔄 ${srCount} question${srCount>1?"s":""} queued for spaced repetition review`;
    $("score-msg").after(srNote);
  }

  const reviewBtn = $("review-btn");
  if (reviewBtn) {
    reviewBtn.style.display = wrongAnswers.length > 0 ? "block" : "none";
    reviewBtn.onclick = showMistakesReview;
  }

  // Full answer key — always show after quiz
  const answerKeyBtn = $("answer-key-btn");
  if (answerKeyBtn) {
    answerKeyBtn.style.display = allAnswers.length > 0 ? "block" : "none";
    answerKeyBtn.onclick = showFullAnswerKey;
  }

  if (score === questions.length) updateQuestMetric("perfect", 1);
  playSound(pct >= 80 ? "levelup" : pct >= 60 ? "correct" : "wrong");

  // Fetch and display updated badges
  try {
    const badges = await api("/api/badges");
    const BADGE_INFO = {
      first_correct: "⭐ First Answer",
      ten_correct: "🔥 10 Correct",
      fifty_correct: "🏆 50 Correct",
    };
    const newBadges = badges.slice(-3);
    if (newBadges.length > 0) {
      $("score-badges").innerHTML = newBadges.map(b =>
        `<span class="badge-chip">${BADGE_INFO[b.badge] || b.badge} Unlocked!</span>`
      ).join("");
    }
  } catch {}

  // Show pass message if 80%+
  if (pct >= 80) {
    const confetti = document.createElement("div");
    confetti.style.cssText = "text-align:center;font-size:3rem;margin-bottom:12px";
    confetti.textContent = "🎉🎊🏆";
    $("score-card")?.prepend(confetti);
  }

  // Show AI generate button if student has answered many questions
  const answered = currentSubject ? getAnsweredCount(currentSubject.id) : 0;
  const genBtn = $("gen-questions-btn");
  if (genBtn && answered >= 15) {
    genBtn.style.display = "block";
  }
}

// ── Full Answer Key ───────────────────────────────────────────────────────────
function showFullAnswerKey() {
  $("score-section").classList.add("hidden");
  $("answer-key-section").classList.remove("hidden");

  $("answer-key-list").innerHTML = allAnswers.map((a, i) => {
    const q = a.question;
    const icon = a.correct ? "✅" : "❌";
    const chosenStyle = a.correct
      ? "color:var(--success);font-weight:700"
      : "color:var(--danger);font-weight:700";
    return `<div class="card" style="padding:18px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:0.75rem;color:var(--muted);font-weight:600">Q${i+1} · ${esc(q.topic||"")}</span>
        <span style="font-size:1.1rem">${icon}</span>
      </div>
      <div style="font-weight:600;margin-bottom:12px;line-height:1.5">${esc(q.question)}</div>
      ${!a.correct ? `<div style="${chosenStyle};font-size:0.88rem;margin-bottom:4px">Your answer: ${esc(a.chosen)}</div>` : ""}
      <div style="color:var(--success);font-weight:700;font-size:0.9rem;margin-bottom:10px">✅ Correct answer: ${esc(q.answer)}</div>
      <div style="background:var(--bg);border-left:3px solid var(--primary);padding:10px 14px;border-radius:0 8px 8px 0;font-size:0.88rem;line-height:1.6;color:var(--text)">
        💡 <strong>Why?</strong> ${esc(q.explanation)}
      </div>
    </div>`;
  }).join("");

  $("back-from-key").onclick = () => {
    $("answer-key-section").classList.add("hidden");
    $("score-section").classList.remove("hidden");
  };
}

// ── Hint System ───────────────────────────────────────────────────────────────
async function showHint(q) {
  const hintBox = $("hint-box");
  if (!hintBox) return;
  hintBox.innerHTML = "💡 Thinking of a hint…";
  hintBox.classList.remove("hidden");
  try {
    const data = await api("/api/hint", {method:"POST", body:{
      question_text: q.question,
      subject: currentSubject.id,
      simple_mode: simpleMode,
    }});
    hintBox.innerHTML = `💡 <strong>Hint:</strong> ${mdToHtml(data.hint)}`;
  } catch {
    hintBox.innerHTML = `💡 Think about: ${esc(q.topic || "the core concept")}`;
  }
}

// ── Sound Effects (Web Audio API — no files needed) ───────────────────────────
let _audioCtx = null;
function _ctx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playSound(type) {
  try {
    const ctx = _ctx();
    const play = (freq, start, dur, vol = 0.25) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    if (type === "correct") { play(523,0,.1); play(659,.1,.1); play(784,.2,.2); }
    else if (type === "wrong") { play(220,0,.15,.2); play(180,.15,.2,.15); }
    else if (type === "levelup") { [523,659,784,1047].forEach((f,i) => play(f,i*.1,.2)); }
  } catch {}
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(seconds) {
  clearTimer();
  let left = seconds;
  const wrap = $("timer-wrap");
  const fill = $("timer-fill");
  const num = $("timer-num");
  if (!wrap) return;
  wrap.classList.remove("hidden");
  fill.style.width = "100%";
  fill.style.background = "var(--primary)";
  num.textContent = left;

  timerInterval = setInterval(() => {
    left--;
    const pct = (left / seconds) * 100;
    fill.style.width = pct + "%";
    num.textContent = left;
    if (left <= 5) fill.style.background = "var(--danger)";
    else if (left <= 10) fill.style.background = "var(--warning)";

    if (left <= 0) {
      clearTimer();
      const q = questions[questionIndex];
      $("choices").querySelectorAll(".choice-btn").forEach(b => {
        b.disabled = true;
        if (b.dataset.answer === q.answer) b.classList.add("reveal-correct");
      });
      wrongAnswers.push({question: q, chosen: "(time ran out)"});
      allAnswers.push({question: q, chosen: "(time ran out)", correct: false});
      const expBox = $("explanation");
      expBox.innerHTML = `⏰ Time's up! The correct answer was: <strong>${esc(q.answer)}</strong>. ${esc(q.explanation)}`;
      expBox.className = "explanation-box wrong-exp";
      expBox.classList.remove("hidden");
      $("next-btn").classList.remove("hidden");
      $("next-btn").onclick = () => { $("video-embed")?.classList.add("hidden"); questionIndex++; showQuestion(); };
    }
  }, 1000);
}

function clearTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  $("timer-wrap")?.classList.add("hidden");
}

// ── Review Mistakes ───────────────────────────────────────────────────────────
function showMistakesReview() {
  $("score-section").classList.add("hidden");
  $("review-section").classList.remove("hidden");
  $("review-list").innerHTML = wrongAnswers.map((w, i) => `
    <div class="card" style="padding:16px;margin-bottom:12px">
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">Question ${i+1} • ${esc(w.question.topic||"")}</div>
      <div style="font-weight:600;margin-bottom:10px">${esc(w.question.question)}</div>
      <div style="color:var(--danger);font-size:0.85rem">❌ Your answer: ${esc(w.chosen)}</div>
      <div style="color:var(--success);font-weight:700;margin-top:4px">✅ Correct: ${esc(w.question.answer)}</div>
      <div style="color:var(--muted);font-size:0.82rem;margin-top:8px;line-height:1.5">${esc(w.question.explanation)}</div>
    </div>`).join("");
  $("back-from-review").onclick = () => {
    $("review-section").classList.add("hidden");
    $("score-section").classList.remove("hidden");
  };
}

// ── Flashcards ────────────────────────────────────────────────────────────────
async function startFlashcards(subjectId, subjectName) {
  startStudyTimer();
  $("flash-section").classList.remove("hidden");
  flashQuestions = await api(`/api/questions/${subjectId}?limit=20`);
  flashIndex = 0;
  flashKnown = new Array(flashQuestions.length).fill(null);
  flashSpeedMode = false;
  clearInterval(flashSpeedTimer);
  // Wire speed mode toggle
  const toggleBtn = $("flash-speed-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = "⚡ Speed Mode: OFF";
    toggleBtn.style.color = "var(--muted)";
    toggleBtn.onclick = () => {
      flashSpeedMode = !flashSpeedMode;
      toggleBtn.textContent = flashSpeedMode ? "⚡ Speed Mode: ON" : "⚡ Speed Mode: OFF";
      toggleBtn.style.color = flashSpeedMode ? "var(--primary)" : "var(--muted)";
      toggleBtn.style.borderColor = flashSpeedMode ? "var(--primary)" : "var(--border)";
      if (flashSpeedMode) startFlashSpeedTimer();
      else { clearInterval(flashSpeedTimer); const el = $("flash-speed-countdown"); if (el) el.textContent = ""; }
    };
  }
  showFlashcard();
}

function showFlashcard() {
  const total = flashQuestions.length;
  if (flashIndex >= total) {
    updateQuestMetric("flashcards", 1);
    const known = flashKnown.filter(k => k === true).length;
    $("flashcard").innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:3rem;margin-bottom:12px">🎉</div>
        <h3 style="margin-bottom:8px">Deck complete!</h3>
        <p style="color:var(--muted);margin-bottom:20px">${known}/${total} cards mastered</p>
        <button class="btn btn-primary" onclick="startFlashcards('${currentSubject.id}','${currentSubject.name}')">Shuffle & Repeat 🔄</button>
        <a href="/study" class="btn btn-outline" style="margin-top:10px;display:block">Back to Subjects</a>
      </div>`;
    return;
  }

  const q = flashQuestions[flashIndex];
  const pct = (flashIndex / total) * 100;
  $("flash-progress-fill").style.width = pct + "%";
  $("flash-num").textContent = `${flashIndex + 1} / ${total}`;
  $("flash-question").textContent = q.question;
  $("flash-back").classList.add("hidden");
  $("flash-reveal-btn").classList.remove("hidden");
  speak(q.question);

  $("flash-reveal-btn").onclick = () => {
    clearInterval(flashSpeedTimer);
    const el = $("flash-speed-countdown"); if (el) el.textContent = "";
    $("flash-answer").innerHTML = `<strong>Answer: ${esc(q.answer)}</strong><br><small style="color:var(--muted)">${esc(q.explanation)}</small>`;
    $("flash-back").classList.remove("hidden");
    $("flash-reveal-btn").classList.add("hidden");
    speak(q.answer + ". " + q.explanation);
  };

  $("flash-got-it").onclick = () => {
    flashKnown[flashIndex] = true;
    flashIndex++;
    showFlashcard();
  };

  $("flash-review-it").onclick = () => {
    flashKnown[flashIndex] = false;
    flashQuestions.push(flashQuestions[flashIndex]);
    flashIndex++;
    showFlashcard();
  };

  startFlashSpeedTimer();
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function checkOnboarding() {
  if (localStorage.getItem("bp_onboarded")) return;
  const modal = $("onboarding-modal");
  if (!modal) return;
  modal.style.display = "flex";

  const dismiss = () => {
    modal.style.display = "none";
    localStorage.setItem("bp_onboarded", "1");
  };

  $("onboard-skip").onclick = dismiss;
  $("onboard-start").onclick = () => {
    const sub = $("onboard-subject")?.value;
    dismiss();
    if (sub) window.location.href = `/study?subject=${sub}`;
  };
}

// ── Study Reminders (Browser Notifications) ───────────────────────────────────
function setupNotificationBanner() {
  const banner = $("notify-banner");
  const btn = $("notify-btn");
  if (!banner || !btn) return;
  if (!("Notification" in window)) return;
  if (localStorage.getItem("bp_notify") === "1" || Notification.permission === "denied") return;
  if (Notification.permission === "granted") { localStorage.setItem("bp_notify","1"); return; }
  banner.style.display = "flex";
  btn.addEventListener("click", async () => {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem("bp_notify", "1");
      banner.style.display = "none";
      new Notification("BoroPrep 📚", {body: "Daily study reminders are on! Keep that streak going 🔥"});
      try { await fetch("/api/push/test", {method:"POST",credentials:"include"}); } catch {}
    } else {
      banner.style.display = "none";
    }
  });
}

function scheduleDailyReminder() {
  const msUntil8pm = (() => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(20, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target - now;
  })();
  setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification("BoroPrep 📚", { body: "Time to study! Your Regents exam is coming up — 10 minutes today makes a big difference! 🔥" });
    }
    scheduleDailyReminder();
  }, msUntil8pm);
}

// ── Tutor Chat ────────────────────────────────────────────────────────────────
function startChat(subjectId, subjectName) {
  $("chat-section").classList.remove("hidden");
  chatHistory = [];
  $("chat-welcome").innerHTML = `Hey! I'm your BoroPrep tutor for <strong>${esc(subjectName)}</strong>! 🎓<br>Ask me anything, or say <em>"quiz me"</em> to practice!`;

  $("chat-send").onclick = sendChat;
  $("chat-input").onkeydown = e => { if(e.key === "Enter") sendChat(); };
  $("chat-input").disabled = false;
  $("chat-input").focus();
}

async function sendChat() {
  const input = $("chat-input");
  const msg = input.value.trim();
  if (!msg) return;
  input.value = "";

  appendBubble(msg, "user");
  chatHistory.push({role:"user", content:msg});
  const thinking = appendBubble("…", "bot");

  try {
    const data = await api("/api/tutor", {method:"POST", body:{
      subject: currentSubject.id,
      history: chatHistory.slice(-20),
      message: msg,
      simple_mode: simpleMode,
    }});
    thinking.innerHTML = mdToHtml(data.reply);
    chatHistory.push({role:"assistant", content:data.reply});
    speak(data.reply);
  } catch {
    thinking.textContent = "Sorry, something went wrong. Try again!";
  }
  scrollChat();
}

function appendBubble(text, role) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.innerHTML = role === "bot" ? mdToHtml(text) : esc(text);
  $("chat-messages").appendChild(div);
  scrollChat();
  return div;
}

function scrollChat() {
  const el = $("chat-messages");
  if (el) el.scrollTop = el.scrollHeight;
}

// ── Exam Countdown ────────────────────────────────────────────────────────────
async function loadExamCountdown() {
  try {
    const dates = await api("/api/exam-dates");
    const container = $("exam-countdown");
    if (!container) return;
    if (!dates.length) {
      container.innerHTML = `<span style="font-size:0.8rem;color:var(--muted)">No exams added yet.</span>`;
    } else {
      container.innerHTML = dates.map(e => {
        const color = e.days_left <= 7 ? "#ef4444" : e.days_left <= 30 ? "#f59e0b" : "#10b981";
        const label = e.days_left < 0 ? "Passed" : e.days_left === 0 ? "TODAY!" : `${e.days_left}d`;
        return `<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;border:1.5px solid ${color};background:${color}18;font-size:0.8rem;font-weight:700;cursor:pointer" onclick="window.location='/study?subject=${e.subject_id}'" title="${e.name} — ${e.date}">
          <span style="color:var(--text)">${e.name.split(" ")[0]}</span>
          <span style="color:${color}">${label}</span>
        </div>`;
      }).join("");
    }
    // Wire toggle button
    const toggle = $("add-exam-toggle");
    const setter = $("exam-date-setter");
    if (toggle && setter) {
      toggle.addEventListener("click", () => {
        const open = setter.style.display !== "none";
        setter.style.display = open ? "none" : "block";
        toggle.textContent = open ? "+ Add Date" : "✕ Close";
      });
    }
  } catch {}
}

// ── Smart Suggestions ─────────────────────────────────────────────────────────
async function loadSmartSuggestion() {
  try {
    const data = await api("/api/smart-study");
    const box = $("smart-suggestion");
    const text = $("suggestion-text");
    if (box && text && data.suggestion) {
      text.textContent = data.suggestion;
      box.style.display = "block";
    }
  } catch {}
}

// ── Photo Help ────────────────────────────────────────────────────────────────
function initPhotoMode() {
  $("photo-section").classList.remove("hidden");
  const input = $("photo-input");
  const preview = $("photo-preview");
  const img = $("preview-img");

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    img.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });

  $("analyze-btn").addEventListener("click", async () => {
    const file = input.files[0];
    if (!file) return;
    const btn = $("analyze-btn");
    btn.textContent = "🤖 Analyzing…";
    btn.disabled = true;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("simple_mode", simpleMode ? "true" : "false");

    try {
      const res = await fetch("/api/photo-help", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      const answerBox = $("photo-answer");
      answerBox.classList.remove("hidden");
      answerBox.innerHTML = mdToHtml(data.answer);
      speak(data.answer);
    } catch {
      $("photo-answer").classList.remove("hidden");
      $("photo-answer").textContent = "Error — please try again.";
    }
    btn.textContent = "🤖 Get AI Help";
    btn.disabled = false;
  });
}

// ── Multiplayer ───────────────────────────────────────────────────────────────
let myRoomCode = null;
let myPlayerName = null;
let pollInterval = null;

function initMultiplayer() {
  $("create-btn").addEventListener("click", async () => {
    const data = await api("/api/room/create", {method:"POST"});
    myRoomCode = data.code;
    myPlayerName = data.player_name;
    showWaitingRoom(data.code);
  });

  $("join-btn").addEventListener("click", async () => {
    const code = $("join-code").value.trim().toUpperCase();
    if (!code) return;
    try {
      const data = await api(`/api/room/join/${code}`, {method:"POST"});
      myRoomCode = data.code;
      myPlayerName = data.player_name;
      showWaitingRoom(code);
    } catch {
      $("lobby-error").textContent = "Room not found! Check the code.";
      $("lobby-error").classList.remove("hidden");
    }
  });
}

function showWaitingRoom(code) {
  $("lobby").classList.add("hidden");
  $("waiting-room").classList.remove("hidden");
  $("room-code-display").textContent = code;

  $("start-btn").addEventListener("click", async () => {
    await api(`/api/room/start/${code}`, {method:"POST"});
    startMultiplayerGame();
  });

  pollInterval = setInterval(async () => {
    const state = await api(`/api/room/state/${code}`);
    updatePlayersList(state.players);
    if (state.started) {
      clearInterval(pollInterval);
      startMultiplayerGame();
    }
  }, 2000);
}

function updatePlayersList(players) {
  $("players-list").innerHTML = Object.entries(players).map(([name, score]) =>
    `<div class="card" style="padding:10px 16px;display:flex;justify-content:space-between">
      <span>👤 ${esc(name)}</span><span style="font-weight:700">${score} pts</span>
    </div>`
  ).join("");
}

async function startMultiplayerGame() {
  $("waiting-room").classList.add("hidden");
  $("game-section").classList.remove("hidden");
  await loadGameQuestion();
}

async function loadGameQuestion() {
  const state = await api(`/api/room/state/${myRoomCode}`);
  if (!state.question || state.current_q >= state.total_q) {
    showGameResults(state.players);
    return;
  }
  const q = state.question;
  const pct = (state.current_q / state.total_q) * 100;
  $("game-progress").style.width = pct + "%";
  $("game-q-num").textContent = `Question ${state.current_q + 1} of ${state.total_q}`;
  $("game-q-text").textContent = q.question;
  $("game-explanation").classList.add("hidden");
  $("game-next").classList.add("hidden");
  updateScoreboard(state.players);

  const labels = ["A","B","C","D"];
  $("game-choices").innerHTML = q.choices.map((c, i) => `
    <button class="choice-btn" data-answer="${esc(c)}">
      <div class="choice-label">${labels[i]}</div>${esc(c)}
    </button>`).join("");

  $("game-choices").querySelectorAll(".choice-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      $("game-choices").querySelectorAll(".choice-btn").forEach(b => b.disabled = true);
      const data = await api("/api/room/answer", {method:"POST", body:{
        code: myRoomCode, player_name: myPlayerName, answer: btn.dataset.answer
      }});
      btn.classList.add(data.correct ? "correct" : "wrong");
      updateScoreboard(data.scores);
      const expBox = $("game-explanation");
      expBox.className = data.correct ? "explanation-box" : "explanation-box wrong-exp";
      expBox.classList.remove("hidden");
      expBox.textContent = data.explanation;
      $("game-next").classList.remove("hidden");
      $("game-next").onclick = loadGameQuestion;
    });
  });
}

function updateScoreboard(players) {
  $("scoreboard").innerHTML = Object.entries(players)
    .sort((a,b) => b[1]-a[1])
    .map(([name, pts]) => `<div style="background:${name===myPlayerName?'#eef2ff':'#f8fafc'};padding:6px 12px;border-radius:8px;font-size:0.85rem;font-weight:600">
      ${name===myPlayerName?'⭐ ':''} ${esc(name)}: ${pts}
    </div>`).join("");
}

// ── XP & Levels ───────────────────────────────────────────────────────────────
const LEVELS = [
  {min:0,    name:"Beginner",  emoji:"🌱", label:"BEGINNER"},
  {min:100,  name:"Explorer",  emoji:"🔍", label:"EXPLORER"},
  {min:300,  name:"Learner",   emoji:"📚", label:"LEARNER"},
  {min:600,  name:"Scholar",   emoji:"🎓", label:"SCHOLAR"},
  {min:1000, name:"Expert",    emoji:"⭐", label:"EXPERT"},
  {min:1500, name:"Master",    emoji:"🏆", label:"MASTER"},
  {min:2500, name:"Legend",    emoji:"👑", label:"LEGEND"},
];

function getLevel(xp) {
  let lvl = LEVELS[0], nextXp = LEVELS[1].min;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      lvl = LEVELS[i];
      nextXp = LEVELS[i+1]?.min || LEVELS[i].min + 1000;
      break;
    }
  }
  return { ...lvl, next: nextXp, pct: Math.min(100, Math.round((xp - lvl.min) / (nextXp - lvl.min) * 100)) };
}

async function loadXpBar() {
  try {
    const user = await api("/auth/me");
    if (!user) return;
    updateXpBar(user.xp || 0);
    $("xp-section")?.style && ($("xp-section").style.display = "block");
  } catch {}
}

function updateXpBar(xp) {
  const lvl = getLevel(xp);
  const section = $("xp-section");
  if (!section) return;
  section.style.display = "block";
  $("xp-level").textContent = LEVELS.indexOf(lvl) + 1;
  $("xp-level-name").textContent = `${lvl.emoji} ${lvl.name}`;
  $("level-badge").textContent = `${lvl.emoji} ${lvl.label}`;
  $("xp-current").textContent = xp;
  $("xp-next").textContent = lvl.next - xp;
  const fill = $("xp-bar-fill");
  if (fill) { setTimeout(() => fill.style.width = lvl.pct + "%", 50); }
}

function showXpPopup(text, anchorEl) {
  const popup = document.createElement("div");
  popup.className = "xp-popup";
  popup.textContent = text;
  const rect = anchorEl?.getBoundingClientRect() || {left: window.innerWidth/2, top: window.innerHeight/2};
  popup.style.left = (rect.left + rect.width/2 - 30) + "px";
  popup.style.top = (rect.top + window.scrollY - 10) + "px";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1700);
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function loadLeaderboard() {
  try {
    const board = await api("/api/leaderboard");
    const list = $("leaderboard-list");
    if (!list || !board.length) return;
    const medals = ["🥇","🥈","🥉"];
    list.innerHTML = board.map((p, i) => `
      <div class="leaderboard-row">
        <span class="lb-rank">${medals[i] || `${i+1}.`}</span>
        <span class="lb-name">${esc(p.name.split(" ")[0])} ${p.streak > 2 ? "🔥" : ""}</span>
        <span class="lb-xp">${p.xp || 0} XP</span>
      </div>`).join("");
  } catch {}
}

// ── Daily Study Plan ──────────────────────────────────────────────────────────
async function loadDailyPlan() {
  try {
    const data = await api("/api/daily-plan");
    if (!data.plan) return;
    const card = $("daily-plan-card");
    const text = $("daily-plan-text");
    if (card && text) {
      text.innerHTML = mdToHtml(data.plan);
      card.style.display = "block";
      // Wire read-aloud button if present
      const readBtn = card.querySelector(".plan-read-btn");
      if (readBtn) readBtn.onclick = () => speak(data.plan);
    }
  } catch {}
}

// ── Dark Mode ─────────────────────────────────────────────────────────────────
function setupDarkMode() {
  const stored = localStorage.getItem("bp_dark");
  // If user hasn't set a preference, follow the OS
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  if (stored === "1" || (stored === null && prefersDark)) {
    document.body.classList.add("dark");
  }
  document.getElementById("sb-dark")?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("bp_dark", document.body.classList.contains("dark") ? "1" : "0");
  });
}

function showGameResults(players) {
  $("game-section").classList.add("hidden");
  $("results-section").classList.remove("hidden");
  const sorted = Object.entries(players).sort((a,b) => b[1]-a[1]);
  const medals = ["🥇","🥈","🥉"];
  $("final-scores").innerHTML = sorted.map(([name, pts], i) =>
    `<div class="card" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-weight:700">${medals[i]||"  "} ${esc(name)}</span>
      <span style="font-size:1.2rem;font-weight:800;color:var(--primary)">${pts} pts</span>
    </div>`
  ).join("");
}

// ── Daily Challenge ───────────────────────────────────────────────────────────
async function loadDailyChallenge() {
  try {
    const data = await api("/api/daily-challenge");
    const card = $("daily-challenge-card");
    if (!card) return;
    if (data.done) return; // already answered today — hide the card, no clutter
    card.style.display = "block";
    if (data.challenge_streak > 0) {
      $("dc-streak").textContent = `🔥 ${data.challenge_streak} day streak`;
    }
    $("dc-question").textContent = data.question;
    $("dc-choices").innerHTML = data.choices.map(c =>
      `<button class="btn btn-outline dc-choice" style="text-align:left;padding:10px 14px;font-size:0.88rem" data-choice="${esc(c)}">${esc(c)}</button>`
    ).join("");
    $("dc-choices").querySelectorAll(".dc-choice").forEach(btn => {
      btn.addEventListener("click", async () => {
        $("dc-choices").querySelectorAll(".dc-choice").forEach(b => b.disabled = true);
        const correct = btn.dataset.choice === data.answer;
        const resultEl = $("dc-result");
        resultEl.classList.remove("hidden");
        try {
          const res = await api("/api/daily-challenge/submit", {method:"POST", body:{
            question_id: data.id || "daily",
            student_answer: btn.dataset.choice,
            correct_answer: data.answer,
            question_text: data.question,
            subject: data.subject || "general"
          }});
          if (res.detail) throw new Error(res.detail); // 401 fallthrough
          resultEl.style.background = res.correct ? "#d1fae5" : "#fee2e2";
          resultEl.style.color = res.correct ? "#065f46" : "#991b1b";
          resultEl.innerHTML = `${res.correct ? "✅ Correct!" : "❌ Not quite."} +${res.xp_earned} XP<br><small>${res.explanation || ""}</small>`;
          if (res.xp_earned) showXpPopup(`+${res.xp_earned} XP`, resultEl);
        } catch {
          resultEl.style.background = correct ? "#d1fae5" : "#fee2e2";
          resultEl.style.color = correct ? "#065f46" : "#991b1b";
          resultEl.innerHTML = `${correct ? "✅ Correct!" : "❌ Not quite."}<br><small>Sign in to save your progress and earn XP!</small>`;
        }
        const card2 = $("daily-challenge-card");
        if (card2) setTimeout(() => { card2.style.transition="opacity 0.6s"; card2.style.opacity="0"; setTimeout(()=>card2.style.display="none",600); }, 4000);
      });
    });
  } catch {}
}

// ── Weekly Quests ─────────────────────────────────────────────────────────────
const QUESTS = [
  { id: "q50", label: "Answer 50 questions", emoji: "📝", target: 50, xp: 50, metric: "questions" },
  { id: "q3streak", label: "3-day study streak", emoji: "🔥", target: 3, xp: 30, metric: "streak" },
  { id: "q3sub", label: "Study 3 different subjects", emoji: "📚", target: 3, xp: 40, metric: "subjects" },
  { id: "qflash", label: "Complete a flashcard deck", emoji: "📇", target: 1, xp: 20, metric: "flashcards" },
  { id: "qperfect", label: "Get a perfect quiz score", emoji: "⭐", target: 1, xp: 75, metric: "perfect" },
];

function getQuestProgress() {
  const week = new Date().getFullYear() + "-W" + String(getISOWeek(new Date())).padStart(2,"0");
  try {
    const saved = JSON.parse(localStorage.getItem("bp_quests") || "{}");
    if (saved.week !== week) return { week, questions: 0, streak: 0, subjects: [], flashcards: 0, perfect: 0, claimed: [] };
    return saved;
  } catch { return { week, questions: 0, streak: 0, subjects: [], flashcards: 0, perfect: 0, claimed: [] }; }
}
function saveQuestProgress(p) { localStorage.setItem("bp_quests", JSON.stringify(p)); }
function updateQuestMetric(metric, value) {
  const p = getQuestProgress();
  if (metric === "subjects") { if (!p.subjects.includes(value)) p.subjects.push(value); }
  else if (metric === "questions") p.questions = (p.questions||0) + value;
  else if (metric === "flashcards") p.flashcards = (p.flashcards||0) + value;
  else if (metric === "perfect") p.perfect = (p.perfect||0) + value;
  saveQuestProgress(p);
}

function loadWeeklyQuests() {
  const el = $("weekly-quests");
  if (!el) return;
  const p = getQuestProgress();
  const user = (() => { try { return JSON.parse(localStorage.getItem("bp_user")||"null"); } catch { return null; } })();
  p.streak = user?.streak || 0;
  el.innerHTML = QUESTS.map(q => {
    const current = q.metric === "subjects" ? (p.subjects||[]).length
                  : q.metric === "streak" ? Math.min(p.streak||0, q.target)
                  : p[q.metric] || 0;
    const done = current >= q.target;
    const claimed = (p.claimed||[]).includes(q.id);
    const pct = Math.min(100, Math.round(current/q.target*100));
    return `<div class="quest-item ${done && !claimed ? 'quest-ready' : ''}" data-id="${q.id}" style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:1.1rem;width:22px;text-align:center">${q.emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:0.82rem;font-weight:700;${claimed?'opacity:0.4':''}white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${q.label}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
          <div style="flex:1;background:var(--border);border-radius:6px;height:4px">
            <div style="background:${done?'var(--success)':'var(--primary)'};width:${pct}%;height:4px;border-radius:6px;transition:width 0.4s"></div>
          </div>
          <div style="font-size:0.7rem;color:var(--muted);white-space:nowrap">${current}/${q.target}</div>
        </div>
      </div>
      ${done && !claimed ? `<button class="btn btn-success quest-claim" data-qid="${q.id}" style="padding:4px 10px;font-size:0.75rem">+${q.xp}XP</button>` : ''}
      ${claimed ? '<span style="color:var(--success);font-size:0.9rem">✅</span>' : ''}
    </div>`;
  }).join("");
  el.querySelectorAll(".quest-claim").forEach(btn => {
    btn.addEventListener("click", async () => {
      const qid = btn.dataset.qid;
      const quest = QUESTS.find(q => q.id === qid);
      if (!quest) return;
      const p2 = getQuestProgress();
      if (!(p2.claimed||[]).includes(qid)) {
        p2.claimed = [...(p2.claimed||[]), qid];
        saveQuestProgress(p2);
        try { await api("/api/xp/add", {method:"POST", body:{amount: quest.xp}}); } catch {}
        showXpPopup(`+${quest.xp} XP`, btn);
        loadWeeklyQuests();
      }
    });
  });
}

// ── Install Prompt ────────────────────────────────────────────────────────────
function initInstallPrompt() {
  // Already installed
  if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) return;

  // Dismissed recently (7 days)
  const dismissed = localStorage.getItem('bp_install_dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 3600 * 1000) return;

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);

  function dismiss() {
    localStorage.setItem('bp_install_dismissed', Date.now().toString());
    document.getElementById('install-banner')?.remove();
  }

  if (isIOS) {
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <div class="install-icon">🗽</div>
      <div class="install-text">
        <div class="install-title">Add BoroPrep to Home Screen</div>
        <div class="install-sub">Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> for the full app experience</div>
      </div>
      <button class="install-close" id="install-close">✕</button>`;
    document.body.appendChild(banner);
    document.getElementById('install-close').onclick = dismiss;
  }

  // Android/Chrome: listen for native prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'install-banner';
    banner.innerHTML = `
      <div class="install-icon">🗽</div>
      <div class="install-text">
        <div class="install-title">Install BoroPrep</div>
        <div class="install-sub">Study offline, faster — like a real app!</div>
      </div>
      <button class="install-btn" id="install-btn">Install</button>
      <button class="install-close" id="install-close">✕</button>`;
    document.body.appendChild(banner);
    document.getElementById('install-btn').onclick = async () => {
      await e.prompt();
      dismiss();
    };
    document.getElementById('install-close').onclick = dismiss;
  });
}

// ── Exam Date Setter ──────────────────────────────────────────────────────────
async function loadExamDateSetter() {
  const saveBtn = $("save-exam-date-btn");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", async () => {
    const subject = $("exam-subject-pick")?.value;
    const date = $("exam-date-pick")?.value;
    if (!subject || !date) return;
    try {
      await api("/api/exam-dates", {method:"POST", body:{subject, exam_date: date}});
      $("exam-subject-pick").value = "";
      $("exam-date-pick").value = "";
      const setter = $("exam-date-setter");
      if (setter) setter.style.display = "none";
      const toggle = $("add-exam-toggle");
      if (toggle) toggle.textContent = "+ Add Date";
      await loadExamCountdown();
    } catch { alert("Please sign in to save exam dates."); }
  });
}

