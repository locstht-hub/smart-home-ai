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

const welcomeMessage =
  "Xin chào, mình là AI Project Assistant. Bạn có thể hỏi về PLC S7-1200, MFM384, luồng dữ liệu, app, server API, AI forecast hoặc hướng tích hợp model fine-tune.";

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
  metricGrid.innerHTML = knowledge.metrics
    .map(
      (item) => `
        <article class="metric-card">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
          <small>${item.note}</small>
        </article>
      `,
    )
    .join("");
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

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.textContent = text;
  floatingChatLog.appendChild(message);
  floatingChatLog.scrollTop = floatingChatLog.scrollHeight;
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
  addMessage("bot", findAnswer(cleaned));
}

function setFloatingChatOpen(isOpen) {
  floatingChatPanel.classList.toggle("is-open", isOpen);
  floatingChatToggle.setAttribute("aria-expanded", String(isOpen));

  if (isOpen) {
    window.setTimeout(() => floatingChatInput.focus(), 80);
  }
}

function bindEvents() {
  heroChatOpen.addEventListener("click", () => {
    setFloatingChatOpen(true);
  });

  floatingChatToggle.addEventListener("click", () => {
    setFloatingChatOpen(!floatingChatPanel.classList.contains("is-open"));
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setFloatingChatOpen(false);
    }
  });
}

renderMetrics();
renderWorkflow();
bindEvents();
addMessage("bot", welcomeMessage);
