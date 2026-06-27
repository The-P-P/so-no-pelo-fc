# Só no Pelo FC ⚽

Site de estatísticas de pelada de várzea com humor.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Database)
- Lucide React
- date-fns

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

### Login grátis (sem SMS)

- **E-mail + PIN de 6 dígitos** — incluso no plano free do Supabase
- **Esqueci o PIN** — link no e-mail redefine o PIN (sem Twilio)

> Contas antigas criadas por telefone precisam criar uma conta nova com e-mail.

### 3. Rodar localmente

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
components/
  ui/              → shadcn/ui
  auth/            → formulários de auth
  layout/          → sidebar, header
lib/
  supabase/        → clientes browser, server, middleware
  auth.ts          → helpers de autenticação
types/             → tipos TypeScript
supabase/
  schema.sql       → schema + RLS
```

## Roles

| Role   | Permissões                                      |
|--------|-------------------------------------------------|
| Owner  | Tudo + deletar time                             |
| Admin  | Criar peladas, aprovar stats, gerenciar membros |
| Player | Lançar próprias estatísticas                    |
