// ==================================================
// GUARDIÕES DO JARDIM - jogo.js
// Todo o código do jogo fica neste arquivo.
//
// Partes do código:
//  1. Pegar os elementos do HTML
//  2. Variáveis do jogo
//  3. Nível de dificuldade
//  4. Criar personagens
//  5. Mover personagens
//  6. Desenhar (cenário, abelha, inseto, placar)
//  7. Vidas e fim de jogo
//  8. Teclado e mouse
//  9. Loop do jogo e botão de iniciar
// ==================================================


// ---------- 1. PEGAR OS ELEMENTOS DO HTML ----------

const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');   // ctx é o "pincel" que desenha no canvas
const botaoIniciar = document.getElementById('botaoIniciar');


// ---------- 2. VARIÁVEIS DO JOGO ----------

let pontos = 0;
let vidas = 3;
let jogando = false;
let inseticida = 'azul';      // inseticida selecionado (muda com as teclas 1, 2 e 3)
let personagens = [];         // lista com as abelhas e os insetos que estão na tela
let quadro = 0;               // conta os quadros (usado para animar asas e patas)
let intervaloDoJogo = null;   // guarda o setInterval para poder parar o jogo

// Mensagem que aparece por um tempinho ("+10", "Cor errada!"...)
let mensagem = '';
let corMensagem = 'green';
let tempoMensagem = 0;

// Posição da mira (atualizada sempre que o mouse se mexe no canvas)
let miraX = 0;
let miraY = 0;
let mouseNoCanvas = false;

// Controle de quando o próximo personagem vai aparecer
let contadorAparicao = 0;
let proximaAparicao = 60;     // 60 quadros = 1 segundo

// Estas variáveis mudam de acordo com o nível (ver a função atualizarNivel)
let nivel = 'Fácil';
let velocidade = 1.5;
let aparicaoMinima = 90;
let aparicaoMaxima = 150;
let tempoNaTela = 420;
let chanceDeVirar = 0.01;

// Cores dos personagens e dos inseticidas
const cores = {
  azul: '#2d7ff9',
  vermelho: '#e5383b',
  amarelo: '#ffc93c'
};
const listaDeCores = ['azul', 'vermelho', 'amarelo'];

// Os 3 inseticidas que aparecem na barra de baixo do jogo.
// "x" é a posição de cada um na barra.
const inseticidas = [
  { cor: 'azul', tecla: '1', nome: 'Azul', x: 190 },
  { cor: 'vermelho', tecla: '2', nome: 'Vermelho', x: 335 },
  { cor: 'amarelo', tecla: '3', nome: 'Amarelo', x: 480 }
];

// Flores do cenário: as posições são sorteadas uma vez só
const flores = [];
const coresDasFlores = ['#f7a8c8', '#ffffff', '#cda8e6'];
for (let i = 0; i < 45; i++) {
  flores.push({
    x: Math.random() * canvas.width,
    y: 200 + Math.random() * 290,
    cor: coresDasFlores[Math.floor(Math.random() * coresDasFlores.length)]
  });
}


// Sorteia um número entre min e max
function sortear(min, max) {
  return min + Math.random() * (max - min);
}


// ---------- 3. NÍVEL DE DIFICULDADE ----------
// O nível depende de duas coisas:
//  - das VIDAS: quanto menos vidas, mais difícil (Fácil, Médio, Difícil);
//  - dos PONTOS: com 50 e com 100 pontos o jogo fica ainda mais rápido.
// Os tempos estão em quadros: 60 quadros = 1 segundo.

function atualizarNivel() {
  if (vidas === 3) {
    nivel = 'Fácil';
    velocidade = 1.5;          // pixels por quadro
    aparicaoMinima = 90;       // aparece alguém a cada 1,5 a 2,5 segundos
    aparicaoMaxima = 150;
    tempoNaTela = 420;         // fica 7 segundos na tela
    chanceDeVirar = 0.01;
  } else if (vidas === 2) {
    nivel = 'Médio';
    velocidade = 2.5;
    aparicaoMinima = 50;
    aparicaoMaxima = 100;
    tempoNaTela = 360;         // 6 segundos
    chanceDeVirar = 0.02;
  } else {
    nivel = 'Difícil';
    velocidade = 3.5;
    aparicaoMinima = 20;       // intervalo bem variado = mais imprevisível
    aparicaoMaxima = 100;
    tempoNaTela = 300;         // 5 segundos
    chanceDeVirar = 0.04;
  }

  // PARTE 2: os acertos também deixam o jogo mais difícil
  // (50 pontos = 5 acertos, 100 pontos = 10 acertos)
  if (pontos >= 100) {
    velocidade = velocidade * 1.5;           // 50% mais rápido
    aparicaoMinima = aparicaoMinima * 0.6;   // aparecem com mais frequência
    aparicaoMaxima = aparicaoMaxima * 0.6;
    nivel = nivel + ' ★★';
  } else if (pontos >= 50) {
    velocidade = velocidade * 1.25;          // 25% mais rápido
    aparicaoMinima = aparicaoMinima * 0.8;
    aparicaoMaxima = aparicaoMaxima * 0.8;
    nivel = nivel + ' ★';
  }
}


// ---------- 4. CRIAR PERSONAGENS ----------

// Sorteia uma velocidade para um lado ou para o outro
function velocidadeAleatoria() {
  let v = sortear(velocidade * 0.4, velocidade);
  if (Math.random() < 0.5) {
    v = -v;
  }
  return v;
}

function criarPersonagem() {
  // 40% de chance de ser abelha, 60% de ser inseto
  let tipo = 'inseto';
  if (Math.random() < 0.4) {
    tipo = 'abelha';
  }

  // sorteia uma das três cores
  const cor = listaDeCores[Math.floor(Math.random() * 3)];

  // cada personagem é um objeto com suas informações
  const personagem = {
    tipo: tipo,
    cor: cor,
    x: sortear(60, canvas.width - 60),     // posição sorteada na tela
    y: sortear(110, canvas.height - 110),
    vx: velocidadeAleatoria(),             // velocidade na horizontal
    vy: velocidadeAleatoria(),             // velocidade na vertical
    tempo: tempoNaTela,                    // quanto tempo ainda fica na tela
    raio: 28                               // tamanho usado para saber se o clique acertou
  };

  personagens.push(personagem);
}

// Conta os quadros e, quando chega a hora, cria um personagem novo
function controlarAparicoes() {
  contadorAparicao++;

  if (contadorAparicao >= proximaAparicao) {
    if (personagens.length < 4) {          // no máximo 4 ao mesmo tempo
      criarPersonagem();
    }
    contadorAparicao = 0;
    proximaAparicao = sortear(aparicaoMinima, aparicaoMaxima);   // próximo tempo é sorteado
  }
}


// ---------- 5. MOVER PERSONAGENS ----------

function moverPersonagens() {
  // o laço vai de trás para frente porque podemos remover itens da lista
  for (let i = personagens.length - 1; i >= 0; i--) {
    const p = personagens[i];

    // anda
    p.x = p.x + p.vx;
    p.y = p.y + p.vy;

    // bateu na parede: volta para o outro lado
    if (p.x < 40) {
      p.x = 40;
      p.vx = -p.vx;
    }
    if (p.x > canvas.width - 40) {
      p.x = canvas.width - 40;
      p.vx = -p.vx;
    }
    if (p.y < 90) {
      p.y = 90;
      p.vy = -p.vy;
    }
    if (p.y > canvas.height - 100) {      // não desce até a barra de inseticidas
      p.y = canvas.height - 100;
      p.vy = -p.vy;
    }

    // de vez em quando muda de direção sozinho (movimento imprevisível)
    if (Math.random() < chanceDeVirar) {
      p.vx = velocidadeAleatoria();
      p.vy = velocidadeAleatoria();
    }

    // diminui o tempo na tela; quando acaba, o personagem vai embora
    p.tempo--;
    if (p.tempo <= 0) {
      personagens.splice(i, 1);    // remove da lista

      if (p.tipo === 'inseto') {
        perderVida('Um inseto escapou!');
        if (jogando === false) {
          return;                  // o jogo acabou, não precisa continuar
        }
      }
    }
  }
}


// ---------- 6. DESENHAR ----------

// Desenha um círculo preenchido (função de ajuda para não repetir código)
function circulo(x, y, raio, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2);
  ctx.fill();
}

function desenharCenario() {
  // céu
  ctx.fillStyle = '#a9ddf3';
  ctx.fillRect(0, 0, canvas.width, 190);

  // sol
  circulo(690, 100, 35, '#fff3c4');

  // grama
  ctx.fillStyle = '#7cc35a';
  ctx.fillRect(0, 190, canvas.width, canvas.height - 190);

  // arbustos (uma fileira de círculos verdes)
  for (let x = 0; x <= canvas.width; x = x + 40) {
    circulo(x, 192, 26, '#4e9e45');
  }

  // flores
  for (let i = 0; i < flores.length; i++) {
    desenharFlor(flores[i]);
  }
}

function desenharFlor(flor) {
  // caule
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(flor.x, flor.y);
  ctx.lineTo(flor.x, flor.y + 14);
  ctx.stroke();

  // quatro pétalas e o miolo
  circulo(flor.x - 5, flor.y, 4.5, flor.cor);
  circulo(flor.x + 5, flor.y, 4.5, flor.cor);
  circulo(flor.x, flor.y - 5, 4.5, flor.cor);
  circulo(flor.x, flor.y + 5, 4.5, flor.cor);
  circulo(flor.x, flor.y, 3, '#9c6b30');
}

// ABELHA: corpo com listras, asas brancas, olho e sorriso
function desenharAbelha(p) {
  const x = p.x;
  const y = p.y;

  // asas: mudam de tamanho a cada 5 quadros para parecer que estão batendo
  let tamanhoAsa = 14;
  if (quadro % 10 < 5) {
    tamanhoAsa = 10;
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x - 7, y - 20, 9, tamanhoAsa, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + 7, y - 20, 9, tamanhoAsa, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ferrão (triângulo)
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.moveTo(x - 24, y - 5);
  ctx.lineTo(x - 36, y);
  ctx.lineTo(x - 24, y + 5);
  ctx.fill();

  // corpo
  ctx.fillStyle = cores[p.cor];
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // listras pretas
  ctx.fillStyle = '#222222';
  ctx.fillRect(x - 12, y - 16, 6, 32);
  ctx.fillRect(x + 1, y - 17, 6, 34);

  // contorno do corpo
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 18, 0, 0, Math.PI * 2);
  ctx.stroke();

  // olho
  circulo(x + 15, y - 5, 5, 'white');
  circulo(x + 16, y - 5, 2.5, '#222222');

  // sorriso
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 14, y + 3, 6, 0.3, Math.PI - 0.3);
  ctx.stroke();
}

// INSETO INVASOR: casco com manchas, cabeça preta, olhos vermelhos e patas
function desenharInseto(p) {
  const x = p.x;
  const y = p.y;

  // patas: 3 linhas atravessando o corpo; mexem a cada 8 quadros
  let mexer = 3;
  if (quadro % 16 < 8) {
    mexer = -3;
  }
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 12 + mexer, y - 28);
    ctx.lineTo(x + i * 12 - mexer, y + 28);
    ctx.stroke();
  }

  // antenas
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 5);
  ctx.lineTo(x + 42, y - 16);
  ctx.moveTo(x + 30, y + 5);
  ctx.lineTo(x + 42, y + 16);
  ctx.stroke();

  // casco
  ctx.fillStyle = cores[p.cor];
  ctx.beginPath();
  ctx.ellipse(x, y, 25, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // linha no meio do casco
  ctx.beginPath();
  ctx.moveTo(x - 25, y);
  ctx.lineTo(x + 20, y);
  ctx.stroke();

  // manchas
  circulo(x - 11, y - 9, 4, '#222222');
  circulo(x + 4, y - 11, 3.5, '#222222');
  circulo(x - 9, y + 10, 4, '#222222');
  circulo(x + 6, y + 10, 3.5, '#222222');

  // cabeça
  circulo(x + 27, y, 11, '#222222');

  // olhos vermelhos (cara de bravo)
  circulo(x + 30, y - 5, 3.5, 'white');
  circulo(x + 30, y + 5, 3.5, 'white');
  circulo(x + 31, y - 5, 2, '#e5383b');
  circulo(x + 31, y + 5, 2, '#e5383b');
}

function desenharPersonagens() {
  for (let i = 0; i < personagens.length; i++) {
    const p = personagens[i];

    if (p.tipo === 'abelha') {
      desenharAbelha(p);
    } else {
      desenharInseto(p);

      // aviso "!" quando falta menos de 1,5 segundo para o inseto fugir
      if (p.tempo < 90) {
        circulo(p.x, p.y - 42, 12, 'white');
        ctx.fillStyle = '#c62828';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', p.x, p.y - 35);
      }
    }
  }
}

// Placar no topo: pontos, nível e vidas
function desenharPlacar() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(0, 0, canvas.width, 50);

  ctx.textAlign = 'left';
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#1e4a2e';
  ctx.fillText('Pontos: ' + pontos, 15, 32);
  ctx.fillText('Nível: ' + nivel, 200, 32);
  ctx.fillText('Vidas:', 640, 32);

  // um coração para cada vida
  let coracoes = '';
  for (let i = 0; i < vidas; i++) {
    coracoes = coracoes + '♥ ';
  }
  ctx.fillStyle = '#e5383b';
  ctx.fillText(coracoes, 710, 32);
}

// Barra de baixo com os 3 inseticidas. O selecionado fica destacado.
function desenharInseticidas() {
  // fundo da barra
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(180, 428, 440, 68);

  for (let i = 0; i < inseticidas.length; i++) {
    const ins = inseticidas[i];

    // destaque do inseticida selecionado: fundo claro e borda grossa da cor dele
    if (ins.cor === inseticida) {
      ctx.fillStyle = '#fff4d1';
      ctx.fillRect(ins.x, 434, 130, 56);
      ctx.strokeStyle = cores[ins.cor];
      ctx.lineWidth = 4;
      ctx.strokeRect(ins.x, 434, 130, 56);
    }

    // lata: tampa cinza + corpo colorido com contorno
    ctx.fillStyle = '#999999';
    ctx.fillRect(ins.x + 16, 440, 14, 8);
    ctx.fillStyle = cores[ins.cor];
    ctx.fillRect(ins.x + 10, 448, 26, 36);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2;
    ctx.strokeRect(ins.x + 10, 448, 26, 36);

    // número da tecla escrito na lata
    ctx.fillStyle = 'white';
    if (ins.cor === 'amarelo') {
      ctx.fillStyle = '#1e4a2e';   // texto escuro na lata amarela
    }
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(ins.tecla, ins.x + 23, 472);

    // nome do inseticida
    ctx.fillStyle = '#1e4a2e';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(ins.nome, ins.x + 44, 468);
  }
}

// Faz o caminho da mira: um círculo com uma cruz no meio
function tracarMira() {
  ctx.beginPath();
  ctx.arc(miraX, miraY, 18, 0, Math.PI * 2);   // círculo
  ctx.moveTo(miraX - 12, miraY);                // linha horizontal da cruz
  ctx.lineTo(miraX + 12, miraY);
  ctx.moveTo(miraX, miraY - 12);                // linha vertical da cruz
  ctx.lineTo(miraX, miraY + 12);
  ctx.stroke();
}

// Desenha a mira na cor do inseticida selecionado
function desenharMira() {
  if (mouseNoCanvas === false) {
    return;   // mouse fora do canvas: não desenha
  }

  // 1º: um contorno branco mais grosso, para a mira aparecer em qualquer fundo
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 6;
  tracarMira();

  // 2º: por cima, a mira na cor do inseticida
  ctx.strokeStyle = cores[inseticida];
  ctx.lineWidth = 3;
  tracarMira();
}

function mostrarMensagem(texto, cor) {
  mensagem = texto;
  corMensagem = cor;
  tempoMensagem = 60;   // aparece por 1 segundo
}

function desenharMensagem() {
  if (tempoMensagem > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Arial';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'white';
    ctx.strokeText(mensagem, canvas.width / 2, 90);
    ctx.fillStyle = corMensagem;
    ctx.fillText(mensagem, canvas.width / 2, 90);
    tempoMensagem--;
  }
}

// Tela antes de começar
function desenharTelaInicial() {
  desenharCenario();
  ctx.fillStyle = 'rgba(30, 74, 46, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5b700';
  ctx.font = 'bold 44px Arial';
  ctx.fillText('Let It Bee!', canvas.width / 2, 190);

  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Teclas 1, 2 e 3 escolhem o inseticida. Clique para borrifar.', canvas.width / 2, 250);
  ctx.fillText('Elimine os insetos da mesma cor e deixe as abelhas passarem!', canvas.width / 2, 285);
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Clique em "Iniciar jogo" para começar', canvas.width / 2, 350);
}

// Tela de fim de jogo
function desenharTelaFinal() {
  desenharCenario();
  desenharPlacar();
  ctx.fillStyle = 'rgba(30, 74, 46, 0.8)';
  ctx.fillRect(0, 50, canvas.width, canvas.height - 50);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5b700';
  ctx.font = 'bold 50px Arial';
  ctx.fillText('Fim de jogo!', canvas.width / 2, 220);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('Pontuação final: ' + pontos, canvas.width / 2, 280);
  ctx.font = '20px Arial';
  ctx.fillText('Clique em "Jogar novamente" para tentar de novo', canvas.width / 2, 340);
}


// ---------- 7. VIDAS E FIM DE JOGO ----------

function perderVida(texto) {
  vidas = vidas - 1;
  mostrarMensagem(texto, '#c62828');

  if (vidas <= 0) {
    fimDeJogo();
  } else {
    atualizarNivel();   // menos vidas = jogo mais difícil
  }
}

function fimDeJogo() {
  jogando = false;
  clearInterval(intervaloDoJogo);   // para o loop do jogo
  canvas.style.cursor = 'default';  // a seta do mouse volta
  desenharTelaFinal();
  botaoIniciar.disabled = false;
  botaoIniciar.textContent = 'Jogar novamente';
}


// ---------- 8. TECLADO E MOUSE ----------

// Teclas 1, 2 e 3 escolhem o inseticida
document.addEventListener('keydown', function (evento) {
  if (evento.key === '1') {
    inseticida = 'azul';
  } else if (evento.key === '2') {
    inseticida = 'vermelho';
  } else if (evento.key === '3') {
    inseticida = 'amarelo';
  }
});

// Guarda a posição do mouse para desenhar a mira
canvas.addEventListener('mousemove', function (evento) {
  const retangulo = canvas.getBoundingClientRect();
  const escala = canvas.width / retangulo.width;
  miraX = (evento.clientX - retangulo.left) * escala;
  miraY = (evento.clientY - retangulo.top) * escala;
  mouseNoCanvas = true;
});

// Quando o mouse sai do canvas, a mira some
canvas.addEventListener('mouseleave', function () {
  mouseNoCanvas = false;
});

// Clique no canvas dispara o inseticida
canvas.addEventListener('click', function (evento) {
  if (jogando === false) {
    return;
  }

  // Descobre onde foi o clique DENTRO do canvas.
  // A "escala" corrige a posição caso o canvas esteja menor na tela (ex.: celular).
  const retangulo = canvas.getBoundingClientRect();
  const escala = canvas.width / retangulo.width;
  const mouseX = (evento.clientX - retangulo.left) * escala;
  const mouseY = (evento.clientY - retangulo.top) * escala;

  // Clicou em uma das latas da barra? Então escolhe esse inseticida.
  for (let i = 0; i < inseticidas.length; i++) {
    const ins = inseticidas[i];
    if (mouseX > ins.x && mouseX < ins.x + 130 && mouseY > 434 && mouseY < 490) {
      inseticida = ins.cor;
      return;
    }
  }

  // Verifica se o clique acertou algum personagem
  for (let i = personagens.length - 1; i >= 0; i--) {
    const p = personagens[i];

    // distância entre o clique e o centro do personagem
    const dx = mouseX - p.x;
    const dy = mouseY - p.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < p.raio) {
      if (p.tipo === 'abelha') {
        // atingiu uma abelha: -1 vida
        personagens.splice(i, 1);
        perderVida('Você atingiu uma abelha!');
      } else if (p.cor === inseticida) {
        // inseto com a cor certa: +10 pontos e ele some
        personagens.splice(i, 1);
        pontos = pontos + 10;
        mostrarMensagem('+10', '#23753a');

        // com 50 e com 100 pontos o jogo fica mais difícil
        atualizarNivel();
        if (pontos === 50 || pontos === 100) {
          mostrarMensagem('+10  Ficou mais difícil!', '#23753a');
        }
      } else {
        // inseto com a cor errada: -1 vida (o inseto continua)
        perderVida('Cor errada!');
      }
      return;   // um clique atinge só um personagem
    }
  }

  // Se chegou aqui, o clique foi em um espaço vazio: nada acontece
});


// ---------- 9. LOOP DO JOGO E BOTÃO DE INICIAR ----------

// Esta função roda 60 vezes por segundo enquanto o jogo está ativo
function loopDoJogo() {
  quadro++;
  controlarAparicoes();
  moverPersonagens();

  if (jogando === false) {
    return;   // o jogo pode ter acabado durante moverPersonagens
  }

  // apaga tudo e desenha de novo
  desenharCenario();
  desenharPersonagens();
  desenharPlacar();
  desenharInseticidas();
  desenharMensagem();
  desenharMira();
}

function iniciarJogo() {
  // volta tudo para o começo
  pontos = 0;
  vidas = 3;
  personagens = [];
  inseticida = 'azul';
  quadro = 0;
  contadorAparicao = 0;
  proximaAparicao = 60;
  tempoMensagem = 0;
  atualizarNivel();

  jogando = true;
  canvas.style.cursor = 'none';   // esconde a seta do mouse: o jogo desenha a mira
  botaoIniciar.disabled = true;
  botaoIniciar.blur();

  clearInterval(intervaloDoJogo);                    // garante que só existe um loop
  intervaloDoJogo = setInterval(loopDoJogo, 1000 / 60);
}

botaoIniciar.addEventListener('click', iniciarJogo);

// Quando a página abre, mostra a tela inicial
desenharTelaInicial();
