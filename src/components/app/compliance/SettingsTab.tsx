"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Section } from "@/components/app/console/kit";
import type { Settings } from "./types";

export function SettingsTab({ settings, onSave }: { settings: Settings; onSave: (settings: Settings) => void }) {
  const t = useTranslations("dashboard.compliance");
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const jurisdictionOptions: { value: string; label: string }[] = [
    { value: "European Union", label: t("settings.jurisdictionOptions.eu") },
    { value: "United States", label: t("settings.jurisdictionOptions.us") },
    { value: "United Kingdom", label: t("settings.jurisdictionOptions.uk") },
    { value: "Global", label: t("settings.jurisdictionOptions.global") }
  ];

  return (
    <>
      <Section title={t("settings.jurisdictionsTitle")} description={t("settings.jurisdictionsDescription")}>
        <div className="vck-card space-y-2 p-4">
          {jurisdictionOptions.map(({ value, label }) => (
            <label
              key={value}
              className="vck-inset flex items-center gap-2 px-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localSettings.jurisdictions.includes(value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLocalSettings({
                      ...localSettings,
                      jurisdictions: [...localSettings.jurisdictions, value]
                    });
                  } else {
                    setLocalSettings({
                      ...localSettings,
                      jurisdictions: localSettings.jurisdictions.filter((j) => j !== value)
                    });
                  }
                }}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
          <button type="button" className="vck-btn vck-btn-primary mt-2" onClick={() => onSave(localSettings)}>
            {t("settings.save")}
          </button>
        </div>
      </Section>

      <Section title={t("settings.automationTitle")}>
        <div className="vck-card space-y-3 p-4">
          <label className="vck-inset flex items-center justify-between gap-3 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t("settings.autoSubmitTitle")}</p>
              <p className="vck-meta">{t("settings.autoSubmitDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.autoSubmit}
              onChange={(e) => setLocalSettings({ ...localSettings, autoSubmit: e.target.checked })}
            />
          </label>

          <label className="vck-inset flex items-center justify-between gap-3 px-3 py-2 cursor-pointer">
            <div>
              <p className="text-sm font-medium">{t("settings.emailNotificationsTitle")}</p>
              <p className="vck-meta">{t("settings.emailNotificationsDesc")}</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.emailNotifications}
              onChange={(e) => setLocalSettings({ ...localSettings, emailNotifications: e.target.checked })}
            />
          </label>
        </div>
      </Section>
    </>
  );
}
