# Só no Pelo FC ⚽

Site de estatísticas de pelada — PWA instalável com notificações push.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database)
- Lucide React
- date-fns
- Web Push (PWA)

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie `.env.local.example` para `.env.local` e preencha as variáveis
3. No SQL Editor, execute o arquivo `supabase/schema.sql` (e migrations se necessário)
4. Em **Authentication → Providers**, habilite **Email** (já vem ativo)
5. Em **Authentication → Providers**, desabilite **Phone** (evita SMS pago via Twilio)
6. Em **Authentication → URL Configuration**, defina **Site URL** como `http://localhost:3000` (dev) ou sua URL da Vercel (prod)
7. (Opcional) **Confirm email**: desligue em Providers → Email se quiser cadastro instantâneo sem confirmar e-mail
8. Execute a migration `supabase/migrations/020_push_subscriptions.sql` (subscriptions de push)

### Login grátis (sem SMS)

- **E-mail + PIN de 6 dígitos** — incluso no plano free do Supabase
- **Esqueci o PIN** — link no e-mail redefine o PIN (sem Twilio)

> Contas antigas criadas por telefone precisam criar uma conta nova com e-mail.

### 3. Configurar PWA / Web Push

1. Gere as chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

2. Preencha no `.env.local`:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (ex.: `mailto:voce@email.com`)
- `SUPABASE_SERVICE_ROLE_KEY` (Settings → API no Supabase — só no servidor)

3. No Perfil do app: **Ativar notificações** (e use **Enviar teste**).

#### Instalar o app

| Plataforma | Como |
|------------|------|
| Chrome / Android | Banner “Instalar” ou menu → Instalar app |
| iPhone / iPad | Safari → Compartilhar → Adicionar à Tela de Início |

> No iOS, push só funciona com o PWA instalado (iOS 16.4+).

### 4. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura

```
app/
  (auth)/          → login, register
  (dashboard)/     → páginas protegidas
  auth/callback/   → OAuth callback
  manifest.ts      → Web App Manifest (PWA)
components/
  ui/              → shadcn/ui
  auth/            → formulários de auth
  layout/          → sidebar, header
  pwa/             → install prompt, SW register, notificações
lib/
  supabase/        → clientes browser, server, middleware, admin
  push.ts          → envio Web Push
  auth.ts          → helpers de autenticação
public/
  sw.js            → service worker (push)
  icons/           → ícones PWA
types/             → tipos TypeScript
supabase/
  schema.sql       → schema + RLS
  migrations/      → migrations incrementais
```

## Notificações

| Evento | Quem recebe |
|--------|-------------|
| Nova pelada | Membros do grupo |
| Stats aprovada/rejeitada | Dono da stat |
| Pedido de apelido | Admins / owner |
| Apelido aprovado/rejeitado | Solicitante |

## Roles

| Role   | Permissões                                      |
|--------|-------------------------------------------------|
| Owner  | Tudo + deletar time                             |
| Admin  | Criar peladas, aprovar stats, gerenciar membros |
| Player | Lançar próprias estatísticas                    |
