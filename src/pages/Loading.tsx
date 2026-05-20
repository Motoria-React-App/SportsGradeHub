import { motion } from "framer-motion"

const LoadingPage = () => {
    const letters = "SportsGradeHub".split("");

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            }
        }
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 200,
            }
        }
    };

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
            {/* Ambient Background Glowing Orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                    className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div 
                    className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-primary/5 blur-[80px]"
                    animate={{
                        x: [0, -20, 0],
                        y: [0, 20, 0],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Glowing Logo Container */}
                <div className="relative flex items-center justify-center">
                    {/* Rotating Gradient Ring */}
                    <motion.div
                        className="absolute w-24 h-24 rounded-full border-2 border-transparent border-t-primary border-r-primary/40"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    
                    {/* Secondary slower counter-rotating ring for depth */}
                    <motion.div
                        className="absolute w-[104px] h-[104px] rounded-full border border-transparent border-b-primary/30 border-l-primary/10"
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />

                    {/* Logo Hub */}
                    <motion.div
                        className="w-20 h-20 rounded-full bg-card border border-muted-foreground/10 flex items-center justify-center shadow-2xl backdrop-blur-md overflow-hidden p-1"
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <img 
                            src="/logoSGH.png" 
                            alt="SportsGradeHub Logo" 
                            className="w-full h-full object-cover rounded-full" 
                        />
                    </motion.div>
                </div>

                {/* Staggered Text */}
                <div className="flex flex-col items-center gap-2">
                    <motion.h1
                        className="flex text-3xl md:text-4xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-primary/80"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {letters.map((char, index) => (
                            <motion.span key={index} variants={letterVariants}>
                                {char}
                            </motion.span>
                        ))}
                    </motion.h1>
                    
                    {/* Animated Pulsing Status */}
                    <motion.p
                        className="text-xs text-muted-foreground font-medium tracking-widest uppercase flex items-center gap-1.5"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        Caricamento in corso
                        <span className="flex gap-0.5">
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
                            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}>.</motion.span>
                        </span>
                    </motion.p>
                </div>
            </div>
        </div>
    );
};

export default LoadingPage;
