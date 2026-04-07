const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const storagePath = path.join(process.cwd(), "data", "questionnaires.json");

async function ensureStorageFile() {
  try {
    await fs.access(storagePath);
  } catch {
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(storagePath, "[]", "utf-8");
  }
}

async function readQuestionnaires() {
  await ensureStorageFile();
  const raw = await fs.readFile(storagePath, "utf-8");
  return JSON.parse(raw);
}

async function saveQuestionnaire(payload) {
  const questionnaires = await readQuestionnaires();

  const entry = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    ...payload,
  };

  questionnaires.push(entry);
  await fs.writeFile(storagePath, JSON.stringify(questionnaires, null, 2), "utf-8");

  return entry;
}

module.exports = { readQuestionnaires, saveQuestionnaire };
