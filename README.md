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
3. No SQL Editor, execute o arquivo `supabase/schema.sql`
4. Em **Authentication → Providers**, habilite **Phone** e configure SMS (ex: Twilio)
5. Em **Authentication → URL Configuration**, defina **Site URL** como `http://localhost:3000`

### Configurar SMS (Twilio)

No Supabase: **Authentication → Providers → Phone**

1. Ative **Enable Phone provider**
2. Escolha **Twilio** e preencha Account SID, Auth Token e número remetente
3. Para testes, use números verificados no console Twilio

> Login por telefone: o usuário recebe um código SMS de 6 dígitos. Primeira vez cria conta automaticamente.

Se já rodou o `schema.sql` antigo, execute também `supabase/migrations/002_phone_auth.sql`.

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
