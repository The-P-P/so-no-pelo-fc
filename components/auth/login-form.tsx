"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Phone, User, ArrowLeft, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatBrazilPhoneInput,
  toE164Brazil,
  formatPhoneDisplay,
} from "@/lib/phone";
import {
  getSavedPhone,
  savePhone,
  hasSavedPin,
  markPinSet,
  clearPinFlag,
} from "@/lib/auth-storage";
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

type Step = "quick" | "sms" | "otp" | "set-pin";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [step, setStep] = useState<Step>("quick");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [resettingPin, setResettingPin] = useState(false);

  useEffect(() => {
    const saved = getSavedPhone();
    if (saved) {
      setPhone(saved);
      setIsReturningUser(true);
      setStep(hasSavedPin() ? "quick" : "sms");
    }
  }, []);

  async function handleQuickLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const e164 = toE164Brazil(phone);
    if (!e164) {
      setError("Digite um celular válido com DDD.");
      setLoading(false);
      return;
    }

    if (pin.length < 6) {
      setError("O PIN tem 6 dígitos.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      phone: e164,
      password: pin,
    });

    if (authError) {
      setError("PIN incorreto. Tenta de novo ou usa o código SMS.");
      setLoading(false);
      return;
    }

    savePhone(phone);
    router.push(redirectTo);
    router.refresh();
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const e164 = toE164Brazil(phone);
    if (!e164) {
      setError("Digite um celular válido com DDD. Ex: (11) 99999-9999");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: {
        data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setPhoneE164(e164);
    savePhone(phone);
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (otp.length < 6) {
      setError("O código tem 6 dígitos.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: otp,
      type: "sms",
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Primeira vez ou redefinindo PIN após SMS
    if (!hasSavedPin() || resettingPin) {
      setResettingPin(false);
      setStep("set-pin");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (pin.length < 6) {
      setError("O PIN precisa ter 6 dígitos.");
      setLoading(false);
      return;
    }

    if (pin !== confirmPin) {
      setError("Os PINs não batem. Confere aí.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: pin,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    markPinSet();
    savePhone(phone);
    router.push(redirectTo);
    router.refresh();
  }

  async function handleResendOtp() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: phoneE164,
    });

    if (authError) {
      setError(authError.message);
    }

    setLoading(false);
  }

  function goToSmsFlow(forgotPin = false) {
    if (forgotPin) {
      setResettingPin(true);
      clearPinFlag();
    }
    setStep("sms");
    setPin("");
    setOtp("");
    setError(null);
  }

  const titleByStep: Record<Step, string> = {
    quick: "Bem-vindo de volta!",
    sms: isReturningUser ? "Entrar com SMS" : "Entra na pelada",
    otp: `Código enviado pro ${formatPhoneDisplay(phoneE164)}`,
    "set-pin": "Cria teu PIN",
  };

  const descByStep: Record<Step, string> = {
    quick: "Celular + PIN — sem SMS toda vez.",
    sms: "Vamos te mandar um código de 6 dígitos.",
    otp: "Cola o código que chegou no SMS.",
    "set-pin": "6 dígitos pra entrar rápido da próxima vez.",
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
        <CardDescription>{descByStep[step]}</CardDescription>
        <p className="text-sm font-medium text-foreground">{titleByStep[step]}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Login rápido: celular + PIN */}
        {step === "quick" && (
          <form onSubmit={handleQuickLogin} className="space-y-4">
            <PhoneField phone={phone} setPhone={setPhone} loading={loading} />

            <div className="space-y-2">
              <Label htmlFor="pin">PIN de 6 dígitos</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-12 pl-10 text-center text-lg tracking-[0.4em]"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            </div>

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

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => goToSmsFlow(true)}
              disabled={loading}
            >
              Esqueci o PIN / entrar com SMS
            </Button>
          </form>
        )}

        {/* SMS: enviar código */}
        {step === "sms" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {!isReturningUser && (
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
            )}

            <PhoneField phone={phone} setPhone={setPhone} loading={loading} />

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Receber código SMS"
              )}
            </Button>

            {hasSavedPin() && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setStep("quick");
                  setError(null);
                }}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar pro login com PIN
              </Button>
            )}
          </form>
        )}

        {/* OTP: confirmar SMS */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Código do SMS</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="h-14 text-center text-2xl tracking-[0.5em]"
                autoComplete="one-time-code"
                required
                disabled={loading}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                O código expira em ~1 minuto e só vale uma vez.
              </p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verificando...
                </>
              ) : (
                "Confirmar código"
              )}
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setStep("sms");
                  setOtp("");
                  setError(null);
                }}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trocar número
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Reenviar SMS
              </Button>
            </div>
          </form>
        )}

        {/* Criar PIN após primeiro SMS */}
        {step === "set-pin" && (
          <form onSubmit={handleSetPin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPin">Escolhe um PIN</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                placeholder="6 dígitos"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="h-12 text-center text-lg tracking-[0.4em]"
                autoComplete="new-password"
                required
                disabled={loading}
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirma o PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                placeholder="6 dígitos"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="h-12 text-center text-lg tracking-[0.4em]"
                autoComplete="new-password"
                required
                disabled={loading}
                maxLength={6}
              />
            </div>

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
                "Salvar e entrar"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function PhoneField({
  phone,
  setPhone,
  loading,
}: {
  phone: string;
  setPhone: (v: string) => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Celular</Label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          +55
        </div>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(formatBrazilPhoneInput(e.target.value))}
          className="h-12 pl-16 text-base tracking-wide"
          autoComplete="tel"
          required
          disabled={loading}
        />
      </div>
    </div>
  );
}
