"use client";

/**
 * Deterministic avatars for the console.
 *
 * The mark is generated from a seed (the person, agent or company name) with
 * DiceBear, so the same subject always gets the same face and nothing has to
 * be uploaded. The style is a workspace preference: a person can pick the
 * character family that fits them.
 */

import { useMemo } from "react";
import { createAvatar, type Style } from "@dicebear/core";
import {
  adventurerNeutral,
  botttsNeutral,
  funEmoji,
  initials,
  lorelei,
  notionists,
  notionistsNeutral,
  shapes,
  thumbs,
} from "@dicebear/collection";
import { usePersistedState } from "@/hooks/usePersistedState";

export const AVATAR_STYLES = {
  notionists: { label: "Sketch people", style: notionists },
  notionistsNeutral: { label: "Sketch heads", style: notionistsNeutral },
  lorelei: { label: "Line portraits", style: lorelei },
  adventurerNeutral: { label: "Adventurer", style: adventurerNeutral },
  thumbs: { label: "Thumbs", style: thumbs },
  funEmoji: { label: "Emoji faces", style: funEmoji },
  botttsNeutral: { label: "Robots", style: botttsNeutral },
  shapes: { label: "Shapes", style: shapes },
  initials: { label: "Initials", style: initials },
} as Record<string, { label: string; style: Style<Record<string, unknown>> }>;


export type AvatarStyleKey = keyof typeof AVATAR_STYLES;

export const DEFAULT_AVATAR_STYLE: AvatarStyleKey = "notionists";

const STORAGE_KEY = "vuneli.avatar.style";

/** Sage background ring that matches the console palette. */
const BACKGROUND = ["c9d8cd", "dfe8e2", "e6ede4", "cddcd2"];

/** Reads the saved character family. Falls back to the default on the server. */
export function useAvatarStyle() {
  return usePersistedState<AvatarStyleKey>(STORAGE_KEY, DEFAULT_AVATAR_STYLE);
}

export function avatarDataUri(seed: string, styleKey: AvatarStyleKey = DEFAULT_AVATAR_STYLE) {
  const entry = AVATAR_STYLES[styleKey] ?? AVATAR_STYLES[DEFAULT_AVATAR_STYLE];
  return createAvatar(entry.style, {
    seed: seed.trim().toLowerCase() || "vuneli",
    backgroundColor: BACKGROUND,
    radius: 50,
    scale: styleKey === "initials" ? 100 : 92,
  }).toDataUri();
}

export function ConsoleAvatar({
  seed,
  size = 28,
  styleKey,
  className,
  alt,
}: {
  seed: string;
  size?: number;
  /** Overrides the workspace preference, for previews inside the picker. */
  styleKey?: AvatarStyleKey;
  className?: string;
  alt?: string;
}) {
  const [saved] = useAvatarStyle();
  const active = styleKey ?? saved;
  const uri = useMemo(() => avatarDataUri(seed, active), [seed, active]);

  return (
    <img
      src={uri}
      width={size}
      height={size}
      alt={alt ?? `Avatar for ${seed}`}
      className={className}
      style={{ width: size, height: size, borderRadius: "50%", display: "block", flexShrink: 0 }}
      draggable={false}
    />
  );
}
