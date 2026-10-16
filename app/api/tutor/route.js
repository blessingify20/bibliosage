import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* The only place the Groq key is ever used. It is a server-only variable
   (GROQ_API_KEY, no NEXT_PUBLIC_ prefix), so it is never sent to the browser,
   never logged and never committed. Everything below runs on the server. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/* Groq's Llama chat models are now Enterprise-only, so we use the model Groq
   itself recommends as their replacement: openai/gpt-oss-120b. Override with
   GROQ_MODEL if you ever want a different one. */
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_INPUT = 6000; // pasted text
const MAX_TOPIC = 300; // "Type a topic"
const MAX_EXPLAIN_TURNS = 10;
const LIMITS = { free: 10, plus: 30 };

/* Strict JSON schema — the model is guaranteed to answer in this shape.
   "notes" is the tutor's compact memory; "books" is only used in topic mode. */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    stage: { type: "string", enum: ["explain", "check", "actions"] },
    say: { type: "string" },
    question: { type: "string" },
    notes: {
      type: "object",
      properties: {
        known: { type: "string" },
        misconceptions: { type: "string" },
        asked: { type: "string" },
        ignored: { type: "string" },
        examples: { type: "string" },
        running: { type: "string" },
      },
      required: ["known", "misconceptions", "asked", "ignored", "examples", "running"],
      additionalProperties: false,
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
        },
        required: ["title", "body"],
        additionalProperties: false,
      },
    },
    books: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
        },
        required: ["title", "author"],
        additionalProperties: false,
      },
    },
  },
  required: ["stage", "say", "question", "notes", "actions", "books"],
  additionalProperties: false,
};

/* Only used if the model forgets a question where one is genuinely needed.
   Picked so we do not repeat a question already in the conversation. */
const EXPLAIN_FALLBACKS = [
  "What part of that feels clear, and which part is still fuzzy?",
  "How would you put that in your own words?",
  "Where do you think this already shows up in what you do?",
];
const CHECK_FALLBACKS = [
  "How would you explain the main idea to a friend?",
  "In your own words, what is the key point here?",
  "What would you say this is really about?",
];

const EXPLAIN_DIRECTIVES = ["start", "got_it", "diff", "example", "reply"];

/* Last-resort actions if the model refuses to finish after the checks. Rare:
   the tutor normally writes its own, built from the reader's life and goal. */
function fallbackActions(goal) {
  const focus =
    typeof goal === "string" && goal.trim() ? goal.trim() : "what you just learned";
  return [
    {
      title: "Say it back in your own words",
      body: `Explain ${focus} out loud to one person today, without looking at notes.`,
    },
    {
      title: "Spot it in real life",
      body: "Pick one thing you'll do this week and notice where this idea shows up.",
    },
    {
      title: "Write three lines",
      body: `Write three short sentences about ${focus} and one thing you'll do differently.`,
    },
  ];
}

function directiveText(directive, checkAnswers, isTopic) {
  const actionsRule = isTopic
    ? 'Set stage = "actions", fill the actions array with 3 to 5 items, and fill "books" with up to 3 well-known books (title + author) you are highly confident really exist — use an empty array if you are not sure.'
    : 'Set stage = "actions" and fill the actions array with 3 to 5 items. "books" stays [].';

  switch (directive) {
    case "start":
      return 'BEGIN. In one or two short lines, orient the reader to what you will explore, then ask ONE short question to find out what they already know about it. Do not explain the whole thing yet. stage = "explain", actions = [], books = [].';
    case "got_it":
      return 'The reader tapped "Got it". Carry on with the next piece of understanding, building on what they said, and keep using the running example. Do not restart. 3 to 6 sentences. Ask a question only if it truly helps; often none is best. stage = "explain", actions = [], books = [].';
    case "diff":
      return 'The reader tapped "Explain differently". Re-explain the SAME idea from a genuinely new angle, with a new comparison from the reader\'s life. Do not reuse any earlier wording, question or example. 3 to 6 sentences. stage = "explain", actions = [], books = [].';
    case "example":
      return 'The reader tapped "Give me an example". Give one concrete example built from the reader\'s own life or the running example, unlike anything used before. 3 to 6 sentences. stage = "explain", actions = [], books = [].';
    case "reply":
      return 'The reader just replied in their own words (their message is the last one in the conversation). Read it first and respond to what they actually said — borrow a few of their own words naturally. If they are right, build on it rather than just praising. If they are unsure or mistaken, gently correct with a smaller step or a fresh comparison from their life. Never repeat a question, phrase or example already used. 3 to 6 sentences. stage = "explain", actions = [], books = [].';
    case "begin_checks":
      return 'The reader is ready to be checked. Ask the FIRST of two short check questions, inviting them to explain the idea back in their own words (vary the wording). Ask ONE question only, do not answer it, and do not repeat a question you have asked before. stage = "check", actions = [], books = [].';
    case "check_answer": {
      const fb =
        "Begin with brief, specific feedback on the reader's answer: name what was right or what was missing, in your own words, with no filler praise.";
      if (checkAnswers < 2)
        return `${fb} Then ask ONE more short check question (different from any before) — this is the last check. Do NOT give the actions yet. Ask at most one question in total. stage = "check", actions = [], books = [].`;
      return `${fb} Now give the actions and ask NOTHING further. ${actionsRule}`;
    }
    default:
      return 'Continue teaching, responding to the reader\'s last message. 3 to 6 sentences, at most one question. stage = "explain", actions = [], books = [].';
  }
}

function renderHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "(This is the very start of the session.)";
  }
  return history
    .map((m) => {
      const who = m && m.role === "tutor" ? "Tutor" : "Reader";
      const text = String((m && (m.text ?? m.content)) ?? "").trim();
      return `${who}: ${text}`;
    })
    .join("\n\n");
}

function notesToText(notes) {
  const n = notes && typeof notes === "object" ? notes : {};
  const line = (v) => (typeof v === "string" && v.trim() ? v.trim() : "none yet");
  return [
    `What the reader already knows or has said: ${line(n.known)}`,
    `Apparent misconceptions: ${line(n.misconceptions)}`,
    `Questions you have already asked: ${line(n.asked)}`,
    `Questions the reader ignored or skipped: ${line(n.ignored)}`,
    `Examples and comparisons already used: ${line(n.examples)}`,
    `The ONE running example from the reader's life: ${line(n.running)}`,
  ].join("\n");
}

function buildUserMessage(p) {
  const profile = p.profile || {};
  const more =
    profile.more && typeof profile.more === "object" ? profile.more : {};
  const clean = (v, fallback = "not shared") =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  const isTopic = p.inputType === "topic";

  const sourceBlock = isTopic
    ? [
        "YOUR SOURCE",
        "There is NO pasted text in this session. Teach from your own general knowledge of the topic the reader typed below.",
        "You must NOT quote any book, author or person, and you must NOT invent specific facts, statistics, quotes, page numbers or study findings. Stay with general, well-established understanding and everyday reasoning.",
        "The app labels this for the reader as an AI overview, so write as a careful teacher, not as a source.",
        "",
        "THE TOPIC",
        p.inputText,
      ].join("\n")
    : [
        "YOUR SOURCE",
        "You work ONLY from the text the reader pasted below. Never claim the text says something it does not. If a question needs something the text does not contain, say so plainly. If the text is too short or too unclear to teach from, say so and ask the reader to paste a little more.",
        "",
        "THE PASTED TEXT (the only source you may teach from)",
        '"""',
        p.inputText,
        '"""',
      ].join("\n");

  return [
    "You are the Bibliosage tutor — a warm, attentive human teacher helping ONE reader understand something and use it in their real life. You teach for understanding, not performance.",
    "",
    sourceBlock,
    "",
    "SAFETY (hard limits — they override the task below)",
    "- You give learning support only, never professional advice. If the reader asks about health, mental health, law or money, say plainly that you cannot help with that and suggest they speak to a qualified professional — or to emergency services straight away if it is urgent.",
    "- Refuse anything harmful: no instructions for weapons, illegal drugs, self-harm, violence or breaking the law, and nothing hateful, abusive or harassing.",
    "- Stay with this lesson. If a request is far outside the topic, answer it in one friendly line and bring the reader back to what they are learning.",
    "- Never invent facts, statistics, quotes, sources or studies to sound authoritative. If you are unsure, say so plainly and remind the reader to double-check.",
    "",
    "HOW YOU TEACH (always)",
    "- Read the reader's most recent message FIRST and answer THAT. Use a few of their own words back so they feel heard.",
    "- Prefer explaining over asking. Ask at most ONE question in a reply, and many replies should have NO question at all — aim to leave \"question\" empty on roughly half of them. Never ask two questions in one reply.",
    "- Put any question you ask ONLY in the \"question\" field. Never also write a question inside \"say\". If you have no question, set \"question\" to \"\".",
    "- Never repeat a question, a phrase, or an example you have already used. If the reader ignored a question, do NOT ask it again — either keep explaining naturally, or (at most once) rephrase it in a completely different way. This includes when the reader still seems lost: reword your correction with new words instead of repeating the same sentence.",
    "- Write 3 to 6 sentences per reply, in plain everyday words, like a person talking. Vary your sentence rhythm; do not fall into a pattern.",
    '- No filler praise and no stock openers. Never begin with "Great question", "Absolutely", "Certainly", "Of course", "Sure", "Good job", "Nice work" or "Well done". If you encourage, be specific about what was right, in your own words.',
    "- Use exactly one everyday comparison per reply, drawn from the reader's own life whenever you can.",
    "",
    "STARTING AND ADAPTING",
    "- On your very first reply, keep it short: in one or two lines, orient the reader to the topic and naturally find out what they already know about it, in a single question. Do not dump the whole explanation yet.",
    "- Choose ONE concrete running example from the reader's profile (their routine, what they enjoy, the real situation they described, or something they are good at) and carry that same example through the whole lesson, calling back to things they told you earlier.",
    "- If the reader's profile is empty, use a simple everyday example. Never invent facts about the reader, and never claim they said something they did not.",
    "- If the reader seems lost, do NOT repeat yourself. Change your approach: take a smaller step, or find a new comparison from their life.",
    '- To check understanding, invite the reader to explain it back in their own words (vary the wording — for example, "How would you explain this to a friend?").',
    "",
    "THE THREE BUTTONS",
    '- "Explain differently" means re-explain the SAME idea from a genuinely new angle with a new comparison. Never reuse earlier wording.',
    '- "Give me an example" means a new, concrete example from the reader\'s life, different from any before.',
    "- If the reader types a reply, that reply takes priority over any button and must change what you say next.",
    "",
    "TEACHING NOTES (this is your memory — keep it accurate and update it every turn)",
    notesToText(p.notes),
    "",
    "THE READER",
    `Day-to-day life: ${clean(profile.life)}`,
    `Working toward: ${clean(profile.goal)}`,
    `What stops them applying what they learn: ${clean(profile.blocker)}`,
    `Right now they are: ${clean(more.doing)}`,
    `They enjoy outside work or school: ${clean(more.enjoy)}`,
    `A real situation they want to use this for: ${clean(more.situation)}`,
    `Something they are good at or have lived through: ${clean(more.strongAt)}`,
    `How they like to learn: ${clean(more.learnStyle)}`,
    `What they want to gain from this session: ${clean(p.sessionGoal)}`,
    "",
    "CONVERSATION SO FAR",
    renderHistory(p.history),
    "",
    "CURRENT TASK",
    directiveText(p.directive, p.checkAnswers, isTopic),
    "",
    'Reply with JSON only, matching the schema. "say" is what you tell the reader. "question" is at most ONE question (end it with a "?"), or "" if this reply has no question. "notes" is your updated teaching memory {known, misconceptions, asked, ignored, examples, running} — a short line each. Put final real-life actions in "actions" (title + body) only when stage is "actions". In topic mode, when you give the actions, also fill "books" with up to 3 well-known books you are highly confident really exist, as {title, author}; never invent titles or authors, and use an empty array if unsure. In paste mode "books" is always []. stage is "explain" while teaching, "check" for the 2 to 3 check questions, and "actions" only for the final actions.',
  ].join("\n");
}

function sanitizeNotes(value) {
  const src = value && typeof value === "object" ? value : {};
  const str = (v) => (typeof v === "string" ? v.trim().slice(0, 600) : "");
  return {
    known: str(src.known),
    misconceptions: str(src.misconceptions),
    asked: str(src.asked),
    ignored: str(src.ignored),
    examples: str(src.examples),
    running: str(src.running),
  };
}

/* A fallback question the conversation has not already used. */
function pickFallback(history, list) {
  const said = (Array.isArray(history) ? history : [])
    .map((m) => String((m && (m.text ?? m.content)) ?? "").toLowerCase())
    .join("\n");
  const fresh = list.find((q) => !said.includes(q.toLowerCase().slice(0, 24)));
  return fresh || list[0];
}

/* Some replies put the same question in both "say" and "question". If "say"
   already contains it, drop the separate field so it is not shown twice. */
function dedupeQuestion(say, question) {
  if (!question) return "";
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const q = norm(question);
  if (q.length >= 8 && norm(say).includes(q)) return "";
  return question;
}

async function callGroq(apiKey, userMessage) {
  const base = {
    model: MODEL,
    messages: [{ role: "user", content: userMessage }],
    temperature: 0.75,
    max_completion_tokens: 1800,
    frequency_penalty: 0.4,
    presence_penalty: 0.5,
    response_format: {
      type: "json_schema",
      json_schema: { name: "tutor_reply", strict: true, schema: RESPONSE_SCHEMA },
    },
  };

  const send = (payload) =>
    fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });

  let res = await send({ ...base, reasoning_effort: "low", include_reasoning: false });
  if (res.status === 400) {
    // Some deployments reject the reasoning knobs — retry without them.
    res = await send(base);
  }
  if (res.status === 400) {
    // ...and some reject the repetition penalties — retry with a lean body.
    const { frequency_penalty, presence_penalty, ...lean } = base;
    res = await send(lean);
  }
  if (!res.ok) {
    const err = new Error("groq " + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function fail(code, error, status) {
  return NextResponse.json({ code, error }, { status });
}

export async function POST(request) {
  const apiKey = process.env.GROQ_API_KEY;
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!apiKey || !supaUrl || !supaAnon) {
    return fail("config", "The tutor is not configured yet.", 500);
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return fail("auth", "Please log in.", 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("input", "Bad request.", 400);
  }

  const directive = typeof body.directive === "string" ? body.directive : "";
  const inputType = body.inputType === "topic" ? "topic" : "paste";
  const inputText = typeof body.inputText === "string" ? body.inputText : "";
  const sessionGoal =
    typeof body.sessionGoal === "string" ? body.sessionGoal.slice(0, 500) : "";
  const history = Array.isArray(body.history) ? body.history.slice(-40) : [];
  const notes = sanitizeNotes(body.notes);
  const explainTurns = Number.isFinite(body.explainTurns)
    ? Math.max(0, Math.floor(body.explainTurns))
    : 0;
  const checkAnswers = Number.isFinite(body.checkAnswers)
    ? Math.max(0, Math.floor(body.checkAnswers))
    : 0;

  if (!inputText.trim()) {
    return fail(
      "input",
      inputType === "topic" ? "Type a topic first." : "Paste some text first.",
      400
    );
  }
  const maxLen = inputType === "topic" ? MAX_TOPIC : MAX_INPUT;
  if (inputText.length > maxLen) {
    return fail(
      "input",
      inputType === "topic"
        ? `Please keep the topic to ${MAX_TOPIC} characters or fewer.`
        : `Please keep the pasted text to ${MAX_INPUT} characters or fewer.`,
      400
    );
  }

  /* The user's own session (anon key + their access token) — so Row Level
     Security does all the access control. No secret/service key is used. */
  const supabase = createClient(supaUrl, supaAnon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  let user;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) throw error || new Error("no user");
    user = data.user;
  } catch {
    return fail("auth", "Please log in again.", 401);
  }

  // Plan and profile (missing rows are fine — plan defaults to Free). The
  // optional "more" column may not exist yet, so fall back without it.
  let profile = null;
  let plan = "free";
  try {
    const [pRes, sRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("life, goal, blocker, more")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle(),
    ]);
    let profileRow = pRes;
    if (pRes.error) {
      profileRow = await supabase
        .from("profiles")
        .select("life, goal, blocker")
        .eq("user_id", user.id)
        .maybeSingle();
    }
    if (!profileRow.error) profile = profileRow.data;
    if (!sRes.error && sRes.data?.plan) plan = sRes.data.plan;
  } catch {
    // Non-fatal: continue with no profile and the Free plan.
  }

  // Monthly limit — block the start.
  if (directive === "start") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count, error } = await supabase
      .from("sessions")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth);
    if (error) {
      return fail("groq", "We couldn't check your sessions just now.", 502);
    }
    const limit = LIMITS[plan] ?? LIMITS.free;
    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          code: "limit",
          error: `You've used all ${limit} sessions on your plan this month.`,
          limit,
          used: count ?? 0,
        },
        { status: 403 }
      );
    }
  }

  // Cap the teaching replies at 10 for one session.
  if (EXPLAIN_DIRECTIVES.includes(directive) && explainTurns >= MAX_EXPLAIN_TURNS) {
    return NextResponse.json({
      stage: "explain",
      say: "We've gone deep — let's find out what you've taken from it. Tap “I understand” when you're ready.",
      question: "",
      notes,
      actions: [],
      books: [],
    });
  }

  const userMessage = buildUserMessage({
    directive,
    inputType,
    inputText,
    sessionGoal,
    profile,
    notes,
    history,
    explainTurns,
    checkAnswers,
  });

  let groqData;
  try {
    groqData = await callGroq(apiKey, userMessage);
  } catch (err) {
    if (err?.status === 429) {
      return fail("busy", "The tutor is busy, try again in a minute.", 429);
    }
    return fail("groq", "The tutor couldn't answer just now.", 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(groqData?.choices?.[0]?.message?.content || "{}");
  } catch {
    return fail("groq", "The tutor gave an unexpected answer.", 502);
  }

  const isTopic = inputType === "topic";

  const coerce = (raw) => {
    let stage = ["explain", "check", "actions"].includes(raw.stage)
      ? raw.stage
      : "explain";
    let say = typeof raw.say === "string" ? raw.say.trim() : "";
    let question = typeof raw.question === "string" ? raw.question.trim() : "";
    question = dedupeQuestion(say, question);
    let actions = Array.isArray(raw.actions)
      ? raw.actions
          .filter((a) => a && (a.title || a.body))
          .slice(0, 5)
          .map((a) => ({
            title: String(a.title || "").trim(),
            body: String(a.body || "").trim(),
          }))
      : [];
    let books =
      isTopic && Array.isArray(raw.books)
        ? raw.books
            .filter((b) => b && b.title)
            .slice(0, 3)
            .map((b) => ({
              title: String(b.title || "").trim(),
              author: String(b.author || "").trim(),
            }))
        : [];

    if (EXPLAIN_DIRECTIVES.includes(directive)) {
      stage = "explain";
      actions = [];
      books = [];
      if (directive === "start" && !question && !say.includes("?")) {
        question = pickFallback(history, EXPLAIN_FALLBACKS);
      }
    }
    if (directive === "begin_checks") {
      stage = "check";
      actions = [];
      books = [];
      if (!question && !say.includes("?")) question = pickFallback(history, CHECK_FALLBACKS);
    }
    if (directive === "check_answer" && checkAnswers < 2) {
      stage = "check";
      actions = [];
      books = [];
      if (!question && !say.includes("?")) question = pickFallback(history, CHECK_FALLBACKS);
    }
    if (stage === "actions") {
      question = "";
    } else {
      books = [];
    }
    if (!say && !question) {
      say = "Let me put that another way — tell me which part you'd like me to go over again.";
    }
    return { stage, say, question, notes: sanitizeNotes(raw.notes || notes), actions, books };
  };

  let out = coerce(parsed);

  /* After the SECOND check answer the actions MUST appear. If the model stalls
     and asks yet another question, nudge it once — explicitly — to finish; if
     it still will not, use simple fallback actions so the session always ends. */
  const needActions = directive === "check_answer" && checkAnswers >= 2;
  if (needActions && (out.stage !== "actions" || out.actions.length < 3)) {
    const nudge =
      userMessage +
      '\n\nIMPORTANT: You have already asked enough check questions. Do not ask another. Reply now with stage="actions", a short warm intro in "say", "question": "", and 3 to 5 items in "actions".' +
      (isTopic ? ' Also fill "books" with up to 3 books, or [].' : "");
    try {
      const retry = await callGroq(apiKey, nudge);
      const raw2 = JSON.parse(retry?.choices?.[0]?.message?.content || "{}");
      const out2 = coerce(raw2);
      if (out2.stage === "actions" && out2.actions.length >= 3) out = out2;
    } catch {
      // fall through to the fallback below
    }
  }
  if (needActions && (out.stage !== "actions" || out.actions.length < 3)) {
    out = {
      ...out,
      stage: "actions",
      question: "",
      actions: fallbackActions(sessionGoal),
    };
  }

  return NextResponse.json(out);
}
