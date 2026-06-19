const knowledge = window.PROJECT_KNOWLEDGE;

const metricGrid = document.querySelector("#metricGrid");
const workflowList = document.querySelector("#workflowList");
const heroChatOpen = document.querySelector("#heroChatOpen");
const floatingChatToggle = document.querySelector("#floatingChatToggle");
const floatingChatClose = document.querySelector("#floatingChatClose");
const floatingChatPanel = document.querySelector("#floatingChatPanel");
const floatingChatLog = document.querySelector("#floatingChatLog");
const floatingChatForm = document.querySelector("#floatingChatForm");
const floatingChatInput = document.querySelector("#floatingChatInput");
const quickPromptButtons = document.querySelectorAll("[data-question]");

const welcomeMessage =
  "Xin chào, mình là trợ lý dự án trên website Smart Home AI. Hiện mình trả lời bằng bộ tri thức tĩnh của dự án; bản Gemini hoặc LoRA fine-tune sẽ cần đi qua backend assistant API ở giai đoạn sau.";

// Simulated real-time sensor state for MFM384 / PLC
const liveData = {
  voltage: 220.4,
  current: 5.62,
  power: 1.05,
  energy: 142.8435,
  quota: 72.4,
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderMetrics() {
  metricGrid.innerHTML = `
    <article class="metric-card">
      <div class="live-pulse"></div>
      <span>Điện áp (V)</span>
      <strong id="live-voltage">220.4 V</strong>
      <small>Theo dõi tag V1N trên MFM384</small>
    </article>
    <article class="metric-card">
      <div class="live-pulse"></div>
      <span>Dòng điện (I)</span>
      <strong id="live-current">5.62 A</strong>
      <small>Theo dõi dòng tải tổng ngõ vào MFM384</small>
    </article>
    <article class="metric-card">
      <div class="live-pulse"></div>
      <span>Công suất (P)</span>
      <strong id="live-power">1.05 kW</strong>
      <small>Theo dõi công suất tức thời từ PLC</small>
    </article>
    <article class="metric-card">
      <div class="live-pulse"></div>
      <span>Điện năng (E)</span>
      <strong id="live-energy">142.8435 kWh</strong>
      <small>Theo dõi tổng tích lũy điện năng tiêu thụ</small>
    </article>
    <article class="metric-card">
      <div class="live-pulse"></div>
      <span>Hạn mức (Quota)</span>
      <strong id="live-quota">72.4%</strong>
      <div class="quota-progress-container">
        <div class="quota-progress-bar" id="live-quota-bar" style="width: 72.4%"></div>
      </div>
      <small>Theo dõi cảnh báo vượt hạn mức tiêu thụ</small>
    </article>
    <article class="metric-card">
      <div class="live-pulse"></div>
      <span>Dự báo (Forecast)</span>
      <strong id="live-forecast">Ổn định &rarr;</strong>
      <small>Theo dõi ước lượng từ các mô hình AI</small>
    </article>
  `;
}

function flashElement(el, color = "var(--cyan)") {
  if (!el) return;
  el.style.transition = "none";
  el.style.color = color;
  el.style.textShadow = `0 0 12px ${color}`;
  setTimeout(() => {
    el.style.transition = "color 0.6s ease-out, text-shadow 0.6s ease-out";
    el.style.color = "";
    el.style.textShadow = "";
  }, 50);
}

function startLiveMetrics() {
  setInterval(() => {
    // Voltage fluctuates between 218.2V and 221.8V
    liveData.voltage = (220.0 + (Math.random() - 0.5) * 3.6).toFixed(1);
    // Current fluctuates between 4.2A and 7.8A
    liveData.current = (5.5 + (Math.random() - 0.5) * 2.8).toFixed(2);
    // Power in kW = V * I * cos(phi) / 1000, cos(phi) = 0.85
    liveData.power = ((liveData.voltage * liveData.current * 0.85) / 1000).toFixed(2);
    // Energy accumulates slowly based on power
    liveData.energy = (parseFloat(liveData.energy) + parseFloat(liveData.power) * 0.00015).toFixed(4);
    // Quota fluctuates slightly around 72.4%
    liveData.quota = (72.4 + (Math.random() - 0.5) * 0.6).toFixed(1);

    // Update DOM elements dynamically
    const vEl = document.querySelector("#live-voltage");
    const iEl = document.querySelector("#live-current");
    const pEl = document.querySelector("#live-power");
    const eEl = document.querySelector("#live-energy");
    const qEl = document.querySelector("#live-quota");
    const qBar = document.querySelector("#live-quota-bar");
    const fEl = document.querySelector("#live-forecast");

    if (vEl) {
      vEl.textContent = `${liveData.voltage} V`;
      flashElement(vEl, "var(--cyan)");
    }
    if (iEl) {
      iEl.textContent = `${liveData.current} A`;
      flashElement(iEl, "var(--cyan)");
    }
    if (pEl) {
      pEl.textContent = `${liveData.power} kW`;
      flashElement(pEl, "var(--cyan)");
    }
    if (eEl) {
      eEl.textContent = `${liveData.energy} kWh`;
      flashElement(eEl, "var(--cyan)");
    }
    if (qEl) {
      qEl.textContent = `${liveData.quota}%`;
      flashElement(qEl, "var(--amber)");
    }
    if (qBar) qBar.style.width = `${liveData.quota}%`;

    if (fEl) {
      if (parseFloat(liveData.power) > 1.25) {
        fEl.innerHTML = `Tăng nhẹ &nearr;`;
        fEl.style.color = "#fbbf24";
      } else if (parseFloat(liveData.power) < 0.9) {
        fEl.innerHTML = `Giảm nhẹ &searr;`;
        fEl.style.color = "#34d399";
      } else {
        fEl.innerHTML = `Ổn định &rarr;`;
        fEl.style.color = "#38bdf8";
      }
    }
  }, 2000);
}

function renderWorkflow() {
  workflowList.innerHTML = knowledge.workflow
    .map(
      (item, index) => `
        <article class="workflow-item">
          <div class="workflow-index">${index + 1}</div>
          <strong>${item.title}</strong>
          <span>${item.text}</span>
        </article>
      `,
    )
    .join("");
}

function addMessage(role, text, isTyping = false) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  if (isTyping) {
    message.classList.add("typing-indicator-msg");
    message.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
  } else {
    message.textContent = text;
  }
  floatingChatLog.appendChild(message);
  floatingChatLog.scrollTop = floatingChatLog.scrollHeight;
  return message;
}

function scoreFaq(query, faq) {
  const normalizedQuery = normalizeText(query);
  const queryWords = new Set(normalizedQuery.split(" ").filter((word) => word.length >= 2));
  const searchable = normalizeText([faq.question, faq.answer, ...(faq.keywords || [])].join(" "));
  let score = 0;

  for (const word of queryWords) {
    if (searchable.includes(word)) {
      score += word.length > 4 ? 2 : 1;
    }
  }

  for (const keyword of faq.keywords || []) {
    if (normalizedQuery.includes(normalizeText(keyword))) {
      score += 4;
    }
  }

  return score;
}

function findAnswer(query) {
  const ranked = knowledge.faq
    .map((item) => ({ item, score: scoreFaq(query, item) }))
    .sort((a, b) => b.score - a.score);

  if (!ranked[0] || ranked[0].score < 2) {
    return (
      "Mình chưa tìm thấy câu trả lời sát với câu hỏi này trong bộ dữ liệu hiện tại.\n\n" +
      "Bạn có thể hỏi theo các chủ đề như: PLC S7-1200, MFM384, RS485, workflow dữ liệu, " +
      "Server API, app hiển thị gì, AI dự báo phụ tải hoặc chatbot fine-tune."
    );
  }

  return ranked[0].item.answer;
}

function askQuestion(question) {
  const cleaned = question.trim();
  if (!cleaned) return;

  addMessage("user", cleaned);
  
  // Show typing indicator
  const typingIndicator = addMessage("bot", "", true);
  
  // Simulate AI latency
  setTimeout(() => {
    typingIndicator.remove();
    addMessage("bot", findAnswer(cleaned));
  }, 600 + Math.random() * 800);
}

function setFloatingChatOpen(isOpen) {
  floatingChatPanel.hidden = !isOpen;
  if (isOpen) {
    floatingChatPanel.style.display = "flex";
    // Trigger fade in animation frame delay
    setTimeout(() => {
      floatingChatPanel.classList.add("is-open");
      floatingChatToggle.setAttribute("aria-expanded", "true");
      floatingChatInput.focus();
    }, 20);
  } else {
    floatingChatPanel.classList.remove("is-open");
    floatingChatToggle.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      floatingChatPanel.style.display = "none";
    }, 300); // match transition speed
  }
}

const forecastScenarios = {
  morning: [42, 48, 55, 60, 50, 45, 38, 30, 28, 24, 20, 18],
  noon: [48, 58, 65, 72, 75, 78, 80, 85, 88, 82, 74, 65],
  peak: [65, 72, 78, 84, 88, 92, 95, 90, 88, 92, 74, 64],
  night: [40, 35, 30, 28, 25, 22, 20, 18, 15, 12, 10, 12]
};

function applyForecastScenario(name) {
  const chart = document.querySelector(".forecast-chart");
  if (!chart) return;
  const bars = chart.querySelectorAll("span");
  const heights = forecastScenarios[name] || forecastScenarios.morning;

  bars.forEach((bar, idx) => {
    if (heights[idx] !== undefined) {
      bar.style.height = `${heights[idx]}%`;
    }
  });
}

function animateForecastChart() {
  const chart = document.querySelector(".forecast-chart");
  if (!chart) return;
  const bars = chart.querySelectorAll("span");
  
  // Reset heights to 0% for animation
  bars.forEach(bar => {
    bar.style.height = "0%";
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Cascade animation to default scenario (morning)
        const heights = forecastScenarios.morning;
        bars.forEach((bar, idx) => {
          setTimeout(() => {
            bar.style.height = `${heights[idx]}%`;
          }, idx * 60);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  observer.observe(chart);
}

function bindEvents() {
  heroChatOpen.addEventListener("click", () => {
    setFloatingChatOpen(true);
  });

  floatingChatToggle.addEventListener("click", () => {
    const isOpen = floatingChatPanel.classList.contains("is-open");
    setFloatingChatOpen(!isOpen);
  });

  floatingChatClose.addEventListener("click", () => {
    setFloatingChatOpen(false);
  });

  floatingChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = floatingChatInput.value;
    floatingChatInput.value = "";
    askQuestion(value);
  });

  quickPromptButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const question = button.dataset.question || button.textContent || "";
      askQuestion(question);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setFloatingChatOpen(false);
    }
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#assistant") {
      setFloatingChatOpen(true);
    }
  });

  const forecastTabs = document.querySelectorAll(".forecast-tab");
  forecastTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      forecastTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const scenario = tab.dataset.scenario;
      applyForecastScenario(scenario);
    });
  });
}

// Initial setup
renderMetrics();
startLiveMetrics();
renderWorkflow();
bindEvents();
animateForecastChart();
addMessage("bot", welcomeMessage);

if (window.location.hash === "#assistant") {
  setFloatingChatOpen(true);
}
