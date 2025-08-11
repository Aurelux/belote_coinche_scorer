import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onFinish, 4000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-blue-600 flex items-center justify-center z-50">
      <AnimatePresence>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          >
            <Sparkles className="w-20 h-20 text-white drop-shadow-lg" />
          </motion.div>
          <motion.p
            className="text-white text-lg font-medium"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Chargement…
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

