import { supabase } from "@/lib/supabase";

export async function uploadImageFile(file: File): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("Connectez-vous avec votre compte vendeur pour ajouter une image.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name || "image");

  const response = await fetch("/api/uploads/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const result = (await response.json()) as { url?: string; message?: string };

  if (!response.ok || !result.url) {
    throw new Error(result.message || "Image upload failed.");
  }

  return result.url;
}
