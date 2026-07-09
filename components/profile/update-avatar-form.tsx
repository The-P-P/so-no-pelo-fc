"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import {
  removeProfileAvatar,
  updateProfileAvatar,
  type ProfileActionResult,
} from "@/lib/actions/profile-actions";
import {
  AVATAR_BUCKET,
  buildAvatarPublicUrl,
  getAvatarStoragePath,
} from "@/lib/avatar";
import { prepareAvatarImage, validateImageFile } from "@/lib/avatar-upload";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UpdateAvatarFormProps {
  userId: string;
  currentAvatarUrl?: string | null;
  initials: string;
}

export function UpdateAvatarForm({
  userId,
  currentAvatarUrl,
  initials,
}: UpdateAvatarFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl ?? null
  );
  const [state, setState] = useState<ProfileActionResult>({});
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setState({});

    const validationError = await validateImageFile(file);
    if (validationError) {
      setState({ error: validationError });
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== userId) {
        setState({ error: "Sessão expirada. Faça login novamente." });
        return;
      }

      const blob = await prepareAvatarImage(file);
      const storagePath = getAvatarStoragePath(user.id);
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(storagePath, blob, {
          upsert: true,
          contentType: "image/webp",
        });

      if (uploadError) {
        setState({ error: "Não foi possível enviar a foto." });
        return;
      }

      const publicUrl = buildAvatarPublicUrl(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        user.id,
        Date.now()
      );
      const result = await updateProfileAvatar(publicUrl);

      if (result.error) {
        setState({ error: result.error });
        return;
      }

      setPreviewUrl(publicUrl);
      setState({ success: result.success });
    } catch {
      setState({ error: "Não foi possível processar a imagem." });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setState({});
    setRemoving(true);

    try {
      const result = await removeProfileAvatar();

      if (result.error) {
        setState({ error: result.error });
        return;
      }

      setPreviewUrl(null);
      setState({ success: result.success });
    } finally {
      setRemoving(false);
    }
  }

  const busy = uploading || removing;

  return (
    <div className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
          {state.success}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={previewUrl ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-lg text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Escolher foto
              </>
            )}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 text-destructive hover:text-destructive"
              disabled={busy}
              onClick={handleRemove}
            >
              {removing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remover foto
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={busy}
        onChange={handleFileChange}
      />
    </div>
  );
}
