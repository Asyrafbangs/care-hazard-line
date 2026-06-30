function sanitize(value: string): string {
  // Vercel/dotenv values pasted by hand frequently carry surrounding quotes,
  // a trailing newline, or stray whitespace. These survive `Boolean(value)`
  // checks but break consumers like supabase-js ("Invalid supabaseUrl").
  return value.trim().replace(/^['"]|['"]$/g, "").trim();
}

export function getRequiredEnv(name: string): string {
  const raw = process.env[name];

  if (raw === undefined || raw === null || sanitize(raw) === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return sanitize(raw);
}

export function getOptionalEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return undefined;
  const value = sanitize(raw);
  return value === "" ? undefined : value;
}

/**
 * Reads an environment variable that must be a valid http(s) URL. Throws a
 * descriptive error (naming the variable and the offending value) instead of
 * letting an opaque "Invalid supabaseUrl" surface from a downstream library.
 */
export function getRequiredUrl(name: string): string {
  const value = getRequiredEnv(name);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      `Environment variable ${name} is not a valid URL. Received: "${value}". ` +
        `It must start with "https://" (e.g. https://your-project.supabase.co).`
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Environment variable ${name} must use http(s). Received protocol: "${parsed.protocol}".`
    );
  }

  return value;
}
