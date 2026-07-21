export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin",
  facebookGraphApiUrl: process.env.FACEBOOK_GRAPH_API_URL ?? "https://graph.facebook.com"
};
