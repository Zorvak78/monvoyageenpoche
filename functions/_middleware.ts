/**
 * Cloudflare Pages Function — porte d'entrée de l'espace privé.
 *
 * Tout ce qui vit sous /prive/ n'est servi qu'après une connexion réussie :
 * sans session valide, le serveur ne renvoie jamais le contenu, seulement
 * le formulaire de connexion.
 *
 * Configuration requise côté Cloudflare Pages (Settings → Variables) :
 *   - PRIVE_USER     : votre identifiant
 *   - PRIVE_PASSWORD : votre mot de passe (à créer en « Secret »)
 * Changer le mot de passe invalide automatiquement les sessions ouvertes.
 */

interface Env {
  PRIVE_USER?: string;
  PRIVE_PASSWORD?: string;
}

const COOKIE = "espace_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours
const enc = new TextEncoder();

/* ---------- signature de session (HMAC-SHA256) ---------- */
const b64url = (buf: ArrayBuffer) => {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
async function keyFrom(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode("espace-prive:" + secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
async function sign(payload: string, secret: string) {
  const sig = await crypto.subtle.sign("HMAC", await keyFrom(secret), enc.encode(payload));
  return payload + "." + b64url(sig);
}
/* comparaison à durée constante : ne révèle pas où la différence se trouve */
function safeEqual(a: string, b: string) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
async function issue(user: string, secret: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return sign(`${encodeURIComponent(user)}.${exp}`, secret);
}
async function valid(token: string | null, secret: string) {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const expected = await sign(payload, secret);
  if (!safeEqual(token, expected)) return false;
  const exp = Number(payload.split(".")[1] || 0);
  return Number.isFinite(exp) && exp * 1000 > Date.now();
}
const cookieOf = (req: Request, name: string) => {
  const raw = req.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
};
/* la cible de redirection doit rester interne à l'espace privé */
const safeNext = (v: string | null) => (v && /^\/prive(\/|$)/.test(v) && !v.startsWith("//") ? v : "/prive/");

/* ---------- page de connexion ---------- */
function loginPage(opts: { error?: string; next?: string; notice?: string } = {}) {
  const err = opts.error
    ? `<p style="color:var(--neg);font-size:.83rem;margin-top:12px">${opts.error}</p>` : "";
  const notice = opts.notice
    ? `<p style="color:var(--muted);font-size:.8rem;margin-top:12px">${opts.notice}</p>` : "";
  return `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex, nofollow"><title>Espace privé</title>
<meta name="theme-color" content="#f7f6f3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101215" media="(prefers-color-scheme: dark)">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231f3f66'/%3E%3Cpath d='M22 30v-6a10 10 0 0120 0v6' fill='none' stroke='%23fff' stroke-width='5'/%3E%3Crect x='16' y='30' width='32' height='22' rx='5' fill='%23fff'/%3E%3C/svg%3E">
<style>
:root{color-scheme:light;--page:#f7f6f3;--surface:#fdfcfa;--ink:#1b1d21;--ink-2:#55575c;--muted:#8d8b85;
 --border:#e4e1da;--border-strong:#d4d0c7;--accent:#1f3f66;--neg:#b23c30;
 --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif}
@media (prefers-color-scheme:dark){:root{color-scheme:dark;--page:#101215;--surface:#16181b;--ink:#f2f1ee;
 --ink-2:#b3b2ae;--muted:#8b8a86;--border:#262a2f;--border-strong:#363b42;--accent:#8fb0d8;--neg:#d97456}}
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:var(--page);color:var(--ink);
 font:14.5px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.box{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:30px 28px;width:min(390px,100%);
 box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mark{width:36px;height:36px;border-radius:9px;background:var(--accent);display:grid;place-items:center;margin-bottom:18px}
.mark svg{width:20px;height:20px}
h1{margin:0;font-family:var(--serif);font-weight:400;font-size:1.6rem;letter-spacing:-.01em}
p.sub{margin:6px 0 22px;color:var(--muted);font-size:.84rem}
label{display:block;font-size:.78rem;font-weight:520;color:var(--ink-2);margin:0 0 5px}
input[type=text],input[type=password]{width:100%;font:inherit;font-size:.9rem;color:var(--ink);background:var(--page);
 border:1px solid var(--border-strong);border-radius:8px;padding:9px 11px;margin-bottom:14px}
input:focus{outline:1.5px solid var(--accent);outline-offset:1px}
.check{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--ink-2);margin-bottom:18px}
.check input{accent-color:var(--accent);width:16px;height:16px}
button{width:100%;padding:10px;border:none;border-radius:8px;background:var(--accent);color:#fff;font:inherit;
 font-weight:560;cursor:pointer}
@media (prefers-color-scheme:dark){button{color:#101215}}
button:hover{filter:brightness(1.1)}
.foot{margin-top:20px;font-size:.75rem;color:var(--muted);line-height:1.5}
</style></head><body>
<form class="box" method="POST" action="/prive/login">
  <div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round">
    <rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 118 0v3"/></svg></div>
  <h1>Espace privé</h1>
  <p class="sub">Cet espace est réservé. Identifiez-vous pour continuer.</p>
  <input type="hidden" name="next" value="${(opts.next || "/prive/").replace(/"/g, "&quot;")}">
  <label for="u">Identifiant</label>
  <input id="u" name="user" type="text" autocomplete="username" autocapitalize="off" spellcheck="false" required autofocus>
  <label for="p">Mot de passe</label>
  <input id="p" name="password" type="password" autocomplete="current-password" required>
  <label class="check"><input type="checkbox" name="remember" value="1" checked> Rester connecté 30 jours</label>
  <button type="submit">Entrer</button>
  ${err}${notice}
  <p class="foot">Connexion chiffrée. Aucune donnée n'est accessible sans identification.</p>
</form></body></html>`;
}
const htmlResponse = (body: string, status = 200, extra: Record<string, string> = {}) =>
  new Response(body, {
    status,
    headers: Object.assign({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
    }, extra),
  });

/* ---------- middleware ---------- */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (!/^\/prive(\/|$)/.test(path)) return next();          // site public : inchangé

  const user = env.PRIVE_USER || "";
  const password = env.PRIVE_PASSWORD || "";
  if (!user || !password) {
    return htmlResponse(loginPage({
      error: "Espace non configuré.",
      notice: "Définissez les variables PRIVE_USER et PRIVE_PASSWORD dans Cloudflare Pages (Settings → Variables and Secrets), puis redéployez.",
    }), 503);
  }

  /* déconnexion */
  if (path === "/prive/logout") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/prive/login",
        "Set-Cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/prive; Max-Age=0`,
        "Cache-Control": "no-store",
      },
    });
  }

  const authenticated = await valid(cookieOf(request, COOKIE), password);

  /* formulaire de connexion */
  if (path === "/prive/login") {
    if (request.method === "GET") {
      if (authenticated) return Response.redirect(new URL(safeNext(url.searchParams.get("next")), url).toString(), 302);
      return htmlResponse(loginPage({ next: safeNext(url.searchParams.get("next")) }));
    }
    if (request.method === "POST") {
      const form = await request.formData();
      const u = String(form.get("user") || "");
      const p = String(form.get("password") || "");
      const dest = safeNext(String(form.get("next") || ""));
      const ok = safeEqual(u, user) && safeEqual(p, password);
      if (!ok) {
        await new Promise((r) => setTimeout(r, 700));        // ralentit les essais répétés
        return htmlResponse(loginPage({ error: "Identifiant ou mot de passe incorrect.", next: dest }), 401);
      }
      const token = await issue(u, password);
      const persist = form.get("remember") ? `; Max-Age=${MAX_AGE}` : "";
      return new Response(null, {
        status: 303,
        headers: {
          Location: dest,
          "Set-Cookie": `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/prive${persist}`,
          "Cache-Control": "no-store",
        },
      });
    }
    return new Response("Méthode non autorisée", { status: 405 });
  }

  /* tout le reste de l'espace privé */
  if (!authenticated) {
    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Non autorisé", { status: 401 });
    const back = new URL("/prive/login", url);
    back.searchParams.set("next", path + url.search);
    return Response.redirect(back.toString(), 302);
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "no-store");
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  out.headers.set("Referrer-Policy", "no-referrer");
  out.headers.set("X-Frame-Options", "DENY");
  return out;
};
