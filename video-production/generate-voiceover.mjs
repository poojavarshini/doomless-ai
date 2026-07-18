import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const root = path.resolve(import.meta.dirname, "..");
const productionDir = path.join(root, "video-production");
const outputDir = path.join(productionDir, "work", "voice");

async function loadEnv(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const entries = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      return [key, value];
    });
  return Object.fromEntries(entries);
}

const [config, env] = await Promise.all([
  fs.readFile(path.join(productionDir, "voiceover.json"), "utf8").then(JSON.parse),
  loadEnv(path.join(root, ".env")),
]);

if (!env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not configured in .env");
}

await fs.mkdir(outputDir, { recursive: true });
const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
const manifest = [];

for (const chapter of config.chapters) {
  const outputPath = path.join(outputDir, `${chapter.id}.wav`);
  const transcriptPath = path.join(outputDir, `${chapter.id}.txt`);

  const response = await client.chat.completions.create({
    model: config.model,
    modalities: ["text", "audio"],
    audio: { voice: config.voice, format: "wav" },
    messages: [
      {
        role: "system",
        content:
          "You are the narrator of a polished three-minute hackathon product film. Speak in a warm, confident, natural female voice at roughly 145 words per minute. Use crisp diction, light energy, and smooth sentence transitions. Do not add an introduction, commentary, or new words.",
      },
      {
        role: "user",
        content: `Read the following narration exactly as written. Do not paraphrase:\n\n${chapter.script}`,
      },
    ],
  });

  const audio = response.choices[0]?.message?.audio;
  if (!audio?.data) {
    throw new Error(`The audio model did not return audio for ${chapter.id}`);
  }

  await Promise.all([
    fs.writeFile(outputPath, Buffer.from(audio.data, "base64")),
    fs.writeFile(transcriptPath, `${audio.transcript || chapter.script}\n`, "utf8"),
  ]);

  manifest.push({
    id: chapter.id,
    model: config.model,
    voice: config.voice,
    outputPath: path.relative(root, outputPath),
    transcriptPath: path.relative(root, transcriptPath),
  });

  console.log(`Generated ${chapter.id}`);
}

await fs.writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`Voiceover complete: ${manifest.length} chapters`);
