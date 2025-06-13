// ========== TOASTIFY ==========
function injectToastStyles() {
  if (!document.querySelector("#toastify-style")) {
    const link = document.createElement("link");
    link.id = "toastify-style";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
    document.head.appendChild(link);
  }
}

function sendToast(text, duration = 3000) {
  Toastify({
    text,
    duration,
    gravity: "top",
    position: "right",
    backgroundColor: "#ff0055",
    stopOnFocus: true,
  }).showToast();
}

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();

    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// ========== PEGAR IDS DO URL ==========
function pegarTaskIdEAnswerIdDoURL() {
  const url = new URL(window.location.href);
  const paths = url.pathname.split("/");

  const taskId = paths.includes("task") ? paths[paths.indexOf("task") + 1] : null;
  const answerId = paths.includes("answer") ? paths[paths.indexOf("answer") + 1] : null;

  return { taskId, answerId };
}

// ========== PEGAR TOKEN AUTOMÁTICO ==========
function pegarTokenAutomatico() {
  const valor = localStorage.getItem("persist:root");
  if (!valor) return null;

  try {
    const persistido = JSON.parse(valor);
    const auth = JSON.parse(persistido.auth);
    const token = auth?.accessToken;
    return token;
  } catch (err) {
    console.error("[HCK TAREFAS] Erro ao pegar token:", err);
    return null;
  }
}

// ========== PEGAR RESPOSTA ==========
async function pegarRespostasCorretas(taskId, answerId, headers) {
  const url = `https://edusp-api.ip.tv/tms/task/${taskId}/answer/${answerId}`;
  sendToast("Pegando respostas certas...", 2000);

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) throw new Error(`Erro ${response.status} ao pegar resposta`);

  const json = await response.json();
  return json;
}

// ========== TRANSFORMAR ==========
function transformJson(originalJson) {
  const transformed = { answers: [] };
  if (!originalJson?.answers) return transformed;

  originalJson.answers.forEach((resposta) => {
    if (resposta?.alternative_id) {
      transformed.answers.push({
        question_id: resposta.question_id,
        alternative_id: resposta.alternative_id,
      });
    } else if (resposta?.text_answer) {
      transformed.answers.push({
        question_id: resposta.question_id,
        text_answer: resposta.text_answer,
      });
    }
  });

  return transformed;
}

// ========== ENVIAR ==========
async function enviarRespostasCorrigidas(respostasAnteriores, taskId, answerId, headers) {
  const url = `https://edusp-api.ip.tv/tms/task/${taskId}/answer/${answerId}`;
  sendToast("Enviando respostas corrigidas...", 2000);

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(respostasAnteriores)
    });

    if (!response.ok) {
      console.error(`[HCK TAREFAS] Erro ${response.status} ao enviar respostas.`);
      throw new Error(`Erro ${response.status} ao enviar respostas.`);
    }

    sendToast("Respostas enviadas com sucesso! 🔥", 3000);
    console.log("[HCK TAREFAS] Respostas corrigidas enviadas com sucesso!");
  } catch (error) {
    console.error("[HCK TAREFAS] Falha ao enviar respostas:", error);
    sendToast(`Erro ao enviar: ${error.message}`, 4000);
  }
}

// ========== FUNÇÃO PRINCIPAL ==========
async function hckCorrigir() {
  try {
    injectToastStyles();
    await loadScript("https://cdn.jsdelivr.net/npm/toastify-js");

    const token = pegarTokenAutomatico();
    if (!token) {
      sendToast("token n encontrado no localStorage 😓", 5000);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const { taskId, answerId } = pegarTaskIdEAnswerIdDoURL();

    if (!taskId || !answerId) {
      sendToast("taskId ou answerId n encontrados na URL 😓", 5000);
      return;
    }

    const jsonOriginal = await pegarRespostasCorretas(taskId, answerId, headers);
    const respostasTransformadas = transformJson(jsonOriginal);
    await enviarRespostasCorrigidas(respostasTransformadas, taskId, answerId, headers);
  } catch (err) {
    console.error("[HCK TAREFAS] Erro geral:", err);
    sendToast("Falha geral ao executar script", 4000);
  }
}

// ========== EXECUTAR ==========
hckCorrigir();
