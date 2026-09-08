import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const skeletonVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const shimmerVariants = {
  hidden: { x: "-100%" },
  visible: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear" as const,
    },
  },
};

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted rounded-md",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        variants={shimmerVariants}
        initial="hidden"
        animate="visible"
      />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="p-6 rounded-lg border bg-card shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </motion.div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <motion.div
      variants={skeletonVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {[...Array(4)].map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </motion.div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={cn("p-6 rounded-lg border bg-card shadow-sm", className)}
    >
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-[300px] w-full rounded-lg" />
    </motion.div>
  );
}

export function ListItemSkeleton() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-3 p-2 rounded-lg"
    >
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-8 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </motion.div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <motion.div
      variants={skeletonVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {[...Array(count)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </motion.div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={cn("p-6 rounded-lg border bg-card shadow-sm", className)}
    >
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function ButtonSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Skeleton className={cn("h-10 w-full rounded-md", className)} />
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <motion.div
      variants={skeletonVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <StatsCardsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <CardSkeleton />
          <ListSkeleton count={4} />
        </div>
      </div>
    </motion.div>
  );
}