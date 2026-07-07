import { NextResponse } from "next/server";
import {
  buildGeneratedIssue,
  buildPrompt,
  ComicProject,
  Issue,
  isComicProject,
  normalizeIssue,
  providerPresets,
  sanitizeProject,
} from "@/lib/comic-engine";

function readTimeoutMs() {
  const value = Number(process.env.OPENAI_TIMEOUT_MS ?? "45000");

  if (!Number.isFinite(value) || value < 1000) {
    return 45000;
  }

  return Math.floor(value);
}

async function generateWithModel(project: ComicProject, issue: Issue) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const preset = providerPresets.find(
    (candidate) => candidate.id === project.aiSettings.providerPreset,
  );
  const baseUrl = (
    process.env.OPENAI_BASE_URL ?? preset?.baseUrl ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    project.aiSettings.customModel ||
    process.env.OPENAI_MODEL ||
    preset?.model ||
    "gpt-5.4";
  const siteUrl = process.env.OPENAI_SITE_URL?.trim();
  const siteName = process.env.OPENAI_SITE_NAME?.trim();
  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  });

  if (siteUrl) {
    headers.set("HTTP-Referer", siteUrl);
  }

  if (siteName) {
    headers.set("X-Title", siteName);
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(readTimeoutMs()),
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You create structured comic issue plans that preserve continuity and character consistency.",
        },
        {
          role: "user",
          content: buildPrompt(project, issue),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Model API returned ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Model API returned no content.");
  }

  return JSON.parse(content) as unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      project?: unknown;
      issueIndex?: unknown;
    };

    if (!isComicProject(body.project)) {
      return NextResponse.json(
        { error: "Invalid project payload." },
        { status: 400 },
      );
    }

    if (typeof body.issueIndex !== "number") {
      return NextResponse.json(
        { error: "Invalid issue index." },
        { status: 400 },
      );
    }

    const project = sanitizeProject(body.project);
    const issue = project.issues[body.issueIndex];

    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found." },
        { status: 404 },
      );
    }

    try {
      const modelIssue = await generateWithModel(project, issue);
      if (modelIssue) {
        return NextResponse.json({
          issue: normalizeIssue(modelIssue, buildGeneratedIssue(issue, project)),
          source: "ai",
          provider: project.aiSettings.providerPreset,
        });
      }
    } catch {
      // Fall back to the local continuity engine when the remote provider is unavailable.
    }

    return NextResponse.json({
      issue: buildGeneratedIssue(issue, project),
      source: "local",
      provider: "local",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
}
