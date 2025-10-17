import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Beer, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Input } from "./components/ui/input.jsx";
import { Button } from "./components/ui/button.jsx";
import Fuse from "fuse.js";

/* =========================
 * Data sets (exemplos)
 * ========================= */
const OWNED_BRANDS = [
  "Budweiser",
  "Corona",
  "Stella Artois",
  "Michelob",
  "Goose Island",
  "Hoegaarden",
  "Modelo",
  "Shock Top",
];

const COMPETITOR_BRANDS = [
  // Ex.: outras marcas concorrentes (apenas exemplos)
  "Heineken",
  "Amstel",
  "Lagunitas",
  "Dos Equis",
  "Pacifico",
];

/* Aliases/variações → nome canônico */
const ALIASES = {
  "michelob ultra": "Michelob",
  stella: "Stella Artois",
  "modelo especial": "Modelo",
  "corona extra": "Corona",
};

/* =========================
 * i18n
 * ========================= */
const I18N = {
  en: {
    title: "Cheers or Tears? 🍺",
    subtitle: "Find out instantly if a beer belongs to our company.",
    placeholder: "Type a beer brand (e.g., Corona...)",
    btnLabel: "Check beer brand",
    footer: "Crafted for beer lovers who care where their brew — and earnings — come from.",
    results: {
      owned: {
        title: "Cheers!",
        description: "Go for it! 🍻",
      },
      not_owned: {
        title: "Tears...",
        description: "Go for tap water, though.",
      },
      competitors: {
        title: "Really?",
        description: "How dare you?",
      },
    },
    suggestions: "Did you mean:",
    noMatch: "No close matches. Try another spelling.",
  },
  pt: {
    title: "Cheers ou Tears? 🍺",
    subtitle: "Descubra na hora se a cerveja pertence à nossa companhia.",
    placeholder: "Digite uma marca (ex.: Corona...)",
    btnLabel: "Verificar marca",
    footer:
      "Feito para quem se importa com a origem da sua cerveja — e dos seus vencimentos.",
    results: {
      owned: {
        title: "Saúde",
        description: "Manda ver! 🍻",
      },
      not_owned: {
        title: "Não é nossa...",
        description: "Melhor beber água. 😉",
      },
      competitors: {
        title: "Sério mesmo?",
        description: "Pede pra sair.",
      },
    },
    suggestions: "Você quis dizer:",
    noMatch: "Nenhuma sugestão próxima. Tente outra grafia.",
  },
};

/* =========================
 * Utils
 * ========================= */
const normalize = (str = "") =>
  str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/* Retorna nome canônico se bater algum alias */
const aliasToCanonical = (qNorm) => {
  const found = ALIASES[qNorm];
  return found || null;
};

/* Monta índice para fuzzy */
const buildIndex = () => {
  const items = [
    ...OWNED_BRANDS.map((name) => ({ name, type: "owned" })),
    ...COMPETITOR_BRANDS.map((name) => ({ name, type: "competitors" })),
  ];
  const fuse = new Fuse(items, {
    keys: ["name"],
    threshold: 0.35, // sensibilidade do fuzzy
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return { items, fuse };
};

/* =========================
 * Mensagens por resultado
 * ========================= */
const RESULT_MESSAGES = (t) => ({
  owned: {
    title: t.results.owned.title,
    description: t.results.owned.description,
    icon: CheckCircle2,
    className: "result-owned",
  },
  competitors: {
    title: t.results.competitors.title,
    description: t.results.competitors.description,
    icon: AlertTriangle,
    className: "result-competitor",
  },
  not_owned: {
    title: t.results.not_owned.title,
    description: t.results.not_owned.description,
    icon: XCircle,
    className: "result-independent",
  },
});

/* =========================
 * API (assíncrona)
 * Troque USE_API para true e implemente seu endpoint.
 * ========================= */
const USE_API = false;

async function fetchBrandInfo(query) {
  if (USE_API) {
    // Exemplo de chamada real:
    // const res = await fetch(`/api/brand?q=${encodeURIComponent(query)}`);
    // return await res.json(); // { result: "owned"|"competitors"|"not_owned", suggestions?: [] }
    throw new Error("API not implemented");
  } else {
    // Modo local: usa o índice fuzzy e retorna resultado/sugestões
    const qNorm = normalize(query);
    const canonical = aliasToCanonical(qNorm);

    const { items, fuse } = buildIndex();

    // 1) tentativa exata (case-insensitive) nas listas
    const exactOwned = OWNED_BRANDS.some(
      (n) => normalize(n) === (canonical ? normalize(canonical) : qNorm)
    );
    if (exactOwned) return { result: "owned", suggestions: [] };

    const exactComp = COMPETITOR_BRANDS.some(
      (n) => normalize(n) === (canonical ? normalize(canonical) : qNorm)
    );
    if (exactComp) return { result: "competitors", suggestions: [] };

    // 2) tentativa includes (parcial)
    const partialOwned = OWNED_BRANDS.find((n) =>
      normalize(n).includes(qNorm)
    );
    if (partialOwned) return { result: "owned", suggestions: [] };

    const partialComp = COMPETITOR_BRANDS.find((n) =>
      normalize(n).includes(qNorm)
    );
    if (partialComp) return { result: "competitors", suggestions: [] };

    // 3) fuzzy
    const fuzzy = fuse.search(query).slice(0, 5);
    const suggestions = fuzzy.map((r) => r.item.name);

    // Heurística: se a melhor pontuação for “boa”, classifica pelo tipo
    if (fuzzy.length > 0 && fuzzy[0].score <= 0.25) {
      const best = fuzzy[0].item;
      return { result: best.type, suggestions: suggestions.slice(1) };
    }

    // 4) nada encontrado
    return { result: "not_owned", suggestions };
  }
}

/* =========================
 * Componente
 * ========================= */
export default function App() {
  const preferredLang =
    typeof navigator !== "undefined" && navigator.language?.startsWith("pt")
      ? "pt"
      : "en";
  const [lang] = useState(preferredLang);
  const t = I18N[lang];

  const [brand, setBrand] = useState("");
  const [result, setResult] = useState(null); // null | "owned" | "competitors" | "not_owned"
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const trimmedBrand = brand.trim();
  const isButtonDisabled = trimmedBrand.length === 0 || loading;

  const messages = useMemo(() => RESULT_MESSAGES(t), [t]);
  const resultConfig = result ? messages[result] : null;
  const ResultIcon = resultConfig?.icon;

  const inputRef = useRef(null);

  useEffect(() => {
    // Gera sugestões enquanto digita (auto-complete "não intrusivo")
    const run = async () => {
      if (!trimmedBrand) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      const { fuse } = buildIndex();
      const out = fuse.search(trimmedBrand).slice(0, 5).map((r) => r.item.name);
      setSuggestions(out);
      setShowDropdown(out.length > 0);
    };
    run();
  }, [trimmedBrand]);

  const selectSuggestion = (name) => {
    setBrand(name);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const checkBrand = async () => {
    if (isButtonDisabled) return;
    setLoading(true);
    setResult(null);

    try {
      const { result, suggestions } = await fetchBrandInfo(trimmedBrand);
      setResult(result);
      setSuggestions(suggestions || []);
      setShowDropdown((suggestions || []).length > 0 && result === "not_owned");
    } catch (e) {
      // fallback em erro de API
      setResult("not_owned");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkBrand();
    }
  };

  return (
    <div className="app">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="hero-title">{t.title}</h1>
        <p className="hero-subtitle">{t.subtitle}</p>
      </motion.div>

      <Card className="app-card">
        <CardContent>
          <div className="input-row relative">
            <Input
              ref={inputRef}
              placeholder={t.placeholder}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Beer brand name"
              onFocus={() => setShowDropdown(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            <Button
              onClick={checkBrand}
              disabled={isButtonDisabled}
              aria-label={t.btnLabel}
            >
              {loading ? <Beer className="loading-icon" /> : <Search />}
            </Button>

            {/* Dropdown de sugestões */}
            <AnimatePresence>
              {showDropdown && (
                <motion.ul
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="suggestions-dropdown"
                  role="listbox"
                >
                  <li className="suggestions-header">{t.suggestions}</li>
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        className="suggestion-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(s)}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                  {suggestions.length === 0 && (
                    <li className="suggestion-empty">{t.noMatch}</li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {resultConfig && ResultIcon && (
              <motion.div
                key={result}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
                className={`result ${resultConfig.className}`}
              >
                <ResultIcon size={42} />
                <p className="result-title">{resultConfig.title}</p>
                <p className="result-description">{resultConfig.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <p className="footer-note">{t.footer}</p>
    </div>
  );
}
