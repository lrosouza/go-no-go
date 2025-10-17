import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Beer, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "./components/ui/card.jsx";
import { Input } from "./components/ui/input.jsx";
import { Button } from "./components/ui/button.jsx";

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

const RESULT_MESSAGES = {
  owned: {
    title: "Cheers!.",
    description: "Go for it!🍻",
    icon: CheckCircle2,
    className: "result-owned",
  },
  not_owned: {
    title: "Tears!",
    description: "Gor for a water (tap), though.",
    icon: XCircle,
    className: "result-independent",
  },
};

export default function App() {
  const [brand, setBrand] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const trimmedBrand = brand.trim();
  const isButtonDisabled = trimmedBrand.length === 0 || loading;

  const checkBrand = () => {
    if (isButtonDisabled) return;

    setLoading(true);
    setResult(null);

    window.setTimeout(() => {
      const match = OWNED_BRANDS.some(
        (name) => name.toLowerCase() === trimmedBrand.toLowerCase()
      );
      setResult(match ? "owned" : "not_owned");
      setLoading(false);
    }, 900);
  };

  const resultConfig = useMemo(() => {
    return result ? RESULT_MESSAGES[result] : null;
  }, [result]);

  const ResultIcon = resultConfig?.icon;

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
        <h1 className="hero-title">Cheers or Tears? 🍺</h1>
        <p className="hero-subtitle">
          Find out instantly if a beer belongs to our
          company.
        </p>
      </motion.div>

      <Card className="app-card">
        <CardContent>
          <div className="input-row">
            <Input
              placeholder="Type a beer brand (e.g., Corona...)"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Beer brand name"
            />
            <Button
              onClick={checkBrand}
              disabled={isButtonDisabled}
              aria-label="Check beer brand"
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

      <p className="footer-note">
        Crafted for beer lovers who care where their brew, and earnings, comes from.
      </p>
    </div>
  );
}
