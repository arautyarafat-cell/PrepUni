
 // src/utils/indexedDB.js
import { openDB } from "idb";

// Inicializa o banco de dados
async function getDB() {
  return await openDB("offlineVideos", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("videos")) {
        db.createObjectStore("videos");
      }
    },
  });
}

// Salvar vídeo offline com metadados
export async function saveVideoOffline(
  videoId,
  blob,
  title,
  tema,
  disciplina,
  dataExpiracao
) {
  const db = await getDB();

  await db.put(
    "videos",
    {
      blob,
      title: title || "Vídeo-aula sem título",
      tema: tema || "",
      disciplina: disciplina || "",
      dataExpiracao: dataExpiracao || null,
      dataDownload: new Date().toISOString(),
    },
    videoId
  );
}

// Recuperar vídeo offline por ID
export async function getVideoOffline(videoId) {
  const db = await getDB();
  return await db.get("videos", videoId);
}

// Listar todos os vídeos offline com metadados
export async function getAllOfflineVideos() {
  const db = await getDB();
  const videos = await db.getAll("videos");
  const keys = await db.getAllKeys("videos");

  return videos.map((video, index) => ({
    id: keys[index],
    ...video,
  }));
}

// Apagar vídeo offline por ID
export async function deleteVideoOffline(videoId) {
  const db = await getDB();
  await db.delete("videos", videoId);
}
