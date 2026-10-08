"use client";

/**
 * Questionnaires Page (/app/questionnaires).
 *
 * Implements S-03 (Reverse Questionnaire Inbox):
 * - Views questionnaires received via email or file drop.
 * - Auto-fills questions against verified workspace records (EAC kWh, Scope 1, Scope 2, water, waste, governance).
 * - Flags gaps where input/documents are missing.
 * - Allows in-line editing of responses.
 * - Exports the completed questionnaire to CSV / Excel.
 */

import { useState, useMemo, useRef } from "react";
import { useLocale } from "next-intl";
import {
  PageShell,
  PageHeader,
  Section,
  MetricRow,
  Metric,
  DataTable,
  Empty,
  ToolbarTabs,
  type Column,
} from "@/components/app/console/kit";
import { useWorkspaceResource, useWorkspaceAction } from "@/components/app/console/workspace-store";
import { InboxAddress } from "@/components/app/intake/InboxAddress";
import { toast } from "sonner";
import type { InboundQuestionnaireDetail, QuestionnaireQuestion } from "@/lib/questionnaires/questionnaire.server";

const PATH = "/api/console/questionnaires";

export default function QuestionnairesPage() {
  const locale = useLocale();
  const isEl = locale.startsWith("el");
  const t = (en: string, el: string) => (isEl ? el : en);

  const resource = useWorkspaceResource<{ questionnaires: InboundQuestionnaireDetail[] }>(PATH);
  const action = useWorkspaceAction();

  const questionnaires = resource.data?.questionnaires ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeModule, setActiveModule] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null);
  const [editAnswer, setEditAnswer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeQuestionnaire = useMemo(() => {
    if (selectedId) return questionnaires.find((q) => q.id === selectedId) ?? questionnaires[0] ?? null;
    return questionnaires[0] ?? null;
  }, [questionnaires, selectedId]);

  const questions = useMemo(() => {
    if (!activeQuestionnaire) return [];
    if (activeModule === "all") return activeQuestionnaire.questions;
    return activeQuestionnaire.questions.filter((q) => q.module === activeModule);
  }, [activeQuestionnaire, activeModule]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx" && ext !== "pdf") {
        toast.error(t("Please upload a .xlsx, .csv, or .pdf file.", "Παρακαλώ μεταφορτώστε αρχείο .xlsx, .csv ή .pdf."));
        return;
      }

      if (ext === "csv") {
        const text = await file.text();
        const res = await action.run<{ ok: boolean; questionnaire: InboundQuestionnaireDetail }>(PATH, {
          method: "POST",
          body: {
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            fileType: "csv",
            csvText: text,
          },
          invalidates: [PATH],
        });
        if (res?.questionnaire) {
          setSelectedId(res.questionnaire.id);
          toast.success(t("Questionnaire imported and auto-filled!", "Το ερωτηματολόγιο εισήχθη και συμπληρώθηκε αυτόματα!"));
        }
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const data = result.includes(",") ? result.split(",")[1] : result;
            resolve(data);
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        const res = await action.run<{ ok: boolean; questionnaire: InboundQuestionnaireDetail }>(PATH, {
          method: "POST",
          body: {
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            fileType: ext as "xlsx" | "pdf",
            base64Data: base64,
          },
          invalidates: [PATH],
        });
        if (res?.questionnaire) {
          setSelectedId(res.questionnaire.id);
          toast.success(t("Questionnaire imported and auto-filled!", "Το ερωτηματολόγιο εισήχθη και συμπληρώθηκε αυτόματα!"));
        }
      }
    } catch {
      toast.error(t("Failed to process questionnaire.", "Αποτυχία επεξεργασίας ερωτηματολογίου."));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async () => {
    if (!activeQuestionnaire || !editingQuestion) return;
    try {
      await action.run(PATH, {
        method: "PATCH",
        body: {
          questionnaireId: activeQuestionnaire.id,
          questionId: editingQuestion.id,
          answerEn: editAnswer,
          answerEl: editAnswer,
          isVerified: true,
        },
        invalidates: [PATH],
      });
      toast.success(t("Answer updated.", "Η απάντηση ενημερώθηκε."));
      setEditingQuestion(null);
    } catch {
      toast.error(t("Failed to save answer.", "Αποτυχία αποθήκευσης απάντησης."));
    }
  };

  const exportCsv = () => {
    if (!activeQuestionnaire) return;
    const header = ["Code", "Module", "Question", "Answer", "Unit", "Evidence Source", "Verified"];
    const rows = activeQuestionnaire.questions.map((q) => [
      `"${q.code}"`,
      `"${q.module}"`,
      `"${(isEl ? q.questionEl : q.questionEn).replace(/"/g, '""')}"`,
      `"${(isEl ? q.answerEl : q.answerEn).replace(/"/g, '""')}"`,
      `"${q.unit || ""}"`,
      `"${q.source.replace(/"/g, '""')}"`,
      `"${q.isVerified ? "Yes" : "Pending"}"`,
    ]);
    const csvContent = "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeQuestionnaire.title}-answered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<QuestionnaireQuestion>[] = [
    {
      key: "code",
      header: t("Code", "Κωδικός"),
      render: (q) => <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">{q.code}</span>,
    },
    {
      key: "question",
      header: t("Question & Module", "Ερώτηση & Ενότητα"),
      render: (q) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">{isEl ? q.questionEl : q.questionEn}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {q.module}
            </span>
            <span className="text-xs text-neutral-500">Source: {q.source}</span>
          </div>
        </div>
      ),
    },
    {
      key: "answer",
      header: t("Auto-Filled Answer", "Συμπληρωμένη Απάντηση"),
      render: (q) => (
        <div className="max-w-md">
          {editingQuestion?.id === q.id ? (
            <div className="space-y-2">
              <textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                className="w-full rounded border border-neutral-300 p-2 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                >
                  {t("Save", "Αποθήκευση")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300"
                >
                  {t("Cancel", "Ακύρωση")}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                setEditingQuestion(q);
                setEditAnswer(isEl ? q.answerEl : q.answerEn);
              }}
              className="group cursor-pointer rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title={t("Click to edit answer", "Κάντε κλικ για επεξεργασία")}
            >
              <p className={`text-sm ${q.needsInput ? "text-amber-700 dark:text-amber-400 font-medium" : "text-neutral-800 dark:text-neutral-200"}`}>
                {isEl ? q.answerEl : q.answerEn}
              </p>
              <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {t("Click to override", "Κλικ για τροποποίηση")}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: t("Status", "Κατάσταση"),
      render: (q) => (
        <div>
          {q.isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t("Verified", "Επαληθευμένο")}
            </span>
          ) : q.needsInput ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {t("Needs Data", "Χρειάζεται Στοιχεία")}
            </span>
          ) : (
            <span className="text-xs text-neutral-500">{t("Reported", "Καταγεγραμμένο")}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title={t("Customer Questionnaires", "Ερωτηματολόγια Πελατών")}
        purpose={t(
          "Automate buyer & corporate ESG questionnaires. Forward spreadsheets or PDFs to your private inbox or drop them below to generate verified responses backed by official bills.",
          "Αυτοματοποιήστε τα ερωτηματολόγια ESG πελατών. Προωθήστε αρχεία Excel ή PDF στο ιδιωτικό σας email ή σύρετέ τα παρακάτω για αυτόματες, επαληθευμένες απαντήσεις.",
        )}
      />

      {/* Inbound address plate */}
      <div className="mb-6">
        <InboxAddress />
      </div>

      {/* Upload button & Quick Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv,.pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? t("Processing...", "Επεξεργασία...") : t("+ Drop New Questionnaire (.xlsx, .csv, .pdf)", "+ Νέο Ερωτηματολόγιο (.xlsx, .csv, .pdf)")}
          </button>
        </div>

        {questionnaires.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">{t("Active file:", "Ενεργό αρχείο:")}</span>
            <select
              value={activeQuestionnaire?.id ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              aria-label={t("Select questionnaire", "Επιλέξτε ερωτηματολόγιο")}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              {questionnaires.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.answeredQuestions}/{q.totalQuestions} answered)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeQuestionnaire ? (
        <>
          <Section
            title={activeQuestionnaire.title}
            description={t(
              `Source: ${activeQuestionnaire.source} · File: ${activeQuestionnaire.fileName} · Cryptographic Merkle hash: ${activeQuestionnaire.hash.slice(0, 16)}...`,
              `Πηγή: ${activeQuestionnaire.source} · Αρχείο: ${activeQuestionnaire.fileName} · Κρυπτογραφικό αποτύπωμα: ${activeQuestionnaire.hash.slice(0, 16)}...`,
            )}
            action={
              <button
                type="button"
                onClick={exportCsv}
                className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {t("Export CSV / Excel", "Εξαγωγή CSV / Excel")}
              </button>
            }
          >
            <MetricRow>
              <Metric
                label={t("Total Questions", "Σύνολο Ερωτήσεων")}
                value={String(activeQuestionnaire.totalQuestions)}
                note={t("Parsed from file", "Από το αρχείο")}
              />
              <Metric
                label={t("Answered Automatically", "Απαντήθηκαν Αυτόματα")}
                value={String(activeQuestionnaire.answeredQuestions)}
                note={`${Math.round((activeQuestionnaire.answeredQuestions / (activeQuestionnaire.totalQuestions || 1)) * 100)}% coverage`}
              />
              <Metric
                label={t("Verified by Bills", "Επαληθευμένα από Λογαριασμούς")}
                value={String(activeQuestionnaire.verifiedQuestions)}
                note={t("Document-backed", "Με παραστατικά")}
              />
              <Metric
                label={t("Data Gaps", "Κενά Στοιχείων")}
                value={String(activeQuestionnaire.totalQuestions - activeQuestionnaire.answeredQuestions)}
                note={t("Requires user review", "Απαιτείται έλεγχος")}
              />
            </MetricRow>
          </Section>

          {/* Module Filter Tabs */}
          <div className="mb-4">
            <ToolbarTabs
              value={activeModule}
              onChange={setActiveModule}
              options={[
                { value: "all", label: t("All Questions", "Όλες οι Ερωτήσεις") },
                { value: "general", label: t("General", "Γενικά") },
                { value: "energy", label: t("Energy & Grid", "Ενέργεια & Δίκτυο") },
                { value: "scope1", label: t("Scope 1 Fuels", "Scope 1 Καύσιμα") },
                { value: "scope2", label: t("Scope 2 Electricity", "Scope 2 Ηλεκτρισμός") },
                { value: "water", label: t("Water", "Νερό") },
                { value: "waste", label: t("Waste", "Απόβλητα") },
                { value: "governance", label: t("Governance", "Διακυβέρνηση") },
              ]}
            />
          </div>

          <DataTable
            rows={questions}
            rowKey={(q) => q.id}
            columns={columns}
            empty={<p className="p-4 text-xs text-neutral-500">{t("No questions found in this module.", "Δεν βρέθηκαν ερωτήσεις σε αυτή την ενότητα.")}</p>}
          />
        </>
      ) : (
        <Empty
          title={t("No Inbound Questionnaires Yet", "Δεν υπάρχουν εισερχόμενα ερωτηματολόγια")}
          body={t(
            "Forward customer ESG questionnaires to your private bill inbox, or drop an Excel/PDF file to automatically extract questions and match answers from your verified bills.",
            "Προωθήστε τα ερωτηματολόγια ESG πελατών στο ιδιωτικό σας email ή σύρετε ένα αρχείο Excel/PDF για αυτόματη εξαγωγή και συμπλήρωση απαντήσεων.",
          )}
          action={{
            label: t("Drop Questionnaire File", "Επιλογή Αρχείου Ερωτηματολογίου"),
            onClick: () => fileInputRef.current?.click(),
          }}
        />
      )}
    </PageShell>
  );
}
