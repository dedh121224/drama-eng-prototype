(function (global) {
  "use strict";

  global.DRAMA_DATA = {
    series: {
      id: "apex-star",
      title: "星辰集團生存日記",
      subtitle: "Surviving the CEO",
      worldview: "現代都會・霸總 × 社畜",
      setting:
        "台北信義區 68 樓「星辰科技集團（Apex Star Corp）」— 冷面反差萌霸道總裁顧景深，遇上靠超商大冰美續命的苦命特助林小滿。輕鬆幽默又帶點微心動的職場短劇，每集精選高頻口說片語，用中文語境直接記住道地用法。"
    },
    cast: {
      narrator: {
        id: "narrator",
        name: "旁白",
        role: "場景說明",
        badge: "旁",
        gender: "neutral",
        pitch: 1.0,
        rate: 1.0,
        color: "#94a3b8"
      },
      mina: {
        id: "mina",
        name: "林小滿",
        role: "苦命特助",
        badge: "滿",
        gender: "female",
        pitch: 1.08,
        rate: 1.03,
        color: "#f59e0b"
      },
      kevin: {
        id: "kevin",
        name: "阿凱",
        role: "茶水間情報王",
        badge: "凱",
        gender: "male",
        pitch: 1.02,
        rate: 1.05,
        color: "#14b8a6"
      },
      ethan: {
        id: "ethan",
        name: "顧景深",
        role: "霸道總裁",
        badge: "顧",
        gender: "male",
        pitch: 0.86,
        rate: 0.94,
        color: "#fb7185"
      }
    },
    episodes: [
      {
        id: "ep01",
        number: 1,
        title: "EP01：五分鐘內，我要看到這份提案重做！",
        duration: "約 2.5 分鐘",
        level: "實用口說 B1",
        synopsis:
          "週五下班前五分鐘，林小滿準備衝去吃麻辣鍋，卻碰上冷面總裁顧景深空降退件。忍無可忍的打工人竟然當眾頂撞老闆，沒想到高冷總裁的反應完全出乎意料……",
        vocab: [
          {
            id: "v01",
            en: "call it a day",
            zh: "收工、今天就到這",
            phonetic: "/kɔːl ɪt ə deɪ/",
            pos: "片語",
            tip: "台灣人常直譯成 finish work，但母語者下班收工最愛說 Let's call it a day! 注意 call-it-a 連音唸成「考利特」。",
            example: "We've been working for ten hours. Let's call it a day.",
            exampleZh: "我們已經工作十小時了，今天就收工吧。"
          },
          {
            id: "v02",
            en: "jinx it",
            zh: "烏鴉嘴、觸霉頭",
            phonetic: "/dʒɪŋks ɪt/",
            pos: "片語",
            tip: "擔心講完好話反而出事時說 Don't jinx it!（別烏鴉嘴！），美劇職場超常出現。連音唸「金克斯特」。",
            example: "Shh! Everything is going smoothly, so don't jinx it.",
            exampleZh: "噓！一切都很順利，別烏鴉嘴！"
          },
          {
            id: "v03",
            en: "make sense",
            zh: "合理、說得通",
            phonetic: "/meɪk sens/",
            pos: "片語",
            tip: "覺得方案不合理千萬別說 not reasonable 而已，口語用 That doesn't make sense. 最自然道地。",
            example: "Your proposal doesn't make sense without real budget numbers.",
            exampleZh: "沒有實際預算數字的話，你的提案說不通。"
          },
          {
            id: "v04",
            en: "from scratch",
            zh: "從頭開始、白手起家",
            phonetic: "/frʌm skrætʃ/",
            pos: "片語",
            tip: "強調「完全重來、從零做起」。記得 scratch 的字尾 ch 要咬緊吐氣，常搭配 start / redo / build。",
            example: "The file crashed, so I had to rebuild the slides from scratch.",
            exampleZh: "檔案當掉了，所以我只好從頭重做簡報。"
          },
          {
            id: "v05",
            en: "last-minute",
            zh: "最後一刻的、臨時的",
            phonetic: "/ˌlæst ˈmɪnɪt/",
            pos: "形容詞片語",
            tip: "當形容詞修飾名詞時加連字號（last-minute change 臨時改動），也常說 at the last minute（在最後一刻）。",
            example: "I hate dealing with last-minute requests right before Friday evening.",
            exampleZh: "我超討厭週五傍晚前才收到臨時要求。"
          },
          {
            id: "v06",
            en: "burn out",
            zh: "累垮、職業倦怠",
            phonetic: "/bɜːrn aʊt/",
            pos: "片語",
            tip: "指長期高壓工作後「燒乾了、精疲力竭」。連音唸「波恩奧特」，名詞形式是 burnout。",
            example: "If you keep skipping lunch, you're going to burn out soon.",
            exampleZh: "你再繼續不吃午餐，很快就會累垮。"
          },
          {
            id: "v07",
            en: "take it for granted",
            zh: "視為理所當然",
            phonetic: "/teɪk ɪt fɔːr ˈɡræntɪd/",
            pos: "片語",
            tip: "台灣人最容易誤用成 take it as granted！正確介系詞一定是 for。口語連音唸「take-it for gran-ted」。",
            example: "Don't take your team's overtime effort for granted.",
            exampleZh: "別把團隊的加班付出視為理所當然。"
          },
          {
            id: "v08",
            en: "cross the line",
            zh: "越界、太過分",
            phonetic: "/krɔːs ðə laɪn/",
            pos: "片語",
            tip: "警告對方說話或行為踩到底線了，可用 That's crossing the line. 或 Did I cross the line?",
            example: "Talking back to the CEO in public really crossed the line.",
            exampleZh: "當眾頂撞總裁真的越界了。"
          },
          {
            id: "v09",
            en: "zone out",
            zh: "放空、走神",
            phonetic: "/zoʊn aʊt/",
            pos: "片語",
            tip: "開會開到靈魂出竅、腦袋一片空白就用 zone out。連音像「ぞ-納特」(zoh-nout)。",
            example: "Sorry, I zoned out for a second. Could you repeat that?",
            exampleZh: "抱歉，我剛放空了一秒，可以再說一次嗎？"
          },
          {
            id: "v10",
            en: "figure it out",
            zh: "想出辦法、搞定",
            phonetic: "/ˈfɪɡjər ɪt aʊt/",
            pos: "片語",
            tip: "口語萬用神句！不管是問題、程式碼還是人生難題，We'll figure it out.（我們會想出辦法的）超好用。連音唸「fi-gyer-i-tout」。",
            example: "Don't panic yet. Give me ten minutes and I'll figure it out.",
            exampleZh: "先別慌，給我十分鐘，我會想出辦法搞定。"
          },
          {
            id: "v11",
            en: "make it up to you",
            zh: "補償你",
            phonetic: "/meɪk ɪt ʌp tu juː/",
            pos: "片語",
            tip: "放鳥朋友或讓同事多加班後想請客賠罪，就說 Let me make it up to you. 口語連音唸「may-ki-tup to you」。",
            example: "I ruined your Friday dinner plan. Let me make it up to you.",
            exampleZh: "我毀了你的週五晚餐計畫，讓我補償你吧。"
          },
          {
            id: "v12",
            en: "caught off guard",
            zh: "措手不及、嚇了一跳",
            phonetic: "/kɔːt ɔːf ɡɑːrd/",
            pos: "片語",
            tip: "原意是拳擊手放下防備被打中，常用被動 be caught off guard，形容突然發生讓人完全沒準備。",
            example: "Everyone in the office was caught off guard by his sudden smile.",
            exampleZh: "他突然露出的微笑讓辦公室每個人都措手不及。"
          }
        ],
        lines: [
          {
            id: "l01",
            speaker: "narrator",
            emotion: "週五 17:55・信義區 68 樓",
            text: "週五傍晚五點五十五分，星辰集團 68 樓辦公室。距離下班只剩五分鐘，所有社畜都準備好衝出電梯。"
          },
          {
            id: "l02",
            speaker: "mina",
            emotion: "伸懶腰・眼睛發亮",
            text: "耶！今天進度總算搞定了，我要準時 {{call it a day|收工、今天就到這|v01}}，衝去吃麻辣鍋！"
          },
          {
            id: "l03",
            speaker: "kevin",
            emotion: "壓低聲音・神經緊張",
            text: "小滿，拜託別 {{jinx it|烏鴉嘴、觸霉頭|v02}}！剛剛總裁秘書經過茶水間，臉色臭得跟什麼一樣。"
          },
          {
            id: "l04",
            speaker: "mina",
            emotion: "拍胸脯・自信滿滿",
            text: "安啦！我昨天熬夜改了八版簡報，每個數字都有對過，不會有事的。"
          },
          {
            id: "l05",
            speaker: "narrator",
            emotion: "高跟鞋與皮鞋聲逼近",
            text: "話才剛說完，總裁辦公室的自動門突然滑開。冷面總裁顧景深大步走出來，把整疊資料啪地甩在林小滿桌上。"
          },
          {
            id: "l06",
            speaker: "ethan",
            emotion: "冷冽低沉・氣場全開",
            text: "林特助，這份第三季市場分析的邏輯根本不 {{make sense|合理、說得通|v03}}。五分鐘內，給我 {{from scratch|從頭開始|v04}} 重做。"
          },
          {
            id: "l07",
            speaker: "kevin",
            emotion: "倒抽一口氣・假裝看螢幕",
            text: "（小聲）天啊，五分鐘從頭做簡報？這 {{last-minute|最後一刻的、臨時的|v05}} 要求也太硬了吧……"
          },
          {
            id: "l08",
            speaker: "mina",
            emotion: "深吸一口氣・理智斷線",
            text: "總裁，我連續三天都喝兩杯大冰美撐到半夜，現在真的快 {{burn out|累垮、精疲力竭|v06}} 了。"
          },
          {
            id: "l09",
            speaker: "mina",
            emotion: "眼神堅定・豁出去",
            text: "我敬重您對品質的要求，但這件事您真的 {{take it for granted|視為理所當然|v07}} 了，沒有人能在五分鐘內把整份提案變出來！"
          },
          {
            id: "l10",
            speaker: "narrator",
            emotion: "空氣瞬間凝結",
            text: "整個樓層瞬間安靜到連印表機的風扇聲都聽得見，阿凱在旁邊嚇得差點把馬克杯捏碎。"
          },
          {
            id: "l11",
            speaker: "ethan",
            emotion: "微瞇雙眼・逼近一步",
            text: "林小滿，妳知道當眾頂撞上司，已經 {{cross the line|越界、太過分|v08}} 了嗎？"
          },
          {
            id: "l12",
            speaker: "mina",
            emotion: "硬著頭皮・有點後悔但沒退縮",
            text: "對不起，我剛剛有點 {{zone out|放空、走神|v09}} 加情緒激動……如果真的要改，我現在就留下來 {{figure it out|想出辦法、搞定|v10}}。"
          },
          {
            id: "l13",
            speaker: "narrator",
            emotion: "沉默三秒鐘",
            text: "顧景深盯著她泛紅的眼眶看了三秒，忽然把視線移開，從西裝內袋拿出一張黑卡和兩張餐券。"
          },
          {
            id: "l14",
            speaker: "ethan",
            emotion: "語氣放軟・耳根微紅",
            text: "算了，剛剛那份其實是我把舊檔拿錯了。妳的正式版我看過，做得很好。"
          },
          {
            id: "l15",
            speaker: "mina",
            emotion: "瞬間傻眼・大腦當機",
            text: "欸？什麼？我剛剛完全被這反轉搞得 {{caught off guard|措手不及|v12}}……"
          },
          {
            id: "l16",
            speaker: "ethan",
            emotion: "低頭看手錶・刻意裝酷",
            text: "這張私廚雙人麻辣鍋券拿去，算是我為剛才的態度 {{make it up to you|補償你|v11}}。現在馬上 {{call it a day|收工、今天就到這|v01}}。"
          },
          {
            id: "l17",
            speaker: "ethan",
            emotion: "轉身離開前・嘴角微微上揚",
            text: "對了，週一早上飛東京出差，只有我們兩個人。週末好好休息，別再 {{burn out|累垮、精疲力竭|v06}} 了。"
          },
          {
            id: "l18",
            speaker: "kevin",
            emotion: "探出頭・八卦眼神發光",
            text: "哇賽……原來冰山總裁也會怕把妳逼走喔？小滿，看來這季的劇本要從社畜求生變成戀愛攻略囉！"
          }
        ]
      }
    ]
  };
})(window);
