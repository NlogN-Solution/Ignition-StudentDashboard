// The cookie that tells the public Ignition site a student is signed in.
//
// The two halves of Ignition are separate deployments with separate origins,
// so the landing site cannot read this app's tokens. Without some signal it
// would keep showing "Login" to a student who already has an account open in
// the next tab, which makes one product feel like two.
//
// This carries no identity and grants nothing. It is a boolean the landing
// site uses to swap a nav label; every actual authorisation decision is made
// by the backend against the JWT. Forging it gets an attacker a link that
// says "Dashboard" and a redirect to the login screen.
//
// Cookies are scoped by host and ignore the port, so this works in
// development (both halves on localhost) and in any deployment where the two
// are subdomains of one registrable domain — set REACT_APP_SESSION_COOKIE_DOMAIN
// to that domain, e.g. ".ignition.co.uk". With the two on unrelated hosts the
// cookie cannot be shared at all and the landing site simply keeps showing
// "Login", which is the correct degraded behaviour.

const COOKIE = "ignition_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // Matches REFRESH_TOKEN_EXPIRE_DAYS.

const domainAttribute = () => {
  const domain = process.env.REACT_APP_SESSION_COOKIE_DOMAIN;
  return domain ? `; domain=${domain}` : "";
};

// `Secure` would stop the cookie being set at all over plain http, which is
// how the whole stack runs locally.
const secureAttribute = () =>
  typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : "";

export const setSessionHint = () => {
  if (typeof document === "undefined") return;
  document.cookie =
    `${COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax` +
    domainAttribute() +
    secureAttribute();
};

export const clearSessionHint = () => {
  if (typeof document === "undefined") return;
  document.cookie =
    `${COOKIE}=; path=/; max-age=0; samesite=lax` + domainAttribute() + secureAttribute();
};
