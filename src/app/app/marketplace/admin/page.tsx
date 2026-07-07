"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const BackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor">
    <path d="M19 12 L5 12 M12 19 L5 12 L12 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill={filled ? "currentColor" : "none"} stroke="currentColor">
    <path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <path d="M12 2 L20 6 L20 12 C20 17, 16 21, 12 22 C8 21, 4 17, 4 12 L4 6 Z M9 12 L11 14 L15 10" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1" />
    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1" />
    <path d="M21 15 L16 10 L5 21" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface Project {
  id: number;
  name: string;
  category: string;
  location: string;
  isFeatured: boolean;
  verificationStatus: string;
  bannerImage: string | null;
}

export default function MarketplaceAdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth?redirect=/app/marketplace/admin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/marketplace/projects");
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

  const toggleFeatured = async (projectId: number, currentStatus: boolean) => {
    try {
      setUpdating(projectId);
      const response = await fetch(`/api/marketplace/projects/${projectId}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, isFeatured: !currentStatus } : p
      ));

      toast.success(`Project ${!currentStatus ? "featured" : "unfeatured"} successfully`);
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const updateVerificationStatus = async (projectId: number, status: string) => {
    try {
      setUpdating(projectId);
      const response = await fetch(`/api/marketplace/projects/${projectId}/update-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status })
      });

      if (!response.ok) throw new Error("Failed to update status");

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, verificationStatus: status } : p
      ));

      toast.success(`Verification status updated to ${status}`);
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const generateBanner = async (projectId: number) => {
    try {
      setGenerating(projectId);
      toast.info("Generating banner image...");
      
      const response = await fetch(`/api/marketplace/projects/${projectId}/generate-banner`, {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to generate banner");

      const data = await response.json();
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, bannerImage: data.bannerImage } : p
      ));

      toast.success("Banner generated successfully!");
    } catch (error) {
      console.error("Error generating banner:", error);
      toast.error("Failed to generate banner");
    } finally {
      setGenerating(null);
    }
  };

  const bulkGenerateBanners = async () => {
    try {
      toast.info("Generating banners for all projects...");
      
      const response = await fetch("/api/marketplace/projects/bulk-generate-banners", {
        method: "POST"
      });

      if (!response.ok) throw new Error("Failed to generate banners");

      const data = await response.json();
      
      toast.success(`Generated ${data.generated} banners successfully!`);
      fetchProjects(); // Refresh to show new banners
    } catch (error) {
      console.error("Error generating banners:", error);
      toast.error("Failed to generate banners");
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const projectsWithoutBanners = projects.filter(p => !p.bannerImage).length;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Link href="/app/marketplace">
            <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <BackIcon />
              Back to Marketplace
            </button>
          </Link>
        </div>
        
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold mb-1.5 tracking-tight">
              Marketplace <span className="gradient-text">Admin</span>
            </h1>
            <p className="text-xs text-muted-foreground font-light">
              Manage project badges, verification status, and banner images
            </p>
          </div>
          
          {projectsWithoutBanners > 0 && (
            <PremiumButton
              onClick={bulkGenerateBanners}
              size="sm"
              className="text-xs gap-1.5"
            >
              <ImageIcon />
              Generate All Banners ({projectsWithoutBanners})
            </PremiumButton>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        <PremiumCard className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Projects</div>
          <div className="text-2xl font-bold">{projects.length}</div>
        </PremiumCard>
        <PremiumCard className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Featured</div>
          <div className="text-2xl font-bold text-primary">
            {projects.filter(p => p.isFeatured).length}
          </div>
        </PremiumCard>
        <PremiumCard className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Verified</div>
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.verificationStatus === "verified").length}
          </div>
        </PremiumCard>
        <PremiumCard className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Without Banners</div>
          <div className="text-2xl font-bold text-orange-600">
            {projectsWithoutBanners}
          </div>
        </PremiumCard>
      </motion.div>

      {/* Projects List */}
      <div className="space-y-3">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <PremiumCard className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold line-clamp-1">{project.name}</h3>
                    {project.isFeatured && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold">
                        <StarIcon filled={true} />
                        FEATURED
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground mb-3">
                    <span className="capitalize">{project.category.replace("_", " ")}</span>
                    <span>•</span>
                    <span>{project.location}</span>
                    <span>•</span>
                    <span className="capitalize text-primary font-medium">{project.verificationStatus}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Featured Toggle */}
                    <button
                      onClick={() => toggleFeatured(project.id, project.isFeatured)}
                      disabled={updating === project.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        project.isFeatured
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-accent"
                      } disabled:opacity-50`}
                    >
                      <StarIcon filled={project.isFeatured} />
                      {project.isFeatured ? "Featured" : "Feature"}
                    </button>

                    {/* Verification Status */}
                    <select
                      value={project.verificationStatus}
                      onChange={(e) => updateVerificationStatus(project.id, e.target.value)}
                      disabled={updating === project.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-muted border border-border hover:bg-accent transition-all disabled:opacity-50"
                    >
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    {/* Generate Banner */}
                    {!project.bannerImage && (
                      <button
                        onClick={() => generateBanner(project.id)}
                        disabled={generating === project.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-accent transition-all disabled:opacity-50"
                      >
                        <ImageIcon />
                        {generating === project.id ? "Generating..." : "Generate Banner"}
                      </button>
                    )}
                    
                    {project.bannerImage && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-semibold">
                        <ShieldIcon />
                        Has Banner
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
