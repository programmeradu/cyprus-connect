import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// `buildCommand` belongs to the top-level OpenNext config, not the Cloudflare
// overrides, so it is set next to them rather than inside.
export default {
	...defineCloudflareConfig({
		// For best results consider enabling R2 caching
		// See https://opennext.js.org/cloudflare/caching for more details
		// incrementalCache: r2IncrementalCache
	}),
	buildCommand: "npm run build",
};
