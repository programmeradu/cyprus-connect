"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import NextImage from "next/image";
import { useTranslations } from "next-intl";
import { APP_OPEN_ACCESS } from "@/lib/open-access";
import {
  PageShell,
  PageHeader,
  PageToolbar,
  ToolbarTabs,
  Section,
  EmptyState,
  AiUnavailable,
  MetricRow,
  Metric
} from "@/components/app/shell";

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
  const [aiError, setAiError] = useState(false);

  const [editPrompt, setEditPrompt] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);

  const [userData, setUserData] = useState<any>(null);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      if (!APP_OPEN_ACCESS) router.push("/auth");
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
          Authorization: `Bearer ${token}`,
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
    if (typeof media.id === "string") return;

    try {
      const token = localStorage.getItem("bearer_token");
      const newSavedState = !media.saved;

      const response = await fetch(`/api/studio/generations/${media.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ saved: newSavedState })
      });

      if (response.ok) {
        setGeneratedMedia((prev) =>
          prev.map((m) => (m.id === media.id ? { ...m, saved: newSavedState } : m))
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
    if (typeof media.id === "string") {
      setGeneratedMedia((prev) => prev.filter((m) => m.id !== media.id));
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
        setGeneratedMedia((prev) => prev.filter((m) => m.id !== media.id));
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
          Authorization: `Bearer ${token}`
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
    setAiError(false);
    try {
      const sustainabilityPrompt = await buildSustainabilityPrompt(prompt);
      const token = localStorage.getItem("bearer_token");

      toast.info(t("toasts.generatingInfo", { type: t(`mediaType.${mediaType}`) }));

      if (mediaType === "image") {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
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

          setGeneratedMedia((prev) => [newMedia, ...prev]);
          setSelectedMedia(newMedia);
          await loadStudioStats();

          const modelName =
            result.model === "imagen-4.0-generate-001" ? t("models.imagen4") : t("models.geminiFlash");
          toast.success(t("toasts.imageGenerated", { model: modelName }), {
            description: result.modelReason
          });
        } else {
          throw new Error("No media returned");
        }
      } else {
        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            prompt: sustainabilityPrompt,
            aspectRatio: "16:9",
            durationSeconds: 8
          })
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
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

          setGeneratedMedia((prev) => [newMedia, ...prev]);
          setSelectedMedia(newMedia);
          await loadStudioStats();
          toast.success(t("toasts.videoGenerated"), {
            description: t("toasts.videoDesc")
          });
        } else {
          throw new Error("No media returned");
        }
      }
    } catch (error: any) {
      console.error("Media generation error:", error);
      setAiError(true);
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

        setGeneratedMedia((prev) => [editedMedia, ...prev]);
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
      const response = await fetch(media.url);
      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `vuneli-${media.type}-${media.id}.${media.type === "image" ? "png" : "mp4"}`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      toast.success(t("toasts.downloadStarted"));
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(t("toasts.downloadFailed"));
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

    const isInvalidProtocol = selectedMedia?.url && !selectedMedia.url.startsWith("http");

    setVideoError(isInvalidProtocol ? t("toasts.videoErrorInvalid") : t("toasts.videoErrorGeneric"));
  };

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

  const filteredMedia = viewMode === "library" ? generatedMedia.filter((m) => m.saved) : generatedMedia;

  return (
    <PageShell
      signedOut={!isPending && !session?.user}
      loading={isPending || (!!session?.user && isLoadingHistory)}
      header={<PageHeader title={t("title")} purpose={t("subtitle")} />}
      toolbar={
        <PageToolbar meta={studioStats ? t("itemCount", { count: filteredMedia.length }) : undefined}>
          <ToolbarTabs
            ariaLabel="Gallery"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "recent", label: t("recent") },
              { value: "library", label: t("library"), count: studioStats?.savedCount }
            ]}
          />
        </PageToolbar>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Section title={t("creator.title")} description={t("creator.subtitle")}>
          <div className="app-card space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaType("image")}
                className={`app-btn ${mediaType === "image" ? "" : "app-btn-ghost"}`}
              >
                {t("creator.image")}
              </button>
              <button
                type="button"
                onClick={() => setMediaType("video")}
                className={`app-btn ${mediaType === "video" ? "" : "app-btn-ghost"}`}
              >
                {t("creator.video")}
              </button>
            </div>

            <div>
              <label className="app-label mb-1.5 block">{t("creator.contextLabel")}</label>
              <select
                value={contextType}
                onChange={(e) => setContextType(e.target.value as ContextType)}
                className="w-full rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-rule-strong)]"
              >
                <option value="custom">{t("contextTypes.custom")}</option>
                <option value="company_data">{t("contextTypes.company_data")}</option>
                <option value="progress">{t("contextTypes.progress")}</option>
                <option value="insights">{t("contextTypes.insights")}</option>
                <option value="recommendations">{t("contextTypes.recommendations")}</option>
              </select>
            </div>

            <div>
              <label className="app-label mb-1.5 block">{t("creator.quickIdeas")}</label>
              <div className="flex flex-wrap gap-1.5">
                {generateContextSuggestions().map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPrompt(suggestion)}
                    className="app-tag"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="app-label mb-1.5 block">{t("creator.promptLabel")}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("creator.promptPlaceholder")}
                className="min-h-[96px] w-full resize-none rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-rule-strong)]"
              />
              <p className="app-meta mt-2 leading-relaxed">
                <strong className="text-foreground">{t("creator.intelligentSelection")}</strong>{" "}
                {t("creator.intelligentDesc")}
              </p>
            </div>

            <button
              type="button"
              onClick={generateMedia}
              disabled={isGenerating || !prompt.trim()}
              className="app-btn w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? t("creator.generating")
                : mediaType === "image"
                  ? t("creator.generateImage")
                  : t("creator.generateVideo")}
            </button>
          </div>
        </Section>

        <Section title={t("preview.title")}>
          {aiError ? (
            <AiUnavailable feature="generate report visuals" onRetry={generateMedia} />
          ) : selectedMedia ? (
            <div className="app-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {selectedMedia.model && (
                    <p className="app-meta">
                      {t("preview.generatedWith", {
                        model:
                          selectedMedia.model === "imagen-4.0-generate-001"
                            ? t("models.imagen4")
                            : selectedMedia.model === "veo-3.1-generate-preview"
                              ? t("models.veo")
                              : t("models.geminiFlash")
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveToLibrary(selectedMedia)}
                    className={`app-btn ${selectedMedia.saved ? "" : "app-btn-ghost"}`}
                  >
                    {selectedMedia.saved ? t("preview.savedToLibrary") : t("preview.saveToLibrary")}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadMedia(selectedMedia)}
                    className="app-btn-ghost app-btn"
                  >
                    {t("preview.download")}
                  </button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[0.5rem] border border-[var(--app-rule)] bg-[var(--app-surface-2)]">
                {selectedMedia.type === "image" ? (
                  <NextImage
                    src={selectedMedia.url}
                    alt="Generated content"
                    width={1200}
                    height={675}
                    className="h-auto w-full"
                  />
                ) : (
                  <div className="relative w-full">
                    {isVideoLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--app-surface-2)]">
                        <p className="app-meta">{t("preview.loadingVideo")}</p>
                      </div>
                    )}
                    {videoError && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--app-surface-2)]">
                        <div className="max-w-md p-4 text-center">
                          <p className="mb-2 text-sm text-destructive">{videoError}</p>
                          <button
                            type="button"
                            onClick={() => openExternalUrl(selectedMedia.url)}
                            className="app-btn-ghost app-btn"
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
                      className="h-auto w-full"
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

              <p className="app-meta mt-3 break-words leading-relaxed">
                <strong className="text-foreground">{t("preview.prompt")}</strong> {selectedMedia.prompt}
              </p>

              {selectedMedia.type === "image" && (
                <div className="mt-4 border-t border-[var(--app-rule)] pt-4">
                  <p className="app-label mb-1">{t("editing.title")}</p>
                  <p className="app-meta mb-2">{t("editing.subtitle")}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNaturalLanguageEdit()}
                      placeholder={t("editing.placeholder")}
                      disabled={isEditingImage}
                      className="flex-1 rounded-[0.375rem] border border-[var(--app-rule)] bg-[var(--app-surface-1)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-rule-strong)]"
                    />
                    <button
                      type="button"
                      onClick={handleNaturalLanguageEdit}
                      disabled={isEditingImage || !editPrompt.trim()}
                      className="app-btn disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isEditingImage ? t("creator.generating") : t("editing.title")}
                    </button>
                  </div>
                  <p className="app-meta mt-2">{t("editing.examples")}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title={t("preview.empty")}
              description={t("preview.emptyHint")}
            />
          )}
        </Section>
      </div>

      <Section title={viewMode === "recent" ? t("recentGenerations") : t("savedLibrary")}>
        {filteredMedia.length === 0 ? (
          <EmptyState
            title={viewMode === "library" ? t("sidebar.noSaved") : t("sidebar.noGenerations")}
            description={viewMode === "library" ? t("sidebar.saveHint") : t("sidebar.createHint")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredMedia.map((media) => (
              <div
                key={media.id}
                onClick={() => setSelectedMedia(media)}
                className={`app-card cursor-pointer overflow-hidden p-0 ${
                  selectedMedia?.id === media.id ? "border-[var(--app-rule-strong)]" : ""
                }`}
              >
                {media.type === "image" ? (
                  <NextImage
                    src={media.url}
                    alt="Thumbnail"
                    width={200}
                    height={150}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-full items-center justify-center bg-[var(--app-surface-2)]">
                    <span className="app-meta">{t("mediaType.video")}</span>
                  </div>
                )}
                <div className="space-y-1 p-2">
                  <p className="break-words text-[0.8125rem] font-medium leading-snug">{media.prompt}</p>
                  <div className="flex items-center justify-between">
                    {media.model && (
                      <span className="app-meta">
                        {media.model === "imagen-4.0-generate-001"
                          ? t("models.imagen4")
                          : t("models.geminiFlashShort")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGeneration(media);
                      }}
                      className="app-meta hover:text-destructive"
                    >
                      {t("sidebar.noSaved") ? "Remove" : "Remove"}
                    </button>
                  </div>
                  {media.saved && <span className="app-tag">Saved</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {studioStats && (
        <Section title={t("stats.label")}>
          <MetricRow columns={4}>
            <Metric label={t("stats.total")} value={studioStats.totalGenerations} />
            <Metric label={t("stats.images")} value={studioStats.imagesCount} />
            <Metric label={t("stats.videos")} value={studioStats.videosCount} />
            <Metric label={t("stats.saved")} value={studioStats.savedCount} />
          </MetricRow>
        </Section>
      )}
    </PageShell>
  );
}
