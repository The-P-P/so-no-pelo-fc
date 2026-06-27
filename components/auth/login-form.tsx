"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, User, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getSavedEmail, saveEmail } from "@/lib/auth-storage";
import { isValidPin, pinValidationError, sanitizePinInput } from "@/lib/pin";
import { mapAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Mode = "login" | "signup" | "forgot" | "reset-pin";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const recoveryStep = searchParams.get("step") === "reset-pin";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const saved = getSavedEmail();
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (!recoveryStep) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMode("reset-pin");
        if (user.email) setEmail(user.email);
      }
    });
  }, [recoveryStep]);

  function validatePinPair(
    value: string,
    confirm: string,
    confirmLabel = "Os PINs não batem."
  ): string | null {
    const pinError = pinValidationError(value);
    if (pinError) return pinError;
    if (!isValidPin(value)) return "O PIN precisa ter exatamente 6 dígitos.";
    if (value !== confirm) return confirmLabel;
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isValidPin(pin)) {
      setError("O PIN precisa ter exatamente 6 dígitos.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: pin,
    });

    if (authError) {
      setError(mapAuthError(authError.message));
      setLoading(false);
      return;
    }

    saveEmail(normalizedEmail);
    router.push(redirectTo);
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const validationError = validatePinPair(pin, confirmPin);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const authCallback = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

    const { data, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: pin,
      options: {
        data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
        emailRedirectTo: authCallback,
      },
    });

    if (authError) {
      setError(mapAuthError(authError.message));
      setLoading(false);
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setError(
        "Este e-mail já está cadastrado. Entra com teu PIN ou usa “Esqueci o PIN”."
      );
      setMode("login");
      setLoading(false);
      return;
    }

    saveEmail(normalizedEmail);

    if (data.session) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    // Confirmação desligada: algumas configs não devolvem session no signUp
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pin,
      });

    if (!loginError && loginData.session) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      setSuccess(
        "Conta criada! Abre o e-mail de confirmação e clica no link. Depois entra com teu PIN."
      );
      setMode("login");
      setPin("");
      setConfirmPin("");
      setLoading(false);
      return;
    }

    setError(
      mapAuthError(
        loginError?.message ??
          "Conta criada, mas não foi possível entrar automaticamente. Tenta login manual."
      )
    );
    setMode("login");
    setPin("");
    setConfirmPin("");
    setLoading(false);
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Informe o e-mail da conta.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const resetRedirect = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/login?step=reset-pin")}`;
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      { redirectTo: resetRedirect }
    );

    if (authError) {
      setError(mapAuthError(authError.message));
      setLoading(false);
      return;
    }

    saveEmail(normalizedEmail);
    setSuccess(
      "Enviamos um link pro teu e-mail. Abre o link e define um PIN novo."
    );
    setLoading(false);
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const validationError = validatePinPair(pin, confirmPin);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Link expirado. Pede um novo em “Esqueci o PIN”.");
      setMode("forgot");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      password: pin,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  const titles: Record<Mode, string> = {
    login: "Entra na pelada",
    signup: "Cria tua conta",
    forgot: "Esqueceu o PIN?",
    "reset-pin": "Novo PIN",
  };

  const descriptions: Record<Mode, string> = {
    login: "E-mail + PIN de 6 dígitos.",
    signup: "Escolhe um e-mail e um PIN de 6 dígitos.",
    forgot: "Mandamos um link pro teu e-mail pra redefinir o PIN.",
    "reset-pin": "Define um PIN novo de 6 dígitos.",
  };

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-2xl">
          ⚽
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Só no Pelo FC
        </CardTitle>
        <CardDescription>{descriptions[mode]}</CardDescription>
        <p className="text-sm font-medium text-foreground">{titles[mode]}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <EmailField email={email} setEmail={setEmail} loading={loading} />
            <PinField
              id="loginPin"
              label="PIN (6 dígitos)"
              pin={pin}
              setPin={setPin}
              loading={loading}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="flex flex-col gap-2 text-center text-sm">
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setMode("signup");
                  setPin("");
                  setConfirmPin("");
                  setError(null);
                  setSuccess(null);
                }}
                disabled={loading}
              >
                Criar conta
              </button>
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setMode("forgot");
                  setPin("");
                  setError(null);
                  setSuccess(null);
                }}
                disabled={loading}
              >
                Esqueci o PIN
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Apelido (opcional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Zagueiro Violento"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 pl-10 text-base"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            <EmailField email={email} setEmail={setEmail} loading={loading} />
            <PinField
              id="signupPin"
              label="Cria um PIN"
              pin={pin}
              setPin={setPin}
              loading={loading}
              autoComplete="new-password"
            />
            <PinField
              id="confirmSignupPin"
              label="Confirma o PIN"
              pin={confirmPin}
              setPin={setConfirmPin}
              loading={loading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode("login");
                setPin("");
                setConfirmPin("");
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              Já tenho conta
            </Button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <EmailField email={email} setEmail={setEmail} loading={loading} />

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de redefinição"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              Voltar pro login
            </Button>
          </form>
        )}

        {mode === "reset-pin" && (
          <form onSubmit={handleResetPin} className="space-y-4">
            <PinField
              id="newPin"
              label="Novo PIN"
              pin={pin}
              setPin={setPin}
              loading={loading}
              autoComplete="new-password"
            />
            <PinField
              id="confirmNewPin"
              label="Confirma o novo PIN"
              pin={confirmPin}
              setPin={setConfirmPin}
              loading={loading}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar PIN e entrar"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function EmailField({
  email,
  setEmail,
  loading,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">E-mail</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 pl-10 text-base"
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>
    </div>
  );
}

function PinField({
  id,
  label,
  pin,
  setPin,
  loading,
  autoComplete,
}: {
  id: string;
  label: string;
  pin: string;
  setPin: (v: string) => void;
  loading: boolean;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="password"
          inputMode="numeric"
          placeholder="000000"
          value={pin}
          onChange={(e) => setPin(sanitizePinInput(e.target.value))}
          className="h-12 pl-10 text-center text-lg tracking-[0.4em]"
          autoComplete={autoComplete}
          required
          disabled={loading}
          maxLength={6}
        />
      </div>
    </div>
  );
}
