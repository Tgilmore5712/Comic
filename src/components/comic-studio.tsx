"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  buildContinuityAlerts,
  buildGeneratedIssue,
  buildImagePromptPack,
  buildIssueHandoffHtml,
  buildIssueHandoffMarkdown,
  buildPromptReview,
  buildScore,
  ComicProject,
  createPanelRevision,
  createEmptyIssue,
  defaultProject,
  isComicProject,
  Issue,
  Panel,
  providerPresets,
  sanitizeProject,
  updateIssueAtIndex,
} from "@/lib/comic-engine";

const storageKey = "inkforge-studio-project";

export function ComicStudio() {
  const [project, setProject] = useState<ComicProject>(() => {
    if (typeof window === "undefined") {
      return defaultProject;
    }

    const savedProject = window.localStorage.getItem(storageKey);

    if (!savedProject) {
      return defaultProject;
    }

    try {
      return sanitizeProject(JSON.parse(savedProject) as ComicProject);
    } catch {
      window.localStorage.removeItem(storageKey);
      return defaultProject;
    }
  });
  const [activeIssueIndex, setActiveIssueIndex] = useState(0);
  const [studioMessage, setStudioMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [galleryMode, setGalleryMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    if (!studioMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStudioMessage(null);
    }, 3600);

    return () => window.clearTimeout(timeoutId);
  }, [studioMessage]);

  const activeIssue = project.issues[activeIssueIndex] ?? project.issues[0];
  const alerts = buildContinuityAlerts(project, activeIssue);
  const continuityScore = buildScore(alerts, activeIssue);
  const activeThreads = project.arcs.filter((arc) => arc.status !== "Resolved").length;
  const plannedPages = project.issues.reduce((total, issue) => total + issue.pages, 0);
  const promptReviewFindings = buildPromptReview(project, activeIssue);
  const imagePrep = project.imagePrep ?? defaultProject.imagePrep;
  const galleryIssues = project.issues
    .map((issue) => ({
      ...issue,
      pages: Array.from(new Set(issue.panels.map((panel) => panel.page)))
        .sort((left, right) => left - right)
        .map((page) => ({
          page,
          panels: issue.panels.filter((panel) => panel.page === page && panel.imageUrl.trim()),
        }))
        .filter((group) => group.panels.length > 0),
    }))
    .filter((issue) => issue.pages.length > 0);

  function updatePanelAtIndex(panelIndex: number, recipe: (panel: Panel) => Panel) {
    setProject((current) => ({
      ...current,
      issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
        ...issue,
        panels: issue.panels.map((panel, currentPanelIndex) =>
          currentPanelIndex === panelIndex ? recipe(panel) : panel,
        ),
      })),
    }));
  }

  function exportProject() {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    anchor.href = url;
    anchor.download = `${safeTitle || "inkforge-project"}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStudioMessage("Project exported as JSON.");
  }

  async function importProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!isComicProject(parsed)) {
        throw new Error("The JSON file does not match the Inkforge project format.");
      }

      const nextProject = sanitizeProject(parsed);
      setProject(nextProject);
      setActiveIssueIndex(0);
      setStudioMessage(`Imported ${nextProject.title}.`);
    } catch {
      setStudioMessage("Import failed. Use a valid Inkforge project JSON file.");
    } finally {
      event.target.value = "";
    }
  }

  function addIssue() {
    const nextIndex = activeIssueIndex + 1;

    setProject((current) => ({
      ...current,
      issues: [
        ...current.issues.slice(0, nextIndex),
        createEmptyIssue(current.issues.length + 1),
        ...current.issues.slice(nextIndex),
      ],
    }));
    setActiveIssueIndex(nextIndex);
    setStudioMessage("Inserted a new issue after the active issue.");
  }

  function deleteActiveIssue() {
    if (project.issues.length === 1) {
      setProject((current) => ({
        ...current,
        issues: [createEmptyIssue(1)],
      }));
      setActiveIssueIndex(0);
      setStudioMessage("Reset the final remaining issue to a blank outline.");
      return;
    }

    const nextIndex = Math.max(0, activeIssueIndex - 1);

    setProject((current) => ({
      ...current,
      issues: current.issues.filter((_, issueIndex) => issueIndex !== activeIssueIndex),
    }));
    setActiveIssueIndex(nextIndex);
    setStudioMessage(`Deleted ${activeIssue.title}.`);
  }

  function downloadHandoff() {
    const handoff = buildIssueHandoffMarkdown(project, activeIssue);
    const blob = new Blob([handoff], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = activeIssue.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    anchor.href = url;
    anchor.download = `${safeTitle || "issue-handoff"}.md`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStudioMessage(`Downloaded a handoff script for ${activeIssue.title}.`);
  }

  function downloadPromptPack() {
    const promptPack = buildImagePromptPack(project, activeIssue);
    const blob = new Blob([promptPack], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTitle = `${activeIssue.title}-prompt-pack`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    anchor.href = url;
    anchor.download = `${safeTitle || "prompt-pack"}.md`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStudioMessage(
      promptReviewFindings.length > 0
        ? `Downloaded an image prompt pack for ${activeIssue.title} with ${promptReviewFindings.length} review flags.`
        : `Downloaded an image prompt pack for ${activeIssue.title}.`,
    );
  }

  function attachPanelImage(panelIndex: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      updatePanelAtIndex(panelIndex, (panel) => ({
        ...panel,
        imageUrl: result,
        imageStatus: "Ready",
      }));
      setStudioMessage(`Attached an image asset to panel ${panelIndex + 1}.`);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function printHandoff() {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printWindow) {
      setStudioMessage("Print window was blocked by the browser.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildIssueHandoffHtml(project, activeIssue));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setStudioMessage(`Opened a print-friendly handoff for ${activeIssue.title}.`);
  }

  function savePanelRevision(panelIndex: number) {
    const panel = activeIssue.panels[panelIndex];

    if (!panel?.imageUrl.trim()) {
      setStudioMessage("Attach or paste an image first before saving a revision.");
      return;
    }

    updatePanelAtIndex(panelIndex, (currentPanel) => ({
      ...currentPanel,
      revisions: [createPanelRevision(currentPanel), ...currentPanel.revisions],
    }));
    setStudioMessage(`Saved a revision for panel ${panelIndex + 1}.`);
  }

  function restorePanelRevision(panelIndex: number, revisionId: string) {
    updatePanelAtIndex(panelIndex, (panel) => {
      const revision = panel.revisions.find((candidate) => candidate.id === revisionId);

      if (!revision) {
        return panel;
      }

      return {
        ...panel,
        imageUrl: revision.imageUrl,
        imageStatus: revision.status,
        imageNotes: revision.note,
      };
    });
    setStudioMessage(`Restored a saved revision for panel ${panelIndex + 1}.`);
  }

  function downloadBundle() {
    const promptPack = buildImagePromptPack(project, activeIssue);
    const handoff = buildIssueHandoffMarkdown(project, activeIssue);
    const safeTitle = `${activeIssue.title}-bundle`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const imageMarkup = activeIssue.panels
      .filter((panel) => panel.imageUrl.trim())
      .map(
        (panel) => `
          <article class="bundle-card">
            <h3>Page ${panel.page}, Panel ${panel.panel}</h3>
            <img src="${panel.imageUrl}" alt="Page ${panel.page}, Panel ${panel.panel}" />
            <p><strong>Status:</strong> ${panel.imageStatus}</p>
            <p><strong>Notes:</strong> ${panel.imageNotes || "None"}</p>
          </article>`,
      )
      .join("");
    const html = `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${project.title} - ${activeIssue.title} bundle</title>
          <style>
            body { font-family: "Segoe UI", sans-serif; margin: 0; padding: 32px; background: #f7efe1; color: #1f1a14; }
            h1, h2, h3 { margin: 0 0 12px; }
            section { margin-bottom: 28px; }
            pre { white-space: pre-wrap; background: white; border: 1px solid rgba(31,26,20,0.12); border-radius: 18px; padding: 18px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
            .bundle-card { background: white; border: 1px solid rgba(31,26,20,0.12); border-radius: 18px; padding: 16px; }
            img { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <section>
            <h1>${project.title}</h1>
            <h2>${activeIssue.title}</h2>
            <p>Bundled export containing the issue handoff, prompt pack, and attached panel images.</p>
          </section>
          <section>
            <h2>Handoff script</h2>
            <pre>${handoff.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>
          </section>
          <section>
            <h2>Prompt pack</h2>
            <pre>${promptPack.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>
          </section>
          <section>
            <h2>Attached panel images</h2>
            <div class="grid">${imageMarkup || "<p>No panel images are attached yet.</p>"}</div>
          </section>
        </body>
      </html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${safeTitle || "issue-bundle"}.html`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStudioMessage(`Downloaded a bundled issue package for ${activeIssue.title}.`);
  }

  async function generateIssuePass() {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
          issueIndex: activeIssueIndex,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation request failed.");
      }

      const payload = (await response.json()) as {
        issue: Issue;
        source: "ai" | "local";
        provider?: string;
      };

      setProject((current) => ({
        ...current,
        issues: updateIssueAtIndex(current.issues, activeIssueIndex, () => payload.issue),
      }));
      setStudioMessage(
        payload.source === "ai"
          ? `Generated an AI-assisted story pass for ${activeIssue.title} using ${payload.provider ?? project.aiSettings.providerPreset}.`
          : `Generated a constrained local story pass for ${activeIssue.title}.`,
      );
    } catch {
      setProject((current) => ({
        ...current,
        issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) =>
          buildGeneratedIssue(issue, current),
        ),
      }));
      setStudioMessage(
        `API assist was unavailable, so ${activeIssue.title} was generated with the local story engine.`,
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,188,78,0.22),_transparent_28%),linear-gradient(180deg,_#f6efe1_0%,_#efe3cc_48%,_#e8dcc6_100%)] text-stone-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <section className="overflow-hidden rounded-[32px] border border-stone-900/10 bg-stone-950 text-stone-100 shadow-[0_30px_80px_rgba(52,33,16,0.28)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.35fr_0.85fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-200">
                Continuity-first comic studio
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
                  Build issues, scenes, and panel plans without losing the voice of your world.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
                  Inkforge keeps your character bible, arc map, issue outline, and panel continuity in one workspace so every scene can be checked against the same story logic.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <div className="text-sm uppercase tracking-[0.2em] text-stone-400">Continuity score</div>
                  <div className="mt-2 text-3xl font-black text-amber-300">{continuityScore}%</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">Derived from missing voice cues, panel notes, and issue structure.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <div className="text-sm uppercase tracking-[0.2em] text-stone-400">Active threads</div>
                  <div className="mt-2 text-3xl font-black text-sky-300">{activeThreads}</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">Open arcs stay visible while you break issues into beats.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <div className="text-sm uppercase tracking-[0.2em] text-stone-400">Planned pages</div>
                  <div className="mt-2 text-3xl font-black text-rose-300">{plannedPages}</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">Track pacing early so issue stakes fit the available page count.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.22em] text-stone-400">Series capsule</div>
                  <h2 className="mt-2 text-2xl font-bold text-white">{project.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setProject(defaultProject)}
                  className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-white/10"
                >
                  Reset demo
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={exportProject}
                  className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-white/10"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-white/10"
                >
                  Import JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={importProject}
                  className="hidden"
                />
              </div>
              <div className="mt-5 space-y-4 text-sm leading-7 text-stone-300">
                <p><span className="font-semibold text-amber-200">Logline:</span> {project.logline}</p>
                <p><span className="font-semibold text-amber-200">Series promise:</span> {project.seriesPromise}</p>
                <p><span className="font-semibold text-amber-200">Narrative hook:</span> {project.hook}</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Genre</div>
                  <div className="mt-2 text-lg font-semibold text-white">{project.genre}</div>
                </div>
                <div className="rounded-2xl bg-black/25 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Tone</div>
                  <div className="mt-2 text-lg font-semibold text-white">{project.tone}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border border-stone-900/10 bg-white/75 p-6 shadow-[0_18px_60px_rgba(70,45,22,0.12)] backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Story bible</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">Core story rules</h2>
              </div>
              <div className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
                Continuity source of truth
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">Project title</span>
                <input
                  value={project.title}
                  onChange={(event) =>
                    setProject((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-amber-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">Series hook</span>
                <input
                  value={project.hook}
                  onChange={(event) =>
                    setProject((current) => ({ ...current, hook: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-amber-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-stone-700">Logline</span>
                <textarea
                  value={project.logline}
                  onChange={(event) =>
                    setProject((current) => ({ ...current, logline: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
            </div>
            <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Style guide</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Visual style</span>
                  <input
                    value={project.styleGuide.visualStyle}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        styleGuide: { ...current.styleGuide, visualStyle: event.target.value },
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Linework</span>
                  <input
                    value={project.styleGuide.linework}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        styleGuide: { ...current.styleGuide, linework: event.target.value },
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Color mood</span>
                  <input
                    value={project.styleGuide.colorMood}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        styleGuide: { ...current.styleGuide, colorMood: event.target.value },
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Camera language</span>
                  <input
                    value={project.styleGuide.cameraLanguage}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        styleGuide: { ...current.styleGuide, cameraLanguage: event.target.value },
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Lettering direction</span>
                  <input
                    value={project.styleGuide.lettering}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        styleGuide: { ...current.styleGuide, lettering: event.target.value },
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-stone-700">Reference notes</span>
                  <textarea
                    rows={3}
                    value={project.styleGuide.referenceNotes}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        styleGuide: { ...current.styleGuide, referenceNotes: event.target.value },
                      }))
                    }
                    className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-amber-500"
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">AI provider</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Preset</span>
                  <select
                    value={project.aiSettings.providerPreset}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        aiSettings: {
                          ...current.aiSettings,
                          providerPreset: event.target.value as ComicProject["aiSettings"]["providerPreset"],
                        },
                      }))
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  >
                    {providerPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-stone-700">Model override</span>
                  <input
                    value={project.aiSettings.customModel}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        aiSettings: {
                          ...current.aiSettings,
                          customModel: event.target.value,
                        },
                      }))
                    }
                    placeholder="Leave blank to use the preset default"
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {providerPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`rounded-2xl border p-4 text-sm leading-6 ${
                      preset.id === project.aiSettings.providerPreset
                        ? "border-amber-400 bg-amber-50"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    <div className="font-semibold text-stone-900">{preset.label}</div>
                    <div className="text-stone-600">{preset.summary}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Image generation prep</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-stone-700">Global negative prompt</span>
                  <textarea
                    rows={3}
                    value={imagePrep.globalNegativePrompt}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        imagePrep: {
                          ...(current.imagePrep ?? defaultProject.imagePrep),
                          globalNegativePrompt: event.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-amber-500"
                  />
                </label>
                {imagePrep.renderDirectives.map((directive, index) => (
                  <label key={`render-directive-${index}`} className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-stone-700">Render directive {index + 1}</span>
                    <input
                      value={directive}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          imagePrep: {
                            ...(current.imagePrep ?? defaultProject.imagePrep),
                            renderDirectives: (current.imagePrep ?? defaultProject.imagePrep).renderDirectives.map((currentDirective, directiveIndex) =>
                              directiveIndex === index ? event.target.value : currentDirective,
                            ),
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-500"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-6 rounded-[22px] border border-stone-200 bg-white p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Character reference prompts</div>
                <div className="mt-4 space-y-4">
                  {project.characters.map((character) => {
                    const reference =
                      imagePrep.characterReferences.find(
                        (entry) => entry.characterId === character.id,
                      ) ?? {
                        characterId: character.id,
                        visualPrompt: "",
                        negativePrompt: "",
                      };

                    return (
                      <article key={character.id} className="rounded-[20px] border border-stone-200 bg-stone-50 p-4">
                        <div className="text-base font-semibold text-stone-900">{character.name}</div>
                        <div className="mt-1 text-sm text-stone-600">{character.role}</div>
                        <textarea
                          rows={3}
                          value={reference.visualPrompt}
                          onChange={(event) =>
                            setProject((current) => {
                              const currentImagePrep = current.imagePrep ?? defaultProject.imagePrep;
                              const hasReference = currentImagePrep.characterReferences.some(
                                (entry) => entry.characterId === character.id,
                              );

                              return {
                                ...current,
                                imagePrep: {
                                  ...currentImagePrep,
                                  characterReferences: hasReference
                                    ? currentImagePrep.characterReferences.map((entry) =>
                                        entry.characterId === character.id
                                          ? { ...entry, visualPrompt: event.target.value }
                                          : entry,
                                      )
                                    : [
                                        ...currentImagePrep.characterReferences,
                                        {
                                          characterId: character.id,
                                          visualPrompt: event.target.value,
                                          negativePrompt: "",
                                        },
                                      ],
                                },
                              };
                            })
                          }
                          placeholder="Reusable visual prompt for this character"
                          className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                        />
                        <textarea
                          rows={2}
                          value={reference.negativePrompt}
                          onChange={(event) =>
                            setProject((current) => {
                              const currentImagePrep = current.imagePrep ?? defaultProject.imagePrep;
                              const hasReference = currentImagePrep.characterReferences.some(
                                (entry) => entry.characterId === character.id,
                              );

                              return {
                                ...current,
                                imagePrep: {
                                  ...currentImagePrep,
                                  characterReferences: hasReference
                                    ? currentImagePrep.characterReferences.map((entry) =>
                                        entry.characterId === character.id
                                          ? { ...entry, negativePrompt: event.target.value }
                                          : entry,
                                      )
                                    : [
                                        ...currentImagePrep.characterReferences,
                                        {
                                          characterId: character.id,
                                          visualPrompt: "",
                                          negativePrompt: event.target.value,
                                        },
                                      ],
                                },
                              };
                            })
                          }
                          placeholder="Character-specific negative prompt"
                          className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                        />
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {project.rules.map((rule, index) => (
                <label key={`${rule}-${index}`} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-amber-200">
                    {index + 1}
                  </span>
                  <input
                    value={rule}
                    onChange={(event) =>
                      setProject((current) => ({
                        ...current,
                        rules: current.rules.map((currentRule, ruleIndex) =>
                          ruleIndex === index ? event.target.value : currentRule,
                        ),
                      }))
                    }
                    className="w-full bg-transparent text-sm leading-7 text-stone-700 outline-none"
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-stone-900/10 bg-[#1d2733] p-6 text-stone-100 shadow-[0_18px_60px_rgba(40,32,22,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200/70">Continuity radar</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">Warnings before you draft</h2>
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                {alerts.length} open flags
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {studioMessage ? (
                <div className="rounded-2xl border border-sky-200/15 bg-sky-300/10 px-4 py-3 text-sm leading-7 text-sky-50">
                  {studioMessage}
                </div>
              ) : null}
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert} className="rounded-2xl border border-rose-200/15 bg-white/6 px-4 py-3 text-sm leading-7 text-stone-200">
                    {alert}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm leading-7 text-emerald-100">
                  No continuity flags on the active issue. Character intent, panel notes, and structure are aligned.
                </div>
              )}
            </div>
            <div className="mt-6 rounded-[24px] bg-black/18 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">What Inkforge is checking</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-stone-300">
                <li>Character voice and goal are defined before issue drafting.</li>
                <li>Every beat is anchored to named characters.</li>
                <li>Panel notes track emotional and visual continuity.</li>
                <li>Page count is large enough to support the planned beats.</li>
                <li>Issue summary still reflects the rules of the series.</li>
              </ul>
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-stone-900/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(70,45,22,0.12)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Character bible</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">Voice, motive, fear, and continuity anchors</h2>
            </div>
            <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
              Keep cast behavior stable
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {project.characters.map((character) => (
              <article key={character.id} className="rounded-[26px] border border-stone-200 bg-stone-50/85 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold tracking-[-0.03em] text-stone-950">{character.name}</h3>
                    <p className="mt-1 text-sm text-stone-600">{character.role}</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
                    {character.palette}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Voice</span>
                    <textarea
                      rows={3}
                      value={character.voice}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          characters: current.characters.map((currentCharacter) =>
                            currentCharacter.id === character.id
                              ? { ...currentCharacter, voice: event.target.value }
                              : currentCharacter,
                          ),
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Goal</span>
                    <input
                      value={character.goal}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          characters: current.characters.map((currentCharacter) =>
                            currentCharacter.id === character.id
                              ? { ...currentCharacter, goal: event.target.value }
                              : currentCharacter,
                          ),
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Fear</span>
                    <input
                      value={character.fear}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          characters: current.characters.map((currentCharacter) =>
                            currentCharacter.id === character.id
                              ? { ...currentCharacter, fear: event.target.value }
                              : currentCharacter,
                          ),
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Signature details</span>
                    <textarea
                      rows={2}
                      value={character.signature}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          characters: current.characters.map((currentCharacter) =>
                            currentCharacter.id === character.id
                              ? { ...currentCharacter, signature: event.target.value }
                              : currentCharacter,
                          ),
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Continuity notes</span>
                    <textarea
                      rows={3}
                      value={character.continuityNotes}
                      onChange={(event) =>
                        setProject((current) => ({
                          ...current,
                          characters: current.characters.map((currentCharacter) =>
                            currentCharacter.id === character.id
                              ? { ...currentCharacter, continuityNotes: event.target.value }
                              : currentCharacter,
                          ),
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-stone-900/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(70,45,22,0.12)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Species codex</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">Bloodlines and evolved inheritance</h2>
            </div>
            <div className="rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-900">
              Worldbuilding sourcebook
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-stone-700">Species name</span>
              <input
                value={project.codex.speciesName}
                onChange={(event) =>
                  setProject((current) => ({
                    ...current,
                    codex: { ...current.codex, speciesName: event.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
              />
            </label>
            {project.codex.inheritanceLaws.map((law, index) => (
              <label key={`inheritance-law-${index}`} className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-stone-700">Inheritance law {index + 1}</span>
                <textarea
                  rows={2}
                  value={law}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      codex: {
                        ...current.codex,
                        inheritanceLaws: current.codex.inheritanceLaws.map((currentLaw, lawIndex) =>
                          lawIndex === index ? event.target.value : currentLaw,
                        ),
                      },
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
            ))}
          </div>
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Base bloodlines</div>
              <div className="mt-4 space-y-4">
                {project.codex.bloodlines.map((bloodline, index) => (
                  <article key={`${bloodline.name}-${index}`} className="rounded-[22px] bg-white p-4 shadow-sm">
                    <div className="text-base font-semibold text-stone-900">{bloodline.name}</div>
                    <div className="mt-2 text-sm leading-7 text-stone-700"><span className="font-semibold text-stone-900">Domain:</span> {bloodline.domain}</div>
                    <div className="mt-1 text-sm leading-7 text-stone-700"><span className="font-semibold text-stone-900">Visual identity:</span> {bloodline.visualIdentity}</div>
                    <div className="mt-1 text-sm leading-7 text-stone-700"><span className="font-semibold text-stone-900">Societal role:</span> {bloodline.societalRole}</div>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Evolved powers</div>
              <div className="mt-4 space-y-4">
                {project.codex.evolvedPowers.map((power, index) => (
                  <article key={`${power.name}-${index}`} className="rounded-[22px] bg-white p-4 shadow-sm">
                    <div className="text-base font-semibold text-stone-900">{power.name}</div>
                    <div className="mt-2 text-sm leading-7 text-stone-700"><span className="font-semibold text-stone-900">Parent lines:</span> {power.parentLines.join(" + ")}</div>
                    <div className="mt-1 text-sm leading-7 text-stone-700"><span className="font-semibold text-stone-900">Effect:</span> {power.effect}</div>
                    <div className="mt-1 text-sm leading-7 text-stone-700"><span className="font-semibold text-stone-900">Risk:</span> {power.risk}</div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <article className="rounded-[28px] border border-stone-900/10 bg-[#111827] p-6 text-stone-100 shadow-[0_18px_60px_rgba(40,32,22,0.18)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200/70">Arc map</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">Long-form tension stays visible</h2>
            </div>
            <div className="mt-6 space-y-4">
              {project.arcs.map((arc) => (
                <article key={arc.title} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{arc.title}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                      {arc.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-300"><span className="font-semibold text-amber-200">Focus:</span> {arc.focus}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-300"><span className="font-semibold text-amber-200">Tension:</span> {arc.tension}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-300"><span className="font-semibold text-amber-200">Payoff:</span> {arc.payoff}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-stone-900/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(70,45,22,0.12)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Issue room</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-stone-950">Plan one issue at scene level</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addIssue}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  New issue
                </button>
                <button
                  type="button"
                  onClick={deleteActiveIssue}
                  className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100"
                >
                  Delete issue
                </button>
                <button
                  type="button"
                  onClick={generateIssuePass}
                  disabled={isGenerating}
                  className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-stone-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {isGenerating ? "Generating..." : "Writers room assist"}
                </button>
                <button
                  type="button"
                  onClick={downloadHandoff}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  Download handoff
                </button>
                <button
                  type="button"
                  onClick={printHandoff}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  Print handoff
                </button>
                <button
                  type="button"
                  onClick={downloadBundle}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  Export bundle
                </button>
                <button
                  type="button"
                  onClick={() => setReviewMode((current) => !current)}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  {reviewMode ? "Hide review" : "Review prompt pack"}
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryMode((current) => !current)}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  {galleryMode ? "Hide gallery" : "Open gallery"}
                </button>
                <button
                  type="button"
                  onClick={downloadPromptPack}
                  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                >
                  Export prompt pack
                </button>
                {project.issues.map((issue, index) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setActiveIssueIndex(index)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      index === activeIssueIndex
                        ? "bg-stone-900 text-amber-200"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {issue.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">Issue title</span>
                <input
                  value={activeIssue.title}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                        ...issue,
                        title: event.target.value,
                      })),
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">Theme</span>
                <input
                  value={activeIssue.theme}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                        ...issue,
                        theme: event.target.value,
                      })),
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">Hook</span>
                <input
                  value={activeIssue.hook}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                        ...issue,
                        hook: event.target.value,
                      })),
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">Page count</span>
                <input
                  type="number"
                  min={1}
                  value={activeIssue.pages}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                        ...issue,
                        pages: Number(event.target.value) || 1,
                      })),
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-stone-700">Issue summary</span>
                <textarea
                  rows={4}
                  value={activeIssue.summary}
                  onChange={(event) =>
                    setProject((current) => ({
                      ...current,
                      issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                        ...issue,
                        summary: event.target.value,
                      })),
                    }))
                  }
                  className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-stone-700">
              <p className="font-semibold uppercase tracking-[0.18em] text-amber-900">Assist mode</p>
              <p className="mt-2">
                Writers room assist generates a fresh hook, theme, summary, beat sheet, and panel pass from the active issue using the current character goals, voices, story rules, and open arcs.
                When an OpenAI-compatible API key is configured on the server, the same button upgrades to an API-backed pass and falls back locally if the request fails.
              </p>
              <p className="mt-2">
                The current issue prompt also inherits your style guide, so the generated beats and panel language stay aligned with the comic&apos;s intended visual identity.
              </p>
            </div>

            {reviewMode ? (
              <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Prompt review</div>
                  <div className="rounded-full bg-stone-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                    {promptReviewFindings.length} findings
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {promptReviewFindings.length > 0 ? (
                    promptReviewFindings.map((finding, index) => (
                      <div
                        key={`${finding.message}-${index}`}
                        className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                          finding.severity === "warning"
                            ? "border border-rose-200 bg-rose-50 text-rose-900"
                            : "border border-sky-200 bg-sky-50 text-sky-900"
                        }`}
                      >
                        {finding.message}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-900">
                      The prompt pack is ready. Story, style, and panel continuity checks are aligned for export.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {galleryMode ? (
              <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Issue gallery</div>
                  <div className="rounded-full bg-stone-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                    {galleryIssues.length} issues with art
                  </div>
                </div>
                <div className="mt-4 space-y-6">
                  {galleryIssues.length > 0 ? (
                    galleryIssues.map((issue) => (
                      <div key={issue.id} className="space-y-4">
                        <div className="text-lg font-semibold text-stone-900">{issue.title}</div>
                        {issue.pages.map((pageGroup) => (
                          <div key={`${issue.id}-page-${pageGroup.page}`} className="space-y-3">
                            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                              Page {pageGroup.page}
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                              {pageGroup.panels.map((panel) => (
                                <article
                                  key={`${issue.id}-${panel.page}-${panel.panel}`}
                                  className="rounded-[22px] border border-stone-200 bg-white p-4"
                                >
                                  <Image
                                    src={panel.imageUrl}
                                    alt={`${issue.title} page ${panel.page} panel ${panel.panel}`}
                                    width={640}
                                    height={320}
                                    unoptimized
                                    className="h-40 w-full rounded-2xl object-cover"
                                  />
                                  <div className="mt-3 text-sm font-semibold text-stone-900">
                                    Panel {panel.panel}
                                  </div>
                                  <div className="mt-1 text-sm text-stone-600">{panel.shot}</div>
                                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-500">
                                    {panel.imageStatus}
                                  </div>
                                </article>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-6 text-sm leading-7 text-stone-600">
                      No panel images are attached yet. Use the image slots below to build the gallery.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Beat sheet</div>
                <div className="mt-4 space-y-4">
                  {activeIssue.beats.map((beat, beatIndex) => (
                    <div key={`${beat.title}-${beatIndex}`} className="rounded-[22px] bg-white p-4 shadow-sm">
                      <input
                        value={beat.title}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              beats: issue.beats.map((currentBeat, currentBeatIndex) =>
                                currentBeatIndex === beatIndex
                                  ? { ...currentBeat, title: event.target.value }
                                  : currentBeat,
                              ),
                            })),
                          }))
                        }
                        className="w-full text-base font-semibold text-stone-900 outline-none"
                      />
                      <textarea
                        rows={2}
                        value={beat.tension}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              beats: issue.beats.map((currentBeat, currentBeatIndex) =>
                                currentBeatIndex === beatIndex
                                  ? { ...currentBeat, tension: event.target.value }
                                  : currentBeat,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                      />
                      <textarea
                        rows={2}
                        value={beat.outcome}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              beats: issue.beats.map((currentBeat, currentBeatIndex) =>
                                currentBeatIndex === beatIndex
                                  ? { ...currentBeat, outcome: event.target.value }
                                  : currentBeat,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                      />
                      <input
                        value={beat.linkedCharacters.join(", ")}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              beats: issue.beats.map((currentBeat, currentBeatIndex) =>
                                currentBeatIndex === beatIndex
                                  ? {
                                      ...currentBeat,
                                      linkedCharacters: event.target.value
                                        .split(",")
                                        .map((value) => value.trim())
                                        .filter(Boolean),
                                    }
                                  : currentBeat,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-stone-200 bg-stone-50/80 p-4">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Panel builder</div>
                <div className="mt-4 space-y-4">
                  {activeIssue.panels.map((panel, panelIndex) => (
                    <div key={`${panel.page}-${panel.panel}-${panelIndex}`} className="rounded-[22px] bg-[#fffdf8] p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Page {panel.page} / Panel {panel.panel}
                        </div>
                        <div className="rounded-full bg-stone-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                          Continuity note required
                        </div>
                      </div>
                      <input
                        value={panel.shot}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              panels: issue.panels.map((currentPanel, currentPanelIndex) =>
                                currentPanelIndex === panelIndex
                                  ? { ...currentPanel, shot: event.target.value }
                                  : currentPanel,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500"
                      />
                      <textarea
                        rows={2}
                        value={panel.caption}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              panels: issue.panels.map((currentPanel, currentPanelIndex) =>
                                currentPanelIndex === panelIndex
                                  ? { ...currentPanel, caption: event.target.value }
                                  : currentPanel,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                      />
                      <textarea
                        rows={2}
                        value={panel.purpose}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              panels: issue.panels.map((currentPanel, currentPanelIndex) =>
                                currentPanelIndex === panelIndex
                                  ? { ...currentPanel, purpose: event.target.value }
                                  : currentPanel,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                      />
                      <textarea
                        rows={2}
                        value={panel.continuity}
                        onChange={(event) =>
                          setProject((current) => ({
                            ...current,
                            issues: updateIssueAtIndex(current.issues, activeIssueIndex, (issue) => ({
                              ...issue,
                              panels: issue.panels.map((currentPanel, currentPanelIndex) =>
                                currentPanelIndex === panelIndex
                                  ? { ...currentPanel, continuity: event.target.value }
                                  : currentPanel,
                              ),
                            })),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                      />
                      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Image slot</div>
                          <select
                            value={panel.imageStatus}
                            onChange={(event) =>
                              updatePanelAtIndex(panelIndex, (currentPanel) => ({
                                ...currentPanel,
                                imageStatus: event.target.value as Issue["panels"][number]["imageStatus"],
                              }))
                            }
                            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none"
                          >
                            <option value="Planned">Planned</option>
                            <option value="Generating">Generating</option>
                            <option value="Ready">Ready</option>
                          </select>
                        </div>
                        <input
                          value={panel.imageUrl}
                          onChange={(event) =>
                            updatePanelAtIndex(panelIndex, (currentPanel) => ({
                              ...currentPanel,
                              imageUrl: event.target.value,
                            }))
                          }
                          placeholder="Paste an image URL or upload a file below"
                          className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition focus:border-amber-500"
                        />
                        <textarea
                          rows={2}
                          value={panel.imageNotes}
                          onChange={(event) =>
                            updatePanelAtIndex(panelIndex, (currentPanel) => ({
                              ...currentPanel,
                              imageNotes: event.target.value,
                            }))
                          }
                          placeholder="Notes about this panel image, revision status, or source"
                          className="mt-3 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-amber-500"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => savePanelRevision(panelIndex)}
                            className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                          >
                            Save revision
                          </button>
                          <label className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100">
                            Upload image
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              onChange={(event) => attachPanelImage(panelIndex, event)}
                              className="hidden"
                            />
                          </label>
                          {panel.imageUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                updatePanelAtIndex(panelIndex, (currentPanel) => ({
                                  ...currentPanel,
                                  imageUrl: "",
                                  imageStatus: "Planned",
                                }))
                              }
                              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 transition hover:bg-rose-100"
                            >
                              Clear image
                            </button>
                          ) : null}
                        </div>
                        {panel.imageUrl ? (
                          <Image
                            src={panel.imageUrl}
                            alt={`Panel ${panel.panel} preview`}
                            width={640}
                            height={320}
                            unoptimized
                            className="mt-3 h-40 w-full rounded-2xl border border-stone-200 object-cover"
                          />
                        ) : null}
                        {panel.revisions.length > 0 ? (
                          <div className="mt-4 space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              Revision history
                            </div>
                            {panel.revisions.map((revision) => (
                              <div
                                key={revision.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2"
                              >
                                <div className="text-sm text-stone-700">
                                  <div className="font-semibold">{new Date(revision.createdAt).toLocaleString()}</div>
                                  <div>{revision.note}</div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-600">
                                    {revision.status}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => restorePanelRevision(panelIndex, revision.id)}
                                    className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700 transition hover:bg-stone-100"
                                  >
                                    Restore
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}