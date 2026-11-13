const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "";
// No backend, se fornecida a service role key, ela ignora RLS para upload seguro de arquivos
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET || process.env.REACT_APP_SUPABASE_BUCKET || "images";

const supabaseAdmin = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

/**
 * Faz upload de um arquivo recebido pelo Multer no backend diretamente para o bucket do Supabase Storage
 * @param {Object} file - Objeto req.file do Multer
 * @param {string} folder - Subpasta no bucket
 * @returns {Promise<string>} - URL pública do Supabase ou caminho relativo local caso o Supabase não esteja configurado
 */
async function uploadBackendFileToSupabase(file, folder = "uploads") {
  if (!file) return null;

  if (!supabaseAdmin) {
    console.warn("⚠️ [Backend Supabase] Credenciais do Supabase não configuradas no backend. Usando caminho local /uploads.");
    return `/uploads/${file.filename}`;
  }

  try {
    const fileBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null);
    if (!fileBuffer) {
      return `/uploads/${file.filename}`;
    }

    const fileExt = path.extname(file.originalname).toLowerCase().replace(".", "") || "jpg";
    const cleanOriginalName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filePath = `${folder}/${uniqueId}_${cleanOriginalName}.${fileExt}`;

    console.log(`🚀 [Backend Supabase Storage] Enviando arquivo para o bucket '${SUPABASE_BUCKET_NAME}': ${filePath}`);

    const { data, error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype || "image/jpeg",
        upsert: true
      });

    if (error) {
      console.error("❌ [Backend Supabase Storage Error]:", error);
      // Se falhar o upload no Supabase, loga o erro e usa o arquivo local como fallback
      return `/uploads/${file.filename}`;
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(SUPABASE_BUCKET_NAME)
      .getPublicUrl(data.path);

    console.log(`✅ [Backend Supabase Storage] Arquivo disponível em: ${publicData.publicUrl}`);

    // Limpa o arquivo temporário do disco após o upload para o Supabase
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // Ignora erro de remoção de temporário
      }
    }

    return publicData.publicUrl;
  } catch (err) {
    console.error("❌ [Backend Supabase Storage Exception]:", err);
    return `/uploads/${file.filename}`;
  }
}

module.exports = {
  supabaseAdmin,
  SUPABASE_BUCKET_NAME,
  uploadBackendFileToSupabase
};
