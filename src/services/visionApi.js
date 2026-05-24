import { MOCK_AI_RESULT } from '../data/mockData.js'

// ─── Vision API Service ───────────────────────────────────────────────────────
// In production this calls Anthropic / GPT-4o Vision.
// For MVP, we return deterministic mock data with a realistic delay.

/**
 * analyseImage — simulates the AI vision tagging call (PRD §6.1)
 * Returns a structured tag object matching the PRD schema.
 *
 * @param {File} imageFile — the uploaded file (unused in mock)
 * @returns {Promise<Object>} tag object
 */
export async function analyseImage(imageFile) {
  // Simulate network latency (1.5–2.5s)
  const delay = 1500 + Math.random() * 1000
  await new Promise((resolve) => setTimeout(resolve, delay))

  // Simulate rare failure (5% chance) for error-state demo
  if (Math.random() < 0.05) {
    throw new Error('image_unreadable')
  }

  return { ...MOCK_AI_RESULT }
}

/**
 * buildTagsFromResult — converts raw AI result into editable tag array
 * suitable for the TagReview component.
 */
export function buildTagsFromResult(aiResult) {
  const tags = []

  tags.push({
    id: 'category',
    key: 'category',
    label: `${aiResult.category}`,
    groupLabel: 'Category',
    value: aiResult.category,
    confidence: aiResult.confidence.category,
    mandatory: true,
  })

  aiResult.colours.forEach((colour, i) => {
    tags.push({
      id: `colour-${i}`,
      key: 'colour',
      label: colour,
      groupLabel: 'Colour',
      value: colour,
      confidence: aiResult.confidence.colours,
      mandatory: i === 0,
    })
  })

  if (aiResult.brand) {
    tags.push({
      id: 'brand',
      key: 'brand',
      label: `${aiResult.brand}`,
      groupLabel: 'Brand',
      value: aiResult.brand,
      confidence: aiResult.confidence.brand,
      mandatory: false,
    })
  }

  tags.push({
    id: 'condition',
    key: 'condition',
    label: `${aiResult.condition}`,
    groupLabel: 'Condition',
    value: aiResult.condition,
    confidence: 0.97,
    mandatory: false,
  })

  tags.push({
    id: 'description',
    key: 'description',
    label: aiResult.description,
    groupLabel: 'Description',
    value: aiResult.description,
    confidence: aiResult.confidence.overall,
    mandatory: false,
    isDescription: true,
  })

  return tags
}
