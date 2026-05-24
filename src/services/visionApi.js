// ─── Vision API — Gemini 1.5 Flash (REST v1, no SDK) ─────────────────────────
//
// Strict rules applied:
//  1. fileToBase64 strips the data URI prefix, sends ONLY raw base64
//  2. Payload uses official v1 format — system prompt merged into user text
//  3. MIME type detected from file.type, explicit fallback to image/jpeg
//  4. safetySettings all set to BLOCK_NONE for campus lost-property use
//  5. Raw Gemini response logged to console for debugging
//
// Required: VITE_GEMINI_API_KEY in .env.local

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'

// ─── Safety settings — BLOCK_NONE for all categories ─────────────────────────
// Prevents Gemini refusing to analyse wallets, IDs, medication, etc.
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_NONE' },
]

// ─── Combined prompt (system + task merged into one user message) ─────────────
// systemInstruction is v1beta-only and causes 400s on the stable v1 endpoint.
// Merging everything into a single user text part is the correct v1 pattern.
const PROMPT = `You are a lost-property tagging assistant for a university campus.
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
  "verificationQuestion": "<a question only the true owner could answer — pick a non-obvious detail from the photo such as a sticker, engraving, internal colour, or charm>",
  "verificationAnswer": "<the answer to the verification question as visible in the photo>",
  "confidence": {
    "category": <float 0.0–1.0>,
    "colours":  <float 0.0–1.0>,
    "brand":    <float 0.0–1.0>,
    "overall":  <float 0.0–1.0>
  }
}

If the image is too dark or blurry to analyse, return exactly:
{ "error": "image_unreadable" }`

// ─── fileToBase64 ─────────────────────────────────────────────────────────────
/**
 * Reads a File/Blob and returns ONLY the raw base64 string.
 * Strictly strips everything before and including the comma in the data URI:
 *   "data:image/jpeg;base64,/9j/4AAQ..."  →  "/9j/4AAQ..."
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`FileReader failed: ${reader.error?.message}`))
    reader.onload  = () => {
      const dataUrl = reader.result          // "data:image/jpeg;base64,<data>"
      const comma   = dataUrl.indexOf(',')   // find the comma separator
      if (comma === -1) {
        reject(new Error('FileReader produced an unexpected data URL format.'))
        return
      }
      resolve(dataUrl.slice(comma + 1))      // everything AFTER the comma
    }
    reader.readAsDataURL(file)
  })
}

// ─── MIME type detection ──────────────────────────────────────────────────────
/**
 * Returns the MIME type Gemini should use for this image.
 * Gemini v1 accepts: image/jpeg, image/png, image/webp, image/heic, image/heif
 * Falls back to image/jpeg for anything unrecognised (e.g. HEIC from iOS).
 */
function detectMimeType(file) {
  const supported = {
    'image/jpeg': 'image/jpeg',
    'image/jpg':  'image/jpeg',
    'image/png':  'image/png',
    'image/webp': 'image/webp',
    'image/heic': 'image/heic',
    'image/heif': 'image/heif',
  }
  const mime = supported[file.type?.toLowerCase()]
  if (!mime) {
    console.warn(`[visionApi] Unrecognised MIME type "${file.type}" — falling back to image/jpeg`)
  }
  return mime || 'image/jpeg'
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

// ─── analyseImage — main export ───────────────────────────────────────────────
/**
 * Calls Gemini 1.5 Flash with the image file.
 * Throws with a human-readable message on every failure — no mock fallback.
 *
 * @param   {File}   imageFile  Browser File from <input> or captureFrame()
 * @returns {object}            Validated PRD §6.1 result object
 * @throws  {Error}             Human-readable — safe to display directly in the UI
 */
export async function analyseImage(imageFile) {
  // 1. Guard: key must exist
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Missing API key.\nAdd VITE_GEMINI_API_KEY=your_key to .env.local and restart the dev server.'
    )
  }

  // 2. Convert image — raw base64 only, no data URI prefix
  console.log('[visionApi] Converting image…', { name: imageFile.name, type: imageFile.type, size: imageFile.size })
  const base64Data = await fileToBase64(imageFile)
  const mimeType   = detectMimeType(imageFile)
  console.log('[visionApi] Image ready.', { mimeType, base64Length: base64Data.length })

  // 3. Build request payload — official Gemini v1 structure
  const payload = {
    contents: [
      {
        parts: [
          // Text prompt first (system + task merged)
          { text: PROMPT },
          // Image inline — raw base64, correct MIME type
          {
            inline_data: {
              mime_type: base64Data ? mimeType : 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
   generationConfig: {
      temperature:     0.1,
      topP:            0.8,
      topK:            40,
      maxOutputTokens: 512,
      // Removed response_mime_type because it is causing 400 errors
    },
    safetySettings: SAFETY_SETTINGS,
  }

  console.log('[visionApi] Sending request to Gemini v1…', {
    url: GEMINI_URL,
    mimeType,
    promptLength: PROMPT.length,
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

  // 5. Log and handle HTTP errors
  const responseText = await response.text()
  console.log('[visionApi] Raw Gemini response:', response.status, responseText)

  if (!response.ok) {
    let detail = responseText
    try {
      const errJson = JSON.parse(responseText)
      detail = errJson?.error?.message || responseText
    } catch { /* keep raw text */ }

    if (response.status === 400) throw new Error(`Gemini 400 Bad Request: ${detail}`)
    if (response.status === 403) throw new Error(`Gemini 403 — invalid API key or permission denied.\n${detail}`)
    if (response.status === 404) throw new Error(`Gemini 404 — model not found at:\n${GEMINI_URL}\n${detail}`)
    if (response.status === 429) throw new Error(`Gemini 429 — rate limit hit. Wait a moment and try again.\n${detail}`)
    throw new Error(`Gemini ${response.status}: ${detail}`)
  }

  // 6. Parse response envelope
  let envelope
  try {
    envelope = JSON.parse(responseText)
  } catch {
    throw new Error(`Could not parse Gemini response as JSON.\nRaw: ${responseText.slice(0, 300)}`)
  }

  // 7. Extract text from first candidate
  const finishReason = envelope?.candidates?.[0]?.finishReason
  const rawText      = envelope?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  console.log('[visionApi] Candidate text:', rawText, '| finishReason:', finishReason)

  if (!rawText) {
    throw new Error(
      finishReason === 'SAFETY'
        ? 'Gemini blocked this image for safety reasons. BLOCK_NONE is set — check the safetyRatings in the console.'
        : `Gemini returned no content (finishReason: ${finishReason ?? 'unknown'}).`
    )
  }

  // 8. Parse the JSON the model returned
  // Strip any stray markdown fences just in case
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Gemini response was not valid JSON.\nRaw model output: ${rawText.slice(0, 300)}`)
  }

  // 9. Model-reported unreadable image
  if (parsed?.error === 'image_unreadable') {
    throw new Error('Image is too dark or blurry to analyse. Retake the photo with better lighting.')
  }

  // 10. Validate schema and return
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
