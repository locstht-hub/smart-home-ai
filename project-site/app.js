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
  "Xin chào, mình là trợ lý tra cứu trên website Smart Home AI. Mình trả lời từ bộ tri thức tĩnh của dự án và không được tính là mô hình AI đang vận hành.";

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
      <span>Điện áp (V)</span>
      <strong>—</strong>
      <small>Chờ tag V1N từ MFM384/PLC</small>
    </article>
    <article class="metric-card">
      <span>Dòng điện (I)</span>
      <strong>—</strong>
      <small>Chờ dòng tải tổng từ phần cứng</small>
    </article>
    <article class="metric-card">
      <span>Công suất (P)</span>
      <strong>—</strong>
      <small>Chờ công suất tức thời từ PLC</small>
    </article>
    <article class="metric-card">
      <span>Điện năng (E)</span>
      <strong>—</strong>
      <small>Chờ chỉ số điện năng tích lũy</small>
    </article>
    <article class="metric-card">
      <span>Hạn mức (Quota)</span>
      <strong>Chưa thiết lập</strong>
      <small>Hạn mức do chủ nhà cấu hình trên hệ thống</small>
    </article>
    <article class="metric-card">
      <span>Dự báo (Forecast)</span>
      <strong>Benchmark offline</strong>
      <small>Không trình bày như dự báo vận hành thật</small>
    </article>
  `;
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
  
  // Keep a brief response delay so the static assistant remains readable.
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
      forecastTabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const scenario = tab.dataset.scenario;
      applyForecastScenario(scenario);
    });
  });
}

// Initial setup
renderMetrics();
renderWorkflow();
bindEvents();
animateForecastChart();
addMessage("bot", welcomeMessage);

if (window.location.hash === "#assistant") {
  setFloatingChatOpen(true);
}
