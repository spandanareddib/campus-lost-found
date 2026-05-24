// ─── Vision API — Gemini 1.5 Flash integration (PRD §6.1) ────────────────────
//
// Calls Google's Gemini 1.5 Flash multimodal model with the exact system prompt
// and JSON schema defined in PRD §6.1.
//
// Environment variable required:
//   VITE_GEMINI_API_KEY=your_key_here   (in .env or .env.local)
//
// Falls back to MOCK_AI_RESULT when:
//   - No API key is configured (local dev without key)
//   - Gemini returns { "error": "image_unreadable" }
//   - Any network / parse error
//
// Usage:
//   import { analyseImage, buildTagsFromResult } from './visionApi.js'
//   const result = await analyseImage(file)   // File object from <input> or captureFrame()
//   const tags   = buildTagsFromResult(result)

import { MOCK_AI_RESULT } from '../data/mockData.js'

// ─── PRD §6.1 — exact prompts ─────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a lost-property tagging assistant for a university campus.
Your job is to analyse photos of found items and return a structured JSON object.
Be concise, accurate, and objective. Do not guess — use "unknown" if unsure.
Return ONLY valid JSON. No prose, no markdown, no explanation.`

const USER_PROMPT = `Analyse this photo of a found item and return a JSON object with this exact structure:

{
  "category": "<one of: bag, electronics, clothing, keys, stationery, book, water_bottle, jewellery, id_card, sports_equipment, umbrella, headphones, wallet, other>",
  "colours": ["<primary colour>", "<secondary colour if present>"],
  "brand": "<brand name if clearly visible, else null>",
  "condition": "<one of: good, damaged, dirty, unknown>",
  "description": "<one plain-English sentence describing the item, max 20 words>",
  "verificationQuestion": "<one question only the true owner could answer, based on a non-obvious detail visible in the photo — e.g. a sticker, keychain, internal colour, or engraving. Must be answerable from the photo.>",
  "verificationAnswer": "<the answer to the verification question, extracted from the photo>",
  "confidence": {
    "category": <float 0.0–1.0>,
    "colours": <float 0.0–1.0>,
    "brand": <float 0.0–1.0>,
    "overall": <float 0.0–1.0>
  }
}

Rules:
- colours: use common English colour names (red, navy, black, silver, etc.)
- brand: only include if a logo or text is clearly legible. Otherwise null.
- description: start with the category noun. E.g. "Navy drawstring bag with a white Adidas logo."
- verificationQuestion: focus on details NOT in the public description — inside colour, a small badge, a crack, a name written inside.
- If the photo is too blurry or dark to analyse, return { "error": "image_unreadable" }`

// ─── Gemini API endpoint ──────────────────────────────────────────────────────
// Using the REST API directly via fetch — no SDK dependency needed.
// Model: gemini-1.5-flash  (fast, cheap, strong vision capabilities)
const GEMINI_MODEL    = 'gemini-1.5-flash'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// ─── File → Base64 data URL ───────────────────────────────────────────────────
/**
 * fileToBase64 — reads a File/Blob and returns the raw Base64 string (no prefix).
 * Gemini's inlineData.data field must be pure Base64, not a data URL.
 *
 * @param {File} file
 * @returns {Promise<string>} raw Base64-encoded bytes
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => {
      // result is "data:<mime>;base64,<data>" — strip the prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })
}

// ─── Normalise MIME type ──────────────────────────────────────────────────────
/**
 * Gemini accepts: image/jpeg, image/png, image/webp, image/heic, image/heif
 * Normalise anything else to image/jpeg as a safe fallback.
 */
function normaliseMimeType(file) {
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  return supported.includes(file.type) ? file.type : 'image/jpeg'
}

// ─── Strip markdown fences from Gemini response ───────────────────────────────
/**
 * Gemini sometimes wraps JSON in ```json ... ``` even when told not to.
 * Strip any markdown code fences before JSON.parse().
 */
function stripMarkdownFences(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
}

// ─── Validate and normalise the parsed AI result ─────────────────────────────
/**
 * validateResult — ensures the parsed object matches the PRD §6.1 schema.
 * Fills in safe defaults for any missing or malformed fields so the rest
 * of the app never receives undefined values.
 *
 * @param {object} raw — parsed JSON from Gemini
 * @returns {object} clean result matching PRD schema
 */
function validateResult(raw) {
  const VALID_CATEGORIES = [
    'bag', 'electronics', 'clothing', 'keys', 'stationery', 'book',
    'water_bottle', 'jewellery', 'id_card', 'sports_equipment',
    'umbrella', 'headphones', 'wallet', 'other',
  ]
  const VALID_CONDITIONS = ['good', 'damaged', 'dirty', 'unknown']

  const category  = VALID_CATEGORIES.includes(raw.category)  ? raw.category  : 'other'
  const condition = VALID_CONDITIONS.includes(raw.condition)  ? raw.condition : 'unknown'

  // colours must be a non-empty array of strings
  const colours = Array.isArray(raw.colours) && raw.colours.length > 0
    ? raw.colours.filter((c) => typeof c === 'string').slice(0, 4)
    : ['unknown']

  // brand: null or non-empty string
  const brand = typeof raw.brand === 'string' && raw.brand.trim() !== ''
    ? raw.brand.trim()
    : null

  // confidence: clamp each field to [0, 1]
  const clamp = (v) => typeof v === 'number' ? Math.min(1, Math.max(0, v)) : 0.5
  const confidence = {
    category: clamp(raw.confidence?.category),
    colours:  clamp(raw.confidence?.colours),
    brand:    brand ? clamp(raw.confidence?.brand) : 0,
    overall:  clamp(raw.confidence?.overall),
  }

  return {
    category,
    colours,
    brand,
    condition,
    description:          typeof raw.description          === 'string' ? raw.description.slice(0, 200)          : 'Unidentified item.',
    verificationQuestion: typeof raw.verificationQuestion === 'string' ? raw.verificationQuestion.slice(0, 300)  : 'Describe a unique feature of this item.',
    verificationAnswer:   typeof raw.verificationAnswer   === 'string' ? raw.verificationAnswer.slice(0, 200)    : '',
    confidence,
  }
}

// ─── Main analyseImage function ───────────────────────────────────────────────
/**
 * analyseImage — calls Gemini 1.5 Flash with the PRD §6.1 prompt + image.
 *
 * If VITE_GEMINI_API_KEY is not set, falls back silently to MOCK_AI_RESULT
 * so the app works in local dev without a key.
 *
 * @param   {File}    imageFile  — browser File object (from input or captureFrame)
 * @returns {Promise<object>}   — validated PRD §6.1 tag object
 * @throws  {Error}             — only for 'image_unreadable'; all others return mock
 */
export async function analyseImage(imageFile) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  // ── No API key: fall back to mock (local dev / demo mode) ──
  if (!apiKey) {
    console.warn(
      '[visionApi] VITE_GEMINI_API_KEY not set — using mock data.\n' +
      'Add VITE_GEMINI_API_KEY=your_key to .env.local to enable real AI tagging.'
    )
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 700))
    return { ...MOCK_AI_RESULT }
  }

  // ── Convert image to Base64 ──
  const base64Data = await fileToBase64(imageFile)
  const mimeType   = normaliseMimeType(imageFile)

  // ── Build Gemini REST request body ──
  // Docs: https://ai.google.dev/api/generate-content#v1beta.models.generateContent
  const requestBody = {
    // System instruction (Gemini 1.5+ supports systemInstruction natively)
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          // Inline image (Base64)
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          // Text prompt
          { text: USER_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature:     0.1,   // low temperature = deterministic, factual output
      topP:            0.8,
      topK:            40,
      maxOutputTokens: 512,   // JSON response is small; 512 is generous
      // Force JSON output via responseMimeType (Gemini 1.5 Flash supports this)
      responseMimeType: 'application/json',
    },
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  let response
  try {
    response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestBody),
    })
  } catch (networkError) {
    console.error('[visionApi] Network error calling Gemini:', networkError)
    // Graceful degradation: return mock so upload flow isn't blocked
    return { ...MOCK_AI_RESULT }
  }

  // ── Handle HTTP errors ──
  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    console.error(`[visionApi] Gemini API error ${response.status}:`, errText)

    if (response.status === 400) {
      // Usually means the image couldn't be processed
      throw new Error('image_unreadable')
    }
    if (response.status === 403) {
      console.error('[visionApi] Invalid or missing API key — check VITE_GEMINI_API_KEY')
    }
    // For all other errors (429 rate limit, 500, etc.), fall back to mock
    return { ...MOCK_AI_RESULT }
  }

  // ── Parse Gemini response envelope ──
  let envelope
  try {
    envelope = await response.json()
  } catch {
    console.error('[visionApi] Failed to parse Gemini response as JSON')
    return { ...MOCK_AI_RESULT }
  }

  // Extract text content from the first candidate
  const rawText = envelope?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!rawText) {
    // Gemini may return finishReason: SAFETY or empty candidate
    const finishReason = envelope?.candidates?.[0]?.finishReason
    console.warn('[visionApi] Empty Gemini response. finishReason:', finishReason)
    return { ...MOCK_AI_RESULT }
  }

  // ── Parse the JSON payload ──
  let parsed
  try {
    parsed = JSON.parse(stripMarkdownFences(rawText))
  } catch {
    console.error('[visionApi] Could not parse Gemini JSON output:', rawText)
    return { ...MOCK_AI_RESULT }
  }

  // ── Handle explicit error response from model ──
  if (parsed?.error === 'image_unreadable') {
    throw new Error('image_unreadable')
  }

  // ── Validate and return ──
  return validateResult(parsed)
}

// ─── buildTagsFromResult ──────────────────────────────────────────────────────
/**
 * buildTagsFromResult — converts a raw PRD §6.1 result object into the editable
 * tag array consumed by the TagReview component.
 *
 * @param   {object}  aiResult  — validated result from analyseImage()
 * @returns {Array}             — tag objects { id, key, label, value, confidence, mandatory }
 */
export function buildTagsFromResult(aiResult) {
  const tags = []

  // Category (mandatory)
  tags.push({
    id:         'category',
    key:        'category',
    label:      aiResult.category,
    groupLabel: 'Category',
    value:      aiResult.category,
    confidence: aiResult.confidence.category,
    mandatory:  true,
  })

  // Colours (first is mandatory)
  aiResult.colours.forEach((colour, i) => {
    tags.push({
      id:         `colour-${i}`,
      key:        'colour',
      label:      colour,
      groupLabel: 'Colour',
      value:      colour,
      confidence: aiResult.confidence.colours,
      mandatory:  i === 0,
    })
  })

  // Brand (optional — only included if Gemini detected one)
  if (aiResult.brand) {
    tags.push({
      id:         'brand',
      key:        'brand',
      label:      aiResult.brand,
      groupLabel: 'Brand',
      value:      aiResult.brand,
      confidence: aiResult.confidence.brand,
      mandatory:  false,
    })
  }

  // Condition
  tags.push({
    id:         'condition',
    key:        'condition',
    label:      aiResult.condition,
    groupLabel: 'Condition',
    value:      aiResult.condition,
    confidence: 0.97,   // condition is determined visually and is usually reliable
    mandatory:  false,
  })

  // Description (full AI-generated sentence)
  tags.push({
    id:           'description',
    key:          'description',
    label:        aiResult.description,
    groupLabel:   'Description',
    value:        aiResult.description,
    confidence:   aiResult.confidence.overall,
    mandatory:    false,
    isDescription: true,
  })

  return tags
}
