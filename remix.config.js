import { flatRoutes } from "@remix-run/fs-routes";

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  routes: async (defineRoutes) => {
    // Use flat-routes to pick up nested files under app/routes
    return flatRoutes("routes", defineRoutes);
  },
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
};
