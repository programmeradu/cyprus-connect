"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

// Custom thin SVG icons for categories
const ForestryIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M12 3 L8 8 L10 8 L7 13 L9 13 L6 18 L18 18 L15 13 L17 13 L14 8 L16 8 Z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M12 18 L12 22" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RenewableEnergyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="4" strokeWidth="1" />
    <path d="M12 2 L12 6 M12 18 L12 22 M22 12 L18 12 M6 12 L2 12" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M18.36 5.64 L15.54 8.46 M8.46 15.54 L5.64 18.36 M18.36 18.36 L15.54 15.54 M8.46 8.46 L5.64 5.64" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

const CarbonCaptureIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M12 2 L12 10 M12 14 L12 22" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 6 L16 6 M8 10 L16 10 M8 14 L16 14 M8 18 L16 18" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" strokeWidth="1" fill="currentColor" opacity="0.2" />
  </svg>
);

const OceanConservationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor">
    <path d="M2 12 Q5 8, 8 12 T14 12 Q17 8, 20 12 T26 12" strokeWidth="1" strokeLinecap="round" />
    <path d="M2 16 Q5 13, 8 16 T14 16 Q17 13, 20 16 T26 16" strokeWidth="1" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.3" />
    <circle cx="16" cy="6" r="1" fill="currentColor" opacity="0.3" />
  </svg>
);

const VerifiedIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M9 12 L11 14 L15 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2 L15 5 L19 4 L20 8 L24 9 L22 13 L24 17 L20 18 L19 22 L15 21 L12 24 L9 21 L5 22 L4 18 L0 17 L2 13 L0 9 L4 8 L5 4 L9 5 Z" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M12 2 C8 2, 5 5, 5 9 C5 14, 12 22, 12 22 C12 22, 19 14, 19 9 C19 5, 16 2, 12 2 Z" strokeWidth="1" strokeLinejoin="round" />
    <circle cx="12" cy="9" r="2" strokeWidth="1" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M3 3 L3 21 L21 21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 14 L7 17 M12 10 L12 17 M17 6 L17 17" strokeWidth="1.5" strokeLinecap="round" />
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
  availableTons: number;
  verificationStatus: string;
  impactMetrics: any;
  isFeatured: boolean;
  sdgGoals: number[];
  bannerImage?: string;
}

const categories = [
  { id: "all", name: "All Projects", icon: null },
  { id: "forestry", name: "Forestry", icon: ForestryIcon },
  { id: "renewable_energy", name: "Renewable Energy", icon: RenewableEnergyIcon },
  { id: "carbon_capture", name: "Carbon Capture", icon: CarbonCaptureIcon },
  { id: "ocean_conservation", name: "Ocean Conservation", icon: OceanConservationIcon },
];

export default function MarketplacePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/marketplace");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory]);

  // Auto-generate banners in background on page visit
  useEffect(() => {
    if (session?.user) {
      triggerBackgroundGeneration();
    }
  }, [session]);

  const triggerBackgroundGeneration = async () => {
    try {
      // Silent background call - don't show errors to user
      await fetch("/api/marketplace/projects/auto-generate-banners", {
        method: "POST"
      });
    } catch (error) {
      // Silently fail - this is a background task
      console.log("Background banner generation triggered");
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      
      const response = await fetch(`/api/marketplace/projects?${params}`);
      if (!response.ok) throw new Error("Failed to fetch projects");
      
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  if (isPending || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-semibold mb-1.5 tracking-tight">
            Carbon Offset <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-xs text-muted-foreground font-light">
            Support verified projects that reduce and remove CO2 from the atmosphere
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/marketplace/impact">
            <PremiumButton variant="outline" size="sm" className="text-xs gap-1.5">
              <ChartIcon />
              <span>Your Impact</span>
            </PremiumButton>
          </Link>
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:bg-accent border border-border/50"
                }`}
              >
                {Icon && <Icon />}
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PremiumCard key={i} className="p-4 animate-pulse">
              <div className="h-32 bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </PremiumCard>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No projects found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onSelect={() => router.push(`/app/marketplace/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, index, onSelect }: { project: Project; index: number; onSelect: () => void }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "forestry": return ForestryIcon;
      case "renewable_energy": return RenewableEnergyIcon;
      case "carbon_capture": return CarbonCaptureIcon;
      case "ocean_conservation": return OceanConservationIcon;
      default: return ForestryIcon;
    }
  };

  const Icon = getCategoryIcon(project.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <PremiumCard className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={onSelect}>
        {/* Banner Image Background */}
        <div className="relative h-40 overflow-hidden">
          {project.bannerImage ? (
            <>
              <img 
                src={project.bannerImage} 
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />
            </>
          )}
          
          {/* Category Icon & Badge - Overlay on Image */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <div className="w-7 h-7 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-primary">
              <Icon />
            </div>
            <span className="text-[10px] text-foreground bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-md font-medium capitalize border border-border/50">
              {project.category.replace("_", " ")}
            </span>
          </div>
          
          {/* Featured Badge */}
          {project.isFeatured && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground z-10">
              <VerifiedIcon />
              <span className="text-[9px] font-semibold">Featured</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Project Name */}
          <h3 className="text-sm font-semibold mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
            {project.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3">
            <LocationIcon />
            <span>{project.location}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2 font-light">
            {project.description}
          </p>

          {/* Impact Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(project.impactMetrics).slice(0, 2).map(([key, value]) => (
              <div key={key} className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs font-semibold text-foreground">
                  {typeof value === 'number' ? value.toLocaleString() : String(value ?? '')}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </div>
              </div>
            ))}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <div className="text-sm font-bold text-foreground">
                ${project.pricePerTon}
                <span className="text-[10px] text-muted-foreground font-normal">/ton</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {project.certification}
              </div>
            </div>
            <PremiumButton
              size="sm"
              className="text-xs px-3 py-1 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              View Details
            </PremiumButton>
          </div>
        </div>
      </PremiumCard>
    </motion.div>
  );
}