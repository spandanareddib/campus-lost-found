// ─── Vision API — Gemini 1.5 Flash (REST v1, no SDK) ─────────────────────────
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_NONE' },
]

const PROMPT = `You are a lost-property tagging assistant for a university campus.
Analyse photos of found items and return structured JSON only.
Return ONLY valid JSON — no markdown, no prose, no code fences.
Structure: { "category": "...", "colours": ["..."], "brand": "...", "condition": "...", "description": "...", "verificationQuestion": "...", "verificationAnswer": "...", "confidence": { "category": 0.9, "colours": 0.9, "brand": 0.9, "overall": 0.9 } }`

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function analyseImage(imageFile) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const base64Data = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  // ALL KEYS CONVERTED TO SNAKE_CASE FOR REST API COMPATIBILITY
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
    generation_config: {
      temperature: 0.1,
      top_p: 0.8,
      top_k: 40,
      max_output_tokens: 512,
      // response_mime_type removed as it causes 400s on some v1 endpoints
    },
    safety_settings: SAFETY_SETTINGS,
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  console.log('[visionApi] Raw Response:', response.status, responseText)

  if (!response.ok) throw new Error(`Gemini Error ${response.status}: ${responseText}`)

  const data = JSON.parse(responseText)
  const rawText = data.candidates[0].content.parts[0].text
  const cleaned = rawText.replace(/```json|```/gi, '').trim()
  return JSON.parse(cleaned)
}

// Helper to match the UI expectations
export function buildTagsFromResult(aiResult) {
  const tags = []
  const addTag = (id, key, label, val, conf, mandatory = false) => 
    tags.push({ id, key, groupLabel: key.charAt(0).toUpperCase() + key.slice(1), label, value: val, confidence: conf || 0.9, mandatory })

  addTag('category', 'category', aiResult.category, aiResult.category, aiResult.confidence?.category, true)
  aiResult.colours?.forEach((c, i) => addTag(`colour-${i}`, 'colour', c, c, aiResult.confidence?.colours, i === 0))
  if (aiResult.brand) addTag('brand', 'brand', aiResult.brand, aiResult.brand, aiResult.confidence?.brand)
  
  tags.push({ id: 'description', key: 'description', label: aiResult.description, value: aiResult.description, isDescription: true })
  return tags
}
