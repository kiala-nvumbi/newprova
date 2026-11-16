# Sistema de Provas Online — Gestão Estratégica

Plataforma web full-stack para aplicação, correcção automática e gestão de provas académicas de Planeamento Estratégico em Gestão, com isolamento estrito de perfis, autenticação segura no servidor e persistência em PostgreSQL / Cloud SQL.

## Funcionalidades Principais

- **Autenticação e Isolamento de Dados**:
  - Cada estudante acede exclusivamente às suas provas, resultados e perfil pessoal (`Meu Perfil`).
  - Apenas o Administrador (ADM) tem acesso ao Painel de Gestão, lista de alunos, importação em massa e estatísticas globais.
- **Gestão de Alunos e Importação Excel**:
  - Criação e edição individual de perfis (matrícula, nome, usuário, senha inicial, turma, província onde estudou, tempo extra e provas permitidas).
  - Importação em lote via ficheiro Excel (`.xlsx` / `.csv`).
- **Motor de Correcção e Cronómetro**:
  - Agendamento por data e hora, abertura imediata ou treino livre (ensaio), rascunho automático local e correcção estruturada.

## Arquitectura de Segurança

- **Palavras-passe Encriptadas (`scrypt`)**: Nenhuma palavra-passe é armazenada em texto simples no cliente ou devolvida pelas rotas da API. As senhas dos estudantes são protegidas com `crypto.scryptSync` e sal aleatório por utilizador.
- **Sessões Assinadas (`HMAC-SHA256`)**: Tokens assinados com expiração de 24h entregues via cookie `HttpOnly` e cabeçalho `Authorization: Bearer`.
- **Controlo de Acesso por Perfil (RBAC)**:
  - Rotas administrativas (`/api/students/*`, `/api/exam-settings` POST, `/api/attempts/reset`, `/api/data/clear`) exigem sessão válida com perfil `docente` (ADM).
  - Rotas de tentativas (`/api/attempts`) filtram rigorosamente os registos pelo `studentId` do utilizador autenticado quando o perfil é `aluno`.
- **Protecção contra Força Bruta & Cabeçalhos HTTP**:
  - Rate limiting por IP em `/api/login` e nas rotas `/api/*`.
  - Cabeçalhos de segurança (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` em HTTPS).

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure os valores do seu ambiente:

```bash
cp .env.example .env
```

Principais variáveis:
- `DATABASE_URL` (ou `SQL_HOST`, `SQL_PORT`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`, `SQL_SSL`)
- `SESSION_SECRET` — segredo criptográfico (mínimo 32 caracteres) para assinatura das sessões
- `ADMIN_PASSWORD` — palavra-passe definida no servidor para a conta de Administrador (`kiala.nvumbi`)
- `PORT` — porta HTTP do servidor (padrão `3000`)

## Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Aplicar esquema na base de dados PostgreSQL
npm run db:push

# 3. Iniciar em modo de desenvolvimento
npm run dev
```

Para compilar e executar em produção:

```bash
npm run lint
npm run build
npm start
```

## Implantação via Docker / GitHub Actions

O repositório inclui:
- **GitHub Actions (`.github/workflows/ci.yml`)**: valida `npm run lint` (`tsc --noEmit`) e `npm run build` automaticamente em cada *push* ou *pull request* para `main`/`master`.
- **Docker (`Dockerfile`)**: imagem de produção baseada em `node:22-alpine` pronta para Cloud Run, Railway, Render ou Fly.io.

```bash
docker build -t sistema-provas .
docker run -p 3000:3000 --env-file .env sistema-provas
```
