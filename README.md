# Pectus Frontend

## Visão Geral

Pectus Frontend é a aplicação cliente que fornece a interface para o sistema de gestão clínica do projeto. Destina-se a profissionais de saúde e administradores que precisam visualizar pacientes, notificações e fluxos internos. Este repositório contém a aplicação escrita em React + TypeScript, empacotada com Vite, e com componentes reutilizáveis e um design tokens system.

## Público-alvo

- Médicos e profissionais clínicos
- Administradores do sistema
- Equipe de desenvolvimento para manutenção e evolução da UI

## Objetivo

Prover uma UI leve, acessível e consistente com componentes reutilizáveis, facilitando desenvolvimento de novas telas e integrações com APIs backend.

## Stack Tecnológica

- Framework: React
- Linguagem: TypeScript
- Bundler / Dev server: Vite
- Estilização: Tailwind CSS + design tokens (arquivos em `src/styles/`)
- Componentização: Componentes React em `src/components/`
- Gerenciamento de estado: React Context + hooks (recomendado). Para estados mais complexos, usar Zustand/Redux (opcional)
- Requisições HTTP: Axios (recomendado) ou Fetch API
- Testes: Jest + React Testing Library (sugestão)

## Pré-requisitos

- Node.js >= 18
- npm >= 9  (ou yarn / pnpm — ajuste os comandos abaixo conforme o gerenciador escolhido)

## Como Rodar Localmente

1. Clone o repositório e entre na pasta do projeto:

```bash
git clone <repo-url>
cd pectus-frontend
```

2. Instale dependências:

```bash
npm install
# ou
yarn
# ou
pnpm install
```

3. Crie um arquivo de ambiente a partir do exemplo e ajuste as variáveis:

```bash
cp .env.example .env
# edite .env conforme necessário
```

4. Execute em modo desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

O servidor de desenvolvimento do Vite estará disponível por padrão em `http://localhost:5173`.

## Scripts Disponíveis

- `dev` — Inicia o servidor de desenvolvimento (Vite)
- `build` — Gera a versão de produção (bundle)
- `preview` — Serve a build de produção localmente
- `lint` — Executa linting (ESLint/Prettier)
- `test` — Executa a suíte de testes
- `format` — Formata o código (Prettier)

Verifique o `package.json` para os comandos exatos do projeto.

## Estrutura de Pastas (src/)

Arquivos principais em `src/`:

- `src/main.tsx` — Ponto de entrada da aplicação (hydrate/mount do React).
- `src/App.tsx` — Componente raiz da aplicação.
- `src/index.css`, `src/styles/` — Estilos globais e tokens de design.
- `src/components/` — Biblioteca de componentes reutilizáveis:
	- `components/ui/` — Componentes de UI (Button, Input, Card, etc.)
	- `components/icons/` — Ícones compartilhados

- `src/pages/` — Páginas e views de alto nível (rotas).
- `src/shell/` — Layouts e elementos de navegação (Sidebar, TopBar, AppShell, Drawers).
- `src/data/` — Dados estáticos, fixtures e tipos (ex.: `notifications.ts`, `doctor.ts`).
- `src/hooks/` — Hooks customizados (ex.: `useAuth`, `useFetch`) — criar conforme necessário.
- `src/services/` ou `src/api/` — Cliente HTTP e abstrações de API (Axios instance, interceptors).
- `src/store/` ou `src/contexts/` — Contextos globais / stores (Auth, Theme, Notifications).
- `src/pages/` — Implementações de páginas e rotas.
- `src/utils/` — Funções utilitárias e helpers puros.




