// Topic → YouTube video ID map
// Format: "subject:topic" → "youtubeVideoId"
const TOPIC_VIDEOS = {
  // Chemistry
  "chemistry:Atomic Structure":    "W3Vc9AZoBKY",  // Khan Academy: Atomic structure
  "chemistry:Periodic Table":      "0RRVV4Diomg",  // CrashCourse: Periodic table
  "chemistry:Bonding":             "QXT4DISME6E",  // Khan Academy: Chemical bonds
  "chemistry:Acids and Bases":     "mrmcnDXEJDE",  // Khan Academy: Acids and bases
  "chemistry:Redox":               "5OFkDiZm0ak",  // Khan Academy: Redox reactions
  "chemistry:Nuclear Chemistry":   "KWAsz59F8gA",  // CrashCourse: Nuclear chemistry
  "chemistry:Stoichiometry":       "SjQG3rKSZUQ",  // Khan Academy: Stoichiometry
  "chemistry:Gas Laws":            "BY9PYa99KiY",  // Khan Academy: Gas laws
  "chemistry:Organic Chemistry":   "Y0buGMdh_yo",  // CrashCourse: Organic chemistry

  // Biology
  "biology:Cell Biology":          "URUJD5NEXC8",  // CrashCourse: Cells
  "biology:Photosynthesis":        "sQK3Yr4Sc_k",  // Khan Academy: Photosynthesis
  "biology:Genetics":              "CBezq1fFUEA",  // CrashCourse: Genetics
  "biology:Evolution":             "GhHOjC4oxh8",  // CrashCourse: Natural selection
  "biology:Ecology":               "oqSiAM8wHrU",  // CrashCourse: Ecology
  "biology:Human Body":            "Ae4MadKPJhg",  // CrashCourse: Circulatory system

  // Algebra I
  "algebra1:Linear Equations":     "9DxrF6Ttws4",  // Khan Academy: Linear equations
  "algebra1:Systems of Equations": "nok99JOhcjo",  // Khan Academy: Systems
  "algebra1:Quadratics":           "i7idZfS8t8w",  // Khan Academy: Quadratics
  "algebra1:Exponents":            "kITJ6qH7jS0",  // Khan Academy: Exponents
  "algebra1:Statistics":           "uhxtUt_-GyM",  // Khan Academy: Mean/median/mode

  // Geometry
  "geometry:Circles":              "tL7zMFLsm30",  // Khan Academy: Circle equations
  "geometry:Triangles":            "D5ahjKAggws",  // Khan Academy: Triangle angles
  "geometry:Pythagorean Theorem":  "AA6RfgP-AHU",  // Khan Academy: Pythagorean theorem
  "geometry:Area":                 "AXEGMEeiqGo",  // Khan Academy: Circle area
  "geometry:Transformations":      "D8dsGEpShV4",  // Khan Academy: Transformations

  // US History
  "history:Civil War":             "AB4rMFEHBLo",  // CrashCourse: Civil War
  "history:Constitution":          "oVF1GcWMhoA",  // CrashCourse: Constitution
  "history:Industrialization":     "r4Tse9oU6Do",  // CrashCourse: Industrial Revolution
  "history:WWI":                   "Cd2ch4XV84s",  // CrashCourse: WWI
  "history:Great Depression":      "gsIHCE7sYj0",  // CrashCourse: Great Depression
  "history:Civil Rights":          "iKlOPBaSmCQ",  // CrashCourse: Civil Rights
  "history:Cold War":              "I79TpDe3t2g",  // CrashCourse: Cold War

  // Physics
  "physics:Motion":                "ZM8ECpBuQYE",  // Khan Academy: Speed & velocity
  "physics:Forces":                "ou9YMWlJgkE",  // Khan Academy: Newton's laws
  "physics:Energy":                "w4QFJb9a6jo",  // Khan Academy: Kinetic energy
  "physics:Waves":                 "WuFGXbqGbBE",  // Khan Academy: Waves
  "physics:Electricity":           "J4Vq-xHqUo8",  // Khan Academy: Ohm's law
  "physics:Gravity":               "-LgBgNf8Nzk",  // Khan Academy: Gravity

  // Earth Science
  "earthscience:Plate Tectonics":  "kwfNGatxUJI",  // CrashCourse: Plate tectonics
  "earthscience:Rocks":            "wIGSZHqbFnE",  // CrashCourse: Rock cycle
  "earthscience:Weather":          "7S7LabSPmDs",  // CrashCourse: Weather
  "earthscience:Solar System":     "TKM0P3XlMNA",  // CrashCourse: Solar system
  "earthscience:Water Cycle":      "al-do-HGuIk",  // Khan Academy: Water cycle

  // Global History
  "global:Ancient Civilizations":  "Ll-eoEFa_k8",  // CrashCourse: Ancient Mesopotamia
  "global:Middle Ages":            "aNhEzwuqeWA",  // CrashCourse: Medieval Europe
  "global:Renaissance":            "Vufba_ZcoR0",  // CrashCourse: Renaissance
  "global:Imperialism":            "Mun1dKkc_As",  // CrashCourse: Imperialism
  "global:WWI":                    "Cd2ch4XV84s",  // CrashCourse: WWI
  "global:WWII":                   "Q78COTwT7nE",  // CrashCourse: WWII
  "global:Cold War":               "I79TpDe3t2g",  // CrashCourse: Cold War

  // English
  "english:Literary Devices":      "294wkA8MR6Q",  // Literary devices explained
  "english:Writing":               "HxXTEAk8QE4",  // How to write a thesis
  "english:Reading Comprehension": "aGMmDM0JFuk",  // Main idea strategy
};

function getVideoForTopic(subject, topic) {
  return TOPIC_VIDEOS[`${subject}:${topic}`] || null;
}

function renderVideoEmbed(videoId, topicLabel) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(topicLabel + " Regents review")}`;
  const uid = videoId.replace(/[^a-zA-Z0-9]/g, "");
  return `<div class="video-embed" id="vwrap-${uid}">
    <div class="video-label">📺 Watch: ${topicLabel}</div>
    <iframe
      id="vframe-${uid}"
      src="https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1"
      allowfullscreen loading="lazy"
    ></iframe>
    <a href="${searchUrl}" target="_blank" class="vid-search-link" id="vsearch-${uid}" style="display:none;margin-top:8px;font-size:0.83rem;color:var(--primary);text-decoration:none">
      🔍 Search YouTube for "${topicLabel}"
    </a>
    <a href="${searchUrl}" target="_blank" class="vid-search-link-always" style="display:block;margin-top:6px;font-size:0.78rem;color:var(--muted);text-decoration:none">
      ↗ Open on YouTube
    </a>
  </div>`;
}

// YouTube IFrame API — detect unavailable/blocked videos and show search fallback
(function() {
  if (window._ytApiLoaded) return;
  window._ytApiLoaded = true;
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
})();

window._ytPlayers = window._ytPlayers || {};
const _origYTReady = window.onYouTubeIframeAPIReady;
window.onYouTubeIframeAPIReady = function() {
  if (_origYTReady) _origYTReady();
  document.querySelectorAll("iframe[id^='vframe-']").forEach(iframe => {
    const uid = iframe.id.replace("vframe-", "");
    window._ytPlayers[uid] = new YT.Player(iframe.id, {
      events: {
        onError: function() {
          const frame = document.getElementById("vframe-" + uid);
          const fallback = document.getElementById("vsearch-" + uid);
          if (frame) frame.style.display = "none";
          if (fallback) fallback.style.display = "block";
        }
      }
    });
  });
};

// Re-init players when new embeds are injected into the DOM
function initNewVideoPlayers() {
  if (typeof YT === "undefined" || !YT.Player) return;
  document.querySelectorAll("iframe[id^='vframe-']").forEach(iframe => {
    const uid = iframe.id.replace("vframe-", "");
    if (window._ytPlayers[uid]) return;
    window._ytPlayers[uid] = new YT.Player(iframe.id, {
      events: {
        onError: function() {
          const frame = document.getElementById("vframe-" + uid);
          const fallback = document.getElementById("vsearch-" + uid);
          if (frame) frame.style.display = "none";
          if (fallback) fallback.style.display = "block";
        }
      }
    });
  });
}
