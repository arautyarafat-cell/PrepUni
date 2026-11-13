import { createClient } from "@supabase/supabase-js";

// Configuração de URL e Anon Key do Supabase (com suporte a variáveis de ambiente frontend e backend)
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Nome do bucket destinado ao armazenamento de imagens
export const SUPABASE_BUCKET_NAME =
  process.env.REACT_APP_SUPABASE_BUCKET ||
  process.env.SUPABASE_BUCKET ||
  "images";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ [Supabase Storage] Atenção: REACT_APP_SUPABASE_URL ou REACT_APP_SUPABASE_ANON_KEY não estão definidas no arquivo .env!\n" +
    "Para que as imagens sejam enviadas para o bucket do Supabase, preencha essas variáveis no seu arquivo .env."
  );
}

// Criação do cliente Supabase
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

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
    const errorMsg =
      "Cliente Supabase não configurado. Verifique se REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY estão definidos no arquivo .env.";
    console.error("❌ [Supabase Storage Error]:", errorMsg);
    throw new Error(errorMsg);
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
