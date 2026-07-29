"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppHeader } from "@/components/app/AppHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { 
  Loader2, Image as ImageIcon, Video, Wand2, Download, 
  Sparkles, Send, Zap, Trash2, Star, Clock, Library, BarChart3, X
} from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";
import { useTranslations } from "next-intl";

// Custom SVG Icons
const RecentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="15" cy="5" r="2" fill="currentColor"/>
  </svg>
);

const LibraryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 8L11.5 11L14.5 11.5L12 13.5L12.5 16.5L10 15L7.5 16.5L8 13.5L5.5 11.5L8.5 11L10 8Z" fill="currentColor" opacity="0.7"/>
  </svg>
);

type MediaType = "image" | "video";
type ContextType = "company_data" | "progress" | "insights" | "recommendations" | "custom";
type ViewMode = "recent" | "library";

interface GeneratedMedia {
  id: string | number;
  type: MediaType;
  url: string;
  prompt: string;
  timestamp?: Date;
  createdAt?: string;
  model?: string;
  modelReason?: string;
  enhancedPrompt?: string;
  contextType?: string;
  aspectRatio?: string;
  saved?: boolean;
}

interface StudioStats {
  totalGenerations: number;
  imagesCount: number;
  videosCount: number;
  savedCount: number;
  modelsUsed: {
    imagen4: number;
    geminiFlash: number;
  };
}

export default function MediaStudioPage() {
  const t = useTranslations("dashboard.studio");
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { user } = useUser();
  
  const [viewMode, setViewMode] = useState<ViewMode>("recent");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [contextType, setContextType] = useState<ContextType>("custom");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<GeneratedMedia | null>(null);
  const [studioStats, setStudioStats] = useState<StudioStats | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Natural language editing
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  
  // User data for context
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  
  // Video loading state
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/auth");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadUserData();
      loadGenerationHistory();
      loadStudioStats();
    }
  }, [session?.user?.id]);

  const loadGenerationHistory = async () => {
    if (!session?.user?.id) return;
    
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/studio/generations?userId=${session.user.id}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const transformed = data.map((item: any) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          prompt: item.prompt,
          createdAt: item.createdAt,
          timestamp: new Date(item.createdAt),
          model: item.model,
          modelReason: item.modelReason,
          enhancedPrompt: item.enhancedPrompt,
          contextType: item.contextType,
          aspectRatio: item.aspectRatio,
          saved: item.saved || false
        }));
        setGeneratedMedia(transformed);
      }
    } catch (error) {
      console.error("Failed to load generation history:", error);
      toast.error(t("toasts.historyLoadFailed"));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadStudioStats = async () => {
    if (!session?.user?.id) return;
    
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/studio/stats?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStudioStats(data);
      }
    } catch (error) {
      console.error("Failed to load studio stats:", error);
    }
  };

  const saveGenerationToDatabase = async (media: GeneratedMedia, enhancedPrompt: string) => {
    if (!session?.user?.id) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/studio/generations", {
        method: "POST",
        headers: {
 "Authorization": `Bearer ${token}`,
 "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: session.user.id,
          type: media.type,
          url: media.url,
          prompt: media.prompt,
          enhancedPrompt: enhancedPrompt,
          model: media.model,
          modelReason: media.modelReason,
          contextType: contextType,
          aspectRatio: "16:9",
          saved: false
        })
      });

      if (response.ok) {
        const savedGeneration = await response.json();
        return savedGeneration.id;
      }
    } catch (error) {
      console.error("Failed to save generation to database:", error);
    }
    return null;
  };

  const toggleSaveToLibrary = async (media: GeneratedMedia) => {
    if (typeof media.id === 'string') return;

    try {
      const token = localStorage.getItem("bearer_token");
      const newSavedState = !media.saved;
      
      const response = await fetch(`/api/studio/generations/${media.id}`, {
        method: "PATCH",
        headers: {
 "Authorization": `Bearer ${token}`,
 "Content-Type": "application/json"
        },
        body: JSON.stringify({ saved: newSavedState })
      });

      if (response.ok) {
        setGeneratedMedia(prev => 
          prev.map(m => m.id === media.id ? { ...m, saved: newSavedState } : m)
        );
        if (selectedMedia?.id === media.id) {
          setSelectedMedia({ ...selectedMedia, saved: newSavedState });
        }
        await loadStudioStats();
        toast.success(newSavedState ? t("toasts.savedLibraryOn") : t("toasts.savedLibraryOff"));
      }
    } catch (error) {
      console.error("Failed to toggle save:", error);
      toast.error(t("toasts.libraryUpdateFailed"));
    }
  };

  const deleteGeneration = async (media: GeneratedMedia) => {
    if (typeof media.id === 'string') {
      setGeneratedMedia(prev => prev.filter(m => m.id !== media.id));
      if (selectedMedia?.id === media.id) {
        setSelectedMedia(null);
      }
      toast.success(t("toasts.removed"));
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/studio/generations/${media.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setGeneratedMedia(prev => prev.filter(m => m.id !== media.id));
        if (selectedMedia?.id === media.id) {
          setSelectedMedia(null);
        }
        await loadStudioStats();
        toast.success(t("toasts.deleted"));
      }
    } catch (error) {
      console.error("Failed to delete generation:", error);
      toast.error(t("toasts.deleteFailed"));
    }
  };

  const loadUserData = async () => {
    if (!session?.user?.id) return;
    
    setIsLoadingContext(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [metricsRes, actionsRes, emissionsRes] = await Promise.all([
        fetch(`/api/dashboard/metrics?userId=${session.user.id}`, { headers }),
        fetch(`/api/actions/user/${session.user.id}`, { headers }),
        fetch(`/api/emissions?userId=${session.user.id}`, { headers })
      ]);

      const metrics = metricsRes.ok ? await metricsRes.json() : null;
      const actions = actionsRes.ok ? await actionsRes.json() : null;
      const emissions = emissionsRes.ok ? await emissionsRes.json() : null;

      setUserData({ metrics, actions, emissions });
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const buildSustainabilityPrompt = async (userPrompt: string): Promise<string> => {
    let contextInfo = "";

    if (contextType === "company_data" && user) {
      contextInfo = `Company Context:
- Company: ${user.companyName || "Unknown"}
- Industry: ${user.companyIndustry || "General"}
- Size: ${user.teamSize || "SME"}
- Location: ${user.countryCode || "Global"}`;
    } else if (contextType === "progress" && userData?.metrics) {
      const carbonMetric = userData.metrics.metrics?.find((m: any) => m.metricType === "carbon_footprint");
      const renewableMetric = userData.metrics.metrics?.find((m: any) => m.metricType === "renewable_share");
      
      contextInfo = `Sustainability Progress:
- Carbon Footprint: ${carbonMetric?.currentValue?.toFixed(2) || "N/A"} tCO₂e (${carbonMetric?.trendPercentage?.toFixed(1) || "N/A"}% change)
- Renewable Energy: ${renewableMetric?.currentValue?.toFixed(0) || "N/A"}%
- Completed Actions: ${userData.actions?.filter((a: any) => a.is_completed).length || 0}`;
    } else if (contextType === "insights" && userData?.emissions) {
      const latestEmission = userData.emissions[0];
      contextInfo = `Recent Insights:
- Latest Monthly Emissions: ${latestEmission?.totalCo2e?.toFixed(2) || "N/A"} tCO₂e
- Electricity: ${latestEmission?.electricity || "N/A"} kWh
- Transportation: ${latestEmission?.transport || "N/A"} km`;
    } else if (contextType === "recommendations" && userData?.actions) {
      const pendingActions = userData.actions?.filter((a: any) => !a.is_completed).slice(0, 3);
      contextInfo = `Recommended Actions:
${pendingActions?.map((a: any) => `- ${a.title}`).join("\n") || "No pending actions"}`;
    }

    const systemPrompt = `You are a sustainability-focused content creator for SMEs. Your task is to take ANY user prompt and transform it into engaging, professional content that relates to sustainability, environmental responsibility, and green business practices.

${contextInfo ? `\nRelevant Context:\n${contextInfo}\n` : ""}

User's Original Request: "${userPrompt}"

Instructions:
1. Even if the prompt seems unrelated to sustainability, find creative ways to connect it to environmental themes
2. Create professional, shareable content suitable for social media, campaigns, or presentations
3. Incorporate relevant sustainability metrics, tips, or facts when possible
4. Keep the tone professional, positive, and action-oriented
5. Generate a detailed ${mediaType === "image" ? "image description" : "video scene description"} that:
   - Highlights sustainability achievements or goals
   - Uses green/eco-friendly visual elements
   - Features professional design suitable for business use
   - Includes relevant sustainability icons, charts, or data visualizations

Generate a ${mediaType === "image" ? "detailed image generation prompt" : "detailed video scene description"} (max 200 words):`;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { 
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: systemPrompt })
      });

      if (response.ok) {
        const result = await response.json();
        return result.text || userPrompt;
      }
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
    }

    return `${userPrompt} - Focus on sustainability, environmental responsibility, green business practices, and eco-friendly themes. Include professional design with green color palette, leaf motifs, and data visualizations showing environmental impact.`;
  };

  const generateMedia = async () => {
    if (!prompt.trim()) {
      toast.error(t("toasts.enterPrompt"));
      return;
    }

    setIsGenerating(true);
    try {
      const sustainabilityPrompt = await buildSustainabilityPrompt(prompt);
      const token = localStorage.getItem("bearer_token");
      
      toast.info(t("toasts.generatingInfo", { type: t(`mediaType.${mediaType}`) }));

      if (mediaType === "image") {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { 
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            prompt: sustainabilityPrompt,
            aspectRatio: "16:9"
          })
        });

        if (!response.ok) {
          throw new Error("Failed to generate image");
        }

        const result = await response.json();
        
        if (result.url) {
          const newMedia: GeneratedMedia = {
            id: Date.now().toString(),
            type: "image",
            url: result.url,
            prompt: prompt,
            timestamp: new Date(),
            model: result.model,
            modelReason: result.modelReason,
            saved: false
          };
          
          const dbId = await saveGenerationToDatabase(newMedia, sustainabilityPrompt);
          if (dbId) {
            newMedia.id = dbId;
          }
          
          setGeneratedMedia(prev => [newMedia, ...prev]);
          setSelectedMedia(newMedia);
          await loadStudioStats();
          
          const modelName = result.model === "imagen-4.0-generate-001" ? t("models.imagen4") : t("models.geminiFlash");
          toast.success(t("toasts.imageGenerated", { model: modelName }), {
            description: result.modelReason
          });
        }
      } else {
        // Video generation with Veo 3.1
        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: { 
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            prompt: sustainabilityPrompt,
            aspectRatio: "16:9",
            durationSeconds: 8 // Veo 3.1 supports up to 8 seconds
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate video");
        }

        const result = await response.json();
        
        if (result.url) {
          const newMedia: GeneratedMedia = {
            id: Date.now().toString(),
            type: "video",
            url: result.url,
            prompt: prompt,
            timestamp: new Date(),
            model: "veo-3.1-generate-preview",
            saved: false
          };
          
          const dbId = await saveGenerationToDatabase(newMedia, sustainabilityPrompt);
          if (dbId) {
            newMedia.id = dbId;
          }
          
          setGeneratedMedia(prev => [newMedia, ...prev]);
          setSelectedMedia(newMedia);
          await loadStudioStats();
          toast.success(t("toasts.videoGenerated"), {
            description: t("toasts.videoDesc")
          });
        }
      }
    } catch (error: any) {
      console.error("Media generation error:", error);
      toast.error(error.message || t("toasts.generationFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNaturalLanguageEdit = async () => {
    if (!editPrompt.trim() || !selectedMedia || selectedMedia.type !== "image") {
      toast.error(t("toasts.enterEdit"));
      return;
    }

    setIsEditingImage(true);
    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: selectedMedia.url,
          editPrompt: editPrompt
        })
      });

      if (!response.ok) {
        throw new Error("Failed to edit image");
      }

      const result = await response.json();
      
      if (result.url) {
        const editedMedia: GeneratedMedia = {
          id: Date.now().toString(),
          type: "image",
          url: result.url,
          prompt: `${selectedMedia.prompt} (Edited: ${editPrompt})`,
          timestamp: new Date(),
          model: "gemini-2.5-flash-image",
          modelReason: "Natural language image editing",
          saved: false
        };
        
        const dbId = await saveGenerationToDatabase(editedMedia, editPrompt);
        if (dbId) {
          editedMedia.id = dbId;
        }
        
        setGeneratedMedia(prev => [editedMedia, ...prev]);
        setSelectedMedia(editedMedia);
        await loadStudioStats();
        
        toast.success(t("toasts.imageEdited"), {
          description: t("toasts.imageEditedDesc")
        });
        setEditPrompt("");
      }
    } catch (error: any) {
      console.error("Image editing error:", error);
      toast.error(error.message || t("toasts.imageEditFailed"));
    } finally {
      setIsEditingImage(false);
    }
  };

  const openExternalUrl = (url: string) => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url } }, "*");
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const downloadMedia = async (media: GeneratedMedia) => {
    try {
      // Fetch the media as a blob to handle CORS issues
      const response = await fetch(media.url);
      const blob = await response.blob();
      
      // Create object URL from blob
      const objectUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `vuneli-${media.type}-${media.id}.${media.type === "image" ? "png" : "mp4"}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      
      toast.success(t("toasts.downloadStarted"));
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(t("toasts.downloadFailed"));
      // Fallback: open in new tab
      openExternalUrl(media.url);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
    setVideoError(null);
  };

  const handleVideoError = (e: any) => {
    console.error("Video loading error:", e);
    setIsVideoLoading(false);
    
    // Check if URL is likely invalid for browser playback
    const isInvalidProtocol = selectedMedia?.url && !selectedMedia.url.startsWith('http');
    
    setVideoError(
      isInvalidProtocol 
        ? t("toasts.videoErrorInvalid")
        : t("toasts.videoErrorGeneric")
    );
  };

  // Reset video state when selectedMedia changes
  useEffect(() => {
    if (selectedMedia?.type === "video") {
      setIsVideoLoading(true);
      setVideoError(null);
    }
  }, [selectedMedia?.id]);

  const generateContextSuggestions = (): string[] => {
    try {
      const raw = t.raw(`suggestions.${contextType}`);
      if (Array.isArray(raw)) return raw as string[];
    } catch {}
    return t.raw("suggestions.custom") as string[];
  };

  const filteredMedia = viewMode === "library" 
    ? generatedMedia.filter(m => m.saved)
    : generatedMedia;

  if (isPending || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <AppHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Icon Buttons - Right Aligned */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <button
          onClick={() => {
            setViewMode("recent");
            setIsSidebarOpen(true);
          }}
          className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 transition-all flex items-center justify-center group relative"
          title={t("recentGenerations")}
        >
          <RecentIcon />
          <span className="absolute -bottom-6 right-0 text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {t("recent")}
          </span>
        </button>
        <button
          onClick={() => {
            setViewMode("library");
            setIsSidebarOpen(true);
          }}
          className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 transition-all flex items-center justify-center group relative"
          title={t("savedLibrary")}
        >
          <LibraryIcon />
          {studioStats && studioStats.savedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">
              {studioStats.savedCount}
            </span>
          )}
          <span className="absolute -bottom-6 right-0 text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {t("library")}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-6">
        {/* LEFT - Content Creator (30%) */}
        <div className="surface-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{t("creator.title")}</h2>
              <p className="text-[9px] text-muted-foreground">{t("creator.subtitle")}</p>
            </div>
          </div>

          {/* Media Type */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setMediaType("image")}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                mediaType === "image"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <ImageIcon className="w-4 h-4 mb-1 text-primary" />
              <p className="text-[10px] font-medium">{t("creator.image")}</p>
            </button>
            <button
              onClick={() => setMediaType("video")}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                mediaType === "video"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Video className="w-4 h-4 mb-1 text-primary" />
              <p className="text-[10px] font-medium">{t("creator.video")}</p>
            </button>
          </div>

          {/* Context Type */}
          <div className="mb-3">
            <label className="block text-[9px] font-medium mb-1">{t("creator.contextLabel")}</label>
            <select
              value={contextType}
              onChange={(e) => setContextType(e.target.value as ContextType)}
              className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="custom">{t("contextTypes.custom")}</option>
              <option value="company_data">{t("contextTypes.company_data")}</option>
              <option value="progress">{t("contextTypes.progress")}</option>
              <option value="insights">{t("contextTypes.insights")}</option>
              <option value="recommendations">{t("contextTypes.recommendations")}</option>
            </select>
          </div>

          {/* Quick Ideas */}
          <div className="mb-3">
            <label className="block text-[9px] font-medium mb-1">{t("creator.quickIdeas")}</label>
            <div className="flex flex-wrap gap-1">
              {generateContextSuggestions().map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggestion)}
                  className="text-[9px] px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-3">
            <label className="block text-[9px] font-medium mb-1">{t("creator.promptLabel")}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("creator.promptPlaceholder")}
              className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[80px] resize-none"
            />
            <div className="flex items-start gap-1 mt-1.5 p-1.5 bg-primary/5 rounded-lg">
              <Zap className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[8px] leading-tight text-muted-foreground">
                <strong>{t("creator.intelligentSelection")}</strong> {t("creator.intelligentDesc")}
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <PremiumButton
            onClick={generateMedia}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-8 text-[10px]"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {t("creator.generating")}
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                {mediaType === "image" ? t("creator.generateImage") : t("creator.generateVideo")}
              </>
            )}
          </PremiumButton>
        </div>

        {/* RIGHT - Preview & Editing (70%) */}
        <div className="space-y-4">
          {/* Preview */}
          {selectedMedia ? (
            <motion.div
              className="surface-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold">{t("preview.title")}</h3>
                  {selectedMedia.model && (
                    <p className="text-[8px] text-muted-foreground mt-0.5">
                      {t("preview.generatedWith", { model: selectedMedia.model === "imagen-4.0-generate-001" ? t("models.imagen4") : selectedMedia.model === "veo-3.1-generate-preview" ? t("models.veo") : t("models.geminiFlash") })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleSaveToLibrary(selectedMedia)}
                    className={`p-1.5 rounded-lg transition-all ${
                      selectedMedia.saved
                        ? "bg-primary/10 text-primary"
                        : "bg-muted hover:bg-primary/10 hover:text-primary"
                    }`}
                    title={selectedMedia.saved ? t("preview.savedToLibrary") : t("preview.saveToLibrary")}
                  >
                    <Star className={`w-3.5 h-3.5 ${selectedMedia.saved ? "fill-current" : ""}`} />
                  </button>
                  <PremiumButton
                    size="sm"
                    onClick={() => downloadMedia(selectedMedia)}
                    className="h-7 text-[10px] px-2"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {t("preview.download")}
                  </PremiumButton>
                </div>
              </div>

              <div className="relative bg-muted/30 rounded-lg overflow-hidden mb-3">
                {selectedMedia.type === "image" ? (
                  <NextImage
                    src={selectedMedia.url}
                    alt="Generated content"
                    width={1200}
                    height={675}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="relative w-full">
                    {isVideoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">{t("preview.loadingVideo")}</p>
                        </div>
                      </div>
                    )}
                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                        <div className="text-center p-4 max-w-md">
                          <Video className="w-12 h-12 text-destructive mx-auto mb-2" />
                          <p className="text-xs text-destructive mb-2">{videoError}</p>
                          <button
                            onClick={() => openExternalUrl(selectedMedia.url)}
                            className="text-xs text-primary hover:underline"
                          >
                            {t("preview.openNewTab")}
                          </button>
                        </div>
                      </div>
                    )}
                    <video
                      key={selectedMedia.url}
                      src={selectedMedia.url}
                      controls
                      playsInline
                      preload="auto"
                      className="w-full h-auto rounded-lg shadow-sm"
                      onLoadedData={handleVideoLoad}
                      onError={handleVideoError}
                      onLoadStart={() => setIsVideoLoading(true)}
                    >
                      <source src={selectedMedia.url} type="video/mp4" />
                      {t("preview.videoUnsupported")}
                    </video>
                  </div>
                )}
              </div>

              <p className="text-[9px] text-muted-foreground mb-3">
                <strong>{t("preview.prompt")}</strong> {selectedMedia.prompt}
              </p>

              {/* Natural Language Editing */}
              {selectedMedia.type === "image" && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="text-[10px] font-semibold mb-2 flex items-center gap-1.5">
                    <Wand2 className="w-3 h-3 text-primary" />
                    {t("editing.title")}
                  </h4>
                  <p className="text-[8px] text-muted-foreground mb-2">
                    {t("editing.subtitle")}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNaturalLanguageEdit()}
                      placeholder={t("editing.placeholder")}
                      className="flex-1 px-2 py-1.5 bg-background border border-border rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/50"
                      disabled={isEditingImage}
                    />
                    <PremiumButton
                      onClick={handleNaturalLanguageEdit}
                      disabled={isEditingImage || !editPrompt.trim()}
                      size="sm"
                      className="h-8 px-3"
                    >
                      {isEditingImage ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </PremiumButton>
                  </div>
                  <div className="flex items-start gap-1 mt-2 p-1.5 bg-primary/5 rounded">
                    <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-[8px] leading-tight text-muted-foreground">
                      {t("editing.examples")}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="surface-card p-12 text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">{t("preview.empty")}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {t("preview.emptyHint")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Panel */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-[450px] bg-background border-l border-border shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    {viewMode === "recent" ? <RecentIcon /> : <LibraryIcon />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      {viewMode === "recent" ? t("recentGenerations") : t("savedLibrary")}
                    </h3>
                    <p className="text-[9px] text-muted-foreground">
                      {t("itemCount", { count: filteredMedia.length })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="p-4 border-b border-border">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode("recent")}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "recent"
                        ? "bg-muted text-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <RecentIcon />
                    {t("recent")}
                  </button>
                  <button
                    onClick={() => setViewMode("library")}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === "library"
                        ? "bg-muted text-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <LibraryIcon />
                    {t("library")}
                    {studioStats && viewMode === "library" && ` (${studioStats.savedCount})`}
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {filteredMedia.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        {viewMode === "recent" ? (
                          <RecentIcon />
                        ) : (
                          <LibraryIcon />
                        )}
                      </div>
                      <p className="text-xs font-medium mb-1">
                        {viewMode === "library" 
                          ? t("sidebar.noSaved")
                          : t("sidebar.noGenerations")}
                      </p>
                      <p className="text-[10px]">
                        {viewMode === "library" 
                          ? t("sidebar.saveHint")
                          : t("sidebar.createHint")}
                      </p>
                    </div>
                  ) : (
                    filteredMedia.map((media) => (
                      <motion.div
                        key={media.id}
                        className={`relative group rounded-lg border cursor-pointer transition-all overflow-hidden ${
                          selectedMedia?.id === media.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          setSelectedMedia(media);
                          setIsSidebarOpen(false);
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {media.saved && (
                          <div className="absolute top-2 right-2 z-10">
                            <Star className="w-3.5 h-3.5 text-primary fill-current drop-shadow-lg" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGeneration(media);
                          }}
                          className="absolute top-2 left-2 w-6 h-6 rounded bg-destructive/80 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <Trash2 className="w-3 h-3 text-primary-foreground" />
                        </button>
                        
                        {media.type === "image" ? (
                          <NextImage
                            src={media.url}
                            alt="Thumbnail"
                            width={200}
                            height={150}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-primary/10">
                            <Video className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        
                        <div className="p-2 bg-background/95">
                          <p className="text-[9px] font-medium break-words mb-1">
                            {media.prompt}
                          </p>
                          {media.model && (
                            <p className="text-[8px] text-primary">
                              {media.model === "imagen-4.0-generate-001" ? t("models.imagen4") : t("models.geminiFlashShort")}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer Stats */}
      {studioStats && (
        <div className="mt-6 surface-card p-3">
          <div className="flex items-center justify-between text-[9px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-primary" />
                <span className="font-medium">{t("stats.label")}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("stats.total")} </span>
                <span className="font-bold">{studioStats.totalGenerations}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("stats.images")} </span>
                <span className="font-bold">{studioStats.imagesCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("stats.videos")} </span>
                <span className="font-bold">{studioStats.videosCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("stats.saved")} </span>
                <span className="font-bold">{studioStats.savedCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <span className="text-muted-foreground">{t("stats.imagen4")} </span>
                <span className="font-bold">{studioStats.modelsUsed.imagen4}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("stats.geminiFlash")} </span>
                <span className="font-bold">{studioStats.modelsUsed.geminiFlash}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}