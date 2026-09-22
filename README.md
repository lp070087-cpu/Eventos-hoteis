# Eventos Pontes Hotéis — website de apresentação

Website estático (sem build, sem dependências) para a marca **Eventos Pontes Hotéis**.
Abre direto no navegador ou publica em qualquer hospedagem estática.

## Como executar localmente

Na pasta do projeto, rode um servidor estático simples:

```bash
# opção 1 — Node (não precisa instalar nada)
npx serve .

# opção 2 — PHP
php -S localhost:5173

# opção 3 — Python
python -m http.server 5173
```

Depois abra **http://localhost:5173** no navegador.

> Também funciona abrindo o `index.html` direto (duplo clique), mas o vídeo da
> seção “Jornada” só é lido corretamente por HTTP. Use o servidor para ver o site completo.

## Estrutura

```
index.html              página única com todas as seções
assets/
  css/base.css          tokens, tipografia, reset, botões, reveal
  css/site.css          estilo de cada seção e responsividade
  js/site.js            abertura, scroll, filme, menu, modal
  img/                  fotos curadas (JPG + WebP, 3 larguras cada)
  film/jornada.mp4      sequência cinematográfica dos espaços (26 s, 2,7 MB)
  film/jornada-poster.* capa do vídeo
```

## Observações

- **Fonte da verdade do conteúdo:** pasta `informaçoes do projeto`.
- **Fotos:** pasta `public` e `informaçoes do projeto` (recortadas e otimizadas).
- **Vídeos do Instagram:** ver `links.txt` — embutidos via endpoint oficial de embed,
  nunca baixados ou redistribuídos.
- **Pastas originais preservadas:** `public`, `informaçoes do projeto`, `links.txt`
  e `Sites de referencia` não foram alteradas.
- **Acessibilidade:** HTML semântico, foco visível, `alt` em todas as imagens,
  navegação por teclado e suporte a `prefers-reduced-motion`.
