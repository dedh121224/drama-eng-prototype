(function (global) {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var DATA = global.DRAMA_DATA;
    var Storage = global.DramaStorage;
    var TTS = global.DramaTTS;
    var SpeechPractice = global.DramaSpeechPractice;

    if (!DATA || !DATA.episodes || !DATA.episodes.length) {
      return;
    }

    var episode = DATA.episodes[0];
    var castMap = DATA.cast || {};
    var state = Storage.load();

    var uiState = {
      activeTab: "drama",
      currentLineIndex: Math.min(
        Math.max(0, (state.lastLineIndex && state.lastLineIndex[episode.id]) || 0),
        episode.lines.length - 1
      ),
      activeVocabId: episode.vocab[0] ? episode.vocab[0].id : null,
      vocabFilter: "all",
      vocabSequencePlaying: false,
      recordingVocabId: null,
      speechResults: {},
      quiz: {
        mode: "phrase",
        started: false,
        questions: [],
        index: 0,
        score: 0,
        answered: false,
        selectedId: null,
        wrongIds: []
      }
    };

    var els = {
      topbarSeriesName: document.getElementById("topbar-series-name"),
      topbarEpBadge: document.getElementById("topbar-ep-badge"),
      statBookmarks: document.getElementById("stat-bookmarks"),
      statPracticed: document.getElementById("stat-practiced"),
      btnThemeToggle: document.getElementById("btn-theme-toggle"),
      themeIcon: document.getElementById("theme-icon"),
      btnOpenSettings: document.getElementById("btn-open-settings"),
      tabButtons: document.querySelectorAll(".tab-btn"),
      tabViews: {
        drama: document.getElementById("view-drama"),
        vocab: document.getElementById("view-vocab"),
        quiz: document.getElementById("view-quiz")
      },
      ttsWarningBanner: document.getElementById("tts-warning-banner"),
      heroWorldview: document.getElementById("hero-worldview"),
      heroLevel: document.getElementById("hero-level"),
      heroDuration: document.getElementById("hero-duration"),
      heroTitle: document.getElementById("hero-title"),
      heroSynopsis: document.getElementById("hero-synopsis"),
      castChips: document.getElementById("cast-chips"),
      btnHeroPlay: document.getElementById("btn-hero-play"),
      heroPlayLabel: document.getElementById("hero-play-label"),
      captionButtons: document.querySelectorAll(".seg-btn[data-caption]"),
      captionHintText: document.getElementById("caption-hint-text"),
      dialogueList: document.getElementById("dialogue-list"),
      desktopSpotlightCard: document.getElementById("desktop-spotlight-card"),
      quickVocabList: document.getElementById("quick-vocab-list"),
      filterAll: document.getElementById("filter-all"),
      filterBookmarked: document.getElementById("filter-bookmarked"),
      btnPlayAllVocab: document.getElementById("btn-play-all-vocab"),
      speechSupportNote: document.getElementById("speech-support-note"),
      vocabGrid: document.getElementById("vocab-grid"),
      quizModeButtons: document.querySelectorAll(".quiz-mode-btn[data-qmode]"),
      quizBestBadge: document.getElementById("quiz-best-badge"),
      quizStage: document.getElementById("quiz-stage"),
      playerDock: document.getElementById("player-dock"),
      dockProgressTrack: document.getElementById("dock-progress-track"),
      dockProgressFill: document.getElementById("dock-progress-fill"),
      dockShadowingBar: document.getElementById("dock-shadowing-bar"),
      dockShadowingText: document.getElementById("dock-shadowing-text"),
      dockLineCounter: document.getElementById("dock-line-counter"),
      dockSpeakerNow: document.getElementById("dock-speaker-now"),
      btnPrevLine: document.getElementById("btn-prev-line"),
      btnPlayPause: document.getElementById("btn-play-pause"),
      btnNextLine: document.getElementById("btn-next-line"),
      btnReplayLine: document.getElementById("btn-replay-line"),
      btnCycleSpeed: document.getElementById("btn-cycle-speed"),
      dockSpeedLabel: document.getElementById("dock-speed-label"),
      btnToggleGloss: document.getElementById("btn-toggle-gloss"),
      btnToggleShadowing: document.getElementById("btn-toggle-shadowing"),
      btnToggleRepeatEn: document.getElementById("btn-toggle-repeat-en"),
      mobileSpotlightBackdrop: document.getElementById("mobile-spotlight-backdrop"),
      mobileSpotlightContent: document.getElementById("mobile-spotlight-content"),
      btnCloseSheet: document.getElementById("btn-close-sheet"),
      settingsModal: document.getElementById("settings-modal"),
      btnCloseSettings: document.getElementById("btn-close-settings"),
      ttsModeRadios: document.querySelectorAll('input[name="ttsMode"]'),
      selectZhVoice: document.getElementById("select-zh-voice"),
      selectEnVoice: document.getElementById("select-en-voice"),
      btnTestTts: document.getElementById("btn-test-tts"),
      rangeZhRate: document.getElementById("range-zh-rate"),
      valZhRate: document.getElementById("val-zh-rate"),
      rangeEnRate: document.getElementById("range-en-rate"),
      valEnRate: document.getElementById("val-en-rate"),
      shadowSecButtons: document.querySelectorAll(".shadow-sec-btn[data-sec]"),
      btnExportJson: document.getElementById("btn-export-json"),
      inputImportJson: document.getElementById("input-import-json"),
      btnResetProgress: document.getElementById("btn-reset-progress"),
      toastContainer: document.getElementById("toast-container")
    };

    function escapeHtml(str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function showToast(msg) {
      var node = document.createElement("div");
      node.className = "toast";
      node.textContent = msg;
      els.toastContainer.appendChild(node);
      global.setTimeout(function () {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }, 2600);
    }

    function findVocabById(vocabId) {
      for (var i = 0; i < episode.vocab.length; i += 1) {
        if (episode.vocab[i].id === vocabId) {
          return episode.vocab[i];
        }
      }
      return null;
    }

    function findFirstLineIndexForVocab(vocabId) {
      for (var i = 0; i < episode.lines.length; i += 1) {
        if (episode.lines[i].text.indexOf("|" + vocabId + "}}") !== -1) {
          return i;
        }
      }
      return 0;
    }

    function isBookmarked(vocabId) {
      return state.bookmarks.indexOf(vocabId) !== -1;
    }

    function isPracticed(vocabId) {
      return state.practiced.indexOf(vocabId) !== -1;
    }

    function getSettings() {
      return state.settings;
    }

    function applyTheme() {
      var theme = state.settings.theme === "light" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      els.themeIcon.textContent = theme === "light" ? "🌙" : "☀️";
      var metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute("content", theme === "light" ? "#f4f6fa" : "#0d1117");
      }
    }

    function updateStatsUI() {
      els.statBookmarks.textContent = String(state.bookmarks.length);
      els.statPracticed.textContent = String(state.practiced.length);
      els.filterBookmarked.textContent = "⭐ 待複習 (" + state.bookmarks.length + ")";
    }

    function syncCaptionUI() {
      var mode = state.settings.captionMode || "bilingual";
      els.dialogueList.setAttribute("data-caption-mode", mode);
      Array.prototype.forEach.call(els.captionButtons, function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-caption") === mode);
      });
      if (mode === "bilingual") {
        els.captionHintText.textContent =
          "目前為「雙語直聽」：顯示完整字幕並朗讀中文＋英文片語＋括弧中文，閉眼也能直接記憶。";
      } else if (mode === "hide-gloss") {
        els.captionHintText.textContent =
          "目前為「遮蔽中文」：括弧內中文釋義已模糊化，先聽英文猜意思，點擊模糊處可偷看。";
      } else {
        els.captionHintText.textContent =
          "目前為「盲聽字幕」：全句字幕已模糊遮蔽，挑戰純用耳朵聽懂劇情！點擊任一句可單獨顯示。";
      }
    }

    function syncDockAndSettingsUI() {
      var s = state.settings;
      var pb = TTS.getPlaybackState();
      var totalLines = episode.lines.length;
      var displayLine = Math.min(uiState.currentLineIndex + 1, totalLines);
      var lineObj = episode.lines[uiState.currentLineIndex];
      var speakerObj = lineObj && castMap[lineObj.speaker];

      els.dockLineCounter.textContent = "第 " + displayLine + " / " + totalLines + " 句";
      els.dockSpeakerNow.textContent =
        (pb.isPlaying ? "正在播放：" : "目前位置：") + (speakerObj ? speakerObj.name : "旁白");

      var pct = totalLines > 0 ? (displayLine / totalLines) * 100 : 0;
      els.dockProgressFill.style.width = pct.toFixed(1) + "%";

      els.btnPlayPause.textContent = pb.isPlaying ? "⏸" : "▶";
      var ctaIcon = els.btnHeroPlay.querySelector(".cta-icon");
      if (ctaIcon) ctaIcon.textContent = pb.isPlaying ? "⏸" : "▶";
      if (pb.isPlaying) {
        els.heroPlayLabel.textContent = "暫停聽劇";
      } else if (uiState.currentLineIndex > 0) {
        els.heroPlayLabel.textContent =
          "從第 " + displayLine + " 句繼續聽" + (s.readGloss ? "（含中文釋義）" : "（純劇情）");
      } else {
        els.heroPlayLabel.textContent =
          "開始聽劇" + (s.readGloss ? "（含中文釋義）" : "（不唸括弧中文）");
      }

      els.dockSpeedLabel.textContent = Number(s.rate || 1).toFixed(2).replace(/\.00$/, ".0") + "x";
      els.btnToggleGloss.classList.toggle("active", Boolean(s.readGloss));
      els.btnToggleShadowing.classList.toggle("active", Boolean(s.shadowingPause));
      els.btnToggleRepeatEn.classList.toggle("active", Boolean(s.repeatEn));

      if (!pb.shadowing) {
        els.dockShadowingBar.classList.add("hidden");
      }

      Array.prototype.forEach.call(els.ttsModeRadios, function (radio) {
        radio.checked = radio.value === s.ttsMode;
      });
      els.rangeZhRate.value = String(s.rate);
      els.valZhRate.textContent = Number(s.rate).toFixed(2) + "x";
      els.rangeEnRate.value = String(s.enRate);
      els.valEnRate.textContent = Number(s.enRate).toFixed(2) + "x";
      Array.prototype.forEach.call(els.shadowSecButtons, function (btn) {
        btn.classList.toggle("active", Number(btn.getAttribute("data-sec")) === Number(s.shadowingSeconds));
      });
    }

    function clearActiveSpeakingHighlights() {
      var activeCards = els.dialogueList.querySelectorAll(".line-card.active-line");
      Array.prototype.forEach.call(activeCards, function (el) {
        el.classList.remove("active-line");
      });
      var speakingSegs = els.dialogueList.querySelectorAll(".speaking");
      Array.prototype.forEach.call(speakingSegs, function (el) {
        el.classList.remove("speaking");
      });
      var shadowPrompts = els.dialogueList.querySelectorAll(".line-shadowing-prompt");
      Array.prototype.forEach.call(shadowPrompts, function (el) {
        el.classList.add("hidden");
      });
    }

    function highlightLineAndSegment(lineIdx, segIdx) {
      clearActiveSpeakingHighlights();
      var card = els.dialogueList.querySelector('.line-card[data-line-index="' + lineIdx + '"]');
      if (!card) return;
      card.classList.add("active-line");
      if (typeof segIdx === "number" && segIdx >= 0) {
        var segEl = card.querySelector('[data-seg-idx="' + segIdx + '"]');
        if (segEl) {
          segEl.classList.add("speaking");
        }
      }
    }

    function buildSpeechResultHTML(vocabId) {
      var res = uiState.speechResults[vocabId];
      if (!res) return "";
      if (res.status === "listening") {
        return '<div class="speech-feedback-pill retry">🎙️ 聆聽中，請唸出片語...</div>';
      }
      if (res.status === "error") {
        return '<div class="speech-feedback-pill error">⚠️ ' + escapeHtml(res.message) + "</div>";
      }
      var cls = res.passed ? "pass" : "retry";
      var prefix = res.passed ? "✅ 發音很清楚！" : "💪 再試一次：";
      var heardText = res.transcript ? "辨識到：「" + escapeHtml(res.transcript) + "」" : "未辨識到完整單字";
      return (
        '<div class="speech-feedback-pill ' +
        cls +
        '">' +
        prefix +
        "（準確度 " +
        res.score +
        "%）" +
        heardText +
        "</div>"
      );
    }

    function buildSpotlightHTML(vocab) {
      if (!vocab) {
        return '<div class="spotlight-eyebrow">焦點片語卡</div><p>點擊任一個英文片語即可查看發音與口說訣竅。</p>';
      }
      var bookmarked = isBookmarked(vocab.id);
      var isRec = uiState.recordingVocabId === vocab.id;
      return (
        '<div class="spotlight-eyebrow">焦點片語卡・' +
        escapeHtml(vocab.pos) +
        "</div>" +
        '<div class="spotlight-en-row">' +
        '<div><h3 class="spotlight-en">' +
        escapeHtml(vocab.en) +
        '</h3><div class="spotlight-phonetic">' +
        escapeHtml(vocab.phonetic) +
        "</div></div>" +
        '<button type="button" class="chip-btn ' +
        (bookmarked ? "active" : "") +
        '" data-action="bookmark" data-vocab-id="' +
        escapeHtml(vocab.id) +
        '">' +
        (bookmarked ? "★ 已收藏" : "☆ 收藏") +
        "</button></div>" +
        '<div class="spotlight-zh">' +
        escapeHtml(vocab.zh) +
        "</div>" +
        '<div class="spotlight-tip-box"><strong>🇹🇼 台灣人要注意：</strong>' +
        escapeHtml(vocab.tip) +
        "</div>" +
        '<div class="spotlight-example-box">' +
        '<p class="spotlight-example-en">' +
        escapeHtml(vocab.example) +
        "</p>" +
        '<p class="spotlight-example-zh">' +
        escapeHtml(vocab.exampleZh) +
        "</p>" +
        "</div>" +
        '<div class="spotlight-actions">' +
        '<button type="button" class="secondary-play-btn" data-action="speak-en" data-vocab-id="' +
        escapeHtml(vocab.id) +
        '">🔊 唸片語</button>' +
        '<button type="button" class="chip-btn" data-action="speak-example" data-vocab-id="' +
        escapeHtml(vocab.id) +
        '">🔊 聽例句</button>' +
        '<button type="button" class="chip-btn ' +
        (isRec ? "recording" : "") +
        '" data-action="mic-check" data-vocab-id="' +
        escapeHtml(vocab.id) +
        '">' +
        (isRec ? "🎙️ 錄音中..." : "🎤 跟讀試唸") +
        "</button>" +
        "</div>" +
        buildSpeechResultHTML(vocab.id)
      );
    }

    function renderSpotlight() {
      var vocab = findVocabById(uiState.activeVocabId) || episode.vocab[0];
      var html = buildSpotlightHTML(vocab);
      els.desktopSpotlightCard.innerHTML = html;
      els.mobileSpotlightContent.innerHTML = html;
      renderQuickVocabChips();
    }

    function renderQuickVocabChips() {
      els.quickVocabList.innerHTML = episode.vocab
        .map(function (v) {
          var activeCls = v.id === uiState.activeVocabId ? " active" : "";
          var bmCls = isBookmarked(v.id) ? " bookmarked" : "";
          return (
            '<button type="button" class="vocab-mini-chip' +
            activeCls +
            bmCls +
            '" data-vocab-id="' +
            escapeHtml(v.id) +
            '">' +
            escapeHtml(v.en) +
            "</button>"
          );
        })
        .join("");
    }

    function renderHeroAndCast() {
      els.topbarSeriesName.textContent = DATA.series.title;
      els.topbarEpBadge.textContent = "EP0" + episode.number;
      els.heroWorldview.textContent = DATA.series.worldview;
      els.heroLevel.textContent = episode.level;
      els.heroDuration.textContent = episode.duration;
      els.heroTitle.textContent = episode.title;
      els.heroSynopsis.textContent = episode.synopsis;

      els.castChips.innerHTML = Object.keys(castMap)
        .filter(function (key) {
          return key !== "narrator";
        })
        .map(function (key) {
          var c = castMap[key];
          return (
            '<div class="cast-chip">' +
            '<span class="cast-avatar" style="background:' +
            escapeHtml(c.color) +
            '">' +
            escapeHtml(c.badge) +
            "</span>" +
            "<strong>" +
            escapeHtml(c.name) +
            "</strong>" +
            '<span class="cast-role">' +
            escapeHtml(c.role) +
            "</span></div>"
          );
        })
        .join("");
    }

    function renderDialogueFeed() {
      var pb = TTS.getPlaybackState();
      els.dialogueList.innerHTML = episode.lines
        .map(function (line, lineIdx) {
          var speaker = castMap[line.speaker] || {
            id: line.speaker,
            name: line.speaker,
            badge: "?",
            color: "#94a3b8"
          };
          var isNarrator = line.speaker === "narrator";
          var segments = TTS.parseLineSegments(line.text);
          var isLooping = pb.isPlaying && pb.loopLineIndex === lineIdx;
          var isCurrent = lineIdx === uiState.currentLineIndex;

          var bodyHtml = segments
            .map(function (seg, segIdx) {
              if (seg.type === "zh") {
                return (
                  '<span class="seg-zh" data-seg-idx="' +
                  segIdx +
                  '">' +
                  escapeHtml(seg.text) +
                  "</span>"
                );
              }
              if (seg.type === "en") {
                return (
                  '<button type="button" class="seg-en" data-seg-idx="' +
                  segIdx +
                  '" data-vocab-id="' +
                  escapeHtml(seg.vocabId) +
                  '">🔊 ' +
                  escapeHtml(seg.text) +
                  "</button>"
                );
              }
              return (
                '<span class="seg-gloss" data-seg-idx="' +
                segIdx +
                '" data-vocab-id="' +
                escapeHtml(seg.vocabId) +
                '">（' +
                escapeHtml(seg.text) +
                "）</span>"
              );
            })
            .join("");

          return (
            '<article class="line-card ' +
            (isNarrator ? "narrator" : "character") +
            (isCurrent && pb.isPlaying ? " active-line" : "") +
            '" data-line-index="' +
            lineIdx +
            '" style="--speaker-color:' +
            escapeHtml(speaker.color) +
            '">' +
            '<div class="line-header">' +
            '<div class="speaker-meta">' +
            '<span class="speaker-badge" style="background:' +
            escapeHtml(speaker.color) +
            '">' +
            escapeHtml(speaker.badge) +
            "</span>" +
            '<span class="speaker-name">' +
            escapeHtml(speaker.name) +
            "</span>" +
            (line.emotion
              ? '<span class="line-emotion">' + escapeHtml(line.emotion) + "</span>"
              : "") +
            "</div>" +
            '<div class="line-actions">' +
            '<button type="button" class="line-mini-btn" data-line-action="play" data-line-index="' +
            lineIdx +
            '" title="從這句開始播放">▶</button>' +
            '<button type="button" class="line-mini-btn' +
            (isLooping ? " active-loop" : "") +
            '" data-line-action="loop" data-line-index="' +
            lineIdx +
            '" title="單句循環複讀">🔁</button>' +
            "</div>" +
            "</div>" +
            '<div class="line-body">' +
            bodyHtml +
            "</div>" +
            '<div class="line-shadowing-prompt hidden" data-shadow-line="' +
            lineIdx +
            '"></div>' +
            "</article>"
          );
        })
        .join("");
    }

    function renderVocabGrid() {
      var list = episode.vocab.filter(function (v) {
        if (uiState.vocabFilter === "bookmarked") {
          return isBookmarked(v.id);
        }
        return true;
      });

      els.filterAll.classList.toggle("active", uiState.vocabFilter === "all");
      els.filterBookmarked.classList.toggle("active", uiState.vocabFilter === "bookmarked");
      els.btnPlayAllVocab.innerHTML = uiState.vocabSequencePlaying
        ? "<span>⏹ 停止連續播放</span>"
        : "<span>▶ 連續聽全部片語</span>";

      if (SpeechPractice.isSupported) {
        els.speechSupportNote.textContent =
          "💡 點擊「🎤 跟讀試唸」可透過瀏覽器麥克風即時檢測英文發音是否清楚（建議用 Chrome / Edge）。";
      } else {
        els.speechSupportNote.textContent =
          "ℹ️ 目前瀏覽器不支援即時麥克風語音辨識，仍可正常聽發音、看連音訣竅與收藏單字。";
      }

      if (!list.length) {
        els.vocabGrid.innerHTML =
          '<div class="empty-state">尚未收藏任何片語！在劇情或清單中點擊「☆ 收藏」，就能集中複習不熟的片語。</div>';
        return;
      }

      els.vocabGrid.innerHTML = list
        .map(function (v) {
          var bookmarked = isBookmarked(v.id);
          var practiced = isPracticed(v.id);
          var isRec = uiState.recordingVocabId === v.id;
          return (
            '<article class="vocab-card" data-vocab-card="' +
            escapeHtml(v.id) +
            '">' +
            '<div class="vocab-card-head">' +
            '<div><h3 class="vocab-en-title">' +
            escapeHtml(v.en) +
            '</h3><div class="vocab-meta-line">' +
            escapeHtml(v.pos) +
            " · " +
            escapeHtml(v.phonetic) +
            (practiced ? " · ✅ 已練習" : "") +
            "</div></div>" +
            '<button type="button" class="chip-btn ' +
            (bookmarked ? "active" : "") +
            '" data-action="bookmark" data-vocab-id="' +
            escapeHtml(v.id) +
            '">' +
            (bookmarked ? "★" : "☆") +
            "</button></div>" +
            '<div class="vocab-zh-meaning">' +
            escapeHtml(v.zh) +
            "</div>" +
            '<p class="vocab-tip-text">🇹🇼 ' +
            escapeHtml(v.tip) +
            "</p>" +
            '<div class="vocab-example-block"><strong>' +
            escapeHtml(v.example) +
            "</strong><span>" +
            escapeHtml(v.exampleZh) +
            "</span></div>" +
            '<div class="vocab-card-actions">' +
            '<button type="button" class="secondary-play-btn" data-action="speak-en" data-vocab-id="' +
            escapeHtml(v.id) +
            '">🔊 片語</button>' +
            '<button type="button" class="chip-btn" data-action="speak-example" data-vocab-id="' +
            escapeHtml(v.id) +
            '">🔊 例句</button>' +
            '<button type="button" class="chip-btn ' +
            (isRec ? "recording" : "") +
            '" data-action="mic-check" data-vocab-id="' +
            escapeHtml(v.id) +
            '">' +
            (isRec ? "🎙️ 錄音中" : "🎤 跟讀") +
            "</button>" +
            '<button type="button" class="chip-btn" data-action="jump-drama" data-vocab-id="' +
            escapeHtml(v.id) +
            '">🎬 回劇情</button>' +
            "</div>" +
            buildSpeechResultHTML(v.id) +
            "</article>"
          );
        })
        .join("");
    }

    function createPlaybackCallbacks() {
      return {
        onPlaybackStateChange: function (pb) {
          if (typeof pb.lineIndex === "number") {
            uiState.currentLineIndex = pb.lineIndex;
          }
          if (!pb.isPlaying) {
            var loops = els.dialogueList.querySelectorAll(".active-loop");
            Array.prototype.forEach.call(loops, function (el) {
              el.classList.remove("active-loop");
            });
            if (!pb.isPaused) {
              clearActiveSpeakingHighlights();
            }
          }
          syncDockAndSettingsUI();
        },
        onLineStart: function (lineIdx, line, segments) {
          uiState.currentLineIndex = lineIdx;
          Storage.saveLastLineIndex(episode.id, lineIdx);
          highlightLineAndSegment(lineIdx, -1);

          var pb = TTS.getPlaybackState();
          var cards = els.dialogueList.querySelectorAll(".line-card");
          Array.prototype.forEach.call(cards, function (c, i) {
            var loopBtn = c.querySelector('[data-line-action="loop"]');
            if (loopBtn) {
              loopBtn.classList.toggle("active-loop", pb.loopLineIndex === i);
            }
          });

          var firstEn = segments.filter(function (s) {
            return s.type === "en";
          })[0];
          if (firstEn && firstEn.vocabId) {
            uiState.activeVocabId = firstEn.vocabId;
            renderSpotlight();
          }

          var card = els.dialogueList.querySelector('.line-card[data-line-index="' + lineIdx + '"]');
          if (card && uiState.activeTab === "drama") {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          syncDockAndSettingsUI();
        },
        onSegmentStart: function (lineIdx, segIdx, seg) {
          highlightLineAndSegment(lineIdx, segIdx);
          if (seg && seg.vocabId) {
            uiState.activeVocabId = seg.vocabId;
            renderSpotlight();
          }
        },
        onShadowingTick: function (remainingSec, targetEnText, lineIdx) {
          var promptEl = els.dialogueList.querySelector('[data-shadow-line="' + lineIdx + '"]');
          if (remainingSec > 0) {
            var msg = "🗣️ 換你開口唸：「" + targetEnText + "」(" + remainingSec + "s)";
            els.dockShadowingBar.classList.remove("hidden");
            els.dockShadowingText.textContent = msg;
            if (promptEl) {
              promptEl.textContent = msg;
              promptEl.classList.remove("hidden");
            }
          } else {
            els.dockShadowingBar.classList.add("hidden");
            if (promptEl) {
              promptEl.classList.add("hidden");
            }
          }
        },
        onEpisodeEnd: function () {
          clearActiveSpeakingHighlights();
          showToast("🎉 EP01 聽劇完成！可以切換「遮蔽中文」或去「聽力測驗」驗收記憶成果。");
        },
        onError: function (msg) {
          showToast(msg);
        }
      };
    }

    function stopAllAudio() {
      uiState.vocabSequencePlaying = false;
      TTS.stop(createPlaybackCallbacks());
      renderVocabGrid();
    }

    function playDramaFrom(lineIndex, opts) {
      uiState.vocabSequencePlaying = false;
      var o = opts || {};
      TTS.playLineSequence(episode, castMap, lineIndex, {
        singleLineOnly: Boolean(o.singleLineOnly),
        loopThisLine: Boolean(o.loopThisLine),
        getSettings: getSettings,
        callbacks: createPlaybackCallbacks()
      });
    }

    function handleVocabAction(action, vocabId) {
      var vocab = findVocabById(vocabId);
      if (!vocab) return;

      if (action === "bookmark") {
        state = Storage.toggleBookmark(vocabId);
        updateStatsUI();
        renderSpotlight();
        renderVocabGrid();
        showToast(isBookmarked(vocabId) ? "⭐ 已加入待複習清單" : "已從待複習移除");
        return;
      }

      if (action === "speak-en") {
        uiState.vocabSequencePlaying = false;
        state = Storage.markPracticed(vocabId);
        updateStatsUI();
        TTS.speakPhrase(vocab.en, "en-US", state.settings.enRate, {
          settings: state.settings,
          callbacks: createPlaybackCallbacks()
        });
        return;
      }

      if (action === "speak-example") {
        uiState.vocabSequencePlaying = false;
        state = Storage.markPracticed(vocabId);
        updateStatsUI();
        TTS.speakPhrase(vocab.example, "en-US", state.settings.enRate, {
          settings: state.settings,
          callbacks: createPlaybackCallbacks()
        });
        return;
      }

      if (action === "mic-check") {
        stopAllAudio();
        uiState.recordingVocabId = vocabId;
        uiState.speechResults[vocabId] = { status: "listening" };
        renderSpotlight();
        renderVocabGrid();

        SpeechPractice.listenAndEvaluate(vocab.en, {
          onResult: function (res) {
            uiState.speechResults[vocabId] = {
              status: "done",
              transcript: res.transcript,
              score: res.score,
              passed: res.passed
            };
            if (res.passed) {
              state = Storage.markPracticed(vocabId);
              updateStatsUI();
            }
          },
          onError: function (msg) {
            uiState.speechResults[vocabId] = {
              status: "error",
              message: msg
            };
          },
          onNoResult: function () {
            if (uiState.speechResults[vocabId] && uiState.speechResults[vocabId].status === "listening") {
              uiState.speechResults[vocabId] = {
                status: "error",
                message: "沒有偵測到語音，請再試一次。"
              };
            }
          },
          onEnd: function () {
            uiState.recordingVocabId = null;
            renderSpotlight();
            renderVocabGrid();
          }
        });
        return;
      }

      if (action === "jump-drama") {
        var lineIdx = findFirstLineIndexForVocab(vocabId);
        switchTab("drama");
        uiState.currentLineIndex = lineIdx;
        uiState.activeVocabId = vocabId;
        renderSpotlight();
        syncDockAndSettingsUI();
        var card = els.dialogueList.querySelector('.line-card[data-line-index="' + lineIdx + '"]');
        if (card) {
          clearActiveSpeakingHighlights();
          card.classList.add("active-line");
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }

    function openMobileSpotlight(vocabId) {
      uiState.activeVocabId = vocabId;
      renderSpotlight();
      if (global.innerWidth < 920) {
        els.mobileSpotlightBackdrop.classList.remove("hidden");
      }
    }

    /* QUIZ ENGINE */
    function shuffleArray(arr) {
      var copy = arr.slice();
      for (var i = copy.length - 1; i > 0; i -= 1) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
      }
      return copy;
    }

    function buildQuizQuestions(vocabIdsSubset) {
      var pool = vocabIdsSubset && vocabIdsSubset.length
        ? episode.vocab.filter(function (v) {
            return vocabIdsSubset.indexOf(v.id) !== -1;
          })
        : episode.vocab.slice();

      var shuffledPool = shuffleArray(pool);
      return shuffledPool.map(function (target) {
        var distractors = shuffleArray(
          episode.vocab.filter(function (v) {
            return v.id !== target.id;
          })
        ).slice(0, 3);
        var options = shuffleArray([target].concat(distractors));
        var lineIdx = findFirstLineIndexForVocab(target.id);
        return {
          vocab: target,
          options: options,
          line: episode.lines[lineIdx]
        };
      });
    }

    function playCurrentQuizAudio(slow) {
      var q = uiState.quiz.questions[uiState.quiz.index];
      if (!q) return;
      var s = state.settings;
      if (uiState.quiz.mode === "sentence" && q.line) {
        var spk = castMap[q.line.speaker] || castMap.mina;
        var quizSettings = Object.assign({}, s, {
          readGloss: false,
          shadowingPause: false,
          repeatEn: false,
          rate: slow ? 0.78 : s.rate,
          enRate: slow ? 0.72 : s.enRate
        });
        TTS.speakPreviewLine(q.line.text, spk, quizSettings, {});
      } else {
        TTS.speakPhrase(q.vocab.en, "en-US", slow ? 0.72 : s.enRate, {
          settings: s
        });
      }
    }

    function startQuiz(vocabIdsSubset, autoPlay) {
      stopAllAudio();
      uiState.quiz.started = true;
      uiState.quiz.questions = buildQuizQuestions(vocabIdsSubset);
      uiState.quiz.index = 0;
      uiState.quiz.score = 0;
      uiState.quiz.answered = false;
      uiState.quiz.selectedId = null;
      uiState.quiz.wrongIds = [];
      renderQuizStage();
      if (autoPlay) {
        playCurrentQuizAudio(false);
      }
    }

    function renderQuizBestBadge() {
      var best = state.quizBest && state.quizBest[episode.id];
      if (best) {
        els.quizBestBadge.textContent = "最高紀錄：" + best.score + " / " + best.total + " 題";
      } else {
        els.quizBestBadge.textContent = "最高紀錄：尚未測驗";
      }
    }

    function renderQuizStage() {
      Array.prototype.forEach.call(els.quizModeButtons, function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-qmode") === uiState.quiz.mode);
      });
      renderQuizBestBadge();

      var qState = uiState.quiz;
      if (!qState.started) {
        els.quizStage.innerHTML =
          '<div class="quiz-card quiz-summary">' +
          "<h3>準備好驗收這集聽力了嗎？</h3>" +
          '<p class="quiz-desc">共 ' +
          episode.vocab.length +
          " 題。系統會先播放語音，不顯示英文文字，考驗耳朵直覺反應！</p>" +
          '<div class="quiz-summary-actions">' +
          '<button type="button" class="cta-play-btn" id="btn-start-quiz">▶ 開始聽力測驗（自動發音）</button>' +
          "</div></div>";
        return;
      }

      if (qState.index >= qState.questions.length) {
        var total = qState.questions.length;
        state = Storage.saveQuizScore(episode.id, qState.score, total);
        renderQuizBestBadge();
        var wrongBtn = qState.wrongIds.length
          ? '<button type="button" class="secondary-play-btn" id="btn-retry-wrong">🔁 只重練錯題（' +
            qState.wrongIds.length +
            " 題）</button>"
          : "";
        els.quizStage.innerHTML =
          '<div class="quiz-card quiz-summary">' +
          "<h3>測驗完成！</h3>" +
          '<div class="quiz-score-big">' +
          qState.score +
          " / " +
          total +
          "</div>" +
          '<p class="quiz-desc">' +
          (qState.score === total
            ? "太強了！全對過關，這集片語已經內化進你的聽力反射！"
            : "很棒的練習！聽不熟的片語可以重練錯題或回劇情再聽一輪。") +
          "</p>" +
          '<div class="quiz-summary-actions">' +
          wrongBtn +
          '<button type="button" class="cta-play-btn" id="btn-restart-quiz">▶ 再測一次全部</button>' +
          "</div></div>";
        return;
      }

      var currentQ = qState.questions[qState.index];
      var pct = ((qState.index + (qState.answered ? 1 : 0)) / qState.questions.length) * 100;
      var promptText =
        qState.mode === "sentence"
          ? "🎧 聽一段劇情原句（已關閉中文提示），這句裡的英文片語是什麼意思？"
          : "🎧 聽一段英文片語發音，選出正確的中文意思：";

      var optionsHtml = currentQ.options
        .map(function (opt) {
          var cls = "quiz-option-btn";
          if (qState.answered) {
            if (opt.id === currentQ.vocab.id) cls += " correct";
            else if (opt.id === qState.selectedId) cls += " wrong";
          }
          return (
            '<button type="button" class="' +
            cls +
            '" data-quiz-opt="' +
            escapeHtml(opt.id) +
            '" ' +
            (qState.answered ? "disabled" : "") +
            ">" +
            escapeHtml(opt.zh) +
            "</button>"
          );
        })
        .join("");

      var explanationHtml = "";
      if (qState.answered) {
        var isRight = qState.selectedId === currentQ.vocab.id;
        explanationHtml =
          '<div class="quiz-explanation">' +
          "<h4>" +
          (isRight ? "✅ 答對了！" : "❌ 正解是：") +
          " " +
          escapeHtml(currentQ.vocab.en) +
          " <small>(" +
          escapeHtml(currentQ.vocab.phonetic) +
          ")</small></h4>" +
          "<p><strong>中文：</strong>" +
          escapeHtml(currentQ.vocab.zh) +
          "</p>" +
          "<p><strong>口說小撇步：</strong>" +
          escapeHtml(currentQ.vocab.tip) +
          "</p>" +
          '<div class="quiz-next-row" style="justify-content:space-between;align-items:center;">' +
          '<button type="button" class="chip-btn" id="btn-quiz-play-example">🔊 聽純英文例句</button>' +
          '<button type="button" class="cta-play-btn" id="btn-quiz-next">' +
          (qState.index + 1 >= qState.questions.length ? "查看成績 🏁" : "下一題 ➔") +
          "</button></div></div>";
      }

      els.quizStage.innerHTML =
        '<div class="quiz-card">' +
        '<div class="quiz-progress-row"><span>第 ' +
        (qState.index + 1) +
        " / " +
        qState.questions.length +
        " 題</span><span>目前得分：" +
        qState.score +
        "</span></div>" +
        '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' +
        pct.toFixed(1) +
        '%"></div></div>' +
        '<div class="quiz-audio-box">' +
        '<p class="quiz-prompt-label">' +
        promptText +
        "</p>" +
        '<div class="quiz-audio-btns">' +
        '<button type="button" class="secondary-play-btn" id="btn-quiz-replay">🔊 再聽一次</button>' +
        '<button type="button" class="chip-btn" id="btn-quiz-slow">🐢 慢速播放</button>' +
        "</div></div>" +
        '<div class="quiz-options">' +
        optionsHtml +
        "</div>" +
        explanationHtml +
        "</div>";
    }

    function populateVoiceSelects() {
      var pool = TTS.getAvailableVoices();
      var zhHTML = ['<option value="">自動挑選最佳台灣語音（依角色微調）</option>'];
      pool.zhVoices.forEach(function (v) {
        zhHTML.push(
          '<option value="' +
            escapeHtml(v.voiceURI) +
            '">' +
            escapeHtml(v.name + " (" + v.lang + ")") +
            "</option>"
        );
      });
      els.selectZhVoice.innerHTML = zhHTML.join("");
      els.selectZhVoice.value = state.settings.zhVoiceURI || "";

      var enHTML = ['<option value="">自動挑選最佳美式發音（依角色微調）</option>'];
      pool.enVoices.forEach(function (v) {
        enHTML.push(
          '<option value="' +
            escapeHtml(v.voiceURI) +
            '">' +
            escapeHtml(v.name + " (" + v.lang + ")") +
            "</option>"
        );
      });
      els.selectEnVoice.innerHTML = enHTML.join("");
      els.selectEnVoice.value = state.settings.enVoiceURI || "";
    }

    function switchTab(tabName) {
      uiState.activeTab = tabName;
      Array.prototype.forEach.call(els.tabButtons, function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
      });
      Object.keys(els.tabViews).forEach(function (key) {
        var el = els.tabViews[key];
        var active = key === tabName;
        el.classList.toggle("active", active);
        el.classList.toggle("hidden", !active);
      });
      els.playerDock.classList.toggle("hidden", tabName !== "drama");

      if (tabName === "vocab") {
        renderVocabGrid();
      } else if (tabName === "quiz") {
        renderQuizStage();
      }
    }

    /* EVENT BINDINGS */
    Array.prototype.forEach.call(els.tabButtons, function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.getAttribute("data-tab"));
      });
    });

    els.btnThemeToggle.addEventListener("click", function () {
      var nextTheme = state.settings.theme === "light" ? "dark" : "light";
      state = Storage.updateSettings({ theme: nextTheme });
      applyTheme();
    });

    els.btnOpenSettings.addEventListener("click", function () {
      populateVoiceSelects();
      syncDockAndSettingsUI();
      els.settingsModal.classList.remove("hidden");
    });

    els.btnCloseSettings.addEventListener("click", function () {
      els.settingsModal.classList.add("hidden");
    });

    els.settingsModal.addEventListener("click", function (ev) {
      if (ev.target === els.settingsModal) {
        els.settingsModal.classList.add("hidden");
      }
    });

    els.btnCloseSheet.addEventListener("click", function () {
      els.mobileSpotlightBackdrop.classList.add("hidden");
    });

    els.mobileSpotlightBackdrop.addEventListener("click", function (ev) {
      if (ev.target === els.mobileSpotlightBackdrop) {
        els.mobileSpotlightBackdrop.classList.add("hidden");
      }
    });

    function togglePlayPauseDrama() {
      var pb = TTS.getPlaybackState();
      if (pb.isPlaying) {
        TTS.pause(createPlaybackCallbacks());
      } else {
        playDramaFrom(uiState.currentLineIndex);
      }
    }

    els.btnHeroPlay.addEventListener("click", togglePlayPauseDrama);
    els.btnPlayPause.addEventListener("click", togglePlayPauseDrama);

    els.btnPrevLine.addEventListener("click", function () {
      var prev = Math.max(0, uiState.currentLineIndex - 1);
      uiState.currentLineIndex = prev;
      Storage.saveLastLineIndex(episode.id, prev);
      if (TTS.getPlaybackState().isPlaying) {
        playDramaFrom(prev);
      } else {
        highlightLineAndSegment(prev, -1);
        syncDockAndSettingsUI();
      }
    });

    els.btnNextLine.addEventListener("click", function () {
      var next = Math.min(episode.lines.length - 1, uiState.currentLineIndex + 1);
      uiState.currentLineIndex = next;
      Storage.saveLastLineIndex(episode.id, next);
      if (TTS.getPlaybackState().isPlaying) {
        playDramaFrom(next);
      } else {
        highlightLineAndSegment(next, -1);
        syncDockAndSettingsUI();
      }
    });

    els.btnReplayLine.addEventListener("click", function () {
      playDramaFrom(uiState.currentLineIndex, { singleLineOnly: true });
    });

    els.dockProgressTrack.addEventListener("click", function (ev) {
      var rect = els.dockProgressTrack.getBoundingClientRect();
      var ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      var targetIdx = Math.min(episode.lines.length - 1, Math.floor(ratio * episode.lines.length));
      uiState.currentLineIndex = targetIdx;
      Storage.saveLastLineIndex(episode.id, targetIdx);
      if (TTS.getPlaybackState().isPlaying) {
        playDramaFrom(targetIdx);
      } else {
        highlightLineAndSegment(targetIdx, -1);
        syncDockAndSettingsUI();
      }
    });

    els.btnCycleSpeed.addEventListener("click", function () {
      var speeds = [0.85, 1.0, 1.15];
      var current = Number(state.settings.rate) || 1.0;
      var next = speeds[0];
      for (var i = 0; i < speeds.length; i += 1) {
        if (current < speeds[i] - 0.02) {
          next = speeds[i];
          break;
        }
      }
      state = Storage.updateSettings({ rate: next });
      syncDockAndSettingsUI();
      showToast("整體語速：" + next + "x");
    });

    els.btnToggleGloss.addEventListener("click", function () {
      var nextVal = !state.settings.readGloss;
      state = Storage.updateSettings({ readGloss: nextVal });
      syncDockAndSettingsUI();
      showToast(nextVal ? "已開啟：整句含括弧中文都唸出" : "已關閉：僅唸劇情中文與英文片語");
    });

    els.btnToggleShadowing.addEventListener("click", function () {
      var nextVal = !state.settings.shadowingPause;
      state = Storage.updateSettings({ shadowingPause: nextVal });
      syncDockAndSettingsUI();
      showToast(
        nextVal
          ? "已開啟跟讀停頓（每句英文後停 " + state.settings.shadowingSeconds + " 秒）"
          : "已關閉跟讀停頓"
      );
    });

    els.btnToggleRepeatEn.addEventListener("click", function () {
      var nextVal = !state.settings.repeatEn;
      state = Storage.updateSettings({ repeatEn: nextVal });
      syncDockAndSettingsUI();
      showToast(nextVal ? "已開啟：英文片語連續唸兩遍" : "已關閉：英文片語唸一遍");
    });

    Array.prototype.forEach.call(els.captionButtons, function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-caption");
        var revealed = els.dialogueList.querySelectorAll(".revealed");
        Array.prototype.forEach.call(revealed, function (el) {
          el.classList.remove("revealed");
        });
        state = Storage.updateSettings({ captionMode: mode });
        syncCaptionUI();
      });
    });

    els.dialogueList.addEventListener("click", function (ev) {
      var lineActionBtn = ev.target.closest("[data-line-action]");
      if (lineActionBtn) {
        var act = lineActionBtn.getAttribute("data-line-action");
        var idx = Number(lineActionBtn.getAttribute("data-line-index"));
        if (act === "play") {
          playDramaFrom(idx);
        } else if (act === "loop") {
          var pb = TTS.getPlaybackState();
          if (pb.isPlaying && pb.loopLineIndex === idx) {
            stopAllAudio();
          } else {
            playDramaFrom(idx, { loopThisLine: true });
          }
        }
        return;
      }

      var enSeg = ev.target.closest(".seg-en");
      if (enSeg) {
        var vocabId = enSeg.getAttribute("data-vocab-id");
        if (state.settings.captionMode === "blind") {
          enSeg.classList.add("revealed");
        }
        var vocab = findVocabById(vocabId);
        if (vocab) {
          uiState.vocabSequencePlaying = false;
          state = Storage.markPracticed(vocabId);
          updateStatsUI();
          TTS.speakPhrase(vocab.en, "en-US", state.settings.enRate, {
            settings: state.settings,
            callbacks: createPlaybackCallbacks()
          });
          openMobileSpotlight(vocabId);
        }
        return;
      }

      var maskedSeg = ev.target.closest(".seg-gloss, .seg-zh");
      if (maskedSeg && state.settings.captionMode !== "bilingual") {
        maskedSeg.classList.toggle("revealed");
      }
    });

    function delegateVocabClick(container) {
      container.addEventListener("click", function (ev) {
        var btn = ev.target.closest("[data-action]");
        if (!btn) return;
        handleVocabAction(btn.getAttribute("data-action"), btn.getAttribute("data-vocab-id"));
      });
    }

    delegateVocabClick(els.desktopSpotlightCard);
    delegateVocabClick(els.mobileSpotlightContent);
    delegateVocabClick(els.vocabGrid);

    els.quickVocabList.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".vocab-mini-chip");
      if (!chip) return;
      var vocabId = chip.getAttribute("data-vocab-id");
      uiState.activeVocabId = vocabId;
      renderSpotlight();
      var lineIdx = findFirstLineIndexForVocab(vocabId);
      uiState.currentLineIndex = lineIdx;
      syncDockAndSettingsUI();
      var card = els.dialogueList.querySelector('.line-card[data-line-index="' + lineIdx + '"]');
      if (card) {
        clearActiveSpeakingHighlights();
        card.classList.add("active-line");
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    els.filterAll.addEventListener("click", function () {
      uiState.vocabFilter = "all";
      renderVocabGrid();
    });

    els.filterBookmarked.addEventListener("click", function () {
      uiState.vocabFilter = "bookmarked";
      renderVocabGrid();
    });

    els.btnPlayAllVocab.addEventListener("click", function () {
      if (uiState.vocabSequencePlaying) {
        stopAllAudio();
        return;
      }
      var list =
        uiState.vocabFilter === "bookmarked"
          ? episode.vocab.filter(function (v) {
              return isBookmarked(v.id);
            })
          : episode.vocab;
      if (!list.length) {
        showToast("目前清單是空的");
        return;
      }
      uiState.vocabSequencePlaying = true;
      renderVocabGrid();
      TTS.speakVocabSequence(list, state.settings, {
        onLineStart: function (idx) {
          var cards = els.vocabGrid.querySelectorAll(".vocab-card");
          Array.prototype.forEach.call(cards, function (c, i) {
            c.classList.toggle("speaking-now", i === idx);
          });
        },
        onEpisodeEnd: function () {
          uiState.vocabSequencePlaying = false;
          renderVocabGrid();
        }
      });
    });

    Array.prototype.forEach.call(els.quizModeButtons, function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-qmode");
        if (uiState.quiz.mode === mode) return;
        uiState.quiz.mode = mode;
        if (uiState.quiz.started) {
          startQuiz(null, true);
        } else {
          renderQuizStage();
        }
      });
    });

    els.quizStage.addEventListener("click", function (ev) {
      if (ev.target.closest("#btn-start-quiz") || ev.target.closest("#btn-restart-quiz")) {
        startQuiz(null, true);
        return;
      }
      if (ev.target.closest("#btn-retry-wrong")) {
        startQuiz(uiState.quiz.wrongIds.slice(), true);
        return;
      }
      if (ev.target.closest("#btn-quiz-replay")) {
        playCurrentQuizAudio(false);
        return;
      }
      if (ev.target.closest("#btn-quiz-slow")) {
        playCurrentQuizAudio(true);
        return;
      }
      if (ev.target.closest("#btn-quiz-play-example")) {
        var qCur = uiState.quiz.questions[uiState.quiz.index];
        if (qCur) {
          TTS.speakPhrase(qCur.vocab.example, "en-US", state.settings.enRate, {
            settings: state.settings
          });
        }
        return;
      }
      if (ev.target.closest("#btn-quiz-next")) {
        uiState.quiz.index += 1;
        uiState.quiz.answered = false;
        uiState.quiz.selectedId = null;
        renderQuizStage();
        if (uiState.quiz.index < uiState.quiz.questions.length) {
          playCurrentQuizAudio(false);
        }
        return;
      }

      var optBtn = ev.target.closest("[data-quiz-opt]");
      if (optBtn && !uiState.quiz.answered) {
        var chosenId = optBtn.getAttribute("data-quiz-opt");
        var currentQ = uiState.quiz.questions[uiState.quiz.index];
        uiState.quiz.answered = true;
        uiState.quiz.selectedId = chosenId;
        if (chosenId === currentQ.vocab.id) {
          uiState.quiz.score += 1;
        } else {
          uiState.quiz.wrongIds.push(currentQ.vocab.id);
        }
        renderQuizStage();
      }
    });

    /* SETTINGS EVENTS */
    Array.prototype.forEach.call(els.ttsModeRadios, function (radio) {
      radio.addEventListener("change", function () {
        if (radio.checked) {
          state = Storage.updateSettings({ ttsMode: radio.value });
          syncDockAndSettingsUI();
        }
      });
    });

    els.selectZhVoice.addEventListener("change", function () {
      state = Storage.updateSettings({ zhVoiceURI: els.selectZhVoice.value });
    });

    els.selectEnVoice.addEventListener("change", function () {
      state = Storage.updateSettings({ enVoiceURI: els.selectEnVoice.value });
    });

    els.btnTestTts.addEventListener("click", function () {
      TTS.speakPreviewLine(
        "這件事我真的 {{take it for granted|視為理所當然|v07}} 了",
        castMap.mina,
        Object.assign({}, state.settings, { readGloss: true, shadowingPause: false }),
        {
          onError: function (msg) {
            showToast(msg);
          }
        }
      );
    });

    els.rangeZhRate.addEventListener("input", function () {
      var val = parseFloat(els.rangeZhRate.value);
      state = Storage.updateSettings({ rate: val });
      syncDockAndSettingsUI();
    });

    els.rangeEnRate.addEventListener("input", function () {
      var val = parseFloat(els.rangeEnRate.value);
      state = Storage.updateSettings({ enRate: val });
      syncDockAndSettingsUI();
    });

    Array.prototype.forEach.call(els.shadowSecButtons, function (btn) {
      btn.addEventListener("click", function () {
        var sec = Number(btn.getAttribute("data-sec")) || 3;
        state = Storage.updateSettings({ shadowingSeconds: sec });
        syncDockAndSettingsUI();
      });
    });

    els.btnExportJson.addEventListener("click", function () {
      var json = Storage.exportJSON();
      var blob = new Blob([json], { type: "application/json;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "dramatalk-progress.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("📤 已下載學習進度備份檔");
    });

    els.inputImportJson.addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          state = Storage.importJSON(String(reader.result || "{}"));
          applyTheme();
          updateStatsUI();
          syncCaptionUI();
          syncDockAndSettingsUI();
          renderSpotlight();
          renderVocabGrid();
          renderQuizBestBadge();
          showToast("📥 進度匯入成功！");
        } catch (_err) {
          showToast("⚠️ 檔案格式無效，匯入失敗");
        }
      };
      reader.readAsText(file, "utf-8");
      ev.target.value = "";
    });

    els.btnResetProgress.addEventListener("click", function () {
      if (!global.confirm("確定要清除所有收藏、練習紀錄與語音設定嗎？")) {
        return;
      }
      stopAllAudio();
      state = Storage.resetAll();
      uiState.currentLineIndex = 0;
      uiState.speechResults = {};
      applyTheme();
      updateStatsUI();
      syncCaptionUI();
      syncDockAndSettingsUI();
      renderDialogueFeed();
      renderSpotlight();
      renderVocabGrid();
      renderQuizStage();
      showToast("🗑️ 已重置所有學習紀錄");
    });

    /* KEYBOARD SHORTCUTS */
    document.addEventListener("keydown", function (ev) {
      if (uiState.activeTab !== "drama") return;
      if (!els.settingsModal.classList.contains("hidden")) {
        if (ev.key === "Escape") els.settingsModal.classList.add("hidden");
        return;
      }
      var tag = ev.target && ev.target.tagName ? ev.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (ev.code === "Space" && tag !== "BUTTON") {
        ev.preventDefault();
        togglePlayPauseDrama();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        els.btnPrevLine.click();
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        els.btnNextLine.click();
      } else if (ev.key === "r" || ev.key === "R") {
        ev.preventDefault();
        els.btnReplayLine.click();
      }
    });

    /* INIT */
    if (!TTS.isSupported) {
      els.ttsWarningBanner.classList.remove("hidden");
    }
    TTS.initVoiceDiscovery(function () {
      if (!els.settingsModal.classList.contains("hidden")) {
        populateVoiceSelects();
      }
    });

    applyTheme();
    updateStatsUI();
    renderHeroAndCast();
    renderDialogueFeed();
    syncCaptionUI();
    renderSpotlight();
    syncDockAndSettingsUI();
    renderQuizBestBadge();
  });
})(window);
