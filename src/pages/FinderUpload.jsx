// ─── FinderUpload — 4-step found-item upload flow (PRD §3.1) ─────────────────

import { useState } from 'react'
import { Check } from 'lucide-react'
import CameraCapture from '../components/finder/CameraCapture.jsx'
import TagReview from '../components/finder/TagReview.jsx'
import LocationPicker from '../components/finder/LocationPicker.jsx'
import SubmitConfirmation from '../components/finder/SubmitConfirmation.jsx'
import { analyseImage, buildTagsFromResult } from '../services/visionApi.js'
import { MOCK_AI_RESULT, CAMPUS_BUILDINGS } from '../data/mockData.js'
import { generateItemId } from '../services/utils.js'
import { findMatches } from '../services/matchEngine.js'
import { Loader2 } from 'lucide-react'

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ['Photo', 'AI Tags', 'Location', 'Done']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-10" role="list" aria-label="Upload steps">
      {STEPS.map((label, i) => {
        const done   = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center" role="listitem">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done   ? 'bg-success text-white'
                  : active ? 'bg-brand-500 text-white shadow-glow scale-110'
                           : 'bg-surface-muted text-ink-disabled'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${
                active ? 'text-brand-600' : done ? 'text-success' : 'text-ink-disabled'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-14 h-px mb-5 mx-1.5 transition-all duration-500 ${i < current ? 'bg-success' : 'bg-surface-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── AI Analysing screen ───────────────────────────────────────────────────────
function AnalysingScreen({ imagePreview }) {
  return (
    <div className="animate-scale-in text-center py-6">
      <div className="relative w-44 h-44 rounded-bento mx-auto mb-8 overflow-hidden bg-surface-subtle">
        {imagePreview
          ? <img src={imagePreview} alt="Uploaded item" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-6xl">🎒</div>
        }
        <div className="absolute inset-0 bg-brand-900/30 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-[3px] border-white/25 border-t-white animate-spin-slow" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <Loader2 size={17} className="text-brand-500 animate-spin" />
        <span className="font-display font-semibold text-brand-900 text-xl">Analysing your photo…</span>
      </div>
      <p className="text-sm text-ink-tertiary mb-7">Identifying category, colour, brand and condition</p>

      <div className="flex justify-center flex-wrap gap-2">
        {['Category', 'Colour', 'Brand', 'Condition', 'Description'].map((lbl, i) => (
          <span
            key={lbl}
            className="text-xs bg-surface-subtle text-ink-tertiary rounded-pill px-3 py-1.5 font-medium animate-pulse"
            style={{ animationDelay: `${i * 0.25}s` }}
          >
            {lbl}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FinderUploadPage({ setPage, addItem, lirs }) {
  const [step,         setStep]         = useState(0)   // 0 photo | 1 analysing | 2 tags | 3 location | 4 done
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [tags,         setTags]         = useState([])
  const [aiResult,     setAiResult]     = useState(null)
  const [location,     setLocation]     = useState({
    building: CAMPUS_BUILDINGS[0],
    floor: 'Ground Floor',
    zone: '',
    foundAt: '',
    notes: '',
  })
  const [submitting,   setSubmitting]   = useState(false)
  const [newItemId,    setNewItemId]    = useState(null)
  const [matchedLirs,  setMatchedLirs]  = useState([])

  async function runAI(file) {
    try {
      const result = await analyseImage(file)
      setAiResult(result)
      setTags(buildTagsFromResult(result))
    } catch {
      setTags([])   // let user add tags manually
    }
    setStep(2)
  }

  function handleImageReady(file, previewUrl) {
    setImageFile(file)
    setImagePreview(previewUrl)
    setStep(1)
    runAI(file)
  }

  async function handleDemo() {
    setImagePreview(null)
    setStep(1)
    await new Promise((r) => setTimeout(r, 2000))
    setAiResult(MOCK_AI_RESULT)
    setTags(buildTagsFromResult(MOCK_AI_RESULT))
    setStep(2)
  }

  async function handleSubmit() {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))

    const itemId = generateItemId()
    const now    = new Date().toISOString()
    const newItem = {
      id: itemId,
      status: 'UNCLAIMED',
      createdAt: now,
      photo: {
        emoji: '🎒',
        color: '#3B5BDB',
        blurredBg: 'from-blue-200 to-indigo-300',
      },
      tags: {
        category:  aiResult?.category || 'other',
        colours:   aiResult?.colours  || ['unknown'],
        brand:     aiResult?.brand    || null,
        condition: aiResult?.condition || 'unknown',
        description: aiResult?.description || 'Unidentified item.',
        customTags:  tags.filter((t) => t.key === 'custom').map((t) => t.value),
        confidence:  aiResult?.confidence || { category: 1, colours: 1, brand: 0, overall: 1 },
        verificationQuestion: aiResult?.verificationQuestion || 'Describe a unique feature of this item.',
        verificationAnswer:   aiResult?.verificationAnswer   || '',
      },
      location: {
        building: location.building,
        floor:    location.floor,
        zone:     location.zone,
        foundAt:  location.foundAt ? new Date(location.foundAt).toISOString() : now,
      },
      finder:    { displayName: 'James O.', anonymous: false },
      expiresAt: new Date(Date.now() + 30 * 864e5).toISOString(),
    }

    addItem(newItem)
    const matches = findMatches(newItem, lirs)
    setMatchedLirs(matches)
    setNewItemId(itemId)
    setSubmitting(false)
    setStep(4)
  }

  function reset() {
    setStep(0); setImageFile(null); setImagePreview(null)
    setTags([]); setAiResult(null)
    setLocation({ building: CAMPUS_BUILDINGS[0], floor: 'Ground Floor', zone: '', foundAt: '', notes: '' })
    setMatchedLirs([]); setNewItemId(null)
  }

  // Map step → stepper index (step 1 = still "Photo" dot active while analysing)
  const stepperIndex = step === 0 ? 0 : step === 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3

  return (
    <div className="max-w-xl mx-auto px-5 lg:px-8 py-10 pb-28">
      {step < 4 && <StepIndicator current={stepperIndex} />}

      {step === 0 && <CameraCapture onImageReady={handleImageReady} onDemo={handleDemo} />}
      {step === 1 && <AnalysingScreen imagePreview={imagePreview} />}
      {step === 2 && (
        <TagReview
          imagePreview={imagePreview}
          tags={tags}
          setTags={setTags}
          onNext={() => setStep(3)}
          onBack={() => { reset(); setStep(0) }}
        />
      )}
      {step === 3 && (
        <LocationPicker
          location={location}
          setLocation={setLocation}
          onSubmit={handleSubmit}
          onBack={() => setStep(2)}
          loading={submitting}
        />
      )}
      {step === 4 && (
        <SubmitConfirmation
          itemId={newItemId}
          matchedLirs={matchedLirs}
          onDone={() => { reset(); setPage('home') }}
          onUploadAnother={reset}
        />
      )}
    </div>
  )
}
