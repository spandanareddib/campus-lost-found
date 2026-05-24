// ─── Vision API — Gemini 1.5 Flash (REST, stable v1) ─────────────────────────
//
// Pure fetch against the stable v1 endpoint. No SDK. No mock fallback.
// All errors throw so the upload flow shows real failure messages in the UI.
//
// Required env var (in .env.local):
//   VITE_GEMINI_API_KEY=AIzaSy...
//
// Get a free key at: https://aistudio.google.com/app/apikey

// ─── Hardcoded stable endpoint — do NOT change to v1beta ─────────────────────
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'

// ─── PRD §6.1 prompts ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
  `You are a lost-property tagging assistant for a university campus.
Your job is to analyse photos of found items and return a structured JSON object.
Be concise, accurate, and objective. Do not guess — use "unknown" if unsure.
Return ONLY valid JSON. No prose, no markdown, no explanation.`

const USER_PROMPT =
  `Analyse this photo of a found item and return a JSON object with this exact structure:

{
  "category": "<one of: bag, electronics, clothing, keys, stationery, book, water_bottle, jewellery, id_card, sports_equipment, umbrella, headphones, wallet, other>",
  "colours": ["<primary colour>", "<secondary colour if present>"],
  "brand": "<brand name if clearly visible, else null>",
  "condition": "<one of: good, damaged, dirty, unknown>",
  "description": "<one plain-English sentence describing the item, max 20 words>",
  "verificationQuestion": "<a question only the true owner could answer — a non-obvious detail from the photo such as a sticker, engraving, internal colour, or keychain>",
  "verificationAnswer": "<the answer to the verification question, extracted from the photo>",
  "confidence": {
    "category": <float 0.0–1.0>,
    "colours":  <float 0.0–1.0>,
    "brand":    <float 0.0–1.0>,
    "overall":  <float 0.0–1.0>
  }
}

Rules:
- colours: use common English colour names only (red, navy, black, silver, etc.)
- brand: only if a logo or text is clearly legible — otherwise null
- description: start with the category noun e.g. "Navy drawstring bag with a white Adidas logo."
- verificationQuestion: pick a detail NOT mentioned in the description
- If the image is too dark or blurry to analyse, return exactly: { "error": "image_unreadable" }`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a File/Blob to a raw Base64 string (no data-URL prefix). */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Could not read image file.'))
    reader.readAsDataURL(file)
  })
}

/** Map file.type to one of the MIME types Gemini accepts. */
function toGeminiMime(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  return allowed.includes(file.type) ? file.type : 'image/jpeg'
}

/** Strip ```json ... ``` fences Gemini occasionally adds despite instructions. */
function stripFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
}

/** Clamp a value to [0, 1], defaulting to 0.5 if not a number. */
const clamp01 = (v) => (typeof v === 'number' ? Math.min(1, Math.max(0, v)) : 0.5)

/**
 * Validate and normalise the raw object Gemini returned against the PRD §6.1
 * schema. Throws descriptive errors so the UI can show them directly.
 */
function validateResult(raw) {
  const VALID_CATEGORIES = [
    'bag', 'electronics', 'clothing', 'keys', 'stationery', 'book',
    'water_bottle', 'jewellery', 'id_card', 'sports_equipment',
    'umbrella', 'headphones', 'wallet', 'other',
  ]
  const VALID_CONDITIONS = ['good', 'damaged', 'dirty', 'unknown']

  if (!raw || typeof raw !== 'object') {
    throw new Error('Gemini returned an unexpected response format.')
  }

  const category  = VALID_CATEGORIES.includes(raw.category)  ? raw.category  : 'other'
  const condition = VALID_CONDITIONS.includes(raw.condition)  ? raw.condition : 'unknown'

  const colours =
    Array.isArray(raw.colours) && raw.colours.length > 0
      ? raw.colours.filter((c) => typeof c === 'string').slice(0, 4)
      : ['unknown']

  const brand =
    typeof raw.brand === 'string' && raw.brand.trim() !== '' ? raw.brand.trim() : null

  const confidence = {
    category: clamp01(raw.confidence?.category),
    colours:  clamp01(raw.confidence?.colours),
    brand:    brand ? clamp01(raw.confidence?.brand) : 0,
    overall:  clamp01(raw.confidence?.overall),
  }

  return {
    category,
    colours,
    brand,
    condition,
    description:
      typeof raw.description === 'string'
        ? raw.description.slice(0, 200)
        : 'Unidentified item.',
    verificationQuestion:
      typeof raw.verificationQuestion === 'string'
        ? raw.verificationQuestion.slice(0, 300)
        : 'Describe a unique feature of this item.',
    verificationAnswer:
      typeof raw.verificationAnswer === 'string'
        ? raw.verificationAnswer.slice(0, 200)
        : '',
    confidence,
  }
}

// ─── analyseImage ─────────────────────────────────────────────────────────────
/**
 * Calls Gemini 1.5 Flash with the image and PRD §6.1 prompts.
 * Throws on every failure — no mock fallback — so real errors surface in the UI.
 *
 * @param   {File}   imageFile  Browser File from <input> or captureFrame()
 * @returns {object}            Validated PRD §6.1 result
 * @throws  {Error}             Human-readable message the UI can display directly
 */
export async function analyseImage(imageFile) {
  // ── Guard: API key must be present ──────────────────────────────────────────
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'No Gemini API key found.\n' +
      'Add VITE_GEMINI_API_KEY=your_key to .env.local and restart the dev server.'
    )
  }

  // ── Convert image ────────────────────────────────────────────────────────────
  const base64Data = await fileToBase64(imageFile)
  const mimeType   = toGeminiMime(imageFile)

  // ── Request body ─────────────────────────────────────────────────────────────
  // systemInstruction is v1beta-only and causes a 400 on the stable v1 endpoint.
  // Instead we prepend the system prompt as the first text part — functionally identical.
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: SYSTEM_PROMPT },
          { inlineData: { mimeType, data: base64Data } },
          { text: USER_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature:      0.1,
      topP:             0.8,
      topK:             40,
      maxOutputTokens:  512,
      responseMimeType: 'application/json',
    },
  }

  // ── Fetch ────────────────────────────────────────────────────────────────────
  let response
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch (networkErr) {
    throw new Error(`Network error — could not reach Gemini API. (${networkErr.message})`)
  }

  // ── HTTP error handling ───────────────────────────────────────────────────────
  if (!response.ok) {
    let detail = ''
    try {
      const errJson = await response.json()
      detail = errJson?.error?.message || JSON.stringify(errJson)
    } catch {
      detail = await response.text().catch(() => '')
    }

    switch (response.status) {
      case 400:
        throw new Error(`Bad request (400): ${detail}`)
      case 403:
        throw new Error(
          `API key rejected (403). Check VITE_GEMINI_API_KEY is correct and has Gemini API enabled.\n${detail}`
        )
      case 404:
        throw new Error(
          `Model not found (404). Endpoint: ${GEMINI_URL}\n${detail}`
        )
      case 429:
        throw new Error(`Rate limit exceeded (429). Wait a moment and try again.\n${detail}`)
      default:
        throw new Error(`Gemini API error ${response.status}: ${detail}`)
    }
  }

  // ── Parse envelope ────────────────────────────────────────────────────────────
  let envelope
  try {
    envelope = await response.json()
  } catch {
    throw new Error('Gemini returned a response that could not be parsed as JSON.')
  }

  // ── Extract text from first candidate ────────────────────────────────────────
  const finishReason = envelope?.candidates?.[0]?.finishReason
  const rawText      = envelope?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!rawText) {
    throw new Error(
      finishReason === 'SAFETY'
        ? 'Gemini blocked this image for safety reasons. Try a different photo.'
        : `Gemini returned an empty response (finishReason: ${finishReason || 'unknown'}).`
    )
  }

  // ── Parse JSON payload ────────────────────────────────────────────────────────
  let parsed
  try {
    parsed = JSON.parse(stripFences(rawText))
  } catch {
    throw new Error(
      `Gemini response was not valid JSON.\nRaw response: ${rawText.slice(0, 200)}`
    )
  }

  // ── Model-reported error ──────────────────────────────────────────────────────
  if (parsed?.error === 'image_unreadable') {
    throw new Error(
      'Image is too dark or blurry to analyse. Try retaking the photo with better lighting.'
    )
  }

  // ── Validate schema and return ────────────────────────────────────────────────
  return validateResult(parsed)
}

// ─── buildTagsFromResult ──────────────────────────────────────────────────────
/**
 * Converts a validated PRD §6.1 result into the tag-chip array
 * consumed by the TagReview component.
 *
 * @param   {object} aiResult  Return value of analyseImage()
 * @returns {Array}            Tag objects for TagReview
 */
export function buildTagsFromResult(aiResult) {
  const tags = []

  tags.push({
    id: 'category', key: 'category',
    label: aiResult.category, groupLabel: 'Category',
    value: aiResult.category,
    confidence: aiResult.confidence.category,
    mandatory: true,
  })

  aiResult.colours.forEach((colour, i) => {
    tags.push({
      id: `colour-${i}`, key: 'colour',
      label: colour, groupLabel: 'Colour',
      value: colour,
      confidence: aiResult.confidence.colours,
      mandatory: i === 0,
    })
  })

  if (aiResult.brand) {
    tags.push({
      id: 'brand', key: 'brand',
      label: aiResult.brand, groupLabel: 'Brand',
      value: aiResult.brand,
      confidence: aiResult.confidence.brand,
      mandatory: false,
    })
  }

  tags.push({
    id: 'condition', key: 'condition',
    label: aiResult.condition, groupLabel: 'Condition',
    value: aiResult.condition,
    confidence: 0.97,
    mandatory: false,
  })

  tags.push({
    id: 'description', key: 'description',
    label: aiResult.description, groupLabel: 'Description',
    value: aiResult.description,
    confidence: aiResult.confidence.overall,
    mandatory: false,
    isDescription: true,
  })

  return tags
}
