# Arquitetura e Decisões Técnicas

Este documento descreve as decisões arquiteturais iniciais, padrões e convenções para o frontend.

## Padrão Arquitetural

Adotamos um padrão híbrido baseado em Feature-Sliced Design para organización das responsabilidades:

- Camada `app` / `shell`: entrada, roteamento e layout (ex.: `src/App.tsx`, `src/shell/`).
- Camada `pages`: páginas por rota (ex.: `src/pages/`).
- Camada `features`: funcionalidades independentes que podem agrupar componentes, hooks e store locais (ex.: `features/notifications`).
- Camada `shared` / `components`: componentes UI reutilizáveis e tokens (ex.: `src/components/`, `src/styles/`).

Racional: Feature-sliced equilibra escalabilidade e separação de responsabilidades, mantendo componentes compartilháveis.

## Gerenciamento de Estado

- Estado Local (componentes): use `useState` / `useReducer` dentro do componente.
- Estado Compartilhado entre poucos componentes: React Context + hooks (ex.: `src/contexts/AuthContext.tsx`).
- Estado Global / Performance-sensitive: Zustand (ou Redux Toolkit) para casos com muitas assinaturas ou lógica complexa.

Quando usar cada um:
- Use Context para autenticação, tema e notificações simples.
- Use Zustand/Redux quando precisar de middlewares, persistência ou debugging avançado (time-travel).

## Comunicação com API / Integração

- Biblioteca recomendada: Axios (instanciar `src/services/api.ts`).
- Padrão:
  - Criar uma instância Axios com `baseURL` e interceptors para autenticação (adicionar token) e tratamento global de erros.
  - Centralizar endpoints em arquivos por domínio: `src/services/patients.api.ts`, `src/services/notifications.api.ts`.
  - Implementar camada de adaptação para transformar respostas do backend em formatos consumidos pela UI.

Exemplo simples de `src/services/api.ts`:

```ts
import axios from 'axios'
const api = axios.create({ baseURL: process.env.VITE_API_URL })
api.interceptors.request.use(config => { /* anexar token */ return config })
api.interceptors.response.use(res => res, err => { /* tratamento global */ return Promise.reject(err) })
export default api
```

## Roteamento e Autenticação

- Roteamento: React Router (v6+) — separar rotas públicas e privadas.
- Guardas/Proteção: componente `PrivateRoute` que verifica `AuthContext` e redireciona para login.
- Estrutura:
  - `src/routes/` ou `src/App.tsx` define `Routes` com `Outlet` para layouts.

Fluxo de autenticação:
- Ao autenticar, salvar token seguro (preferencialmente HttpOnly cookie pelo backend). Se não for possível, usar `localStorage` com precauções e renovar token quando necessário.

## Estilização e Design System

- Ferramenta: Tailwind CSS com tokens de design (variáveis em `src/styles/tokens.css`).
- Componentes de UI: componente base em `src/components/ui/` que utilizam classes utilitárias e tokens CSS.
- Tokens: cores, espaçamentos e tipografia centralizados em `tokens.css` e expostos via classes utilitárias.
- Acesso a tema: `ThemeContext` para alternar temas e mapear tokens dinamicamente.

Boas práticas:
- Preferir composição de componentes (pequenos, focados) em vez de componentes gigantes.
- Manter estilos por componente leves; evitar regras CSS globais excessivas.

## Convenções de Código

- Nomenclatura:
  - Componentes React: `PascalCase.tsx` (ex.: `PatientAvatar.tsx`).
  - Hooks customizados: `useCamelCase.ts` (ex.: `useAuth.ts`).
  - Services / APIs: `kebab.api.ts` ou `domain.api.ts` (ex.: `notifications.api.ts`).
  - Types: `kebab.types.ts` ou `domain.types.ts` (ex.: `notifications.types.ts`).

- Exports:
  - Use `index.ts` para re-exportar módulos de pastas (`src/components/index.ts`).

- Linting/Formatting:
  - ESLint + Prettier configurados com regras compartilhadas.
  - Hooks lint rules: `eslint-plugin-react-hooks` habilitado.

- Boas práticas:
  - Favor composição sobre herança.
  - Isolar efeitos colaterais em hooks (`useEffect`) e serviços.
  - Escrever testes para componentes com lógica e para integrações HTTP usando mocks.

## ADRs (Architectural Decision Records)

### ADR 001 — Ferramenta de Build: Vite

- Decisão: usar Vite como bundler/dev server.
- Motivo: inicialização e HMR muito rápidos; ótima experiência dev com TypeScript.
- Trade-offs: plugins ecosistema menor comparado ao Webpack, mas suficiente para a maioria dos casos.

### ADR 002 — Estilização: Tailwind CSS + Design Tokens

- Decisão: usar Tailwind para produtividade e tokens CSS para semântica de design.
- Motivo: classes utilitárias aceleram desenvolvimento e tokens garantem consistência visual.
- Trade-offs: exige disciplina para manter semântica e evitar classes inline espalhadas; documentar padrões de classes.

### ADR 003 — Estado: React Context como primeira linha, escalando para Zustand

- Decisão: começar com Context + hooks; adotar Zustand quando a complexidade justificar.
- Motivo: Context é suficiente e simples para autenticação e tema; Zustand reduz verbosidade e melhora performance em estados grandes.
- Trade-offs: migrar mais adiante implica refatoração de consumers; entretanto, delimitar boundaries por feature facilita migração incremental.

---
