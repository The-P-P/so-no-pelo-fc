"use client";

import { useState } from "react";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markPinSet } from "@/lib/auth-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "idle" | "otp" | "new-pin";

interface ResetPinFormProps {
  phoneE164?: string | null;
  phoneDisplay?: string;
}

export function ResetPinForm({ phoneE164, phoneDisplay }: ResetPinFormProps) {
  const [step, setStep] = useState<Step>("idle");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!phoneE164) {
    return (
      <p className="text-sm text-muted-foreground">
        Conta sem celular vinculado. Não é possível redefinir PIN por aqui.
      </p>
    );
  }

  const phone = phoneE164;

  async function handleSendSms() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

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
      phone,
      token: otp,
      type: "sms",
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setStep("new-pin");
    setLoading(false);
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
    setSuccess("PIN redefinido com sucesso!");
    setStep("idle");
    setOtp("");
    setPin("");
    setConfirmPin("");
    setLoading(false);
  }

  return (
    <div className="space-y-4">
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

      {step === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enviaremos um código SMS para{" "}
            <strong className="text-foreground">{phoneDisplay}</strong> para
            confirmar que é você.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={handleSendSms}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Enviando SMS...
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Redefinir PIN
              </>
            )}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resetOtp">Código do SMS</Label>
            <Input
              id="resetOtp"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="h-12 text-center text-lg tracking-[0.4em]"
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Verificando...
              </>
            ) : (
              "Confirmar código"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep("idle");
              setOtp("");
              setError(null);
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
        </form>
      )}

      {step === "new-pin" && (
        <form onSubmit={handleSetPin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPin">Novo PIN</Label>
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
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPin">Confirmar PIN</Label>
            <Input
              id="confirmNewPin"
              type="password"
              inputMode="numeric"
              placeholder="6 dígitos"
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="h-12 text-center text-lg tracking-[0.4em]"
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Salvar novo PIN
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
