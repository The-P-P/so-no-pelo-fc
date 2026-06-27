"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isValidPin, sanitizePinInput } from "@/lib/pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isValidPin(pin)) {
      setError("O PIN precisa ter exatamente 6 dígitos.");
      setLoading(false);
      return;
    }

    if (pin !== confirmPin) {
      setError("Os PINs não batem.");
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

    setSuccess("PIN atualizado!");
    setPin("");
    setConfirmPin("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="newPin">Novo PIN</Label>
        <Input
          id="newPin"
          type="password"
          inputMode="numeric"
          placeholder="000000"
          value={pin}
          onChange={(e) => setPin(sanitizePinInput(e.target.value))}
          className="h-11 text-center tracking-[0.4em]"
          autoComplete="new-password"
          required
          disabled={loading}
          maxLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPin">Confirmar novo PIN</Label>
        <Input
          id="confirmNewPin"
          type="password"
          inputMode="numeric"
          placeholder="000000"
          value={confirmPin}
          onChange={(e) => setConfirmPin(sanitizePinInput(e.target.value))}
          className="h-11 text-center tracking-[0.4em]"
          autoComplete="new-password"
          required
          disabled={loading}
          maxLength={6}
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
  );
}
