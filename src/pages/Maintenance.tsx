import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { pageTransition, slideUp, scaleIn, buttonPress } from "@/lib/motion";

export default function Maintenance() {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground space-y-8"
      variants={pageTransition}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="relative flex items-center justify-center"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full w-48 h-48 sm:w-64 sm:h-64"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="bg-primary/10 p-6 rounded-full relative z-10 border border-primary/20">
          <Wrench className="w-20 h-20 sm:w-28 sm:h-28 text-primary animate-[spin_3s_linear_infinite]" />
        </div>
      </motion.div>
      
      <motion.div
        className="space-y-4 max-w-2xl"
        variants={slideUp}
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Sito in Manutenzione
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
          Stiamo eseguendo degli aggiornamenti importanti per migliorare la tua esperienza. 
          Il servizio tornerà online al più presto. Ci scusiamo per il disagio!😜
        </p>
      </motion.div>

      <motion.div
        className="pt-4"
        variants={slideUp}
        transition={{ delay: 0.2 }}
      >
        <motion.div {...buttonPress}>
          <Button onClick={() => window.location.reload()} size="lg" className="rounded-full px-8 py-6 h-auto text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            Riprova a connetterti
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
