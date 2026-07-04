// =========================================================
// Логика страницы Present Simple: шкала частотности + тест
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  initFrequencyScale();
  initQuiz();
  initVoiceButtons();
});

/* ---------- озвучка примеров (Google TTS + фолбэк на SpeechSynthesis) ---------- */

const FLAG_GB =
  '<svg viewBox="0 0 60 30" class="flag" aria-hidden="true"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="4"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/></svg>';

const FLAG_US =
  '<svg viewBox="0 0 60 30" class="flag" aria-hidden="true"><rect width="60" height="30" fill="#B22234"/><g fill="#fff"><rect y="2.3" width="60" height="2.3"/><rect y="6.9" width="60" height="2.3"/><rect y="11.5" width="60" height="2.3"/><rect y="16.1" width="60" height="2.3"/><rect y="20.7" width="60" height="2.3"/><rect y="25.3" width="60" height="2.3"/></g><rect width="24" height="16.1" fill="#3C3B6E"/></svg>';

let activeVoiceAudio = null;
let activeVoiceBtn = null;
let activeVoiceOriginalHTML = "";

const FEMALE_VOICE_HINTS = [
  "female",
  "zira",
  "susan",
  "samantha",
  "victoria",
  "kate",
  "serena",
  "hazel",
  "moira",
  "tessa",
  "fiona",
  "karen",
  "anna",
  "google uk english female",
  "google us english",
  "libby",
  "sonia",
  "aria",
];

function getVoicesAsync() {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      resolve(existing);
      return;
    }
    const onVoices = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    // подстраховка на случай, если событие voiceschanged не сработает
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 400);
  });
}

function pickFemaleVoice(voices, langCode) {
  const langPrefix = langCode.split("-")[0].toLowerCase();
  const sameLang = voices.filter((v) => v.lang.toLowerCase() === langCode.toLowerCase());
  const samePrefix = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
  const pool = sameLang.length ? sameLang : samePrefix.length ? samePrefix : voices;
  if (!pool.length) return null;

  const isFemale = (v) => FEMALE_VOICE_HINTS.some((hint) => v.name.toLowerCase().includes(hint));
  const isHighQuality = (v) => /natural|online|neural/i.test(v.name);

  return (
    pool.find((v) => isFemale(v) && isHighQuality(v)) ||
    pool.find(isFemale) ||
    pool.find(isHighQuality) ||
    pool[0]
  );
}

function resetVoiceButton() {
  if (activeVoiceBtn) {
    activeVoiceBtn.innerHTML = activeVoiceOriginalHTML;
    activeVoiceBtn.classList.remove("is-loading", "is-playing");
  }
  activeVoiceAudio = null;
  activeVoiceBtn = null;
  activeVoiceOriginalHTML = "";
}

function speakWithBrowserVoice(text, langCode, btn, voices) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.lang = langCode;
  utterance.pitch = 1.0;

  const voice = pickFemaleVoice(voices, langCode);
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    btn.classList.remove("is-loading");
    btn.classList.add("is-playing");
    btn.innerHTML = '<span class="voice-dot"></span><span>Голос</span>';
  };
  utterance.onend = () => resetVoiceButton();
  utterance.onerror = () => resetVoiceButton();

  window.speechSynthesis.speak(utterance);
}

function speakWithGoogleTts(text, langCode, btn) {
  const cleanText = encodeURIComponent(text);
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${cleanText}`;

  const audio = new Audio(ttsUrl);
  activeVoiceAudio = audio;

  audio.onplay = () => {
    btn.classList.remove("is-loading");
    btn.classList.add("is-playing");
    btn.innerHTML = '<span class="voice-dot"></span><span>Голос</span>';
  };
  audio.onended = () => resetVoiceButton();
  audio.onerror = () => resetVoiceButton();

  audio.play().catch(() => audio.onerror());
}

async function speakExample(text, langCode, btn) {
  if ((activeVoiceAudio || window.speechSynthesis.speaking) && activeVoiceBtn === btn) {
    if (activeVoiceAudio) activeVoiceAudio.pause();
    window.speechSynthesis.cancel();
    resetVoiceButton();
    return;
  }
  if (activeVoiceBtn) resetVoiceButton();

  activeVoiceBtn = btn;
  activeVoiceOriginalHTML = btn.innerHTML;

  btn.classList.add("is-loading");
  btn.innerHTML = '<span class="voice-spinner"></span><span>...</span>';

  // приоритет — качественный голос самого браузера/ОС (обычно звучит живее,
  // чем неофициальный Google Translate TTS); Google используем только
  // как резерв, если в браузере вообще нет доступных голосов
  if ("speechSynthesis" in window) {
    const voices = await getVoicesAsync();
    if (voices.length) {
      speakWithBrowserVoice(text, langCode, btn, voices);
      return;
    }
  }

  speakWithGoogleTts(text, langCode, btn);
}

function createVoiceButton(text, langCode, flagSvg, label) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "voice-btn";
  btn.setAttribute("aria-label", label);
  btn.innerHTML = `${flagSvg}<span>${langCode === "en-GB" ? "BrE" : "AmE"}</span>`;
  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    speakExample(text, langCode, btn);
  });
  return btn;
}

function initVoiceButtons() {
  document.querySelectorAll(".example-card").forEach((card) => {
    const sentenceEl = card.querySelector(".example-sentence");
    const body = card.querySelector(".example-body");
    if (!sentenceEl || !body) return;

    const text = sentenceEl.textContent.replace(/\s+/g, " ").trim();
    if (!text) return;

    const wrap = document.createElement("div");
    wrap.className = "example-voices";
    wrap.appendChild(createVoiceButton(text, "en-GB", FLAG_GB, "Британское произношение"));
    wrap.appendChild(createVoiceButton(text, "en-US", FLAG_US, "Американское произношение"));
    body.appendChild(wrap);
  });
}

/* ---------- шкала частотности маркеров ---------- */

function initFrequencyScale() {
  const track = document.querySelector(".freq-track");
  if (!track) return;

  const fill = track.querySelector(".freq-fill");
  const points = track.querySelectorAll(".freq-point");
  let triggered = false;

  function reveal() {
    if (triggered) return;
    triggered = true;
    if (fill) fill.style.width = "100%";
    points.forEach((point, index) => {
      point.style.setProperty("--d", `${index * 0.12 + 0.2}s`);
      point.classList.add("is-visible");
    });
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(track);

  // подстраховка: шкала лежит во вкладке, которая по умолчанию скрыта —
  // запускаем анимацию и по клику на вкладку "Слова-маркеры"
  const markersTabBtn = document.querySelector('.tab-btn[data-tab-target="markers"]');
  if (markersTabBtn) {
    markersTabBtn.addEventListener("click", () => setTimeout(reveal, 60));
  }
}

/* ---------- интерактивный тест ---------- */

const QUIZ_DATA = [
  {
    question: 'She <span class="gap">&nbsp;</span> (work) at a hospital.',
    options: ["work", "works", "working", "is work"],
    correct: 1,
    explanation: "После he/she/it к глаголу добавляется окончание -s: she works.",
  },
  {
    question: 'They <span class="gap">&nbsp;</span> (not / like) horror films.',
    options: ["doesn't like", "not like", "don't like", "isn't like"],
    correct: 2,
    explanation: "Для I/you/we/they отрицание образуется с помощью don't + глагол без окончания.",
  },
  {
    question: '<span class="gap">&nbsp;</span> your brother speak French?',
    options: ["Do", "Does", "Is", "Are"],
    correct: 1,
    explanation: "С подлежащим he/she/it (в том числе your brother) вопрос строится с does.",
  },
  {
    question: "Выберите правильную форму глагола study для he:",
    options: ["studys", "studies", "studyes", "study"],
    correct: 1,
    explanation: "Если глагол оканчивается на согласную + y, то y меняется на i и добавляется -es: study → studies.",
  },
  {
    question: "Какое слово-маркер обычно указывает на 0% частоты действия?",
    options: ["usually", "often", "never", "sometimes"],
    correct: 2,
    explanation: "Never переводится как «никогда» и стоит на нулевой отметке шкалы частотности.",
  },
  {
    question: 'The shop <span class="gap">&nbsp;</span> (open) at 9 a.m. every day.',
    options: ["open", "opens", "opening", "is opening"],
    correct: 1,
    explanation: "Present Simple используется для расписаний и регулярных событий: the shop opens at 9 a.m.",
  },
];

function initQuiz() {
  const card = document.querySelector(".quiz-card");
  if (!card) return;

  const dotsWrap = card.querySelector(".quiz-progress");
  const countLabel = card.querySelector(".quiz-count");
  const scoreLabel = card.querySelector(".quiz-score");
  const questionEl = card.querySelector(".quiz-question");
  const optionsEl = card.querySelector(".quiz-options");
  const feedbackEl = card.querySelector(".quiz-feedback");
  const nextBtn = card.querySelector(".quiz-next");
  const bodyEl = card.querySelector(".quiz-body");
  const resultEl = card.querySelector(".quiz-result");
  const scoreBig = card.querySelector(".score-big");
  const retryBtn = card.querySelector(".quiz-retry");

  let current = 0;
  let score = 0;
  let answered = false;

  QUIZ_DATA.forEach(() => {
    const dot = document.createElement("div");
    dot.className = "quiz-dot";
    dotsWrap.appendChild(dot);
  });

  function renderQuestion() {
    answered = false;
    const item = QUIZ_DATA[current];

    countLabel.textContent = `Вопрос ${current + 1} из ${QUIZ_DATA.length}`;
    scoreLabel.textContent = `Счёт: ${score}`;
    questionEl.innerHTML = item.question;
    optionsEl.innerHTML = "";
    feedbackEl.classList.remove("is-visible");
    feedbackEl.textContent = "";
    nextBtn.classList.remove("is-visible");

    item.options.forEach((optionText, index) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = optionText;
      btn.addEventListener("click", () => handleAnswer(index, btn));
      optionsEl.appendChild(btn);
    });

    dotsWrap.querySelectorAll(".quiz-dot").forEach((dot, index) => {
      dot.classList.remove("is-current", "is-done");
      if (index < current) dot.classList.add("is-done");
      if (index === current) dot.classList.add("is-current");
    });
  }

  function handleAnswer(index, btn) {
    if (answered) return;
    answered = true;

    const item = QUIZ_DATA[current];
    const allButtons = optionsEl.querySelectorAll(".quiz-option");
    allButtons.forEach((b) => (b.disabled = true));

    if (index === item.correct) {
      score += 1;
      btn.classList.add("is-correct");
    } else {
      btn.classList.add("is-wrong");
      allButtons[item.correct].classList.add("is-correct");
    }

    scoreLabel.textContent = `Счёт: ${score}`;
    feedbackEl.textContent = item.explanation;
    feedbackEl.classList.add("is-visible");
    nextBtn.classList.add("is-visible");
    nextBtn.textContent = current === QUIZ_DATA.length - 1 ? "Смотреть результат" : "Следующий вопрос";
  }

  nextBtn.addEventListener("click", () => {
    current += 1;
    if (current >= QUIZ_DATA.length) {
      showResult();
    } else {
      renderQuestion();
    }
  });

  function showResult() {
    bodyEl.classList.add("is-hidden");
    resultEl.classList.add("is-visible");
    scoreBig.textContent = `${score} / ${QUIZ_DATA.length}`;

    dotsWrap.querySelectorAll(".quiz-dot").forEach((dot) => {
      dot.classList.add("is-done");
      dot.classList.remove("is-current");
    });
  }

  retryBtn.addEventListener("click", () => {
    current = 0;
    score = 0;
    bodyEl.classList.remove("is-hidden");
    resultEl.classList.remove("is-visible");
    renderQuestion();
  });

  renderQuestion();
}
