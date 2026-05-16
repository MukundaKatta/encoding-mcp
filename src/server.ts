#!/usr/bin/env node
/**
 * encoding MCP server. One tool: `transform`.
 *
 * Encode/decode in three flavors:
 *   - html: HTML entities (`&amp;` etc.)
 *   - url: percent-encoding for URL components
 *   - unicode: `\uXXXX` JavaScript escape sequences
 *
 * No external deps. The HTML map covers the named entities most commonly
 * seen in the wild; unmapped chars roundtrip via `&#NNN;` numeric form.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

export type Flavor = 'html' | 'url' | 'unicode';
export type Op = 'encode' | 'decode';

const HTML_NAMED: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
  '&nbsp;': ' ', '&copy;': '©', '&reg;': '®', '&trade;': '™',
  '&hellip;': '…', '&mdash;': '—', '&ndash;': '–',
  '&laquo;': '«', '&raquo;': '»',
  '&iexcl;': '¡', '&iquest;': '¿',
  '&euro;': '€', '&pound;': '£', '&yen;': '¥', '&cent;': '¢',
};
const HTML_NAMED_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_NAMED).map(([k, v]) => [v, k]),
);

export function encode(text: string, flavor: Flavor): string {
  switch (flavor) {
    case 'html': {
      let out = '';
      for (const ch of text) {
        if (HTML_NAMED_REVERSE[ch]) out += HTML_NAMED_REVERSE[ch];
        else if (ch.charCodeAt(0) > 127) out += `&#${ch.codePointAt(0)};`;
        else out += ch;
      }
      return out;
    }
    case 'url':
      return encodeURIComponent(text);
    case 'unicode':
      return text
        .split('')
        .map((c) => {
          const code = c.charCodeAt(0);
          if (code < 128 && code >= 32 && c !== '\\') return c;
          return '\\u' + code.toString(16).padStart(4, '0');
        })
        .join('');
  }
}

export function decode(text: string, flavor: Flavor): string {
  switch (flavor) {
    case 'html': {
      let s = text;
      // Named entities first (longest first to avoid partial matches).
      for (const [name, char] of Object.entries(HTML_NAMED)) {
        s = s.split(name).join(char);
      }
      // Numeric: &#123; and &#xAB;.
      s = s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)));
      s = s.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
      return s;
    }
    case 'url':
      return decodeURIComponent(text);
    case 'unicode':
      return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }
}

const server = new Server({ name: 'encoding', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'transform',
    description:
      'Encode or decode text. flavor: html (entities), url (percent-encoding), unicode (\\uXXXX).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        flavor: { type: 'string', enum: ['html', 'url', 'unicode'] },
        op: { type: 'string', enum: ['encode', 'decode'] },
      },
      required: ['text', 'flavor', 'op'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name !== 'transform') return errorResult('unknown tool: ' + name);
    const a = args as unknown as { text: string; flavor: Flavor; op: Op };
    const out = a.op === 'encode' ? encode(a.text, a.flavor) : decode(a.text, a.flavor);
    return jsonResult({ result: out });
  } catch (err) {
    return errorResult('encoding failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`encoding MCP server v${VERSION} ready on stdio\n`);
}
