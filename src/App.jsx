import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Beer, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Input } from "./components/ui/input.jsx";
import { Button } from "./components/ui/button.jsx";
import Fuse from "fuse.js";

/* =========================
 * Data sets
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
  "Heineken",
  "Amstel",
  ];

const ALIASES = {
  "michelob ultra": "Michelob",
  "stella": "Stella Artois",
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
    footer:
      "Crafted for beer lovers who care where their brew — and earnings — come from.",
    results: {
      owned: { title: "Cheers!", description: "Go for it! 🍻" },
      not_owned: { title: "Not Ours...", description: "Go for tap water, though.😉" },
      competitors: {
        title: "Really?",
        description: "How dare you? 🤬",
      },
    },
  },
  pt: {
    title: "Cheers ou Tears? 🍺",
    subtitle: "Descubra na hora se a cerveja pertence à nossa companhia.",
    placeholder: "Digite uma marca (ex.: Corona...)",
    btnLabel: "Verificar marca",
    footer:
      "Feito para quem se importa com a origem da sua cerveja — e dos seus vencimentos.",
    results: {
      owned: { title: "Cheers!", description: "Manda ver! 🍻" },
      not_owned: { title: "Não é nossa", description: "Melhor ir de água mesmo. 😉" },
      competitors: {
        title: "Jura?",
        description: "Tá maluco? 🤬",
      },
    },
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

const aliasToCanonical = (qNorm) => ALIASES[qNorm] || null;

const buildIndex = () => {
  const items = [
    ...OWNED_BRANDS.map((name) => ({ name, type: "owned" })),
    ...COMPETITOR_BRANDS.map((name) => ({ name, type: "competitors" })),
  ];
  const fuse = new Fuse(items, {
    keys: ["name"],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  return { items, fuse };
};

/* =========================
 * Messages
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
    icon: XCircle,
    className: "result-competitor",
  },
  not_owned: {
    title: t.results.not_owned.title,
    description: t.results.not_owned.description,
    icon: AlertTriangle,
    className: "result-not-owned",
  },
});

/* =========================
 * Local fuzzy check (async-ready)
 * ========================= */
async function fetchBrandInfo(query) {
  const qNorm = normalize(query);
  const canonical = aliasToCanonical(qNorm);
  const { fuse } = buildIndex();

  // Exato
  if (OWNED_BRANDS.some((n) => normalize(n) === (canonical || qNorm))) return "owned";
  if (COMPETITOR_BRANDS.some((n) => normalize(n) === (canonical || qNorm)))
    return "competitors";

  // Parcial
  if (OWNED_BRANDS.some((n) => normalize(n).includes(qNorm))) return "owned";
  if (COMPETITOR_BRANDS.some((n) => normalize(n).includes(qNorm))) return "competitors";

  // Fuzzy
  const fuzzy = fuse.search(query);
  if (fuzzy.length && fuzzy[0].score <= 0.25) return fuzzy[0].item.type;

  return "not_owned";
}

/* =========================
 * Component
 * ========================= */
export default function App() {
  const preferredLang =
    typeof navigator !== "undefined" && navigator.language?.startsWith("pt")
      ? "pt"
      : "en";
  const [lang] = useState(preferredLang);
  const t = I18N[lang];

  const [brand, setBrand] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const trimmedBrand = brand.trim();
  const isButtonDisabled = trimmedBrand.length === 0 || loading;

  const messages = useMemo(() => RESULT_MESSAGES(t), [t]);
  const resultConfig = result ? messages[result] : null;
  const ResultIcon = resultConfig?.icon;

  const checkBrand = async () => {
    if (isButtonDisabled) return;
    setLoading(true);
    setResult(null);
    const res = await fetchBrandInfo(trimmedBrand);
    setResult(res);
    setLoading(false);
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
          <div className="input-row">
            <Input
              placeholder={t.placeholder}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Beer brand name"
            />
            <Button
              onClick={checkBrand}
              disabled={isButtonDisabled}
              aria-label={t.btnLabel}
            >
              {loading ? <Beer className="loading-icon" /> : <Search />}
            </Button>
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
