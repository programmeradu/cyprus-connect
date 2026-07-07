"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

// Custom thin SVG icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M19 12 L5 12 M12 19 L5 12 L12 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CO2Icon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
    <path d="M9 9 L9 15 M15 9 L15 15 M9 12 L15 12" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" strokeWidth="1" opacity="0.3" />
  </svg>
);

const MoneyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
    <path d="M12 8 L12 16 M9 10 L12 8 L15 10 M15 14 L12 16 L9 14" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProjectIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1" />
    <path d="M4 10 L20 10 M10 4 L10 20" strokeWidth="1" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <circle cx="14" cy="14" r="1" fill="currentColor" />
  </svg>
);

const TreeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M12 3 L8 8 L10 8 L7 13 L9 13 L6 18 L18 18 L15 13 L17 13 L14 8 L16 8 Z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M12 18 L12 22" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const EnergyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const CaptureIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M12 2 L12 10 M12 14 L12 22" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" strokeWidth="1" fill="currentColor" opacity="0.2" />
  </svg>
);

const OceanIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M2 12 Q5 8, 8 12 T14 12 Q17 8, 20 12 T26 12" strokeWidth="1" strokeLinecap="round" />
    <path d="M2 16 Q5 13, 8 16 T14 16 Q17 13, 20 16 T26 16" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

interface ImpactData {
  totalTonsOffset: number;
  totalSpent: number;
  projectsSupported: number;
  firstPurchaseAt: string | null;
  lastPurchaseAt: string | null;
}

interface Breakdown {
  category: string;
  totalTons: number;
  totalSpent: number;
  purchaseCount: number;
}

interface Purchase {
  id: number;
  tonsPurchased: number;
  pricePaid: number;
  purchasedAt: string;
  projectName: string;
  projectCategory: string;
  projectLocation: string;
}

export default function ImpactPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/marketplace/impact");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      // Fetch impact data
      const impactResponse = await fetch("/api/marketplace/impact", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (impactResponse.ok) {
        const impactData = await impactResponse.json();
        setImpact(impactData.impact);
        setBreakdown(impactData.breakdown);
      }
      
      // Fetch purchases
      const purchasesResponse = await fetch("/api/marketplace/purchases", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        setPurchases(purchasesData.purchases);
      }
    } catch (error) {
      console.error("Error fetching impact data:", error);
      toast.error("Failed to load impact data");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "forestry": return TreeIcon;
      case "renewable_energy": return EnergyIcon;
      case "carbon_capture": return CaptureIcon;
      case "ocean_conservation": return OceanIcon;
      default: return TreeIcon;
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasImpact = impact && impact.totalTonsOffset > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <Link href="/app/marketplace">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <BackIcon />
          <span>Back to Marketplace</span>
        </motion.button>
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl md:text-2xl font-semibold mb-1.5 tracking-tight">
          Your <span className="gradient-text">Impact</span>
        </h1>
        <p className="text-xs text-muted-foreground font-light">
          Track your contribution to global carbon reduction
        </p>
      </motion.div>

      {!hasImpact ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PremiumCard className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <CO2Icon />
            </div>
            <h3 className="text-base font-semibold mb-2">Start Your Impact Journey</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto font-light">
              You haven't purchased any carbon offsets yet. Browse our marketplace to find projects that align with your values.
            </p>
            <Link href="/app/marketplace">
              <button className="text-xs px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Browse Projects
              </button>
            </Link>
          </PremiumCard>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PremiumCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <CO2Icon />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{impact!.totalTonsOffset.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Tons CO2 Offset</div>
              </PremiumCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <PremiumCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <MoneyIcon />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">${impact!.totalSpent.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Investment</div>
              </PremiumCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PremiumCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <ProjectIcon />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{impact!.projectsSupported}</div>
                <div className="text-xs text-muted-foreground">Projects Supported</div>
              </PremiumCard>
            </motion.div>
          </div>

          {/* Breakdown by Category */}
          {breakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PremiumCard className="p-5">
                <h2 className="text-sm font-semibold mb-4">Impact by Category</h2>
                <div className="space-y-3">
                  {breakdown.map((item, index) => {
                    const Icon = getCategoryIcon(item.category);
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Icon />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold capitalize">
                              {item.category.replace("_", " ")}
                            </span>
                            <span className="text-xs font-bold text-primary">
                              {item.totalTons.toLocaleString()} tons
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{item.purchaseCount} {item.purchaseCount === 1 ? 'purchase' : 'purchases'}</span>
                            <span>${item.totalSpent.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            </motion.div>
          )}

          {/* Purchase History */}
          {purchases.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PremiumCard className="p-5">
                <h2 className="text-sm font-semibold mb-4">Purchase History</h2>
                <div className="space-y-3">
                  {purchases.map((purchase) => {
                    const Icon = getCategoryIcon(purchase.projectCategory);
                    return (
                      <div key={purchase.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Icon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-xs font-semibold break-words">{purchase.projectName}</h3>
                            <span className="text-xs font-bold text-primary whitespace-nowrap">
                              ${purchase.pricePaid.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{purchase.tonsPurchased} tons</span>
                            <span>•</span>
                            <span>{purchase.projectLocation}</span>
                            <span>•</span>
                            <span>{new Date(purchase.purchasedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PremiumCard>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
