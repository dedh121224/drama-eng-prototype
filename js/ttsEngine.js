(function (global) {
  "use strict";

  var TOKEN_REGEX = /\{\{([^|{}]+)\|([^|{}]+)\|([^|{}]+)\}\}/g;

  var synth = typeof global !== "undefined" && global.speechSynthesis ? global.speechSynthesis : null;
  var isSupported = Boolean(synth && typeof global.SpeechSynthesisUtterance !== "undefined");

  var cachedVoices = [];
  var voiceListeners = [];
  var sessionId = 0;
  var activeUtterance = null;
  var activeTimer = null;
  var shadowingInterval = null;

  var playbackState = {
    isPlaying: false,
    isPaused: false,
    lineIndex: 0,
    shadowing: false,
    loopLineIndex: null
  };

  function clamp(num, min, max) {
    return Math.min(max, Math.max(min, num));
  }

  function stripParens(text) {
    return String(text || "").replace(/[（）()]/g, "").trim();
  }

  function parseLineSegments(text) {
    var input = String(text || "");
    var segments = [];
    var lastIndex = 0;
    var match;

    TOKEN_REGEX.lastIndex = 0;
    while ((match = TOKEN_REGEX.exec(input)) !== null) {
      if (match.index > lastIndex) {
        var before = input.slice(lastIndex, match.index);
        if (before.trim().length > 0) {
          segments.push({ type: "zh", text: before });
        }
      }
      var enText = match[1].trim();
      var glossText = match[2].trim();
      var vocabId = match[3].trim();
      segments.push({ type: "en", text: enText, vocabId: vocabId });
      segments.push({ type: "gloss", text: glossText, vocabId: vocabId });
      lastIndex = TOKEN_REGEX.lastIndex;
    }

    if (lastIndex < input.length) {
      var tail = input.slice(lastIndex);
      if (tail.trim().length > 0) {
        segments.push({ type: "zh", text: tail });
      }
    }

    return segments;
  }

  function normalizeLang(lang) {
    return String(lang || "").replace("_", "-").toLowerCase();
  }

  function scoreVoice(voice, targetGroup) {
    var lang = normalizeLang(voice.lang);
    var name = voice.name || "";
    var score = 0;

    if (targetGroup === "zh") {
      if (lang === "zh-tw") score += 100;
      else if (lang.indexOf("zh-hant") === 0) score += 85;
      else if (lang.indexOf("zh") === 0) score += 40;
      else return -1;

      if (/HsiaoChen/i.test(name)) score += 60;
      if (/YunJhe/i.test(name)) score += 58;
      if (/Google 國語/i.test(name)) score += 55;
      if (/Meijia/i.test(name)) score += 52;
      if (/Yating|Zhiwei/i.test(name)) score += 48;
      if (/Natural/i.test(name)) score += 25;
      if (/Online/i.test(name)) score += 10;
    } else {
      if (lang === "en-us") score += 100;
      else if (lang.indexOf("en-gb") === 0 || lang.indexOf("en-au") === 0) score += 70;
      else if (lang.indexOf("en") === 0) score += 50;
      else return -1;

      if (/Google US English/i.test(name)) score += 60;
      if (/Aria|Jenny|Guy/i.test(name)) score += 56;
      if (/Samantha/i.test(name)) score += 52;
      if (/Natural/i.test(name)) score += 25;
      if (/Online/i.test(name)) score += 10;
    }

    if (voice.localService) score += 3;
    return score;
  }

  function refreshVoices() {
    if (!isSupported) return [];
    var raw = synth.getVoices() || [];
    if (raw.length > 0) {
      cachedVoices = raw.slice();
      voiceListeners.forEach(function (fn) {
        try {
          fn(getAvailableVoices());
        } catch (_err) {}
      });
    }
    return cachedVoices;
  }

  function getAvailableVoices() {
    var all = cachedVoices.length ? cachedVoices : (isSupported ? synth.getVoices() || [] : []);
    var zhVoices = all
      .map(function (v) {
        return { voice: v, score: scoreVoice(v, "zh") };
      })
      .filter(function (item) {
        return item.score >= 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .map(function (item) {
        return item.voice;
      });

    var enVoices = all
      .map(function (v) {
        return { voice: v, score: scoreVoice(v, "en") };
      })
      .filter(function (item) {
        return item.score >= 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .map(function (item) {
        return item.voice;
      });

    return {
      all: all,
      zhVoices: zhVoices,
      enVoices: enVoices
    };
  }

  function inferVoiceGender(voice) {
    var name = (voice && voice.name) || "";
    if (/YunJhe|Zhiwei|Guy|Daniel|Andrew|Brian|David|Mark|Ryan|Male|男/i.test(name)) {
      return "male";
    }
    if (/HsiaoChen|Yating|Meijia|Aria|Jenny|Samantha|Ava|Emma|Zira|Michelle|Female|女/i.test(name)) {
      return "female";
    }
    return "unknown";
  }

  function pickVoiceForSpeaker(langType, speakerObj, settings) {
    var pool = getAvailableVoices();
    var candidates = langType === "zh" ? pool.zhVoices : pool.enVoices;
    if (!candidates.length) return null;

    var customURI = langType === "zh" ? (settings && settings.zhVoiceURI) : (settings && settings.enVoiceURI);
    if (customURI) {
      for (var i = 0; i < candidates.length; i += 1) {
        if (candidates[i].voiceURI === customURI) {
          return candidates[i];
        }
      }
    }

    var targetGender = speakerObj && speakerObj.gender;
    if (targetGender && targetGender !== "neutral" && candidates.length > 1) {
      var sameRegion = candidates.filter(function (v) {
        var norm = normalizeLang(v.lang);
        return langType === "zh" ? norm === "zh-tw" : norm === "en-us";
      });
      var searchList = sameRegion.length ? sameRegion : candidates;
      for (var j = 0; j < searchList.length; j += 1) {
        if (inferVoiceGender(searchList[j]) === targetGender) {
          return searchList[j];
        }
      }
    }

    return candidates[0];
  }

  function initVoiceDiscovery(onChange) {
    if (typeof onChange === "function") {
      voiceListeners.push(onChange);
    }
    if (!isSupported) return;
    refreshVoices();
    if ("onvoiceschanged" in synth) {
      synth.onvoiceschanged = refreshVoices;
    }
    global.setTimeout(refreshVoices, 300);
    global.setTimeout(refreshVoices, 1000);
  }

  function clearTimers() {
    if (activeTimer !== null) {
      global.clearTimeout(activeTimer);
      activeTimer = null;
    }
    if (shadowingInterval !== null) {
      global.clearInterval(shadowingInterval);
      shadowingInterval = null;
    }
  }

  function emitState(callbacks) {
    if (callbacks && typeof callbacks.onPlaybackStateChange === "function") {
      callbacks.onPlaybackStateChange(Object.assign({}, playbackState));
    }
  }

  function stop(callbacks) {
    sessionId += 1;
    clearTimers();
    activeUtterance = null;
    if (isSupported) {
      try {
        synth.cancel();
      } catch (_err) {}
    }
    playbackState.isPlaying = false;
    playbackState.isPaused = false;
    playbackState.shadowing = false;
    playbackState.loopLineIndex = null;
    emitState(callbacks);
  }

  function pause(callbacks) {
    if (!playbackState.isPlaying) return;
    sessionId += 1;
    clearTimers();
    activeUtterance = null;
    if (isSupported) {
      try {
        synth.cancel();
      } catch (_err) {}
    }
    playbackState.isPlaying = false;
    playbackState.isPaused = true;
    playbackState.shadowing = false;
    emitState(callbacks);
  }

  function speakUtteranceNow(text, lang, voice, rate, pitch, mySession, onDone, onFail) {
    if (!isSupported || mySession !== sessionId) return;
    var cleanText = String(text || "").trim();
    if (!cleanText) {
      onDone();
      return;
    }

    var utt = new global.SpeechSynthesisUtterance(cleanText);
    utt.lang = lang;
    if (voice) {
      utt.voice = voice;
    }
    utt.rate = clamp(rate || 1.0, 0.5, 1.8);
    utt.pitch = clamp(pitch || 1.0, 0.6, 1.5);

    var settled = false;
    function finish(isError, errEvent) {
      if (settled) return;
      settled = true;
      if (activeUtterance === utt) {
        activeUtterance = null;
      }
      if (mySession !== sessionId) return;
      if (isError) {
        if (typeof onFail === "function") onFail(errEvent);
        else onDone();
      } else {
        onDone();
      }
    }

    utt.onend = function () {
      finish(false);
    };
    utt.onerror = function (ev) {
      var errCode = ev && ev.error ? ev.error : "";
      if (errCode === "interrupted" || errCode === "canceled") {
        if (mySession !== sessionId) return;
      }
      finish(true, ev);
    };

    activeUtterance = utt;
    try {
      synth.speak(utt);
    } catch (err) {
      finish(true, err);
    }
  }

  function buildSingleTrackText(segments, settings) {
    var parts = [];
    for (var i = 0; i < segments.length; i += 1) {
      var seg = segments[i];
      if (seg.type === "zh") {
        parts.push(seg.text.trim());
      } else if (seg.type === "en") {
        parts.push(seg.text);
        if (settings && settings.repeatEn) {
          parts.push("，" + seg.text);
        }
      } else if (seg.type === "gloss" && settings && settings.readGloss) {
        var cleanGloss = stripParens(seg.text);
        if (cleanGloss) {
          parts.push("，" + cleanGloss + "，");
        }
      }
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  function scheduleAction(wasActive, fn, mySession) {
    if (!wasActive) {
      fn();
      return;
    }
    activeTimer = global.setTimeout(function () {
      activeTimer = null;
      if (mySession !== sessionId) return;
      fn();
    }, 45);
  }

  function playLineSequence(episode, castMap, startIndex, options) {
    var opts = options || {};
    var singleLineOnly = Boolean(opts.singleLineOnly);
    var loopThisLine = Boolean(opts.loopThisLine);
    var getSettings = typeof opts.getSettings === "function" ? opts.getSettings : function () {
      return opts.settings || {};
    };
    var callbacks = opts.callbacks || {};

    if (!isSupported) {
      if (typeof callbacks.onError === "function") {
        callbacks.onError("此瀏覽器不支援 Web Speech API 語音朗讀，請改用新版 Chrome、Edge 或 Safari。");
      }
      return;
    }

    var wasActive = Boolean(synth.speaking || synth.pending);
    sessionId += 1;
    var mySession = sessionId;
    clearTimers();
    activeUtterance = null;
    if (wasActive) {
      try {
        synth.cancel();
      } catch (_err) {}
    }

    var lines = episode && Array.isArray(episode.lines) ? episode.lines : [];
    if (!lines.length) return;

    var currentIndex = clamp(startIndex || 0, 0, lines.length - 1);
    playbackState.isPlaying = true;
    playbackState.isPaused = false;
    playbackState.lineIndex = currentIndex;
    playbackState.shadowing = false;
    playbackState.loopLineIndex = loopThisLine ? currentIndex : null;
    emitState(callbacks);

    function runLine(idx) {
      if (mySession !== sessionId) return;
      if (idx >= lines.length) {
        playbackState.isPlaying = false;
        playbackState.isPaused = false;
        playbackState.shadowing = false;
        playbackState.loopLineIndex = null;
        emitState(callbacks);
        if (typeof callbacks.onEpisodeEnd === "function") {
          callbacks.onEpisodeEnd();
        }
        return;
      }

      var line = lines[idx];
      var speaker = (castMap && castMap[line.speaker]) || {
        id: line.speaker,
        name: line.speaker,
        gender: "neutral",
        pitch: 1.0,
        rate: 1.0
      };
      var settings = getSettings();
      var segments = parseLineSegments(line.text);

      playbackState.lineIndex = idx;
      playbackState.shadowing = false;
      emitState(callbacks);

      if (typeof callbacks.onLineStart === "function") {
        callbacks.onLineStart(idx, line, segments);
      }

      function afterLineFinished() {
        if (mySession !== sessionId) return;

        var liveSettings = getSettings();
        var enSegments = segments.filter(function (s) {
          return s.type === "en";
        });
        var targetEnText = enSegments.map(function (s) {
          return s.text;
        }).join(" / ");

        function proceedNext() {
          if (mySession !== sessionId) return;
          playbackState.shadowing = false;
          if (loopThisLine) {
            emitState(callbacks);
            activeTimer = global.setTimeout(function () {
              activeTimer = null;
              runLine(idx);
            }, 350);
            return;
          }
          if (singleLineOnly) {
            playbackState.isPlaying = false;
            playbackState.isPaused = false;
            emitState(callbacks);
            if (typeof callbacks.onSingleLineEnd === "function") {
              callbacks.onSingleLineEnd(idx);
            }
            return;
          }
          activeTimer = global.setTimeout(function () {
            activeTimer = null;
            runLine(idx + 1);
          }, 180);
        }

        if (liveSettings.shadowingPause && enSegments.length > 0 && !loopThisLine) {
          var remaining = Math.max(1, Number(liveSettings.shadowingSeconds) || 3);
          playbackState.shadowing = true;
          emitState(callbacks);
          if (typeof callbacks.onShadowingTick === "function") {
            callbacks.onShadowingTick(remaining, targetEnText, idx);
          }

          shadowingInterval = global.setInterval(function () {
            if (mySession !== sessionId) {
              clearTimers();
              return;
            }
            remaining -= 1;
            if (remaining <= 0) {
              global.clearInterval(shadowingInterval);
              shadowingInterval = null;
              if (typeof callbacks.onShadowingTick === "function") {
                callbacks.onShadowingTick(0, targetEnText, idx);
              }
              proceedNext();
            } else if (typeof callbacks.onShadowingTick === "function") {
              callbacks.onShadowingTick(remaining, targetEnText, idx);
            }
          }, 1000);
        } else {
          proceedNext();
        }
      }

      if (settings.ttsMode === "single") {
        var combined = buildSingleTrackText(segments, settings);
        if (typeof callbacks.onSegmentStart === "function") {
          callbacks.onSegmentStart(idx, -1, null);
        }
        var zhVoiceSingle = pickVoiceForSpeaker("zh", speaker, settings);
        var singleRate = (Number(settings.rate) || 1.0) * (speaker.rate || 1.0);
        speakUtteranceNow(
          combined,
          "zh-TW",
          zhVoiceSingle,
          singleRate,
          speaker.pitch || 1.0,
          mySession,
          afterLineFinished,
          function () {
            afterLineFinished();
          }
        );
        return;
      }

      var queue = [];
      segments.forEach(function (seg, segIdx) {
        if (seg.type === "zh") {
          queue.push({ segIdx: segIdx, seg: seg, text: seg.text.trim(), langType: "zh" });
        } else if (seg.type === "en") {
          queue.push({ segIdx: segIdx, seg: seg, text: seg.text, langType: "en", repeatPass: 1 });
          if (settings.repeatEn) {
            queue.push({ segIdx: segIdx, seg: seg, text: seg.text, langType: "en", repeatPass: 2, delayBefore: 250 });
          }
        } else if (seg.type === "gloss" && settings.readGloss) {
          var cleanGloss = stripParens(seg.text);
          if (cleanGloss) {
            queue.push({ segIdx: segIdx, seg: seg, text: cleanGloss, langType: "zh" });
          }
        }
      });

      function runQueueStep(qIdx) {
        if (mySession !== sessionId) return;
        if (qIdx >= queue.length) {
          afterLineFinished();
          return;
        }
        var item = queue[qIdx];
        var live = getSettings();

        function fireItem() {
          if (mySession !== sessionId) return;
          if (typeof callbacks.onSegmentStart === "function") {
            callbacks.onSegmentStart(idx, item.segIdx, item.seg);
          }
          var voice = pickVoiceForSpeaker(item.langType, speaker, live);
          var langTag = item.langType === "zh" ? "zh-TW" : "en-US";
          var itemRate =
            item.langType === "zh"
              ? (Number(live.rate) || 1.0) * (speaker.rate || 1.0)
              : Number(live.enRate) || 0.92;

          speakUtteranceNow(
            item.text,
            langTag,
            voice,
            itemRate,
            speaker.pitch || 1.0,
            mySession,
            function () {
              runQueueStep(qIdx + 1);
            },
            function () {
              runQueueStep(qIdx + 1);
            }
          );
        }

        if (item.delayBefore) {
          activeTimer = global.setTimeout(function () {
            activeTimer = null;
            fireItem();
          }, item.delayBefore);
        } else {
          fireItem();
        }
      }

      runQueueStep(0);
    }

    scheduleAction(wasActive, function () {
      runLine(currentIndex);
    }, mySession);
  }

  function speakPhrase(text, lang, rateOverride, options) {
    var opts = options || {};
    if (!isSupported) {
      if (typeof opts.onError === "function") {
        opts.onError("此瀏覽器不支援語音播放。");
      }
      return;
    }

    var wasActive = Boolean(synth.speaking || synth.pending);
    sessionId += 1;
    var mySession = sessionId;
    clearTimers();
    activeUtterance = null;
    if (wasActive) {
      try {
        synth.cancel();
      } catch (_err) {}
    }

    playbackState.isPlaying = false;
    playbackState.isPaused = false;
    playbackState.shadowing = false;
    playbackState.loopLineIndex = null;
    if (opts.callbacks) {
      emitState(opts.callbacks);
    }

    var langType = normalizeLang(lang).indexOf("zh") === 0 ? "zh" : "en";
    var langTag = langType === "zh" ? "zh-TW" : "en-US";
    var voice = pickVoiceForSpeaker(langType, opts.speaker || null, opts.settings || {});
    var rate = rateOverride || (langType === "zh" ? 1.0 : 0.92);

    scheduleAction(wasActive, function () {
      speakUtteranceNow(
        text,
        langTag,
        voice,
        rate,
        opts.pitch || 1.0,
        mySession,
        function () {
          if (typeof opts.onEnd === "function") opts.onEnd();
        },
        function (err) {
          if (typeof opts.onError === "function") opts.onError(err);
        }
      );
    }, mySession);
  }

  function speakPreviewLine(rawText, speakerObj, settings, callbacks) {
    var mockEpisode = {
      id: "_preview",
      lines: [
        {
          id: "_preview_line",
          speaker: (speakerObj && speakerObj.id) || "mina",
          text: rawText
        }
      ]
    };
    var castMap = {};
    if (speakerObj && speakerObj.id) {
      castMap[speakerObj.id] = speakerObj;
    }
    playLineSequence(mockEpisode, castMap, 0, {
      singleLineOnly: true,
      settings: settings,
      callbacks: callbacks || {}
    });
  }

  function speakVocabSequence(vocabList, settings, callbacks) {
    if (!isSupported || !Array.isArray(vocabList) || !vocabList.length) return;
    var mockLines = vocabList.map(function (v, idx) {
      return {
        id: "vocab_seq_" + idx,
        speaker: "mina",
        text: "{{" + v.en + "|" + v.zh + "|" + v.id + "}}"
      };
    });
    var mockEpisode = { id: "_vocab_seq", lines: mockLines };
    var castMap = {
      mina: { id: "mina", name: "示範", gender: "female", pitch: 1.04, rate: 1.0 }
    };
    playLineSequence(mockEpisode, castMap, 0, {
      singleLineOnly: false,
      settings: Object.assign({}, settings, { shadowingPause: false, readGloss: true }),
      callbacks: callbacks || {}
    });
  }

  function getPlaybackState() {
    return Object.assign({}, playbackState);
  }

  global.DramaTTS = {
    isSupported: isSupported,
    parseLineSegments: parseLineSegments,
    initVoiceDiscovery: initVoiceDiscovery,
    getAvailableVoices: getAvailableVoices,
    playLineSequence: playLineSequence,
    speakPhrase: speakPhrase,
    speakPreviewLine: speakPreviewLine,
    speakVocabSequence: speakVocabSequence,
    pause: pause,
    stop: stop,
    getPlaybackState: getPlaybackState
  };
})(window);
