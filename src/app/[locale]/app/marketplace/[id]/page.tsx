"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

// Custom thin SVG icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M19 12 L5 12 M12 19 L5 12 L12 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VerifiedIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M9 12 L11 14 L15 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" strokeWidth="1" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M12 2 C8 2, 5 5, 5 9 C5 14, 12 22, 12 22 C12 22, 19 14, 19 9 C19 5, 16 2, 12 2 Z" strokeWidth="0.8" strokeLinejoin="round" />
    <circle cx="12" cy="9" r="1.5" strokeWidth="0.8" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="0.8" />
    <path d="M3 10 L21 10 M8 2 L8 6 M16 2 L16 6" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

const CertIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <circle cx="12" cy="10" r="7" strokeWidth="0.8" />
    <path d="M12 17 L10 22 L12 21 L14 22 Z" strokeWidth="0.8" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" strokeWidth="0.8" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor">
    <path d="M9 18 L15 12 L9 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M12 2 L13 8 L12 14 L11 8 Z M2 12 L8 13 L14 12 L8 11 Z M6 6 L8 8 L10 10 M14 14 L16 16 L18 18 M6 18 L8 16 L10 14 M14 10 L16 8 L18 6" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  location: string;
  certification: string;
  pricePerTon: number;
  totalCapacityTons: number;
  availableTons: number;
  projectStartDate: string;
  projectEndDate: string | null;
  verificationStatus: string;
  impactMetrics: any;
  isFeatured: boolean;
  sdgGoals: number[];
  bannerImage?: string | null;
}

interface Recommendation {
  id: number;
  name: string;
  category: string;
  pricePerTon: number;
  matchScore: number;
  matchReasons: string[];
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseTons, setPurchaseTons] = useState(1);
  const [purchasing, setPurchasing] = useState(false);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/marketplace");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProject();
      fetchRecommendations();
    }
  }, [id, session]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/projects/${id}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
      router.push("/app/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/marketplace/recommendations", {
        method: "POST",
        headers: {
 "Authorization": `Bearer ${token}`,
 "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  const handleGenerateBanner = async () => {
    if (!project) return;
    
    try {
      setGeneratingBanner(true);
      toast.info("Generating banner image...");
      
      const response = await fetch(`/api/marketplace/projects/${project.id}/generate-banner`, {
        method: "POST"
      });
      
      if (!response.ok) throw new Error("Failed to generate banner");
      
      const data = await response.json();
      
      setProject(prev => prev ? { ...prev, bannerImage: data.bannerImage } : null);
      toast.success("Banner generated successfully!");
    } catch (error: any) {
      console.error("Banner generation error:", error);
      toast.error("Failed to generate banner");
    } finally {
      setGeneratingBanner(false);
    }
  };

  const handlePurchase = async () => {
    if (!project) return;
    
    try {
      setPurchasing(true);
      const token = localStorage.getItem("bearer_token");
      
      const response = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: {
 "Authorization": `Bearer ${token}`,
 "Content-Type": "application/json"
        },
        body: JSON.stringify({
          projectId: project.id,
          tons: purchaseTons
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create purchase");
      }

      const { url } = await response.json();
      
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      
      toast.success("Redirecting to checkout...");
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to start purchase");
    } finally {
      setPurchasing(false);
      setShowPurchaseDialog(false);
    }
  };

  if (isPending || loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPrice = (project.pricePerTon * purchaseTons).toFixed(2);
  const utilizationPercent = ((project.totalCapacityTons - project.availableTons) / project.totalCapacityTons * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-4"
      >
        <Link href="/app/marketplace" className="hover:text-foreground transition-colors">
          Marketplace
        </Link>
        <ChevronIcon />
        <span className="text-foreground font-medium">{project?.name}</span>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Main Content */}
        <div className="space-y-3">
          {/* Hero Card with Banner Image */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PremiumCard className="p-0 overflow-hidden">
              {/* Banner Image or Gradient Header */}
              <div className="relative h-48 overflow-hidden group">
                {project?.bannerImage ? (
                  <>
                    <img 
                      src={project.bannerImage} 
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />
                  </>
                )}
                
                {/* Generate Banner Button (admin feature) */}
                {!project?.bannerImage && (
                  <button
                    onClick={handleGenerateBanner}
                    disabled={generatingBanner}
                    className="absolute top-2 right-2 px-2 py-1 text-[9px] bg-background/80 backdrop-blur-sm border border-border/50 rounded-md hover:bg-background transition-colors disabled:opacity-50"
                  >
                    {generatingBanner ? "Generating..." : "Generate Banner"}
                  </button>
                )}
                
                {/* Badges */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2 z-10">
                  {project?.isFeatured && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                      <SparkleIcon />
                      FEATURED
                    </div>
                  )}
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 font-semibold capitalize">
                    {project?.category.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-base md:text-lg font-bold mb-2 leading-tight">{project.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <LocationIcon />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon />
                        <span>{new Date(project.projectStartDate).getFullYear()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CertIcon />
                        <span>{project.certification}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <VerifiedIcon />
                        <span className="text-primary font-medium">{project.verificationStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl md:text-2xl font-bold text-primary">${project.pricePerTon}</div>
                    <div className="text-[9px] text-muted-foreground font-light">per ton CO₂</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed font-light">
                  {project.description}
                </p>

                {/* Capacity Bar */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="text-muted-foreground">Capacity Utilized</span>
                    <span className="font-semibold">{utilizationPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${utilizationPercent}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                    <span>{project.availableTons.toLocaleString()} tons available</span>
                    <span>{project.totalCapacityTons.toLocaleString()} total</span>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.div>

          {/* Impact Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PremiumCard className="p-4">
              <h2 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary" />
                Impact Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {Object.entries(project.impactMetrics).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="bg-muted/40 rounded-lg p-2.5 border border-border/30 hover:border-primary/30 transition-all"
                  >
                    <div className="text-sm font-bold text-foreground mb-0.5">
                      {typeof value === 'number' ? value.toLocaleString() : String(value ?? '')}
                    </div>
                    <div className="text-[9px] text-muted-foreground capitalize leading-tight font-light">
                      {key.replace(/_/g, " ")}
                    </div>
                  </motion.div>
                ))}
              </div>
            </PremiumCard>
          </motion.div>

          {/* SDG Goals */}
          {project.sdgGoals && project.sdgGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PremiumCard className="p-4">
                <h2 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  UN Sustainable Development Goals
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {project.sdgGoals.map((goal, index) => (
                    <motion.div
                      key={goal}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary tabular-nums transition-colors cursor-default"
                    >
                      {goal}
                    </motion.div>
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Purchase Card */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-4"
          >
            <PremiumCard className="p-4 bg-card border-primary/20">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xs font-semibold">Purchase Offsets</h3>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3 mb-3">
                <div className="text-[9px] text-muted-foreground mb-1 font-light">Available Capacity</div>
                <div className="text-base font-bold">{project.availableTons.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">tons CO₂</div>
              </div>

              <PremiumButton
                className="w-full text-xs h-9"
                onClick={() => setShowPurchaseDialog(true)}
              >
                Purchase Now
              </PremiumButton>

              <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-center gap-1.5">
                <VerifiedIcon />
                <div className="text-[9px] text-muted-foreground">
                  Secure payment via Stripe
                </div>
              </div>
            </PremiumCard>
          </motion.div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <PremiumCard className="p-4">
                <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                  <SparkleIcon />
                  Recommended
                </h3>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <Link key={rec.id} href={`/app/marketplace/${rec.id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="p-2.5 rounded-lg bg-muted/25 border border-border/30 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="text-[11px] font-semibold break-words flex-1 group-hover:text-primary transition-colors">
                            {rec.name}
                          </div>
                          <div className="text-[10px] text-primary font-bold flex-shrink-0">
                            ${rec.pricePerTon}
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground capitalize font-light">
                          {rec.category.replace("_", " ")}
                        </div>
                        {rec.matchReasons[0] && (
                          <div className="text-[9px] text-muted-foreground/80 mt-1 break-words font-light">
                            {rec.matchReasons[0]}
                          </div>
                        )}
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </PremiumCard>
            </motion.div>
          )}
        </div>
      </div>

      {/* Purchase Dialog */}
      {showPurchaseDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPurchaseDialog(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <PremiumCard className="p-5 bg-card border-primary/20">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Purchase Carbon Offsets
              </h3>
              
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block font-medium">
                    Number of Tons
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={project.availableTons}
                    value={purchaseTons}
                    onChange={(e) => setPurchaseTons(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div className="bg-muted/40 rounded-lg p-3.5 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground font-light">Price per ton</span>
                    <span className="font-semibold">${project.pricePerTon}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground font-light">Quantity</span>
                    <span className="font-semibold">{purchaseTons} tons CO₂</span>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                    <span className="text-xs font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-primary">${totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <PremiumButton
                  variant="outline"
                  onClick={() => setShowPurchaseDialog(false)}
                  className="flex-1 text-xs h-9"
                  disabled={purchasing}
                >
                  Cancel
                </PremiumButton>
                <PremiumButton
                  onClick={handlePurchase}
                  className="flex-1 text-xs h-9"
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      Processing
                    </span>
                  ) : (
 "Proceed to Payment"
                  )}
                </PremiumButton>
              </div>
            </PremiumCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}