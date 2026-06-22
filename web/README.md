# Whisper API · Frontend

Interface web em **Vite + React + TypeScript** para consumir a API FastAPI
de transcrição (`../app`).

## Stack

- **Vite 6** + **React 19** + **TypeScript**
- **Tailwind CSS 3** (tema preto/branco de alto contraste, sem cinzas)
- **shadcn-style** components (`cva`, `clsx`, `tailwind-merge`)
- **TanStack Router** (file-based, type-safe, prefetch on intent)
- **lucide-react** para ícones
- **zustand** para estado global leve (tema)
- **Sem proxy** — front fala direto com a API via `VITE_API_URL`

## Tema

- Light e dark com toggle no header (ícone sol/lua).
- Persistência em `localStorage` na chave `whisper-api.theme`.
- Apenas `#000` e `#fff` — sem tons de cinza. `--radius: 0` (bordas retas).
- Tipografia: `Inter` (corpo) + `JetBrains Mono` (títulos/dados).

## Modo foco

A home é um grid de cards. Ao clicar em um card, o app navega para a rota
daquela funcionalidade e renderiza apenas:

- o conteúdo da tarefa
- um único botão "Voltar" (seta para esquerda) no header

Sem navegação lateral, sem cabeçalho cheio, sem distrações.

## Estrutura

```
web/
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── components/
    │   ├── layout/focus-layout.tsx   # shell de "modo foco"
    │   └── ui/
    │       ├── button.tsx            # cva variants
    │       ├── card.tsx
    │       └── mode-toggle.tsx
    ├── lib/
    │   ├── api.ts                    # cliente HTTP tipado
    │   └── utils.ts                  # cn() helper
    ├── routes/                       # file-based (TanStack Router)
    │   ├── __root.tsx
    │   ├── _placeholder.tsx
    │   ├── index.tsx                 # home com grid de cards
    │   ├── transcribe.tsx
    │   ├── subtitle/{srt,vtt,both}.tsx
    │   └── models/{status,unload}.tsx
    ├── stores/theme.ts               # zustand
    ├── index.css                     # tokens P&B
    └── main.tsx
```

## Setup

```bash
cd web
npm install
cp .env.example .env   # já vem com http://localhost:8000
npm run dev
```

A interface sobe em `http://localhost:5173`. Garanta que a API está rodando
em `http://localhost:8000` (veja `../README.md`).

## Configurando a URL da API

Edite `web/.env`:

```
VITE_API_URL=http://localhost:8000
```

Como o front e a API estão em portas diferentes, o navegador vai pedir CORS.
A API já está configurada com `allow_origins=["*"]`, então funciona em
desenvolvimento. Em produção, ajuste o CORS na API.

## Roadmap por partes

- [x] **Parte 1** — esqueleto, tema, roteamento, modo foco, placeholders
- [ ] **Parte 2** — página de transcrição (upload, modelo, idioma, parâmetros)
- [ ] **Parte 3** — páginas de legendas (SRT, VTT, both)
- [ ] **Parte 4** — dashboard de modelos na VRAM + unload manual
- [ ] **Parte 5** — histórico, downloads, polimentos
