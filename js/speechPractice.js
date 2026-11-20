(function (global) {
  "use strict";

  var RecognitionCtor =
    typeof global !== "undefined"
      ? global.SpeechRecognition || global.webkitSpeechRecognition
      : null;

  var isSupported = Boolean(RecognitionCtor);
  var activeRecognition = null;

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[-–—]/g, " ")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function computeWordScore(targetPhrase, candidate) {
    var normTarget = normalizeText(targetPhrase);
    var normCand = normalizeText(candidate);
    if (!normTarget || !normCand) return 0;
    if (normCand === normTarget || normCand.indexOf(normTarget) !== -1) {
      return 100;
    }

    var targetWords = normTarget.split(" ");
    var candWords = normCand.split(" ");
    var candPool = candWords.slice();
    var matched = 0;

    for (var i = 0; i < targetWords.length; i += 1) {
      var w = targetWords[i];
      var foundIdx = candPool.indexOf(w);
      if (foundIdx !== -1) {
        matched += 1;
        candPool.splice(foundIdx, 1);
      } else {
        for (var j = 0; j < candPool.length; j += 1) {
          if (candPool[j].indexOf(w) !== -1 || w.indexOf(candPool[j]) !== -1) {
            matched += 0.75;
            candPool.splice(j, 1);
            break;
          }
        }
      }
    }

    var recall = matched / targetWords.length;
    var precision = matched / Math.max(candWords.length, targetWords.length);
    var combined = recall * 0.8 + precision * 0.2;
    return Math.round(Math.min(100, combined * 100));
  }

  function mapErrorMessage(errorCode) {
    switch (errorCode) {
      case "not-allowed":
      case "service-not-allowed":
        return "麥克風權限被拒絕，請在瀏覽器網址列允許麥克風存取後再試。";
      case "no-speech":
        return "沒有偵測到聲音，請靠近麥克風再清楚唸一次。";
      case "audio-capture":
        return "找不到可用的麥克風裝置。";
      case "network":
        return "語音辨識連線不穩，請確認網路狀態後再試。";
      case "aborted":
        return "已取消本次錄音。";
      default:
        return "語音辨識發生錯誤，請再試一次。";
    }
  }

  function abortCurrent() {
    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch (_err) {}
      activeRecognition = null;
    }
  }

  function listenAndEvaluate(targetPhrase, callbacks) {
    var cb = callbacks || {};
    if (!isSupported) {
      if (typeof cb.onError === "function") {
        cb.onError("目前瀏覽器不支援語音辨識（建議使用桌面或 Android 版 Chrome / Edge 測試麥克風跟讀）。");
      }
      if (typeof cb.onEnd === "function") cb.onEnd();
      return;
    }

    abortCurrent();

    var recognition = new RecognitionCtor();
    activeRecognition = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    var gotResult = false;

    recognition.onstart = function () {
      if (typeof cb.onStart === "function") cb.onStart();
    };

    recognition.onresult = function (event) {
      gotResult = true;
      var results = event && event.results && event.results[0];
      var bestTranscript = "";
      var bestScore = -1;

      if (results) {
        for (var i = 0; i < results.length; i += 1) {
          var alt = results[i].transcript || "";
          var score = computeWordScore(targetPhrase, alt);
          if (score > bestScore) {
            bestScore = score;
            bestTranscript = alt;
          }
        }
      }

      if (bestScore < 0) bestScore = 0;
      var payload = {
        transcript: bestTranscript.trim(),
        score: bestScore,
        passed: bestScore >= 70,
        target: targetPhrase
      };
      if (typeof cb.onResult === "function") cb.onResult(payload);
    };

    recognition.onerror = function (event) {
      var code = event && event.error ? event.error : "unknown";
      if (typeof cb.onError === "function") {
        cb.onError(mapErrorMessage(code), code);
      }
    };

    recognition.onend = function () {
      if (activeRecognition === recognition) {
        activeRecognition = null;
      }
      if (!gotResult && typeof cb.onNoResult === "function") {
        cb.onNoResult();
      }
      if (typeof cb.onEnd === "function") cb.onEnd();
    };

    try {
      recognition.start();
    } catch (_err) {
      activeRecognition = null;
      if (typeof cb.onError === "function") {
        cb.onError("無法啟動麥克風辨識，請稍後再試。");
      }
      if (typeof cb.onEnd === "function") cb.onEnd();
    }
  }

  global.DramaSpeechPractice = {
    isSupported: isSupported,
    normalizeText: normalizeText,
    computeWordScore: computeWordScore,
    listenAndEvaluate: listenAndEvaluate,
    abortCurrent: abortCurrent
  };
})(window);
