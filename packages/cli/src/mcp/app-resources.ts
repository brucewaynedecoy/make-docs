import { z } from "zod";

export const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app";

/** UI resources are static assets, not project records or a second operation path. */
export const AppResourceSchema = z.strictObject({
  uri: z.string().regex(/^ui:\/\/[a-z0-9][a-z0-9.-]*(?:\/[a-z0-9][a-z0-9-]*)*\/v[1-9][0-9]*\.html$/),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  text: z.string().min(1).max(1_000_000),
});

export type AppResource = z.infer<typeof AppResourceSchema>;

/** No file, Store, transport, or tool access occurs here. */
export function createAppResourceCatalog(input: readonly AppResource[]) {
  const resources = z.array(AppResourceSchema).parse(input);
  const byUri = new Map(resources.map(resource => [resource.uri, resource]));
  if (byUri.size !== resources.length) throw new Error("Duplicate MCP app resource URI.");

  const metadata = () => ({
    ui: {
      csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] },
      prefersBorder: true,
    },
  });
  return {
    list: () => resources.map(({ text: _text, ...resource }) => ({
      ...resource,
      mimeType: MCP_APP_MIME_TYPE,
      _meta: metadata(),
    })),
    read: (uri: string) => {
      const resource = byUri.get(uri);
      if (!resource) return undefined;
      return { contents: [{
        uri: resource.uri,
        mimeType: MCP_APP_MIME_TYPE,
        text: resource.text,
        _meta: metadata(),
      }] };
    },
  };
}
