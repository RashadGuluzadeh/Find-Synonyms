import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The only third-party origins the app may talk to (keep in sync with src/lib/http.ts).
const API_ORIGINS = ["https://api.datamuse.com", "https://en.wiktionary.org"];

const cspDirectives = {
  "default-src": ["'none'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'", ...API_ORIGINS],
  "manifest-src": ["'self'"],
  "base-uri": ["'none'"],
  "form-action": ["'none'"],
  "object-src": ["'none'"],
};

const toPolicy = (directives: Record<string, string[]>) =>
  Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");

// frame-ancestors is ignored inside a <meta> tag, so it only goes into the header.
const CSP_META = `${toPolicy(cspDirectives)}; upgrade-insecure-requests`;
const CSP_HEADER = `${CSP_META}; frame-ancestors 'none'`;

const baseSecurityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
};

/**
 * Injects a strict CSP <meta> into the production build. It is skipped in dev,
 * because Vite's HMR client and React Refresh rely on inline scripts.
 */
const cspMetaPlugin = (): Plugin => ({
  name: "csp-meta",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "meta",
      attrs: { "http-equiv": "Content-Security-Policy", content: CSP_META },
      injectTo: "head-prepend",
    },
  ],
});

/** Emits a `_headers` file (Netlify / Cloudflare Pages format) with the same policy. */
const headersFilePlugin = (): Plugin => ({
  name: "static-host-headers",
  apply: "build",
  generateBundle() {
    const lines = Object.entries({ ...baseSecurityHeaders, "Content-Security-Policy": CSP_HEADER })
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");
    this.emitFile({ type: "asset", fileName: "_headers", source: `/*\n${lines}\n` });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), cspMetaPlugin(), headersFilePlugin()],
  server: {
    headers: baseSecurityHeaders,
  },
  preview: {
    headers: { ...baseSecurityHeaders, "Content-Security-Policy": CSP_HEADER },
  },
  build: {
    sourcemap: false,
    target: "es2022",
  },
});
