(function (global) {
  "use strict";

  var STORAGE_KEY = "dramatalk_state_v1";

  var DEFAULT_SETTINGS = {
    ttsMode: "dual",
    readGloss: true,
    repeatEn: false,
    shadowingPause: false,
    shadowingSeconds: 3,
    rate: 1.0,
    enRate: 0.92,
    captionMode: "bilingual",
    theme: "dark",
    zhVoiceURI: "",
    enVoiceURI: ""
  };

  function createDefaultState() {
    return {
      settings: Object.assign({}, DEFAULT_SETTINGS),
      bookmarks: [],
      practiced: [],
      quizBest: {},
      lastLineIndex: { ep01: 0 }
    };
  }

  function safeGetStorage() {
    try {
      return global.localStorage;
    } catch (_err) {
      return null;
    }
  }

  function mergeState(raw) {
    var base = createDefaultState();
    if (!raw || typeof raw !== "object") {
      return base;
    }
    if (raw.settings && typeof raw.settings === "object") {
      base.settings = Object.assign({}, DEFAULT_SETTINGS, raw.settings);
    }
    if (Array.isArray(raw.bookmarks)) {
      base.bookmarks = raw.bookmarks.filter(function (id) {
        return typeof id === "string";
      });
    }
    if (Array.isArray(raw.practiced)) {
      base.practiced = raw.practiced.filter(function (id) {
        return typeof id === "string";
      });
    }
    if (raw.quizBest && typeof raw.quizBest === "object") {
      base.quizBest = Object.assign({}, raw.quizBest);
    }
    if (raw.lastLineIndex && typeof raw.lastLineIndex === "object") {
      base.lastLineIndex = Object.assign({ ep01: 0 }, raw.lastLineIndex);
    }
    return base;
  }

  function load() {
    var storage = safeGetStorage();
    if (!storage) {
      return createDefaultState();
    }
    try {
      var rawText = storage.getItem(STORAGE_KEY);
      if (!rawText) {
        return createDefaultState();
      }
      return mergeState(JSON.parse(rawText));
    } catch (_err) {
      return createDefaultState();
    }
  }

  function persist(state) {
    var storage = safeGetStorage();
    if (!storage) {
      return false;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function save(partial) {
    var current = load();
    var next = mergeState(Object.assign({}, current, partial || {}));
    persist(next);
    return next;
  }

  function updateSettings(partial) {
    var current = load();
    var nextSettings = Object.assign({}, current.settings, partial || {});
    current.settings = nextSettings;
    persist(current);
    return current;
  }

  function toggleBookmark(vocabId) {
    var current = load();
    var idx = current.bookmarks.indexOf(vocabId);
    if (idx === -1) {
      current.bookmarks.push(vocabId);
    } else {
      current.bookmarks.splice(idx, 1);
    }
    persist(current);
    return current;
  }

  function markPracticed(vocabId) {
    var current = load();
    if (current.practiced.indexOf(vocabId) === -1) {
      current.practiced.push(vocabId);
      persist(current);
    }
    return current;
  }

  function saveLastLineIndex(epId, lineIndex) {
    var current = load();
    current.lastLineIndex[epId] = lineIndex;
    persist(current);
    return current;
  }

  function saveQuizScore(epId, score, total) {
    var current = load();
    var existing = current.quizBest[epId];
    var bestScore = existing && typeof existing.score === "number" ? existing.score : -1;
    if (score >= bestScore) {
      current.quizBest[epId] = {
        score: score,
        total: total,
        updatedAt: new Date().toISOString()
      };
      persist(current);
    }
    return current;
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(str) {
    var parsed = JSON.parse(str);
    var merged = mergeState(parsed);
    persist(merged);
    return merged;
  }

  function resetAll() {
    var fresh = createDefaultState();
    persist(fresh);
    return fresh;
  }

  global.DramaStorage = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    load: load,
    save: save,
    updateSettings: updateSettings,
    toggleBookmark: toggleBookmark,
    markPracticed: markPracticed,
    saveLastLineIndex: saveLastLineIndex,
    saveQuizScore: saveQuizScore,
    exportJSON: exportJSON,
    importJSON: importJSON,
    resetAll: resetAll
  };
})(window);
