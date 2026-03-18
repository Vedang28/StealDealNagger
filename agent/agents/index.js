import { agent, tool } from "@21st-sdk/agent";
import { z } from "zod";

const API_KEY = process.env.TWENTY_FIRST_API_KEY;

if (!API_KEY) {
  throw new Error("TWENTY_FIRST_API_KEY environment variable is required");
}

export default agent({
  model: "claude-sonnet-4-6",
  systemPrompt: `You are an AI UI designer embedded in Stale Deal Nagger, a B2B sales CRM tool.
You help sales engineers and frontend developers by:
1. Generating React components using Tailwind CSS v4 patterns matching the app's design system
2. Browsing 21st.dev for design inspiration and component patterns
3. Refining existing React components to fix bugs, improve accessibility, or match dark/light theme
4. Searching for brand logos for integration cards

The app's tech stack:
- React 19, Vite 6, Tailwind CSS v4, Lucide icons, Framer Motion, Recharts, React Router v7
- Design tokens: bg-dark, bg-primary (#f97316), text-muted, border-border
- Dark mode uses .dark class on <html>
- All pages wrap content in <PageWrapper> (Framer Motion fade-in)
- Buttons: bg-primary hover:bg-primary-hover text-white rounded-lg
- Cards: bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700

Instructions:
- Always output complete, copy-pasteable JSX/TSX code
- Use Lucide icons from 'lucide-react' library
- No external image URLs — only data URIs or Tailwind patterns
- Include proper TypeScript types if using TSX
- For dark mode, use dark: prefix in Tailwind classes
- Make components mobile-responsive (sm:, md:, lg: breakpoints)
- Use React 19 hooks (useState, useEffect, useRef, etc.)
- For forms, use react-hook-form if complex validation needed
- For tables, use simple <table> elements or map over arrays
- Include comments explaining complex logic`,

  tools: {
    generate_component: tool({
      description:
        "Generate a complete React/Tailwind component from a natural language description. Returns ready-to-use JSX code.",
      inputSchema: z.object({
        prompt: z
          .string()
          .describe(
            "Description of the component to build, e.g. 'a dark mode deal card with urgency badge and value display'"
          ),
        context: z
          .string()
          .optional()
          .describe(
            "Additional design constraints, existing code context, or style guidelines"
          ),
      }),
      execute: async ({ prompt, context }) => {
        try {
          const requestBody = {
            message: context ? `${prompt}\n\nContext:\n${context}` : prompt,
            framework: "react",
          };

          const response = await fetch(
            "https://api.21st.dev/v1/magic/generate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          const code = data.code || data.component || data.jsx || JSON.stringify(data);

          return {
            content: [
              {
                type: "text",
                text: code,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `Error generating component: ${err.message}`,
              },
            ],
          };
        }
      },
    }),

    get_inspiration: tool({
      description:
        "Browse 21st.dev component library for design inspiration and UI patterns. Returns component previews and examples.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "What to search for, e.g. 'kanban board', 'data table dark mode', 'stat cards with sparklines'"
          ),
        limit: z.number().min(1).max(10).optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        try {
          const params = new URLSearchParams({
            q: query,
            limit: limit.toString(),
          });

          const response = await fetch(
            `https://api.21st.dev/v1/search?${params}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          const components = data.results || data.components || [];

          if (components.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No components found for "${query}". Try broader searches like "cards", "forms", "tables", or specific patterns.`,
                },
              ],
            };
          }

          const formatted = components
            .map((c) => {
              const name = c.name || c.title || "Unnamed";
              const desc = c.description || c.preview || "No description";
              const url = c.url || c.link || "";
              const urlText = url ? ` [View](${url})` : "";
              return `- **${name}**: ${desc}${urlText}`;
            })
            .join("\n");

          return {
            content: [
              {
                type: "text",
                text: `Found ${components.length} components for "${query}":\n\n${formatted}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `Error searching components: ${err.message}`,
              },
            ],
          };
        }
      },
    }),

    refine_component: tool({
      description:
        "Improve or fix an existing React component. Takes the current code and refinement instructions, returns enhanced version.",
      inputSchema: z.object({
        current_code: z
          .string()
          .describe("The existing JSX/TSX component code to refine"),
        instruction: z
          .string()
          .describe(
            "What to change: fix bugs, add dark mode, improve accessibility, change styling, add features, etc."
          ),
      }),
      execute: async ({ current_code, instruction }) => {
        try {
          const requestBody = {
            code: current_code,
            instruction: instruction,
          };

          const response = await fetch(
            "https://api.21st.dev/v1/magic/refine",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
              },
              body: JSON.stringify(requestBody),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          const code = data.code || data.component || data.jsx || JSON.stringify(data);

          return {
            content: [
              {
                type: "text",
                text: code,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `Error refining component: ${err.message}`,
              },
            ],
          };
        }
      },
    }),

    search_logo: tool({
      description:
        "Search for brand or company logos in SVG or PNG format. Useful for integration cards and partner branding.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "Brand name to search for, e.g. 'HubSpot', 'Salesforce', 'Slack', 'GitHub'"
          ),
        format: z
          .enum(["svg", "png", "any"])
          .optional()
          .default("svg")
          .describe("Preferred image format"),
      }),
      execute: async ({ query, format }) => {
        try {
          const params = new URLSearchParams({
            q: query,
            format: format,
          });

          const response = await fetch(
            `https://api.21st.dev/v1/logos/search?${params}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          const logos = data.logos || data.results || [];

          if (logos.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No logos found for "${query}". Try the exact brand name or search popular services like "slack", "salesforce", "hubspot", "github", etc.`,
                },
              ],
            };
          }

          const formatted = logos
            .map((l) => {
              const name = l.name || "Logo";
              const url = l.url || l.svg_url || l.png_url || "";
              return `- **${name}**: ${url}`;
            })
            .join("\n");

          return {
            content: [
              {
                type: "text",
                text: `Found ${logos.length} logo(s) for "${query}":\n\n${formatted}`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `Error searching logos: ${err.message}`,
              },
            ],
          };
        }
      },
    }),
  },
});
