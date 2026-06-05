"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Phone, User, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBrazilPhoneInput, toE164Brazil, formatPhoneDisplay } from "@/lib/phone";
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

type Step = "phone" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);

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

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-2xl">
          ⚽
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Só no Pelo FC
        </CardTitle>
        <CardDescription>
          {step === "phone"
            ? "Entra com teu celular, craque!"
            : `Código enviado pro ${formatPhoneDisplay(phoneE164)}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                Primeira vez? Cria conta automaticamente.
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
                  Enviando código...
                </>
              ) : (
                "Receber código SMS"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Código de 6 dígitos</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
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
                "Entrar na pelada"
              )}
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setStep("phone");
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
                Reenviar código
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
