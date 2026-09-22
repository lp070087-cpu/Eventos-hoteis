/* ============================================================
   EVENTOS PONTES HOTÉIS — Comportamento
   Sem dependências externas.
   ============================================================ */
(function () {
  'use strict';

  var REDUZ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LARGO = window.matchMedia('(min-width: 1025px)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ══════════════════════════════════════════════════════════
     1. ABERTURA CINEMATOGRÁFICA (typewriter)
     ══════════════════════════════════════════════════════════ */
  var intro    = $('#intro');
  var heroEl   = $('.hero');
  var CHAVE    = 'eph_intro_v1';

  var introAtiva = false;
  try { introAtiva = sessionStorage.getItem(CHAVE) !== '1'; } catch (e) { introAtiva = true; }

  function liberarHero() {
    if (heroEl) heroEl.classList.add('is-ready');
  }
  function fecharIntro(imediato) {
    if (!intro) { liberarHero(); return; }
    document.body.classList.remove('intro-lock');
    intro.classList.add('is-done');
    liberarHero();
    var t = imediato ? 0 : 950;
    setTimeout(function () { intro.style.display = 'none'; }, t);
    try { sessionStorage.setItem(CHAVE, '1'); } catch (e) {}
  }

  if (!intro || !introAtiva || REDUZ) {
    // visitante recorrente, ou movimento reduzido: pula a abertura
    if (intro) intro.style.display = 'none';
    document.body.classList.remove('intro-lock');
    liberarHero();
  } else {
    (function animarIntro() {
      var elWelcome = $('#tw-welcome');
      var elBrand   = $('#tw-brand');
      var elTag     = $('#tw-tag');
      var cWelcome  = $('#caret-welcome');
      var cBrand    = $('#caret-brand');
      var cTag      = $('#caret-tag');
      var skip      = $('#intro-skip');
      var vivo      = true;
      var timer     = [];

      function parar() {
        vivo = false;
        timer.forEach(clearTimeout);
        timer = [];
      }
      function espera(ms) {
        return new Promise(function (res) {
          var id = setTimeout(res, ms);
          timer.push(id);
        });
      }
      // digita com aceleracao no fim: ritmo humano, sem estourar o tempo
      function datilografar(el, texto, ms, caret) {
        return new Promise(function (res) {
          var i = 0;
          if (caret) caret.hidden = false;
          (function passo() {
            if (!vivo) return;
            el.textContent = texto.slice(0, ++i);
            if (i < texto.length) {
              var f = i / texto.length;               // 0 -> 1
              var d = ms * (f > 0.72 ? 0.45 : 1);     // acelera no fim
              var id = setTimeout(passo, d);
              timer.push(id);
            } else {
              res();
            }
          })();
        });
      }

      // a barra do rodapé acompanha toda a duração da abertura
      intro.classList.add('is-go');

      // saudação → marca → assinatura  (total ~4,6 s)
      datilografar(elWelcome, 'Seja bem-vindo à', 28, cWelcome)
        .then(function () { return espera(300); })
        .then(function () {
          cWelcome.classList.add('caret--hidden');
          return datilografar(elBrand, 'Eventos Pontes Hotéis', 58, cBrand);
        })
        .then(function () { return espera(480); })
        .then(function () {
          cBrand.classList.add('caret--hidden');
          return datilografar(elTag, 'Tudo em um só lugar.', 40, cTag);
        })
        .then(function () { return espera(800); })
        .then(function () { if (vivo) fecharIntro(); });

      if (skip) {
        skip.addEventListener('click', function () { parar(); fecharIntro(); });
      }
      document.addEventListener('keydown', function (e) {
        if (vivo && e.key === 'Escape') { parar(); fecharIntro(); }
      });
      // rede lenta não deve prender o visitante
      timer.push(setTimeout(function () {
        if (vivo) { parar(); fecharIntro(); }
      }, 7500));
    })();
  }

  /* ══════════════════════════════════════════════════════════
     2. CABEÇALHO — estado, esconder, link ativo
     ══════════════════════════════════════════════════════════ */
  var header = $('#header');
  var ultimoY = 0;

  function aoRolarHeader(y) {
    if (!header) return;
    header.classList.toggle('is-stuck', y > 60);
    var menuAberto = document.body.classList.contains('menu-open');
    if (!menuAberto && y > 520 && y > ultimoY + 4) header.classList.add('is-hidden');
    else if (y < ultimoY - 4 || y < 520) header.classList.remove('is-hidden');
    ultimoY = y;
  }

  // link ativo conforme a seção visível
  var navLinks = $$('.nav__a');
  var porId = {};
  navLinks.forEach(function (a) { porId[a.getAttribute('href').slice(1)] = a; });
  var secoesObservadas = Object.keys(porId)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && secoesObservadas.length) {
    var obsNav = new IntersectionObserver(function (entes) {
      entes.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = porId[en.target.id];
        if (!a) return;
        navLinks.forEach(function (o) { o.classList.remove('is-active'); });
        a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoesObservadas.forEach(function (s) { obsNav.observe(s); });
  }

  /* ══════════════════════════════════════════════════════════
     3. MENU MOBILE
     ══════════════════════════════════════════════════════════ */
  var burger = $('#burger');
  var menu   = $('#menu');
  var focoAnterior = null;

  function abrirMenu() {
    if (!menu) return;
    focoAnterior = document.activeElement;
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');
    if (header) header.classList.remove('is-hidden');
    var primeiro = $('.menu__a', menu);
    if (primeiro) setTimeout(function () { primeiro.focus(); }, 320);
  }
  function fecharMenu(devolverFoco) {
    if (!menu) return;
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    menu.setAttribute('aria-hidden', 'true');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menu');
    }
    if (devolverFoco !== false && focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }
  function menuAberto() { return document.body.classList.contains('menu-open'); }

  if (burger) {
    burger.addEventListener('click', function () {
      menuAberto() ? fecharMenu() : abrirMenu();
    });
  }
  // fecha ao escolher uma opção
  $$('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { fecharMenu(false); });
  });
  // fecha com ESC e prende o foco dentro do painel
  document.addEventListener('keydown', function (e) {
    if (!menuAberto()) return;
    if (e.key === 'Escape') { fecharMenu(); return; }
    if (e.key !== 'Tab') return;
    var foco = $$('a[href], button', menu).filter(function (el) { return el.offsetParent !== null; });
    if (!foco.length) return;
    var primeiro = foco[0], ultimo = foco[foco.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
  // se a tela crescer, o painel não pode ficar preso
  window.addEventListener('resize', function () {
    if (menuAberto() && window.innerWidth > 1100) fecharMenu(false);
  });
  // telas maiores que 1100px e sem JS sobreposto: nada a fazer
  if (LARGO && menu) {
    menu.setAttribute('aria-hidden', 'true');
    if (burger) burger.setAttribute('tabindex', '-1');
  }

  /* ══════════════════════════════════════════════════════════
     4. REVEAL NO SCROLL
     ══════════════════════════════════════════════════════════ */
  var alvos = $$('.reveal, .reveal-img, .rule');
  if ('IntersectionObserver' in window && !REDUZ) {
    var obsRev = new IntersectionObserver(function (entes) {
      entes.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          obsRev.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -12% 0px' });
    alvos.forEach(function (el) { obsRev.observe(el); });
  } else {
    alvos.forEach(function (el) { el.classList.add('is-in'); });
  }
  // Rede de segurança dos reveals.
  // Motivo: no instante em que o site.js roda (defer), as FOTOS da grade de
  // espaços ainda não chegaram. Os cartões são figuras de `aspect-ratio`
  // dentro de um grid, então medir a página nesse momento é medir uma página
  // que ainda não tem a altura final. Qualquer elemento alcançado por essa
  // leitura incompleta recebia `is-in` antes de entrar na tela — e, pior, um
  // revelável que só entra na faixa visível depois que a rede termina de
  // crescer a página podia ficar com `opacity: 0` (área vazia) até o
  // IntersectionObserver se recuperar.
  // Agora a rede roda duas vezes: uma no primeiro quadro e outra quando o
  // carregamento termina, sempre com a geometria já assentada, e faz uma
  // varredura de segurança com folga para nenhum revelável ficar invisível.
  var revealsPendentes = alvos.length;
  function varrerReveals() {
    var pendentes = 0;
    alvos.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      pendentes++;
      var r = el.getBoundingClientRect();
      // já assentado na parte de cima da janela: pode entrar sem esperar o IO
      if (r.top < window.innerHeight * 0.86) { el.classList.add('is-in'); return; }
      // Já passou da janela (ficou ACIMA dela) e continua invisível.
      // Este é o caso que produzia a parede vazia: os 5 cartões da grade de
      // espaços (.space.reveal-img) reservam a altura pelo `aspect-ratio` e só
      // pintam com `.is-in`. Quando a página é aberta/restaurada já abaixo
      // deles — ou quando o menu salta direto para uma âncora adiante — o
      // IntersectionObserver nunca dispara para quem ficou acima da tela: os
      // cartões continuavam ocupando ~1.040 px sem mostrar imagem nenhuma.
      if (r.bottom < 0) el.classList.add('is-in');
    });
    revealsPendentes = pendentes;
    return pendentes;
  }
  requestAnimationFrame(varrerReveals);
  // as fotos chegam depois e mudam a altura da página: reavalia com a
  // geometria final (e de novo no retorno pelo cache do navegador)
  window.addEventListener('load', varrerReveals);
  window.addEventListener('pageshow', varrerReveals);
  // saltos de âncora (o menu pula direto para uma seção): roda por 4 s em
  // intervalos de 400 ms — nunca por quadro, para não pesar na rolagem —
  // e para assim que não sobrar nenhum revelável invisível.
  var vigiaReveals = setInterval(function () {
    if (varrerReveals() === 0) clearInterval(vigiaReveals);
  }, 400);
  setTimeout(function () { clearInterval(vigiaReveals); }, 4000);

  /* ══════════════════════════════════════════════════════════
     5. NÚMEROS QUE CONTAM
     ══════════════════════════════════════════════════════════ */
  var contadores = $$('[data-count]');
  function formatar(v, alvo) {
    if (alvo >= 1000) return Math.round(v).toLocaleString('pt-BR');
    return String(Math.round(v));
  }
  if (contadores.length && 'IntersectionObserver' in window && !REDUZ) {
    var obsNum = new IntersectionObserver(function (entes) {
      entes.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        obsNum.unobserve(el);
        var alvo = parseFloat(el.getAttribute('data-count')) || 0;
        var sufixo = el.getAttribute('data-suffix') || '';
        var t0 = performance.now(), dur = 1500;
        (function passo(t) {
          var p = clamp((t - t0) / dur, 0, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = formatar(alvo * e, alvo) + (p === 1 ? sufixo : '');
          if (p < 1) requestAnimationFrame(passo);
        })(t0);
      });
    }, { threshold: 0.4 });
    contadores.forEach(function (el) { obsNum.observe(el); });
  }

  /* ══════════════════════════════════════════════════════════
     6. JORNADA — a foto é ESTÁTICA; só os textos mudam no scroll
     ══════════════════════════════════════════════════════════ */
  var secFilme  = $('#jornada');
  var secCta    = $('#orcamento');
  var filmeBar  = $('#filmBar');
  var filmePct  = $('#filmPct');
  var beats     = $$('.beat');

  var beatAtual = -1;

  // janelas numéricas lidas uma única vez
  var beatJanelas = beats.map(function (b) {
    return [parseFloat(b.getAttribute('data-show')), parseFloat(b.getAttribute('data-hide'))];
  });
  function marcarBeats(p) {
    var ativo = -1;
    for (var i = 0; i < beatJanelas.length; i++) {
      var w = beatJanelas[i];
      var on = p >= w[0] && p < w[1];
      if (on) ativo = i;
      if (beats[i].classList.contains('is-on') !== on) beats[i].classList.toggle('is-on', on);
    }
    beatAtual = ativo;
  }

  /* ── loop principal: scroll, parallax e Jornada num único rAF ── */
  var heroMedia = $('#heroMedia');
  var ctaBg     = $('#ctaBg');
  var waFloat   = $('#waFloat');

  function quadro() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    aoRolarHeader(y);

    // botão flutuante do WhatsApp
    if (waFloat) waFloat.classList.toggle('is-in', y > window.innerHeight * 0.55);

    // parallax do hero
    if (heroMedia && !REDUZ) {
      var hh = window.innerHeight;
      if (y < hh * 1.3) {
        heroMedia.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(2) + 'px,0) scale(1.02)';
      }
    }

    // janela visível — evita medir seções fora de tela
    var vh = window.innerHeight;

    // Jornada: a fotografia é ESTÁTICA (nenhum transform, nenhum zoom, nenhuma
    // troca de arquivo). O progresso serve só para o indicador e para marcar
    // qual TEXTO está ativo.
    if (secFilme) {
      var rSec = secFilme.getBoundingClientRect();
      if (rSec.bottom > -vh * 0.25 && rSec.top < vh * 1.4) {
        var altura = secFilme.offsetHeight - vh;
        var p = altura > 0 ? clamp(-rSec.top / altura, 0, 1) : 0;

        if (filmeBar) filmeBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        if (filmePct) filmePct.textContent = String(Math.round(p * 100)).padStart(2, '0');
        marcarBeats(p);
      }
    }

    // parallax do CTA final
    if (ctaBg && !REDUZ && secCta) {
      var r = secCta.getBoundingClientRect();
      if (r.bottom > -100 && r.top < vh + 100) {
        var prog = clamp((vh - r.top) / (vh + r.height), 0, 1);
        ctaBg.style.transform = 'translate3d(0,' + ((prog - 0.5) * -70).toFixed(2) + 'px,0)';
      }
    }

    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  /* ══════════════════════════════════════════════════════════
     7. VÍDEO DO INSTAGRAM NO PRÓPRIO CARTÃO (incorporação)
     ──────────────────────────────────────────────────────────
     Comportamento:
       • tocar no cartão / na imagem / no botão de play
         inicializa a incorporação DENTRO do cartão (não abre aba,
         não troca de página, não abre modal);
       • a capa só sai DEPOIS que a incorporação carrega, então
         nunca aparece moldura branca nem área vazia;
       • a seta do canto é um link real para a publicação original
         e para a propagação do clique (não inicia o player);
       • ao iniciar um, o anterior é removido — nunca dois áudios.
     ══════════════════════════════════════════════════════════ */
  var reels = $$('.reel');
  var reelAtivo = null;

  function desligarReel(reel) {
    if (!reel) return;
    var palco = reel.querySelector('.reel__stage');
    if (palco) palco.innerHTML = '';
    reel.classList.remove('is-ready', 'is-loading', 'is-erro');
    var img = reel.querySelector('img');
    if (img) img.style.display = '';
  }

  function ligarReel(reel) {
    if (!reel || reel.classList.contains('is-ready') || reel.classList.contains('is-loading')) return;
    var url = reel.getAttribute('data-ig');
    if (!url) return;
    if (reelAtivo && reelAtivo !== reel) desligarReel(reelAtivo);   // silêncio garantido
    reelAtivo = reel;

    var palco = reel.querySelector('.reel__stage');
    if (!palco) return;

    reel.classList.add('is-loading');
    reel.classList.remove('is-erro');

    // padrão oficial de incorporação do Instagram: a URL da publicação + "embed/"
    var embed = url.replace(/\/?$/, '/') + 'embed/';
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', embed);
    iframe.setAttribute('title', 'Vídeo publicado no perfil oficial da Eventos Pontes Hotéis');
    iframe.setAttribute('loading', 'eager');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');

    var resolvido = false;
    var vigia = setTimeout(function () {       // rede lenta / bloqueio / offline
      if (resolvido) return;
      resolvido = true;
      reel.classList.remove('is-loading');
      reel.classList.add('is-erro');
      palco.innerHTML = '';
      if (reelAtivo === reel) reelAtivo = null;
    }, 9000);

    iframe.addEventListener('load', function () {
      if (resolvido) return;
      resolvido = true;
      clearTimeout(vigia);
      reel.classList.remove('is-loading');
      reel.classList.add('is-ready');
    });
    iframe.addEventListener('error', function () {
      if (resolvido) return;
      resolvido = true;
      clearTimeout(vigia);
      reel.classList.remove('is-loading');
      reel.classList.add('is-erro');
      palco.innerHTML = '';
      if (reelAtivo === reel) reelAtivo = null;
    });

    palco.appendChild(iframe);
  }

  reels.forEach(function (reel) {
    var acerto = reel.querySelector('.reel__hit');
    var seta   = reel.querySelector('.reel__ext');

    if (acerto) {
      acerto.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        ligarReel(reel);
      });
    }
    // a seta é o ÚNICO caminho para o Instagram — e não toca o player
    if (seta) {
      seta.addEventListener('click', function (e) {
        e.stopPropagation();
      });
    }
  });

  // §8: parar o vídeo do cartão quando ele sai de vista — sem áudio solto
  if ('IntersectionObserver' in window && reels.length) {
    var obsReel = new IntersectionObserver(function (entes) {
      entes.forEach(function (en) {
        if (en.isIntersecting) return;
        var r = en.target;
        if (r === reelAtivo) { desligarReel(r); reelAtivo = null; }
      });
    }, { rootMargin: '160px 0px 160px 0px' });
    reels.forEach(function (r) { obsReel.observe(r); });
  }

  /* ══════════════════════════════════════════════════════════
     8. DETALHES
     ══════════════════════════════════════════════════════════ */
  var ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

  // rolagem suave respeitando reduced-motion, com compensação do cabeçalho
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (!id || id === '#') return;
    var destino = document.querySelector(id);
    if (!destino) return;
    e.preventDefault();
    var alturaCabecalho = header ? header.offsetHeight : 0;
    var topo = destino.getBoundingClientRect().top + window.pageYOffset - alturaCabecalho + 1;
    window.scrollTo({ top: topo, behavior: REDUZ ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  // imagens que falharem não deixam buraco
  $$('img').forEach(function (img) {
    img.addEventListener('error', function () {
      var p = img.parentElement;
      if (p) p.style.background = 'var(--navy-700)';
      img.style.visibility = 'hidden';
    });
  });
})();
