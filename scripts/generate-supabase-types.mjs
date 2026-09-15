import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const OUTPUT_PATH = path.join(process.cwd(), "src/shared/api/supabase/database.types.ts");

function parseEnvFile(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return separator === -1 ? [line, ""] : [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

function indent(value, spaces) {
  const padding = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${padding}${line}`)
    .join("\n");
}

function getEnumName(format) {
  return typeof format === "string" && format.startsWith("public.") ? format.slice("public.".length).replace(/\[\]$/, "") : null;
}

function renderBaseType(schema, enumNames) {
  const enumName = getEnumName(schema.format);

  if (schema.type === "array") {
    if (enumName && enumNames.has(enumName)) {
      return `Database["public"]["Enums"]["${enumName}"][]`;
    }

    return "Json[]";
  }

  if (schema.enum && enumName) {
    return `Database["public"]["Enums"]["${enumName}"]`;
  }

  if (!schema.type || schema.format === "json" || schema.format === "jsonb") {
    return "Json";
  }

  if (schema.type === "boolean") return "boolean";
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "object") return "Json";
  return "string";
}

function collectEnums(definitions) {
  const enums = new Map();

  for (const definition of Object.values(definitions)) {
    for (const schema of Object.values(definition.properties ?? {})) {
      const enumName = getEnumName(schema.format);
      if (enumName && Array.isArray(schema.enum)) {
        enums.set(enumName, schema.enum);
      }
    }
  }

  return enums;
}

function renderShape(definition, mode, enumNames) {
  const required = new Set(definition.required ?? []);
  const lines = [];

  for (const [column, schema] of Object.entries(definition.properties ?? {})) {
    const nullable = !required.has(column);
    const hasDefault = Object.prototype.hasOwnProperty.call(schema, "default");
    const optional = mode !== "Row" && (mode === "Update" || nullable || hasDefault);
    const type = `${renderBaseType(schema, enumNames)}${nullable ? " | null" : ""}`;
    lines.push(`${column}${optional ? "?" : ""}: ${type}`);
  }

  return lines.length ? `{\n${indent(lines.join("\n"), 2)}\n}` : "Record<string, never>";
}

function renderRelationships(tableName, definition) {
  const relationships = [];

  for (const [column, schema] of Object.entries(definition.properties ?? {})) {
    const match = /<fk table='([^']+)' column='([^']+)'\/>/.exec(schema.description ?? "");
    if (!match) continue;

    relationships.push(`{
  foreignKeyName: "${tableName}_${column}_fkey"
  columns: ["${column}"]
  isOneToOne: false
  referencedRelation: "${match[1]}"
  referencedColumns: ["${match[2]}"]
}`);
  }

  return relationships.length ? `[\n${indent(relationships.join(",\n"), 2)}\n]` : "[]";
}

function renderDatabase(openApi) {
  const definitions = openApi.definitions ?? {};
  const enums = collectEnums(definitions);
  const enumNames = new Set(enums.keys());
  const tableLines = [];

  for (const tableName of Object.keys(definitions).sort()) {
    const definition = definitions[tableName];
    tableLines.push(`${tableName}: {
  Row: ${renderShape(definition, "Row", enumNames)}
  Insert: ${renderShape(definition, "Insert", enumNames)}
  Update: ${renderShape(definition, "Update", enumNames)}
  Relationships: ${renderRelationships(tableName, definition)}
}`);
  }

  const enumLines = [...enums.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, values]) => `${name}: ${values.map((value) => JSON.stringify(value)).join(" | ")}`);

  return `// Generated from the linked Supabase PostgREST schema. Do not edit by hand.
// Regenerate with: npm run supabase:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
${indent(tableLines.join("\n"), 6)}
    }
    Views: Record<string, never>
    Functions: {
      current_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
    }
    Enums: {
${indent(enumLines.join("\n"), 6)}
    }
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends { Row: infer Row }
      ? Row
      : never
    : never;

export type TablesInsert<PublicTableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][PublicTableName] extends {
  Insert: infer Insert
}
  ? Insert
  : never;

export type TablesUpdate<PublicTableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][PublicTableName] extends {
  Update: infer Update
}
  ? Update
  : never;

export type Enums<PublicEnumName extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][PublicEnumName];
`;
}

async function main() {
  const envFile = await readFile(path.join(process.cwd(), ".env"), "utf8").catch(() => "");
  const env = { ...parseEnvFile(envFile), ...process.env };
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const schemaKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !schemaKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and a Supabase schema key are required to generate database types.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: schemaKey,
      Authorization: `Bearer ${schemaKey}`,
      Accept: "application/openapi+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase schema request failed with HTTP ${response.status}.`);
  }

  const openApi = await response.json();
  await writeFile(OUTPUT_PATH, renderDatabase(openApi), { encoding: "utf8" });
  process.stdout.write(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)} from ${Object.keys(openApi.definitions ?? {}).length} tables.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Supabase type generation failed."}\n`);
  process.exitCode = 1;
});
