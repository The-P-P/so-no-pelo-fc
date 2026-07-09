"use client";

import {
  AVATAR_MAX_DIMENSION,
  AVATAR_MAX_FILE_SIZE,
  isAllowedAvatarMimeType,
} from "@/lib/avatar";

async function hasValidImageMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }

  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export async function validateImageFile(file: File): Promise<string | null> {
  if (!isAllowedAvatarMimeType(file.type)) {
    return "Formato inválido. Use JPEG, PNG ou WebP.";
  }

  if (file.size > AVATAR_MAX_FILE_SIZE) {
    return "Arquivo muito grande (máx. 2 MB).";
  }

  if (!(await hasValidImageMagicBytes(file))) {
    return "Arquivo de imagem inválido.";
  }

  return null;
}

export async function prepareAvatarImage(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    AVATAR_MAX_DIMENSION / Math.max(imageBitmap.width, imageBitmap.height)
  );
  const targetWidth = Math.round(imageBitmap.width * scale);
  const targetHeight = Math.round(imageBitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    imageBitmap.close();
    throw new Error("Não foi possível processar a imagem.");
  }

  context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  imageBitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.85);
  });

  if (!blob) {
    throw new Error("Não foi possível converter a imagem.");
  }

  return blob;
}
