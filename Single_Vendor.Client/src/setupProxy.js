/**
 * CRA dev server: forward /api to ASP.NET (same target as REACT_APP_API_URL).
 * Do not proxy /Identity here: OAuth redirect_uri must match Google Cloud Console (API origin + /signin-google).
 * Google sign-in uses REACT_APP_API_URL + /Identity/Account/GoogleLogin (see AuthModal).
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const target =
    process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "https://localhost:7182";

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: "warn",
    })
  );
};
