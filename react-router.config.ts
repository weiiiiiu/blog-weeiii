import type { Config } from "@react-router/dev/config";
import { getDynamicPaths } from "./utils/dynamic-path";

export default {
  // Config options...
  // ssr-false to no-server SSG
  ssr: false,
  prerender: async ({ getStaticPaths }) => {
    const paths = await getStaticPaths();
    const dyn_paths = await getDynamicPaths();

    return ["/", ...paths, ...dyn_paths, "/test/a", "/404"];
  },
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: false,
    v8_trailingSlashAwareDataRequests: false,
  },
} satisfies Config;
