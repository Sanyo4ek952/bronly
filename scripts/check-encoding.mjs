import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const rootDir = process.cwd();

const TEXT_EXTENSIONS = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".html",
  ".svg",
  ".yml",
  ".yaml",
  ".ps1",
  ".sh",
  ".sql",
  ".env",
  ".txt",
]);

const TEXT_FILENAMES = new Set([
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".npmrc",
  ".prettierignore",
  ".prettierrc",
  "AGENTS.md",
  "README.md",
  "CLAUDE.md",
  "next-env.d.ts",
]);

const MOJIBAKE_PATTERN = /(?:\u00D0.|\u00D1.|\u00C3.){2,}|\uFFFD/u;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

function isTextFile(filePath) {
  const baseName = path.basename(filePath);
  if (TEXT_FILENAMES.has(baseName)) {
    return true;
  }

  if (baseName.startsWith(".env")) {
    return true;
  }

  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function getTrackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  return output.split("\0").filter(Boolean).filter(isTextFile);
}

function hasUtf8Bom(buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  );
}

function normalizeLineEndings(text) {
  return text.replace(/\r\n?/g, "\n");
}

function decodeUtf8(buffer, filePath, errors) {
  try {
    return utf8Decoder.decode(buffer);
  } catch {
    errors.push(`${filePath}: file is not valid UTF-8`);
    return null;
  }
}

function containsMojibake(text) {
  return MOJIBAKE_PATTERN.test(text);
}

function rewriteFile(filePath, text) {
  fs.writeFileSync(path.join(rootDir, filePath), text, "utf8");
}

const trackedFiles = getTrackedFiles();
const errors = [];
const normalizedFiles = [];

for (const filePath of trackedFiles) {
  const absolutePath = path.join(rootDir, filePath);
  const buffer = fs.readFileSync(absolutePath);
  const hadBom = hasUtf8Bom(buffer);
  const contentBuffer = hadBom ? buffer.subarray(3) : buffer;
  const decoded = decodeUtf8(contentBuffer, filePath, errors);

  if (decoded === null) {
    continue;
  }

  const normalizedText = normalizeLineEndings(decoded);
  const needsRewrite = hadBom || normalizedText !== decoded;

  if (shouldWrite && needsRewrite) {
    rewriteFile(filePath, normalizedText);
    normalizedFiles.push(filePath);
  }

  if (!shouldWrite && hadBom) {
    errors.push(`${filePath}: UTF-8 BOM is not allowed`);
  }

  if (containsMojibake(normalizedText)) {
    errors.push(`${filePath}: possible mojibake detected`);
  }
}

if (shouldWrite && normalizedFiles.length > 0) {
  console.log(`Normalized ${normalizedFiles.length} files to UTF-8 without BOM and LF.`);
}

if (errors.length > 0) {
  console.error("Encoding check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Encoding check passed for ${trackedFiles.length} tracked text files.`);
