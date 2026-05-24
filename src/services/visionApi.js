// ─── Vision API — Gemini 1.5 Flash (REST v1beta, no SDK) ─────────────────────
//
//  1. fileToBase64 strips the data URI prefix — sends ONLY raw base64
//  2. All payload keys in snake_case (stops the 400 errors we had)
//  3. MIME type detected from file.type, explicit fallback to image/jpeg
//  4. safety_settings all BLOCK_NONE — prevents refusals on wallets, IDs, etc.
//  5. response_mime_type removed from generation_config (caused versioning issues)
//  6. Raw Gemini response console.log kept for debugging
//
// Required: VITE_GEMINI_API_KEY=your_key in .env.local

// v1beta — gemini-1.5-flash-latest lives here.
// The stable v1 endpoint returns 404 for this model alias.
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

// ─── Safety settings — all BLOCK_NONE ────────────────────────────────────────
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
]

// ─── Prompt (system + task merged into one user turn) ─────────────────────────
const PROMPT =
`You are a lost-property tagging assistant for a university campus.
Analyse photos of found items and return structured JSON only.
Be concise and objective. Use "unknown" when unsure.
Return ONLY valid JSON — no markdown, no prose, no code fences.

Return this exact JSON structure:

{
  "category": "<one of: bag, electronics, clothing, keys, stationery, book, water_bottle, jewellery, id_card, sports_equipment, umbrella, headphones, wallet, other>",
  "colours": ["<primary colour>", "<secondary colour if present>"],
  "brand": "<brand name if clearly legible, else null>",
  "condition": "<one of: good, damaged, dirty, unknown>",
  "description": "<one plain-English sentence, max 20 words, starting with the category noun>",
  "verificationQuestion": "<a question only the true owner could answer — pick a non-obvious detail: sticker, engraving, internal colour, charm, etc.>",
  "verificationAnswer": "<the answer to the verification question as visible in the photo>",
  "confidence": {
    "category": <float 0.0-1.0>,
    "colours":  <float 0.0-1.0>,
    "brand":    <float 0.0-1.0>,
    "overall":  <float 0.0-1.0>
  }
}

If the image is too dark or blurry to analyse, return exactly:
{ "error": "image_unreadable" }`

// ─── fileToBase64 ─────────────────────────────────────────────────────────────
// Uses indexOf+slice — more robust than split(',')[1] for edge-case data URLs.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`FileReader failed: ${reader.error?.message}`))
    reader.onload  = () => {
      const dataUrl = reader.result
      const comma   = dataUrl.indexOf(',')
      if (comma === -1) {
        reject(new Error('FileReader produced an unexpected data URL (no comma found).'))
        return
      }
      resolve(dataUrl.slice(comma + 1))  // raw base64 only — no "data:...;base64," prefix
    }
    reader.readAsDataURL(file)
  })
}

// ─── MIME type detection ──────────────────────────────────────────────────────
function detectMimeType(file) {
  const map = {
    'image/jpeg': 'image/jpeg',
    'image/jpg':  'image/jpeg',
    'image/png':  'image/png',
    'image/webp': 'image/webp',
    'image/heic': 'image/heic',
    'image/heif': 'image/heif',
  }
  const resolved = map[file.type?.toLowerCase()]
  if (!resolved) {
    console.warn(`[visionApi] Unknown MIME type "${file.type}" — using image/jpeg`)
  }
  return resolved || 'image/jpeg'
}

// ─── Schema validation ────────────────────────────────────────────────────────
const clamp = (v) => (typeof v === 'number' ? Math.min(1, Math.max(0, v)) : 0.5)

function validateResult(raw) {
  const VALID_CATEGORIES = [
    'bag','electronics','clothing','keys','stationery','book',
    'water_bottle','jewellery','id_card','sports_equipment',
    'umbrella','headphones','wallet','other',
  ]
  const VALID_CONDITIONS = ['good','damaged','dirty','unknown']

  const category  = VALID_CATEGORIES.includes(raw.category)  ? raw.category  : 'other'
  const condition = VALID_CONDITIONS.includes(raw.condition)  ? raw.condition : 'unknown'
  const colours   = Array.isArray(raw.colours) && raw.colours.length > 0
    ? raw.colours.filter((c) => typeof c === 'string').slice(0, 4)
    : ['unknown']
  const brand = typeof raw.brand === 'string' && raw.brand.trim() ? raw.brand.trim() : null

  return {
    category,
    colours,
    brand,
    condition,
    description:
      typeof raw.description === 'string' ? raw.description.slice(0, 200) : 'Unidentified item.',
    verificationQuestion:
      typeof raw.verificationQuestion === 'string'
        ? raw.verificationQuestion.slice(0, 300)
        : 'Describe a unique feature of this item.',
    verificationAnswer:
      typeof raw.verificationAnswer === 'string' ? raw.verificationAnswer.slice(0, 200) : '',
    confidence: {
      category: clamp(raw.confidence?.category),
      colours:  clamp(raw.confidence?.colours),
      brand:    brand ? clamp(raw.confidence?.brand) : 0,
      overall:  clamp(raw.confidence?.overall),
    },
  }
}

// ─── analyseImage ─────────────────────────────────────────────────────────────
/**
 * Calls Gemini 1.5 Flash with the image.
 * Throws with a human-readable message on every failure — no mock fallback.
 *
 * @param   {File}   imageFile  Browser File from <input> or captureFrame()
 * @returns {object}            Validated PRD §6.1 result
 * @throws  {Error}             Human-readable, safe to show directly in the UI
 */
export async function analyseImage(imageFile) {
  // 1. Guard: key must be present
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      'Missing API key.\nAdd VITE_GEMINI_API_KEY=your_key to .env.local and restart the dev server.'
    )
  }

  // 2. Convert image to raw base64
  console.log('[visionApi] Converting image…', {
    name: imageFile.name,
    type: imageFile.type,
    size: imageFile.size,
  })
  const base64Data = await fileToBase64(imageFile)
  const mimeType   = detectMimeType(imageFile)
  console.log('[visionApi] Image ready.', { mimeType, base64Length: base64Data.length })

  // 3. Build payload — all keys in snake_case for v1beta compatibility
  const payload = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    // snake_case keys — camelCase generationConfig causes 400 on v1beta
    generation_config: {
      temperature:      0.1,
      top_p:            0.8,
      top_k:            40,
      max_output_tokens: 512,
      // response_mime_type intentionally omitted — caused versioning conflicts
    },
    safety_settings: SAFETY_SETTINGS,
  }

  console.log('[visionApi] Sending to Gemini v1beta…', {
    url: GEMINI_URL,
    mimeType,
    base64Length: base64Data.length,
  })

  // 4. Fetch
  let response
  try {
    response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch (networkErr) {
    throw new Error(`Network error — could not reach Gemini.\n${networkErr.message}`)
  }

  // 5. Read response body once, log it raw for debugging
  const responseText = await response.text()
  console.log('[visionApi] Raw Gemini response:', response.status, responseText)

  // 6. Handle HTTP errors — extract Google's error message where possible
  if (!response.ok) {
    let detail = responseText
    try {
      detail = JSON.parse(responseText)?.error?.message || responseText
    } catch { /* keep raw text */ }

    if (response.status === 400) throw new Error(`Gemini 400 Bad Request: ${detail}`)
    if (response.status === 403) throw new Error(`Gemini 403 — check your API key.\n${detail}`)
    if (response.status === 404) throw new Error(`Gemini 404 — model not found.\nURL: ${GEMINI_URL}\n${detail}`)
    if (response.status === 429) throw new Error(`Gemini 429 — rate limit. Wait a moment and retry.\n${detail}`)
    throw new Error(`Gemini ${response.status}: ${detail}`)
  }

  // 7. Parse response envelope
  let envelope
  try {
    envelope = JSON.parse(responseText)
  } catch {
    throw new Error(`Could not parse Gemini response as JSON.\nRaw: ${responseText.slice(0, 300)}`)
  }

  // 8. Extract text from first candidate
  const finishReason = envelope?.candidates?.[0]?.finishReason
  const rawText      = envelope?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  console.log('[visionApi] Candidate text:', rawText, '| finishReason:', finishReason)

  if (!rawText) {
    throw new Error(
      finishReason === 'SAFETY'
        ? 'Gemini blocked this image for safety reasons (BLOCK_NONE is set — check safetyRatings in console).'
        : `Gemini returned no content. finishReason: ${finishReason ?? 'unknown'}`
    )
  }

  // 9. Strip any stray markdown fences and parse the JSON
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Gemini response was not valid JSON.\nRaw: ${rawText.slice(0, 300)}`)
  }

  // 10. Model-reported image error
  if (parsed?.error === 'image_unreadable') {
    throw new Error('Image is too dark or blurry. Retake with better lighting.')
  }

  // 11. Validate schema and return
  return validateResult(parsed)
}

// ─── buildTagsFromResult ──────────────────────────────────────────────────────
/**
 * Converts a validated analyseImage() result into the tag-chip array
 * consumed by the TagReview component.
 */
export function buildTagsFromResult(aiResult) {
  const tags = []

  tags.push({
    id: 'category', key: 'category', groupLabel: 'Category',
    label: aiResult.category, value: aiResult.category,
    confidence: aiResult.confidence.category, mandatory: true,
  })

  aiResult.colours.forEach((colour, i) => {
    tags.push({
      id: `colour-${i}`, key: 'colour', groupLabel: 'Colour',
      label: colour, value: colour,
      confidence: aiResult.confidence.colours, mandatory: i === 0,
    })
  })

  if (aiResult.brand) {
    tags.push({
      id: 'brand', key: 'brand', groupLabel: 'Brand',
      label: aiResult.brand, value: aiResult.brand,
      confidence: aiResult.confidence.brand, mandatory: false,
    })
  }

  tags.push({
    id: 'condition', key: 'condition', groupLabel: 'Condition',
    label: aiResult.condition, value: aiResult.condition,
    confidence: 0.97, mandatory: false,
  })

  tags.push({
    id: 'description', key: 'description', groupLabel: 'Description',
    label: aiResult.description, value: aiResult.description,
    confidence: aiResult.confidence.overall, mandatory: false, isDescription: true,
  })

  return tags
}
