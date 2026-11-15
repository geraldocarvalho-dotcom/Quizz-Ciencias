// COLE AQUI A URL GERADA NO APPS SCRIPT (terminada em /exec):
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxjClpZTIe6vJFiqt-teayJt6gGWhnvyPcSPDOSo4-FGnGNhvc2G-2_P1k5Dp5dH2zrYA/exec";

const TEMPO_POR_PERGUNTA = 30;

let dadosJogador = { nome: "", escola: "", turma: "", idade: "", email: "" };
let perguntasJogo = [];
let indice = 0;
let pontos = 0;
let acertos = 0;
let vidas = 3;
let opcaoSelecionada = 0;
let bloqueado = false;
let tempoRestante = TEMPO_POR_PERGUNTA;
let intervaloTempo = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSom(tipo) {
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (tipo === "acerto") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } else {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.setValueAtTime(130, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
}

function limparFoco() {
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

function mostrarTela(id) {
  limparFoco();
  ["tela-menu", "tela-nome", "tela-jogo", "tela-fim"].forEach(function (tela) {
    document.getElementById(tela).classList.add("oculto");
  });
  document.getElementById(id).classList.remove("oculto");
}

function telaAtiva(id) {
  return !document.getElementById(id).classList.contains("oculto");
}

function irParaNome() {
  mostrarTela("tela-nome");
  setTimeout(function () {
    document.getElementById("input-nome").focus();
  }, 50);
}

function iniciarQuiz() {
  const nome = document.getElementById("input-nome").value.trim();
  const escola = document.getElementById("input-escola").value.trim();
  const turma = document.getElementById("input-turma").value.trim();
  const idade = document.getElementById("input-idade").value.trim();
  const email = document.getElementById("input-email").value.trim();

  if (!nome || !escola || !turma || !idade || !email) {
    alert("Por favor, preencha todos os campos antes de começar!");
    const campos = ["input-nome", "input-escola", "input-turma", "input-idade", "input-email"];
    for (let i = 0; i < campos.length; i++) {
      const el = document.getElementById(campos[i]);
      if (!el.value.trim()) {
        el.focus();
        break;
      }
    }
    return;
  }

  dadosJogador = { nome: nome, escola: escola, turma: turma, idade: idade, email: email };
  perguntasJogo = PERGUNTAS.slice().sort(function () { return Math.random() - 0.5; });
  indice = 0;
  pontos = 0;
  acertos = 0;
  vidas = 3;

  mostrarTela("tela-jogo");
  carregarPergunta();
}

function atualizarSelecaoVisual() {
  const botoes = document.querySelectorAll("#opcoes-container .btn");
  for (let i = 0; i < botoes.length; i++) {
    botoes[i].classList.toggle("selecionado", i === opcaoSelecionada);
  }
}

function iniciarCronometro() {
  clearInterval(intervaloTempo);
  tempoRestante = TEMPO_POR_PERGUNTA;
  const elTempo = document.getElementById("hud-tempo");
  elTempo.classList.remove("urgente");
  elTempo.textContent = "⏱️ " + tempoRestante + "s";

  intervaloTempo = setInterval(function () {
    tempoRestante--;
    elTempo.textContent = "⏱️ " + tempoRestante + "s";
    if (tempoRestante <= 5) elTempo.classList.add("urgente");
    if (tempoRestante <= 0) {
      clearInterval(intervaloTempo);
      tempoEsgotado();
    }
  }, 1000);
}

function tempoEsgotado() {
  if (bloqueado) return;
  bloqueado = true;

  const atual = perguntasJogo[indice];
  const botoes = document.querySelectorAll("#opcoes-container .btn");
  for (let i = 0; i < botoes.length; i++) {
    botoes[i].disabled = true;
    botoes[i].classList.remove("selecionado");
  }

  botoes[atual.correta].classList.add("correta");
  const feedback = document.getElementById("texto-feedback");
  feedback.style.color = "#e14141";
  feedback.textContent = "Tempo esgotado! ⏰";
  document.getElementById("cientista-jogo").textContent = "😱";
  vidas--;
  tocarSom("erro");

  setTimeout(proximaEtapa, 1500);
}

function proximaEtapa() {
  indice++;
  if (vidas <= 0 || indice >= perguntasJogo.length) {
    finalizarQuiz();
  } else {
    carregarPergunta();
  }
}

function carregarPergunta() {
  limparFoco();
  bloqueado = false;
  opcaoSelecionada = 0;

  const atual = perguntasJogo[indice];
  const coracoes = "❤️".repeat(vidas) + "🖤".repeat(3 - vidas);

  document.getElementById("hud-info").textContent = "Pergunta " + (indice + 1) + "/" + perguntasJogo.length + " | Pts: " + pontos + " | Vidas: " + coracoes;
  document.getElementById("hud-tema").textContent = "Tema: " + atual.categoria;
  document.getElementById("texto-pergunta").textContent = atual.pergunta;
  document.getElementById("texto-feedback").textContent = "";
  document.getElementById("cientista-jogo").textContent = "🧑‍🔬";

  const container = document.getElementById("opcoes-container");
  container.innerHTML = "";

  atual.opcoes.forEach(function (opcao, i) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = String.fromCharCode(65 + i) + ") " + opcao;
    btn.onmouseenter = function () {
      if (!bloqueado) {
        opcaoSelecionada = i;
        atualizarSelecaoVisual();
      }
    };
    btn.onclick = function () {
      limparFoco();
      verificarResposta(i, btn);
    };
    container.appendChild(btn);
  });

  atualizarSelecaoVisual();
  iniciarCronometro();
}
function verificarResposta(escolha, botaoClicado) {
  if (bloqueado) return;
  bloqueado = true;
  clearInterval(intervaloTempo);
  limparFoco();

  const atual = perguntasJogo[indice];
  const botoes = document.querySelectorAll("#opcoes-container .btn");
  const feedback = document.getElementById("texto-feedback");
  const cientista = document.getElementById("cientista-jogo");

  for (let i = 0; i < botoes.length; i++) {
    botoes[i].disabled = true;
    botoes[i].classList.remove("selecionado");
  }

  if (escolha === atual.correta) {
    botaoClicado.classList.add("correta");
    feedback.style.color = "#2dc86e";
    feedback.textContent = "Resposta certa! +10 pontos 🎉";
    cientista.textContent = "🤩";
    pontos += 10;
    acertos++;
    tocarSom("acerto");
  } else {
    botaoClicado.classList.add("errada");
    botoes[atual.correta].classList.add("correta");
    feedback.style.color = "#e14141";
    feedback.textContent = "Ops! Resposta incorreta.";
    cientista.textContent = "🤯";
    vidas--;
    tocarSom("erro");
  }

  setTimeout(proximaEtapa, 1500);
}

function finalizarQuiz() {
  clearInterval(intervaloTempo);
  mostrarTela("tela-fim");

  const titulo = document.getElementById("titulo-fim");
  const cientista = document.getElementById("cientista-fim");

  if (vidas <= 0) {
    titulo.textContent = "FIM DE JOGO!";
    cientista.textContent = "💥";
  } else {
    titulo.textContent = "DESAFIO CONCLUÍDO!";
    cientista.textContent = "🏆";
  }

  document.getElementById("resumo-fim").textContent =
    dadosJogador.nome + ", você fez " + pontos + " pontos (" + acertos + "/" + perguntasJogo.length + " acertos)!";

  enviarParaPlanilha();
}

function enviarParaPlanilha() {
  const status = document.getElementById("status-envio");

  if (!navigator.onLine) {
    status.style.color = "#e14141";
    status.textContent = "Sem conexão com a internet. Resultado não enviado.";
    document.getElementById("lista-ranking").textContent = "Ranking indisponível offline.";
    return;
  }

  const dados = new URLSearchParams();
  dados.append("nome", dadosJogador.nome);
  dados.append("escola", dadosJogador.escola);
  dados.append("turma", dadosJogador.turma);
  dados.append("idade", dadosJogador.idade);
  dados.append("email", dadosJogador.email);
  dados.append("pontos", String(pontos));
  dados.append("acertos", String(acertos));

  fetch(URL_APPS_SCRIPT, { method: "POST", mode: "no-cors", body: dados })
    .then(function () {
      status.style.color = "#2dc86e";
      status.textContent = "Resultado salvo automaticamente na planilha! ✅";
      setTimeout(carregarRanking, 1000);
    })
    .catch(function () {
      status.style.color = "#e14141";
      status.textContent = "Erro ao salvar na planilha.";
    });
}

function carregarRanking() {
  const antigo = document.getElementById("script-ranking");
  if (antigo) antigo.remove();

  const script = document.createElement("script");
  script.id = "script-ranking";
  script.src = URL_APPS_SCRIPT + "?callback=exibirRanking&t=" + Date.now();
  script.onerror = function () {
    document.getElementById("lista-ranking").textContent = "Não foi possível carregar o ranking agora.";
  };
  document.body.appendChild(script);
}

function exibirRanking(ranking) {
  const lista = document.getElementById("lista-ranking");

  if (!ranking || ranking.length === 0) {
    lista.textContent = "Nenhuma pontuação registrada ainda.";
    return;
  }

  lista.innerHTML = "";
  const medalhas = ["🥇", "🥈", "🥉"];

  ranking.forEach(function (item, index) {
    const div = document.createElement("div");
    div.className = "ranking-item";

    if (item.nome.toLowerCase() === dadosJogador.nome.toLowerCase() && item.pontos === pontos) {
      div.classList.add("destaque-jogador");
    }

    const posicao = medalhas[index] || (index + 1) + "º";
    div.innerHTML =
      '<span class="ranking-pos">' + posicao + '</span>' +
      '<span class="ranking-nome">' + item.nome + '</span>' +
      '<span class="ranking-turma">' + item.turma + '</span>' +
      '<span class="ranking-pts">' + item.pontos + ' pts</span>';
    lista.appendChild(div);
  });
}

function gerenciarTeclado(e) {
  if (telaAtiva("tela-menu")) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      irParaNome();
    }
    return;
  }

  if (telaAtiva("tela-nome")) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const ordem = ["input-nome", "input-escola", "input-turma", "input-idade", "input-email"];
      const atualId = document.activeElement ? document.activeElement.id : "";
      const pos = ordem.indexOf(atualId);
      if (pos !== -1 && pos < ordem.length - 1) {
        document.getElementById(ordem[pos + 1]).focus();
      } else {
        iniciarQuiz();
      }
    }
    return;
  }

  if (telaAtiva("tela-fim")) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      location.reload();
    }
    return;
  }

  if (telaAtiva("tela-jogo") && !bloqueado) {
    const botoes = document.querySelectorAll("#opcoes-container .btn");
    const total = botoes.length;
    if (total === 0) return;

    const tecla = e.key.toLowerCase();

    if (e.key === "ArrowDown" || e.key === "Down") {
      e.preventDefault();
      e.stopPropagation();
      opcaoSelecionada = (opcaoSelecionada + 1) % total;
      atualizarSelecaoVisual();
    } else if (e.key === "ArrowUp" || e.key === "Up") {
      e.preventDefault();
      e.stopPropagation();
      opcaoSelecionada = (opcaoSelecionada - 1 + total) % total;
      atualizarSelecaoVisual();
    } else if (tecla === "1" || tecla === "2" || tecla === "3" || tecla === "4") {
      const idx = parseInt(tecla, 10) - 1;
      if (idx < total) {
        opcaoSelecionada = idx;
        atualizarSelecaoVisual();
      }
    } else if (tecla === "a" || tecla === "b" || tecla === "c" || tecla === "d") {
      const idx = tecla.charCodeAt(0) - 97;
      if (idx < total) {
        opcaoSelecionada = idx;
        atualizarSelecaoVisual();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      verificarResposta(opcaoSelecionada, botoes[opcaoSelecionada]);
    }
  }
}

document.addEventListener("keydown", gerenciarTeclado, true);


