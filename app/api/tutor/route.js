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
const MAX_INPUT = 6000;
const MAX_EXPLAIN_TURNS = 10;
const LIMITS = { free: 10, plus: 30 };

/* Strict JSON schema — the model is guaranteed to answer in this shape. */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    stage: { type: "string", enum: ["explain", "check", "actions"] },
    say: { type: "string" },
    question: { type: "string" },
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
  },
  required: ["stage", "say", "question", "actions"],
  additionalProperties: false,
};

const EXPLAIN_FALLBACK_Q = "Can you put that idea into your own words?";
const CHECK_FALLBACK_Q = "In your own words, what is the main idea of the passage?";

const EXPLAIN_DIRECTIVES = ["start", "got_it", "diff", "example", "reply"];

function directiveText(directive, checkAnswers) {
  switch (directive) {
    case "start":
      return 'BEGIN. Give the reader the first small chunk (3 to 5 sentences) in plain words, with exactly one everyday comparison. Then ask ONE guiding question. stage = "explain", actions = [].';
    case "got_it":
      return 'The reader tapped "Got it". Move to the NEXT small chunk (3 to 5 sentences, one everyday comparison), then ask ONE guiding question. stage = "explain", actions = [].';
    case "diff":
      return 'The reader tapped "Explain differently". Explain the SAME idea again in a genuinely different way — a different angle and a different everyday comparison than before. Never repeat earlier wording. 3 to 5 sentences, then ONE guiding question. stage = "explain", actions = [].';
    case "example":
      return 'The reader tapped "Give me an example". Give a concrete everyday example that makes the idea real, and make it different from anything said before. 3 to 5 sentences, then ONE guiding question. stage = "explain", actions = [].';
    case "reply":
      return "The reader replied in their own words. Respond to them directly. If they seem unsure, clarify simply with one everyday comparison (3 to 5 sentences). If they show they understood, gently confirm and move to the next small chunk. End with ONE guiding question. stage = \"explain\", actions = [].";
    case "begin_checks":
      return 'The reader tapped "I understand". Ask the FIRST of 2 to 3 short check questions to see whether they really got it. Ask only ONE question and do NOT answer it. stage = "check", actions = [].';
    case "check_answer": {
      const feedback =
        "First give brief, specific, encouraging feedback on the reader's answer (1 to 2 sentences).";
      if (checkAnswers < 2)
        return `${feedback} You MUST ask another short check question now — do NOT give the actions yet. stage = "check", actions = [].`;
      if (checkAnswers === 2)
        return `${feedback} Then either ask ONE final short check question, or, if you are satisfied, give the actions now. If you give the actions, stage = "actions" and fill the actions array with 3 to 5 items; otherwise stage = "check", actions = [].`;
      return `${feedback} You MUST now give the actions. stage = "actions", and fill the actions array with 3 to 5 small, specific things the reader can do this week.`;
    }
    default:
      return 'Continue teaching in small chunks with one guiding question. stage = "explain", actions = [].';
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

function buildUserMessage(p) {
  const profile = p.profile || {};
  const clean = (v, fallback = "not shared") =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  return [
    "You are the Bibliosage tutor — a patient, plain-speaking reading companion.",
    "",
    "YOUR ONE SOURCE",
    "You work ONLY from the text the reader pasted below. Never claim the text says something it does not. If a question needs something the text does not contain, say so plainly. If the text is too short or too unclear to teach from, say so and ask the reader to paste a little more.",
    "",
    "HOW YOU TEACH",
    "- Explain in small chunks of 3 to 5 sentences. Plain, everyday words. No jargon.",
    "- Use exactly ONE everyday comparison in each chunk (something from ordinary life).",
    "- After each chunk, ask ONE guiding question. Never ask two questions at once. Put that single question in the \"question\" field and end it with a question mark.",
    '- "Explain differently" must re-explain the same idea in a genuinely different way — a different angle and a different comparison. Never repeat earlier wording.',
    '- "Give me an example" must give a genuinely different, concrete everyday example. Never repeat earlier wording.',
    "- A session has at most 10 teaching replies, so make each one count.",
    "- Check-question phase: ask short questions one at a time and give brief, specific, encouraging feedback on each answer.",
    "- Actions: give 3 to 5 small, specific things the reader can really do this week, shaped by their life, what they are working toward, what blocks them, and what they wanted to gain.",
    "",
    "SAFETY",
    "- This is learning support only. It is not medical, legal or financial advice. If asked for such advice, say so gently and offer to help with the text instead.",
    "- If the reader asks for anything unsafe or harmful, refuse politely and stay on learning from the text.",
    "- Never invent quotes or facts that are not in the text.",
    "",
    "THE READER",
    `Day-to-day life: ${clean(profile.life)}`,
    `Working toward: ${clean(profile.goal)}`,
    `What stops them applying what they learn: ${clean(profile.blocker)}`,
    `What they want to gain from this session: ${clean(p.sessionGoal)}`,
    "",
    "THE PASTED TEXT (the only source you may teach from)",
    '"""',
    p.inputText,
    '"""',
    "",
    "CONVERSATION SO FAR",
    renderHistory(p.history),
    "",
    "CURRENT TASK",
    directiveText(p.directive, p.checkAnswers),
    "",
    'Reply with JSON only, matching the schema: {"stage": "explain" | "check" | "actions", "say": "...", "question": "...", "actions": [{"title": "...", "body": "..."}]}. Put the explanation (or your feedback on an answer) in "say". Put the ONE guiding/check question in "question", ending with a question mark. Use stage "explain" while teaching, "check" while asking check questions, and "actions" ONLY for the final real-life actions (then fill the actions array, set "question" to "", and otherwise leave the actions array empty).',
  ].join("\n");
}

async function callGroq(apiKey, userMessage) {
  const makeBody = (extra) => ({
    model: MODEL,
    messages: [{ role: "user", content: userMessage }],
    temperature: 0.6,
    max_completion_tokens: 1500,
    response_format: {
      type: "json_schema",
      json_schema: { name: "tutor_reply", strict: true, schema: RESPONSE_SCHEMA },
    },
    ...extra,
  });

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

  let res = await send(makeBody({ reasoning_effort: "low", include_reasoning: false }));
  if (res.status === 400) {
    // Some deployments reject the reasoning knobs — retry without them.
    res = await send(makeBody({}));
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
  const inputText = typeof body.inputText === "string" ? body.inputText : "";
  const sessionGoal =
    typeof body.sessionGoal === "string" ? body.sessionGoal.slice(0, 500) : "";
  const history = Array.isArray(body.history) ? body.history.slice(-40) : [];
  const explainTurns = Number.isFinite(body.explainTurns)
    ? Math.max(0, Math.floor(body.explainTurns))
    : 0;
  const checkAnswers = Number.isFinite(body.checkAnswers)
    ? Math.max(0, Math.floor(body.checkAnswers))
    : 0;

  if (!inputText.trim()) return fail("input", "Paste some text first.", 400);
  if (inputText.length > MAX_INPUT) {
    return fail("input", `Please keep the pasted text to ${MAX_INPUT} characters or fewer.`, 400);
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

  // Plan and profile (missing rows are fine — plan defaults to Free).
  let profile = null;
  let plan = "free";
  try {
    const [pRes, sRes] = await Promise.all([
      supabase.from("profiles").select("life, goal, blocker").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!pRes.error) profile = pRes.data;
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
      say: "We've gone deep on explanations — let's check what you've understood. Tap “I understand” when you're ready.",
      question: "",
      actions: [],
    });
  }

  const userMessage = buildUserMessage({
    directive,
    inputText,
    sessionGoal,
    profile,
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

  let stage = ["explain", "check", "actions"].includes(parsed.stage) ? parsed.stage : "explain";
  let say = typeof parsed.say === "string" ? parsed.say.trim() : "";
  let question = typeof parsed.question === "string" ? parsed.question.trim() : "";
  let actions = Array.isArray(parsed.actions)
    ? parsed.actions
        .filter((a) => a && (a.title || a.body))
        .slice(0, 5)
        .map((a) => ({
          title: String(a.title || "").trim(),
          body: String(a.body || "").trim(),
        }))
    : [];

  if (EXPLAIN_DIRECTIVES.includes(directive)) {
    stage = "explain";
    actions = [];
    if (!question) question = EXPLAIN_FALLBACK_Q;
  }
  if (directive === "begin_checks") {
    stage = "check";
    actions = [];
    if (!question) question = CHECK_FALLBACK_Q;
  }
  if (directive === "check_answer") {
    if (stage === "actions" && actions.length === 0) stage = "check";
    if (stage === "check" && !question) question = CHECK_FALLBACK_Q;
  }
  if (stage === "actions") question = "";
  if (!say && !question) say = "Let's keep going — what did you notice in the text?";

  return NextResponse.json({ stage, say, question, actions });
}
