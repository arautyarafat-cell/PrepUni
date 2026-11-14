import { createClient } from "@supabase/supabase-js";

function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let url = rawUrl.trim().replace(/^["']|["']$/g, "").trim();
  if (!url) return "";

  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    console.error("❌ [Frontend Supabase Config]: A variável REACT_APP_SUPABASE_URL foi preenchida com uma URL de banco de dados (postgresql://). Deve ser a URL do projeto (ex: https://xyz.supabase.co).");
    return "";
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

const rawSupabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);

const supabaseAnonKey = (
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ""
).trim().replace(/^["']|["']$/g, "");

// Nome do bucket destinado ao armazenamento de imagens
export const SUPABASE_BUCKET_NAME = (
  process.env.REACT_APP_SUPABASE_BUCKET ||
  process.env.SUPABASE_BUCKET ||
  "images"
).trim().replace(/^["']|["']$/g, "");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ [Supabase Storage] Atenção: REACT_APP_SUPABASE_URL ou REACT_APP_SUPABASE_ANON_KEY não estão definidas no arquivo .env!\n" +
    "Para que as imagens sejam enviadas para o bucket do Supabase, preencha essas variáveis no seu arquivo .env."
  );
}

// Criação segura do cliente Supabase
let client = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (err) {
    console.error("❌ [Supabase Storage] Erro ao instanciar SupabaseClient:", err.message);
    client = null;
  }
}

export const supabase = client;

/**
 * Função responsável por fazer o upload de uma imagem diretamente para o Supabase Storage
 * @param {File|Blob} file - Objeto File selecionado no input
 * @param {string} folder - Pasta dentro do bucket ('courses', 'avatars', 'uploads')
 * @returns {Promise<string>} - URL pública do arquivo no Supabase Storage
 */
export async function uploadImageToSupabase(file, folder = "uploads") {
  if (!file) {
    throw new Error("Nenhum arquivo de imagem foi fornecido para upload.");
  }

  if (!supabase) {
    console.warn("⚠️ [Supabase Storage] Supabase não configurado. Usando upload direto para o servidor.");
    return null;
  }

  // Sanitizar o nome do arquivo para evitar conflitos de nomes e caracteres especiais
  const fileExt = file.name ? file.name.split(".").pop().toLowerCase() : "jpg";
  const cleanOriginalName = (file.name || "imagem")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const filePath = `${folder}/${uniqueId}_${cleanOriginalName}.${fileExt}`;

  console.log(`🚀 [Supabase Storage] Iniciando upload para o bucket '${SUPABASE_BUCKET_NAME}':`, {
    path: filePath,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "image/jpeg"
  });

  // Executa a chamada do Supabase Storage
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg"
    });

  // Se o upload falhar, não escondemos o erro: mostramos no console e repassamos
  if (error) {
    console.error("❌ [Supabase Storage Error] Detalhes do erro retornado pelo Supabase:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error
    });
    throw new Error(`Erro no Supabase Storage (${error.message || "Falha no upload"}). Verifique as Storage Policies/RLS ou se o bucket '${SUPABASE_BUCKET_NAME}' existe.`);
  }

  // Obter URL pública permanente do arquivo
  const { data: publicUrlData } = supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .getPublicUrl(data.path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error("Não foi possível gerar a URL pública da imagem no Supabase Storage.");
  }

  console.log("✅ [Supabase Storage] Upload concluído com sucesso!", {
    path: data.path,
    publicUrl: publicUrlData.publicUrl
  });

  return publicUrlData.publicUrl;
}

export default supabase;
