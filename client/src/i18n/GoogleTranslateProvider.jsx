import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, getGoogleTargetLang, normalizeLangCode } from "./languages";

const CACHE_KEY = "gt-cache-v1";

function shouldTranslateElement(el) {
  if (!el || el.nodeType !== 1) return false;

  const tag = (el.tagName || "").toUpperCase();
  if (["SCRIPT", "STYLE", "INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(tag)) return false;
  if (el.dataset && el.dataset.i18nSkip === "1") return false;

  const raw = (el.textContent || "").trim();
  if (!raw) return false;
  if (raw.length < 2) return false;

  // Avoid translating standalone +/- buttons and similar symbols.
  if (/^[-+xX*]$/.test(raw)) return false;

  // If the text has no letters at all, it's usually numbers/symbols; leave it.
  // This reduces weirdness like translating "$12.34" or "#4".
  if (!/[A-Za-z]/.test(raw)) return false;

  return true;
}

function getLeafElements(root) {
  const all = Array.from(root.querySelectorAll("*"));
  return all.filter((el) => el.children.length === 0 && shouldTranslateElement(el));
}

function getRoot() {
  return document.getElementById("root");
}

async function translateTexts({ apiUrl, targetLang, texts, cache, setCache }) {
  // texts must be an array of unique strings.
  const missing = [];
  const results = new Map();

  for (const text of texts) {
    const k = `${targetLang}||${text}`;
    if (cache.has(k)) {
      results.set(text, cache.get(k));
    } else {
      missing.push(text);
    }
  }

  if (missing.length > 0) {
    const res = await fetch(`${apiUrl}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLang, texts: missing }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      // If translation fails, fall back to originals to avoid breaking UI.
      return Object.fromEntries(texts.map((t) => [t, t]));
    }

    const translations = data.translations || [];
    for (let i = 0; i < missing.length; i += 1) {
      const translated = translations[i] || missing[i];
      const k = `${targetLang}||${missing[i]}`;
      cache.set(k, translated);
      results.set(missing[i], translated);
    }

    // Persist cache (best effort).
    try {
      const obj = {};
      for (const [k, v] of cache.entries()) obj[k] = v;
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch {
      // ignore
    }

    setCache(cache);
  }

  // Convert to plain object for convenience.
  const out = {};
  for (const text of texts) {
    out[text] = results.get(text) || text;
  }
  return out;
}

export default function GoogleTranslateProvider({ children }) {
  const API_URL = useMemo(() => {
    return (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");
  }, []);

  const [langCode, setLangCode] = useState(() => {
    const saved = localStorage.getItem("ui-lang") || "";
    const fromNav = navigator.language || "en";
    return normalizeLangCode(saved || fromNav);
  });

  const targetLang = useMemo(() => getGoogleTargetLang(langCode), [langCode]);

  const cacheRef = useRef(new Map());
  const setCache = () => {};

  useEffect(() => {
    // Load cache once.
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return;
      cacheRef.current = new Map(Object.entries(obj));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ui-lang", langCode);
  }, [langCode]);

  // Translate currently visible UI (leaf nodes only).
  async function translateNow() {
    const root = getRoot();
    if (!root) return;

    const leafEls = getLeafElements(root);

    // English: restore originals.
    if (langCode === "en") {
      for (const el of leafEls) {
        const orig = el.dataset && el.dataset.i18nOriginal;
        if (orig) el.textContent = orig;
        if (el.dataset) delete el.dataset.i18nTranslatedLang;
      }
      return;
    }

    const originals = [];
    const elOriginalByEl = new Map();

    for (const el of leafEls) {
      const current = (el.textContent || "").trim();
      if (!el.dataset.i18nOriginal) el.dataset.i18nOriginal = current;
      const original = el.dataset.i18nOriginal;
      elOriginalByEl.set(el, original);
      originals.push(original);
    }

    const uniqueOriginals = Array.from(new Set(originals));

    const cache = cacheRef.current;
    const translationsByText = await translateTexts({
      apiUrl: API_URL,
      targetLang,
      texts: uniqueOriginals,
      cache,
      setCache,
    });

    for (const el of leafEls) {
      const original = elOriginalByEl.get(el) || "";
      const translated = translationsByText[original] || original;
      el.textContent = translated;
      el.dataset.i18nTranslatedLang = langCode;
    }
  }

  // Translate on initial load and whenever the language changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      translateNow().catch(() => {
        // ignore
      });
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langCode, targetLang]);

  // Translate newly added UI (cart items, etc.) after language selection.
  useEffect(() => {
    const root = getRoot();
    if (!root) return undefined;
    if (langCode === "en") return undefined;

    const observer = new MutationObserver((mutations) => {
      const addedCandidates = [];

      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node && node.nodeType === 1) {
            addedCandidates.push(node);
          }
        }
      }

      if (addedCandidates.length === 0) return;

      // Debounce multiple DOM inserts from React.
      window.clearTimeout(observer._t);
      observer._t = window.setTimeout(async () => {
        const allLeafEls = [];
        for (const node of addedCandidates) {
          if (node.children && node.children.length === 0 && shouldTranslateElement(node)) {
            allLeafEls.push(node);
          } else if (node.querySelectorAll) {
            const leaves = getLeafElements(node);
            allLeafEls.push(...leaves);
          }
        }

        if (allLeafEls.length === 0) return;

        // Only translate elements that have text and don't already have originals.
        const uniqueOriginals = [];
        const originalsByEl = new Map();
        for (const el of allLeafEls) {
          const current = (el.textContent || "").trim();
          if (!el.dataset.i18nOriginal) el.dataset.i18nOriginal = current;
          const original = el.dataset.i18nOriginal;
          originalsByEl.set(el, original);
          uniqueOriginals.push(original);
        }

        const uniq = Array.from(new Set(uniqueOriginals));
        const cache = cacheRef.current;
        const translationsByText = await translateTexts({
          apiUrl: API_URL,
          targetLang,
          texts: uniq,
          cache,
          setCache,
        });

        for (const el of allLeafEls) {
          const original = originalsByEl.get(el) || "";
          const translated = translationsByText[original] || original;
          el.textContent = translated;
          el.dataset.i18nTranslatedLang = langCode;
        }
      }, 250);
    });

    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [API_URL, langCode, targetLang]);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 9999,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(0,0,0,0.15)",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 12,
          color: "#111",
        }}
      >
        <label style={{ marginRight: 8 }}>Language</label>
        <select value={langCode} onChange={(e) => setLangCode(e.target.value)} style={{ padding: 4 }}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      {children}
    </>
  );
}

