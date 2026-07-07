export type Character = {
  id: string;
  name: string;
  role: string;
  voice: string;
  goal: string;
  fear: string;
  signature: string;
  palette: string;
  continuityNotes: string;
};

export type Arc = {
  title: string;
  focus: string;
  tension: string;
  payoff: string;
  status: "Active" | "Building" | "Resolved";
};

export type Beat = {
  title: string;
  tension: string;
  outcome: string;
  linkedCharacters: string[];
};

export type Panel = {
  page: number;
  panel: number;
  shot: string;
  caption: string;
  purpose: string;
  continuity: string;
  imageUrl: string;
  imageStatus: "Planned" | "Generating" | "Ready";
  imageNotes: string;
  revisions: PanelRevision[];
};

export type PanelRevision = {
  id: string;
  imageUrl: string;
  note: string;
  status: "Planned" | "Generating" | "Ready";
  createdAt: string;
};

export type AISettings = {
  providerPreset: "openrouter-cheap" | "groq-fast" | "openai-balanced" | "custom";
  customModel: string;
};

export type CharacterReference = {
  characterId: string;
  visualPrompt: string;
  negativePrompt: string;
};

export type ImagePrep = {
  globalNegativePrompt: string;
  renderDirectives: string[];
  characterReferences: CharacterReference[];
};

export type Bloodline = {
  name: string;
  domain: string;
  visualIdentity: string;
  societalRole: string;
};

export type EvolvedPower = {
  name: string;
  parentLines: string[];
  effect: string;
  risk: string;
};

export type Codex = {
  speciesName: string;
  inheritanceLaws: string[];
  bloodlines: Bloodline[];
  evolvedPowers: EvolvedPower[];
};

export type Issue = {
  id: string;
  title: string;
  hook: string;
  theme: string;
  summary: string;
  status: "Outline" | "Drafting" | "Ready";
  pages: number;
  beats: Beat[];
  panels: Panel[];
};

export type StyleGuide = {
  visualStyle: string;
  linework: string;
  colorMood: string;
  cameraLanguage: string;
  lettering: string;
  referenceNotes: string;
};

export type ComicProject = {
  title: string;
  logline: string;
  tone: string;
  genre: string;
  seriesPromise: string;
  hook: string;
  styleGuide: StyleGuide;
  aiSettings: AISettings;
  imagePrep: ImagePrep;
  codex: Codex;
  rules: string[];
  characters: Character[];
  arcs: Arc[];
  issues: Issue[];
};

export type PromptReviewFinding = {
  severity: "warning" | "info";
  message: string;
};

export const emptyBeat: Beat = {
  title: "",
  tension: "",
  outcome: "",
  linkedCharacters: [],
};

export const emptyPanel: Panel = {
  page: 1,
  panel: 1,
  shot: "",
  caption: "",
  purpose: "",
  continuity: "",
  imageUrl: "",
  imageStatus: "Planned",
  imageNotes: "",
  revisions: [],
};

export function createPanelRevision(panel: Panel): PanelRevision {
  return {
    id: `revision-${crypto.randomUUID()}`,
    imageUrl: panel.imageUrl,
    note: panel.imageNotes || `Snapshot for page ${panel.page}, panel ${panel.panel}`,
    status: panel.imageStatus,
    createdAt: new Date().toISOString(),
  };
}

export const providerPresets: Array<{
  id: AISettings["providerPreset"];
  label: string;
  provider: string;
  baseUrl: string;
  model: string;
  summary: string;
}> = [
  {
    id: "openrouter-cheap",
    label: "OpenRouter Cheap",
    provider: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4.1-mini",
    summary: "Low-cost strong drafting for issue planning.",
  },
  {
    id: "groq-fast",
    label: "Groq Fast",
    provider: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    summary: "Fast and usually inexpensive for iterative script passes.",
  },
  {
    id: "openai-balanced",
    label: "OpenAI Balanced",
    provider: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-5.4",
    summary: "Higher quality when you want stronger narrative steering.",
  },
  {
    id: "custom",
    label: "Custom Compatible",
    provider: "Custom",
    baseUrl: "",
    model: "",
    summary: "Use the server env values with your own compatible provider.",
  },
];

export const defaultProject: ComicProject = {
  title: "Ashes of Meridian",
  logline:
    "A fugitive cartographer maps the hidden memory-fires burning beneath a drowned megacity before the empire that lit them can rewrite history forever.",
  tone: "Mythic noir with bright heroism and sharp political tension",
  genre: "Sci-fi fantasy adventure",
  seriesPromise:
    "Every issue reveals one new district, one new secret, and one hard choice that changes the crew dynamic.",
  hook: "Maps are literal truth engines. Every false line on the page mutates the city above it.",
  styleGuide: {
    visualStyle: "Prestige sci-fi comic with noir staging and heroic silhouettes",
    linework: "Clean contour lines, selective detail, bold shadow shapes, readable panel silhouettes",
    colorMood: "Amber highlights against flooded teal shadows with restrained neon accents",
    cameraLanguage: "Wide establishing shots, tense medium action framing, emotionally revealing close-ups",
    lettering: "Sharp caption voice, economical dialogue, no overcrowded balloons",
    referenceNotes: "Favor clarity and dramatic composition over painterly noise; every panel should read instantly in print.",
  },
  aiSettings: {
    providerPreset: "openrouter-cheap",
    customModel: "",
  },
  imagePrep: {
    globalNegativePrompt:
      "muddy anatomy, extra limbs, duplicate characters, unreadable hands, broken faces, cluttered backgrounds, random symbols, low contrast, blurry linework, inconsistent costume details",
    renderDirectives: [
      "Keep silhouettes readable at comic-panel scale.",
      "Preserve consistent energy-vein color logic per bloodline.",
      "Favor clean staging over painterly noise.",
    ],
    characterReferences: [],
  },
  codex: {
    speciesName: "",
    inheritanceLaws: [
      "",
      "",
      "",
    ],
    bloodlines: [],
    evolvedPowers: [],
  },
  rules: [
    "Every major choice must deepen the city mystery or fracture the crew.",
    "Kara never lies directly; she withholds, deflects, or redirects.",
    "Bastien only jokes when he is frightened or buying time.",
    "Each issue must close one tactical problem and open one moral problem.",
  ],
  characters: [
    {
      id: "kara",
      name: "Kara Vale",
      role: "Lead cartographer",
      voice: "Measured, precise, never more than one sentence ahead of the room.",
      goal: "Expose who engineered the memory-fires and prove her mother was framed.",
      fear: "That she is becoming as manipulative as the empire she hates.",
      signature: "Burnt-orange field notes, compass ring, eye for infrastructure.",
      palette: "ember, brass, midnight",
      continuityNotes:
        "Refuses open water after issue one. Keeps damaged maps instead of discarding them.",
    },
    {
      id: "bastien",
      name: "Bastien Ward",
      role: "Ex-imperial marksman",
      voice: "Dry humor, clipped admissions, emotionally honest only under pressure.",
      goal: "Protect the crew long enough to atone for the district he helped burn.",
      fear: "Being useful only as a weapon.",
      signature: "Silver railgun, ruined officer coat, bad jokes in bad moments.",
      palette: "gunmetal, smoke, frost",
      continuityNotes:
        "Never shoots first unless civilians are in immediate danger. Avoids formal titles.",
    },
    {
      id: "sen",
      name: "Sen Orin",
      role: "Memory diver",
      voice: "Poetic, sideways, emotionally blunt when reading people.",
      goal: "Find the source-memory that erased their sister from public record.",
      fear: "That every dive leaves less of them behind.",
      signature: "Glass-thread gloves, mirrored tattoos, reverence for ruins.",
      palette: "teal, pearl, rain",
      continuityNotes:
        "Needs silence after every deep dive. Never touches an artifact without asking permission.",
    },
  ],
  arcs: [
    {
      title: "The Lantern Treaty",
      focus: "Kara versus the empire's official map of truth",
      tension: "Every corrected map destabilizes another district alliance.",
      payoff: "Kara learns her mother authored the first forbidden map willingly.",
      status: "Active",
    },
    {
      title: "Bastien's Ledger",
      focus: "Bastien's hidden role in Meridian's ash campaign",
      tension: "Witnesses keep recognizing him before the crew is ready.",
      payoff: "He publicly testifies and chooses accountability over exile.",
      status: "Building",
    },
    {
      title: "Ghost Tide",
      focus: "Sen's search for erased family memory",
      tension: "The deeper the dives go, the less stable Sen's own recollections become.",
      payoff: "Their sister is alive inside the city's submerged archive engine.",
      status: "Building",
    },
  ],
  issues: [
    {
      id: "issue-01",
      title: "Issue 01: The District Beneath",
      hook: "The crew descends into an outlaw market hidden below the flood line.",
      theme: "Truth costs more when everyone depends on the lie.",
      summary:
        "Kara tracks a missing surveyor into the undertow bazaar, where a forged map reveals the first living memory-fire. Bastien has to choose between a clean extraction and protecting the civilians who know his face.",
      status: "Drafting",
      pages: 22,
      beats: [
        {
          title: "Cold open in the flooded tram tunnel",
          tension: "The crew follows a map that redraws itself while the water level rises.",
          outcome: "Kara proves the map is reacting to a buried engine.",
          linkedCharacters: ["kara", "sen"],
        },
        {
          title: "Bazaar introduction",
          tension: "Bastien is recognized by a former dock worker.",
          outcome: "He buys time with humor, then fails to leave when things turn violent.",
          linkedCharacters: ["bastien"],
        },
        {
          title: "The living map bargain",
          tension: "The market archivist offers evidence on Kara's mother in exchange for the engine key.",
          outcome: "Kara accepts a partial truth and puts the crew in deeper debt.",
          linkedCharacters: ["kara", "bastien", "sen"],
        },
      ],
      panels: [
        {
          page: 1,
          panel: 1,
          shot: "Wide overhead of the drowned tram line",
          caption: "Meridian keeps its oldest lies under water.",
          purpose: "Set the mythic-noir scale immediately.",
          continuity: "Water triggers Kara's visible hesitation before she regains control.",
          imageUrl: "",
          imageStatus: "Planned",
          imageNotes: "",
          revisions: [],
        },
        {
          page: 1,
          panel: 2,
          shot: "Inset on Kara's compass ring sparking against wet stone",
          caption: "The map is changing faster than we are.",
          purpose: "Introduce the truth-engine mechanic through action.",
          continuity: "Kara should sound precise, not melodramatic.",
          imageUrl: "",
          imageStatus: "Planned",
          imageNotes: "",
          revisions: [],
        },
        {
          page: 2,
          panel: 1,
          shot: "Low angle on Bastien scanning upper catwalks",
          caption: "You two keep chasing miracles. I'll cover the exits.",
          purpose: "Show Bastien defaulting to protection over confession.",
          continuity: "Humor stays dry; no swagger.",
          imageUrl: "",
          imageStatus: "Planned",
          imageNotes: "",
          revisions: [],
        },
        {
          page: 2,
          panel: 2,
          shot: "Mirrored close-up of Sen touching a memory-slick wall",
          caption: "Someone remembers this place with grief, not fear.",
          purpose: "Distinguish Sen's emotional intelligence from exposition.",
          continuity: "Sen needs a quiet beat after contact on the next page.",
          imageUrl: "",
          imageStatus: "Planned",
          imageNotes: "",
          revisions: [],
        },
      ],
    },
    {
      id: "issue-02",
      title: "Issue 02: Teeth of the Census",
      hook: "The crew infiltrates a census parade that erases dissenters in real time.",
      theme: "Identity becomes fragile when the state owns the archive.",
      summary:
        "A district celebration hides a mass data purge, forcing Sen to risk an unstable dive while Bastien is confronted by a survivor from the ash campaign.",
      status: "Outline",
      pages: 24,
      beats: [
        {
          title: "Parade infiltration",
          tension: "Masks and uniforms make every encounter a recognition risk.",
          outcome: "Kara steals the purge route but loses the exit route.",
          linkedCharacters: ["kara", "bastien"],
        },
        {
          title: "Archive rupture",
          tension: "Sen has to preserve hundreds of names at once.",
          outcome: "The crew saves the list but Sen loses a personal memory.",
          linkedCharacters: ["sen"],
        },
      ],
      panels: [
        {
          page: 3,
          panel: 1,
          shot: "Festival confetti falling over armored archivists",
          caption: "Even celebrations here are inventory checks.",
          purpose: "Contrast spectacle with bureaucratic threat.",
          continuity: "Keep the world bright while the stakes darken underneath.",
          imageUrl: "",
          imageStatus: "Planned",
          imageNotes: "",
          revisions: [],
        },
      ],
    },
  ],
};

export function buildContinuityAlerts(project: ComicProject, issue: Issue) {
  const alerts: string[] = [];

  project.characters.forEach((character) => {
    if (!character.voice.trim() || !character.goal.trim()) {
      alerts.push(`${character.name} is missing a clear voice or goal.`);
    }
  });

  if (!issue.theme.trim()) {
    alerts.push(`${issue.title} needs a thematic statement so scenes have a shared spine.`);
  }

  if (issue.pages < issue.beats.length * 4) {
    alerts.push(`${issue.title} may be under-paged for its current beat count.`);
  }

  issue.beats.forEach((beat) => {
    if (beat.linkedCharacters.length === 0) {
      alerts.push(`Beat "${beat.title}" is missing a character anchor.`);
    }

    beat.linkedCharacters.forEach((characterId) => {
      const characterExists = project.characters.some(
        (character) => character.id === characterId,
      );

      if (!characterExists) {
        alerts.push(`Beat "${beat.title}" references an unknown character id: ${characterId}.`);
      }
    });
  });

  issue.panels.forEach((panel) => {
    if (!panel.continuity.trim()) {
      alerts.push(`Page ${panel.page}, panel ${panel.panel} is missing a continuity note.`);
    }
  });

  project.rules.forEach((rule) => {
    const ruleWord = rule.split(" ")[0]?.toLowerCase();

    if (ruleWord && !issue.summary.toLowerCase().includes(ruleWord)) {
      alerts.push(`Issue summary does not visibly reflect the rule: "${rule}".`);
    }
  });

  return alerts.slice(0, 6);
}

export function buildScore(alerts: string[], issue: Issue) {
  const panelCoverageBonus = Math.min(issue.panels.length * 2, 12);
  return Math.max(58, 96 - alerts.length * 7 + panelCoverageBonus);
}

export function updateIssueAtIndex(
  issues: Issue[],
  index: number,
  recipe: (issue: Issue) => Issue,
) {
  return issues.map((issue, issueIndex) =>
    issueIndex === index ? recipe(issue) : issue,
  );
}

export function sanitizeProject(project: ComicProject): ComicProject {
  return {
    title: project.title || defaultProject.title,
    logline: project.logline || defaultProject.logline,
    tone: project.tone || defaultProject.tone,
    genre: project.genre || defaultProject.genre,
    seriesPromise: project.seriesPromise || defaultProject.seriesPromise,
    hook: project.hook || defaultProject.hook,
    styleGuide: {
      visualStyle:
        project.styleGuide?.visualStyle || defaultProject.styleGuide.visualStyle,
      linework: project.styleGuide?.linework || defaultProject.styleGuide.linework,
      colorMood: project.styleGuide?.colorMood || defaultProject.styleGuide.colorMood,
      cameraLanguage:
        project.styleGuide?.cameraLanguage || defaultProject.styleGuide.cameraLanguage,
      lettering: project.styleGuide?.lettering || defaultProject.styleGuide.lettering,
      referenceNotes:
        project.styleGuide?.referenceNotes || defaultProject.styleGuide.referenceNotes,
    },
    aiSettings: {
      providerPreset:
        project.aiSettings?.providerPreset || defaultProject.aiSettings.providerPreset,
      customModel: project.aiSettings?.customModel || defaultProject.aiSettings.customModel,
    },
    imagePrep: {
      globalNegativePrompt:
        project.imagePrep?.globalNegativePrompt || defaultProject.imagePrep.globalNegativePrompt,
      renderDirectives:
        Array.isArray(project.imagePrep?.renderDirectives) && project.imagePrep.renderDirectives.length > 0
          ? project.imagePrep.renderDirectives.map((directive) => directive || "")
          : defaultProject.imagePrep.renderDirectives,
      characterReferences:
        Array.isArray(project.imagePrep?.characterReferences)
          ? project.imagePrep.characterReferences.map((reference) => ({
              characterId: reference.characterId || "",
              visualPrompt: reference.visualPrompt || "",
              negativePrompt: reference.negativePrompt || "",
            }))
          : defaultProject.imagePrep.characterReferences,
    },
    codex: {
      speciesName: project.codex?.speciesName || defaultProject.codex.speciesName,
      inheritanceLaws:
        Array.isArray(project.codex?.inheritanceLaws) && project.codex.inheritanceLaws.length > 0
          ? project.codex.inheritanceLaws.map((law) => law || "")
          : defaultProject.codex.inheritanceLaws,
      bloodlines:
        Array.isArray(project.codex?.bloodlines)
          ? project.codex.bloodlines.map((bloodline) => ({
              name: bloodline.name || "Unnamed bloodline",
              domain: bloodline.domain || "Domain not set yet.",
              visualIdentity: bloodline.visualIdentity || "Visual identity not set yet.",
              societalRole: bloodline.societalRole || "Societal role not set yet.",
            }))
          : defaultProject.codex.bloodlines,
      evolvedPowers:
        Array.isArray(project.codex?.evolvedPowers)
          ? project.codex.evolvedPowers.map((power) => ({
              name: power.name || "Unnamed evolution",
              parentLines: Array.isArray(power.parentLines) ? power.parentLines.filter(Boolean) : [],
              effect: power.effect || "Effect not set yet.",
              risk: power.risk || "Risk not set yet.",
            }))
          : defaultProject.codex.evolvedPowers,
    },
    rules:
      project.rules.filter((rule) => rule.trim().length > 0).length > 0
        ? project.rules.filter((rule) => rule.trim().length > 0)
        : defaultProject.rules,
    characters:
      project.characters.length > 0
        ? project.characters.map((character, index) => ({
            id: character.id || `character-${index + 1}`,
            name: character.name || `Character ${index + 1}`,
            role: character.role || "Unassigned role",
            voice: character.voice || "Voice not set yet.",
            goal: character.goal || "Goal not set yet.",
            fear: character.fear || "Fear not set yet.",
            signature: character.signature || "Signature details not set yet.",
            palette: character.palette || "custom",
            continuityNotes:
              character.continuityNotes || "Continuity notes not set yet.",
          }))
        : defaultProject.characters,
    arcs:
      project.arcs.length > 0
        ? project.arcs.map((arc) => ({
            title: arc.title || "Untitled arc",
            focus: arc.focus || "Focus not set yet.",
            tension: arc.tension || "Tension not set yet.",
            payoff: arc.payoff || "Payoff not set yet.",
            status: arc.status,
          }))
        : defaultProject.arcs,
    issues:
      project.issues.length > 0
        ? project.issues.map((issue, index) => ({
            id: issue.id || `issue-${index + 1}`,
            title: issue.title || `Issue ${index + 1}`,
            hook: issue.hook || "Issue hook not set yet.",
            theme: issue.theme || "Issue theme not set yet.",
            summary: issue.summary || "Issue summary not set yet.",
            status: issue.status,
            pages: issue.pages > 0 ? issue.pages : 22,
            beats:
              issue.beats.length > 0
                ? issue.beats.map((beat) => ({
                    title: beat.title || "Untitled beat",
                    tension: beat.tension || "Tension not set yet.",
                    outcome: beat.outcome || "Outcome not set yet.",
                    linkedCharacters: beat.linkedCharacters.filter(Boolean),
                  }))
                : [emptyBeat],
            panels:
              issue.panels.length > 0
                ? issue.panels.map((panel, panelIndex) => ({
                    page: panel.page || Math.max(1, panelIndex + 1),
                    panel: panel.panel || 1,
                    shot: panel.shot || "Shot not set yet.",
                    caption: panel.caption || "Caption not set yet.",
                    purpose: panel.purpose || "Purpose not set yet.",
                    continuity: panel.continuity || "Continuity note not set yet.",
                    imageUrl: panel.imageUrl || "",
                    imageStatus: panel.imageStatus || "Planned",
                    imageNotes: panel.imageNotes || "",
                    revisions: Array.isArray(panel.revisions)
                      ? panel.revisions.map((revision, revisionIndex) => ({
                          id: revision.id || `revision-${panelIndex + 1}-${revisionIndex + 1}`,
                          imageUrl: revision.imageUrl || "",
                          note: revision.note || "Archived revision",
                          status: revision.status || "Ready",
                          createdAt: revision.createdAt || new Date(0).toISOString(),
                        }))
                      : [],
                  }))
                : [emptyPanel],
          }))
        : defaultProject.issues,
  };
}

export function isComicProject(value: unknown): value is ComicProject {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ComicProject>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.logline === "string" &&
    typeof candidate.styleGuide === "object" &&
    candidate.styleGuide !== null &&
    typeof candidate.aiSettings === "object" &&
    candidate.aiSettings !== null &&
    (candidate.imagePrep === undefined || typeof candidate.imagePrep === "object") &&
    (candidate.codex === undefined || typeof candidate.codex === "object") &&
    Array.isArray(candidate.rules) &&
    Array.isArray(candidate.characters) &&
    Array.isArray(candidate.arcs) &&
    Array.isArray(candidate.issues)
  );
}

export function buildStyleGuideSummary(project: ComicProject) {
  return [
    `Visual style: ${project.styleGuide.visualStyle}`,
    `Linework: ${project.styleGuide.linework}`,
    `Color mood: ${project.styleGuide.colorMood}`,
    `Camera language: ${project.styleGuide.cameraLanguage}`,
    `Lettering: ${project.styleGuide.lettering}`,
    `Reference notes: ${project.styleGuide.referenceNotes}`,
  ].join("\n");
}

export function buildImagePrepSummary(project: ComicProject) {
  const references = project.imagePrep.characterReferences
    .map((reference) => {
      const character = project.characters.find(
        (candidate) => candidate.id === reference.characterId,
      );

      return [
        `${character?.name ?? reference.characterId}:`,
        `  visual prompt: ${reference.visualPrompt || "Not set"}`,
        `  negative prompt: ${reference.negativePrompt || "None"}`,
      ].join("\n");
    })
    .join("\n");

  return [
    `Global negative prompt: ${project.imagePrep.globalNegativePrompt}`,
    `Render directives: ${project.imagePrep.renderDirectives.join(" | ")}`,
    references ? `Character references:\n${references}` : "Character references: none configured",
  ].join("\n");
}

function pickIssueFocus(issue: Issue, project: ComicProject) {
  const explicitCharacterIds = issue.beats.flatMap((beat) => beat.linkedCharacters);
  const anchorIds = explicitCharacterIds.length > 0
    ? Array.from(new Set(explicitCharacterIds)).slice(0, 3)
    : project.characters.slice(0, 3).map((character) => character.id);

  return project.characters.filter((character) => anchorIds.includes(character.id));
}

export function buildGeneratedIssue(issue: Issue, project: ComicProject): Issue {
  const focusCharacters = pickIssueFocus(issue, project);
  const primaryCharacter = focusCharacters[0] ?? project.characters[0];
  const secondaryCharacter = focusCharacters[1] ?? project.characters[1] ?? primaryCharacter;
  const activeArc =
    project.arcs.find((arc) => arc.status === "Active") ??
    project.arcs.find((arc) => arc.status === "Building") ??
    project.arcs[0];
  const firstRule = project.rules[0] ?? defaultProject.rules[0];
  const secondRule = project.rules[1] ?? defaultProject.rules[1];
  const theme =
    issue.theme.trim() ||
    `${primaryCharacter.name.split(" ")[0]}'s goal collides with ${secondaryCharacter.name.split(" ")[0]}'s fear.`;
  const hook =
    issue.hook.trim() ||
    `${primaryCharacter.name} pushes ${activeArc?.title ?? "the main arc"} forward when a public ritual turns into a truth crisis.`;
  const summary = `${primaryCharacter.name} drives the issue by pursuing ${primaryCharacter.goal.toLowerCase()}, while ${secondaryCharacter.name} is forced to confront ${secondaryCharacter.fear.toLowerCase()}. ${activeArc?.focus ?? project.hook} frames the central conflict, and the issue follows the rule that ${firstRule.toLowerCase()} The ending resolves one tactical problem but leaves a harder moral fracture in the crew because ${secondRule.toLowerCase()}`;

  const beats: Beat[] = [
    {
      title: `Opening pressure on ${primaryCharacter.name}`,
      tension: `${hook} ${primaryCharacter.name} has to act in a voice that stays ${primaryCharacter.voice.toLowerCase()}`,
      outcome: `${primaryCharacter.name} secures a clue tied to ${activeArc?.title ?? "the larger conspiracy"}, but exposes the crew to retaliation.`,
      linkedCharacters: [primaryCharacter.id],
    },
    {
      title: `${secondaryCharacter.name} absorbs the human cost`,
      tension: `${secondaryCharacter.name} is cornered by the emotional consequence of ${activeArc?.tension.toLowerCase() ?? project.hook.toLowerCase()}`,
      outcome: `${secondaryCharacter.name} reveals vulnerability without breaking their established voice, which changes how the team reads the mission.`,
      linkedCharacters: [secondaryCharacter.id],
    },
    {
      title: `Crew fracture over ${activeArc?.title ?? "the truth-engine"}`,
      tension: `The crew debates a choice that tests the rule: ${firstRule}`,
      outcome: `They keep momentum on the mission, but the compromise deepens an unresolved emotional debt.`,
      linkedCharacters: focusCharacters.map((character) => character.id),
    },
    {
      title: `Exit wound and next-issue promise`,
      tension: `${primaryCharacter.name} gets the tactical win while the moral problem opens wider.`,
      outcome: `The issue closes one immediate threat and tees up ${activeArc?.payoff.toLowerCase() ?? "the next escalation"}.`,
      linkedCharacters: focusCharacters.map((character) => character.id),
    },
  ];

  const panels: Panel[] = [
    {
      page: 1,
      panel: 1,
      shot: `Wide establishing shot of the district shaped by ${activeArc?.title ?? project.title}`,
      caption: `${project.title} never lets truth stay buried for long.`,
      purpose: `Announce the issue's scope and visual identity immediately.`,
      continuity: `${primaryCharacter.name} should appear with ${primaryCharacter.signature.toLowerCase()} and maintain ${primaryCharacter.voice.toLowerCase()}`,
      imageUrl: "",
      imageStatus: "Planned",
      imageNotes: "",
      revisions: [],
    },
    {
      page: 1,
      panel: 2,
      shot: `Close on ${secondaryCharacter.name} reacting before speaking`,
      caption: `${secondaryCharacter.name} senses the cost before the plan is spoken aloud.`,
      purpose: `Keep the emotional engine character-first instead of exposition-first.`,
      continuity: `${secondaryCharacter.name} must reflect this note: ${secondaryCharacter.continuityNotes}`,
      imageUrl: "",
      imageStatus: "Planned",
      imageNotes: "",
      revisions: [],
    },
    {
      page: 2,
      panel: 1,
      shot: `Medium action panel of the crew committing to the risky choice`,
      caption: `The city only changes when someone is willing to pay for the correction.`,
      purpose: `Translate the story rule into a visible irreversible action.`,
      continuity: `The scene must honor the rule "${firstRule}" and avoid breaking any voice pattern.`,
      imageUrl: "",
      imageStatus: "Planned",
      imageNotes: "",
      revisions: [],
    },
    {
      page: 3,
      panel: 1,
      shot: `Final reveal image pointing toward the next issue`,
      caption: `${activeArc?.payoff ?? project.seriesPromise}`,
      purpose: `Deliver closure on the tactic while reopening the larger moral question.`,
      continuity: `End on a consequence that clearly advances ${activeArc?.title ?? "the core series arc"}.`,
      imageUrl: "",
      imageStatus: "Planned",
      imageNotes: "",
      revisions: [],
    },
  ];

  return {
    ...issue,
    hook,
    theme,
    summary,
    beats,
    panels,
    status: "Drafting",
  };
}

export function createEmptyIssue(issueNumber: number): Issue {
  const label = String(issueNumber).padStart(2, "0");

  return {
    id: `issue-${crypto.randomUUID()}`,
    title: `Issue ${label}: Untitled`,
    hook: "A destabilizing event forces the crew to act before they are ready.",
    theme: "What this issue proves about the world is not defined yet.",
    summary: "Use the story generator or write an issue summary here.",
    status: "Outline",
    pages: 22,
    beats: [{ ...emptyBeat }],
    panels: [{ ...emptyPanel }],
  };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildIssueHandoffMarkdown(project: ComicProject, issue: Issue) {
  const characterIndex = new Map(
    project.characters.map((character) => [character.id, character]),
  );

  const beatLines = issue.beats
    .map((beat, beatIndex) => {
      const linkedCast = beat.linkedCharacters
        .map((characterId) => characterIndex.get(characterId)?.name ?? characterId)
        .join(", ");

      return [
        `${beatIndex + 1}. ${beat.title}`,
        `   - Tension: ${beat.tension}`,
        `   - Outcome: ${beat.outcome}`,
        `   - Linked cast: ${linkedCast || "None"}`,
      ].join("\n");
    })
    .join("\n\n");

  const panelLines = issue.panels
    .map(
      (panel) =>
        `- Page ${panel.page}, Panel ${panel.panel}: ${panel.shot}\n  Caption: ${panel.caption}\n  Purpose: ${panel.purpose}\n  Continuity: ${panel.continuity}`,
    )
    .join("\n\n");

  const castLines = project.characters
    .map(
      (character) =>
        `- ${character.name} (${character.role})\n  Voice: ${character.voice}\n  Goal: ${character.goal}\n  Fear: ${character.fear}\n  Continuity: ${character.continuityNotes}`,
    )
    .join("\n\n");

  return [
    `# ${project.title}`,
    `## ${issue.title}`,
    ``,
    `Status: ${issue.status}`,
    `Pages: ${issue.pages}`,
    `Theme: ${issue.theme}`,
    `Hook: ${issue.hook}`,
    ``,
    `## Summary`,
    issue.summary,
    ``,
    `## Character Continuity`,
    castLines,
    ``,
    `## Beat Sheet`,
    beatLines,
    ``,
    `## Panel Plan`,
    panelLines,
  ].join("\n");
}

export function buildImagePromptPack(project: ComicProject, issue: Issue) {
  const characterIndex = new Map(
    project.characters.map((character) => [character.id, character]),
  );
  const referenceIndex = new Map(
    project.imagePrep.characterReferences.map((reference) => [reference.characterId, reference]),
  );

  const panelPrompts = issue.panels
    .map((panel) => {
      const relatedBeat = issue.beats.find((beat) =>
        beat.linkedCharacters.some((characterId) =>
          panel.continuity.toLowerCase().includes(characterId.toLowerCase()),
        ),
      );
      const castNotes = issue.beats
        .flatMap((beat) => beat.linkedCharacters)
        .slice(0, 3)
        .map((characterId) => characterIndex.get(characterId))
        .filter((character): character is Character => Boolean(character))
        .map((character) => {
          const reference = referenceIndex.get(character.id);

          return `${character.name}: ${character.signature}; palette ${character.palette}; continuity ${character.continuityNotes}; visual reference ${reference?.visualPrompt || "Use established character bible."}; negative prompt ${reference?.negativePrompt || "None"}`;
        })
        .join(" | ");

      return [
        `### Page ${panel.page}, Panel ${panel.panel}`,
        `Shot: ${panel.shot}`,
        `Caption: ${panel.caption}`,
        `Purpose: ${panel.purpose}`,
        `Continuity: ${panel.continuity}`,
        `Asset status: ${panel.imageStatus}`,
        `Existing image: ${panel.imageUrl || "No image attached yet."}`,
        `Style prompt: ${project.styleGuide.visualStyle}; ${project.genre}; ${project.tone}; ${project.styleGuide.linework}; ${project.styleGuide.colorMood}; ${project.styleGuide.cameraLanguage}; print-ready composition.` ,
        `Render directives: ${project.imagePrep.renderDirectives.join(" | ")}`,
        `Global negative prompt: ${project.imagePrep.globalNegativePrompt}`,
        `Character notes: ${castNotes || "Use the established cast bible from the project."}`,
        `Story context: ${relatedBeat?.tension ?? issue.summary}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `# ${project.title} image prompt pack`,
    `## ${issue.title}`,
    ``,
    `Global style`,
    `- Genre: ${project.genre}`,
    `- Tone: ${project.tone}`,
    `- Hook: ${project.hook}`,
    `- Theme: ${issue.theme}`,
    `- Visual style: ${project.styleGuide.visualStyle}`,
    `- Linework: ${project.styleGuide.linework}`,
    `- Color mood: ${project.styleGuide.colorMood}`,
    `- Camera language: ${project.styleGuide.cameraLanguage}`,
    `- Lettering: ${project.styleGuide.lettering}`,
    `- Reference notes: ${project.styleGuide.referenceNotes}`,
    `- AI preset: ${project.aiSettings.providerPreset}`,
    `- AI model hint: ${project.aiSettings.customModel || "Use preset default"}`,
    `- Global negative prompt: ${project.imagePrep.globalNegativePrompt}`,
    `- Render directives: ${project.imagePrep.renderDirectives.join(" | ")}`,
    `- Keep character design stable across all panels.`,
    `- Preserve panel continuity notes exactly.`,
    ``,
    `## Character bible`,
    ...project.characters.map(
      (character) =>
        `- ${character.name}: ${character.role}; ${character.signature}; voice ${character.voice}; continuity ${character.continuityNotes}`,
    ),
    ``,
    `## Character image references`,
    ...project.imagePrep.characterReferences.map((reference) => {
      const character = project.characters.find((candidate) => candidate.id === reference.characterId);

      return `- ${character?.name ?? reference.characterId}: visual prompt ${reference.visualPrompt || "Not set"}; negative prompt ${reference.negativePrompt || "None"}`;
    }),
    ``,
    `## Panel prompts`,
    panelPrompts,
  ].join("\n");
}

export function buildIssueHandoffHtml(project: ComicProject, issue: Issue) {
  const characterIndex = new Map(
    project.characters.map((character) => [character.id, character]),
  );

  const beatMarkup = issue.beats
    .map((beat, beatIndex) => {
      const linkedCast = beat.linkedCharacters
        .map((characterId) => characterIndex.get(characterId)?.name ?? characterId)
        .join(", ");

      return `
        <article class="card">
          <h3>${beatIndex + 1}. ${escapeHtml(beat.title)}</h3>
          <p><strong>Tension:</strong> ${escapeHtml(beat.tension)}</p>
          <p><strong>Outcome:</strong> ${escapeHtml(beat.outcome)}</p>
          <p><strong>Linked cast:</strong> ${escapeHtml(linkedCast || "None")}</p>
        </article>`;
    })
    .join("");

  const panelMarkup = issue.panels
    .map(
      (panel) => `
        <article class="card panel-card">
          <h3>Page ${panel.page}, Panel ${panel.panel}</h3>
          <p><strong>Shot:</strong> ${escapeHtml(panel.shot)}</p>
          <p><strong>Caption:</strong> ${escapeHtml(panel.caption)}</p>
          <p><strong>Purpose:</strong> ${escapeHtml(panel.purpose)}</p>
          <p><strong>Continuity:</strong> ${escapeHtml(panel.continuity)}</p>
          <p><strong>Asset status:</strong> ${escapeHtml(panel.imageStatus)}</p>
          <p><strong>Image notes:</strong> ${escapeHtml(panel.imageNotes)}</p>
        </article>`,
    )
    .join("");

  const castMarkup = project.characters
    .map(
      (character) => `
        <article class="card">
          <h3>${escapeHtml(character.name)}</h3>
          <p><strong>Role:</strong> ${escapeHtml(character.role)}</p>
          <p><strong>Voice:</strong> ${escapeHtml(character.voice)}</p>
          <p><strong>Goal:</strong> ${escapeHtml(character.goal)}</p>
          <p><strong>Fear:</strong> ${escapeHtml(character.fear)}</p>
          <p><strong>Continuity:</strong> ${escapeHtml(character.continuityNotes)}</p>
        </article>`,
    )
    .join("");

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(project.title)} - ${escapeHtml(issue.title)} handoff</title>
      <style>
        :root { color-scheme: light; }
        body {
          margin: 0;
          padding: 40px;
          font-family: "Segoe UI", sans-serif;
          background: #f7efe1;
          color: #1f1a14;
        }
        h1, h2, h3 { margin: 0 0 12px; }
        h1 { font-size: 32px; }
        h2 { font-size: 20px; margin-top: 28px; }
        p, li { line-height: 1.6; }
        .hero {
          border: 1px solid rgba(31, 26, 20, 0.12);
          border-radius: 24px;
          background: white;
          padding: 24px;
          box-shadow: 0 12px 32px rgba(31, 26, 20, 0.08);
        }
        .grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .card {
          border: 1px solid rgba(31, 26, 20, 0.12);
          border-radius: 18px;
          background: white;
          padding: 18px;
          break-inside: avoid;
        }
        .panel-card {
          background: #fffaf2;
        }
        .meta {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          margin-top: 16px;
        }
        .meta div {
          border-radius: 16px;
          background: #f3e5c7;
          padding: 12px 14px;
        }
        @media print {
          body { background: white; padding: 20px; }
          .hero, .card { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <section class="hero">
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(issue.title)}</p>
        <div class="meta">
          <div><strong>Status</strong><br />${escapeHtml(issue.status)}</div>
          <div><strong>Pages</strong><br />${issue.pages}</div>
          <div><strong>Theme</strong><br />${escapeHtml(issue.theme)}</div>
          <div><strong>Hook</strong><br />${escapeHtml(issue.hook)}</div>
        </div>
        <h2>Summary</h2>
        <p>${escapeHtml(issue.summary)}</p>
      </section>

      <h2>Character continuity</h2>
      <section class="grid">${castMarkup}</section>

      <h2>Beat sheet</h2>
      <section class="grid">${beatMarkup}</section>

      <h2>Panel handoff</h2>
      <section class="grid">${panelMarkup}</section>
    </body>
  </html>`;
}

export function normalizeIssue(candidate: unknown, fallback: Issue): Issue {
  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const value = candidate as Partial<Issue>;

  return {
    ...fallback,
    title: typeof value.title === "string" ? value.title : fallback.title,
    hook: typeof value.hook === "string" ? value.hook : fallback.hook,
    theme: typeof value.theme === "string" ? value.theme : fallback.theme,
    summary: typeof value.summary === "string" ? value.summary : fallback.summary,
    status:
      value.status === "Outline" || value.status === "Drafting" || value.status === "Ready"
        ? value.status
        : fallback.status,
    pages: typeof value.pages === "number" && value.pages > 0 ? value.pages : fallback.pages,
    beats: Array.isArray(value.beats) && value.beats.length > 0
      ? value.beats.map((beat) => ({
          title: typeof beat?.title === "string" ? beat.title : "Untitled beat",
          tension: typeof beat?.tension === "string" ? beat.tension : "Tension not set yet.",
          outcome: typeof beat?.outcome === "string" ? beat.outcome : "Outcome not set yet.",
          linkedCharacters: Array.isArray(beat?.linkedCharacters)
            ? beat.linkedCharacters.filter((item): item is string => typeof item === "string")
            : [],
        }))
      : fallback.beats,
    panels: Array.isArray(value.panels) && value.panels.length > 0
      ? value.panels.map((panel, panelIndex) => ({
          page: typeof panel?.page === "number" && panel.page > 0 ? panel.page : panelIndex + 1,
          panel: typeof panel?.panel === "number" && panel.panel > 0 ? panel.panel : 1,
          shot: typeof panel?.shot === "string" ? panel.shot : "Shot not set yet.",
          caption: typeof panel?.caption === "string" ? panel.caption : "Caption not set yet.",
          purpose: typeof panel?.purpose === "string" ? panel.purpose : "Purpose not set yet.",
          continuity:
            typeof panel?.continuity === "string"
              ? panel.continuity
              : "Continuity note not set yet.",
          imageUrl: typeof panel?.imageUrl === "string" ? panel.imageUrl : "",
          imageStatus:
            panel?.imageStatus === "Planned" ||
            panel?.imageStatus === "Generating" ||
            panel?.imageStatus === "Ready"
              ? panel.imageStatus
              : "Planned",
          imageNotes: typeof panel?.imageNotes === "string" ? panel.imageNotes : "",
          revisions: Array.isArray(panel?.revisions)
            ? panel.revisions.map((revision, revisionIndex) => ({
                id:
                  typeof revision?.id === "string"
                    ? revision.id
                    : `revision-${panelIndex + 1}-${revisionIndex + 1}`,
                imageUrl: typeof revision?.imageUrl === "string" ? revision.imageUrl : "",
                note: typeof revision?.note === "string" ? revision.note : "Archived revision",
                status:
                  revision?.status === "Planned" ||
                  revision?.status === "Generating" ||
                  revision?.status === "Ready"
                    ? revision.status
                    : "Ready",
                createdAt:
                  typeof revision?.createdAt === "string"
                    ? revision.createdAt
                    : new Date(0).toISOString(),
              }))
            : [],
        }))
      : fallback.panels,
  };
}

export function buildPromptReview(project: ComicProject, issue: Issue): PromptReviewFinding[] {
  const findings: PromptReviewFinding[] = [];
  const knownNames = project.characters.map((character) => character.name.toLowerCase());

  if (!project.styleGuide.visualStyle.trim() || !project.styleGuide.cameraLanguage.trim()) {
    findings.push({
      severity: "warning",
      message: "The style guide is missing key visual direction, so downstream art prompts may drift.",
    });
  }

  if (project.aiSettings.providerPreset === "custom" && !project.aiSettings.customModel.trim()) {
    findings.push({
      severity: "warning",
      message: "Custom provider mode is selected without a model hint.",
    });
  }

  issue.panels.forEach((panel) => {
    if (!panel.shot.trim() || !panel.continuity.trim()) {
      findings.push({
        severity: "warning",
        message: `Page ${panel.page}, panel ${panel.panel} is missing shot or continuity detail for reliable prompt export.`,
      });
    }

    const panelText = `${panel.caption} ${panel.continuity}`.toLowerCase();
    if (!knownNames.some((name) => panelText.includes(name))) {
      findings.push({
        severity: "info",
        message: `Page ${panel.page}, panel ${panel.panel} does not name a character explicitly; visual consistency may rely only on context.`,
      });
    }

    if (panel.imageStatus === "Ready" && !panel.imageUrl.trim()) {
      findings.push({
        severity: "warning",
        message: `Page ${panel.page}, panel ${panel.panel} is marked ready but has no attached image asset.`,
      });
    }

    if (panel.imageUrl.trim() && panel.revisions.length === 0) {
      findings.push({
        severity: "info",
        message: `Page ${panel.page}, panel ${panel.panel} has an image attached but no saved revision history yet.`,
      });
    }
  });

  project.rules.forEach((rule) => {
    const token = rule.split(" ")[0]?.toLowerCase();
    if (token && !issue.summary.toLowerCase().includes(token)) {
      findings.push({
        severity: "info",
        message: `Issue summary may not visibly echo the rule: "${rule}".`,
      });
    }
  });

  return findings.slice(0, 8);
}

export function buildPrompt(project: ComicProject, issue: Issue) {
  return [
    "You are a senior comic editor building a single issue plan.",
    "Return JSON only.",
    "Respect the characters' established voices, goals, fears, and continuity notes.",
    "Respect the series rules and open arcs.",
    "Write for a professional comic script workflow: strong page turns, visual clarity, and panel-readable action.",
    "Honor the visual style guide, but do not overwrite story logic with pure aesthetics.",
    "Return an object with keys: title, hook, theme, summary, status, pages, beats, panels.",
    "Beats must be an array of objects with title, tension, outcome, linkedCharacters.",
    "Panels must be an array of objects with page, panel, shot, caption, purpose, continuity.",
    "Do not invent character ids beyond the ones already present in the project.",
    `Style guide:\n${buildStyleGuideSummary(project)}`,
    `Image prep:\n${buildImagePrepSummary(project)}`,
    `Project JSON: ${JSON.stringify(project)}`,
    `Active issue JSON: ${JSON.stringify(issue)}`,
  ].join("\n");
}