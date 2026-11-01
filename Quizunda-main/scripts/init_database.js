const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log("==========================================");
  console.log("🚀 Inicializando Banco de Dados PrepUni...");
  console.log("==========================================\n");

  const cwd = path.resolve(__dirname, "..");

  try {
    console.log("1️⃣ Executando criação de tabelas base (setup_postgres.js)...");
    execSync("node setup_postgres.js", { cwd, stdio: "inherit" });

    console.log("\n2️⃣ Executando migração de schema LMS (scripts/setup_lms_schema.js)...");
    execSync("node scripts/setup_lms_schema.js", { cwd, stdio: "inherit" });

    console.log("\n3️⃣ Populando dados iniciais e admin (scripts/seed_lms_data.js)...");
    execSync("node scripts/seed_lms_data.js", { cwd, stdio: "inherit" });

    console.log("\n🎉 Banco de dados inicializado com sucesso e pronto para produção!");
  } catch (err) {
    console.error("\n❌ Falha na inicialização do banco:", err.message);
    process.exit(1);
  }
}

main();

