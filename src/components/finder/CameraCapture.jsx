// ─── CameraCapture — live viewfinder + gallery fallback ──────────────────────

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, SwitchCamera, X, Zap, AlertCircle } from 'lucide-react'
import { useCamera } from '../../hooks/useCamera.js'

export default function CameraCapture({ onImageReady, onDemo }) {
  const [mode, setMode] = useState('choose') // 'choose' | 'live' | 'uploading'
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const { error: camError, isActive, videoRef, canvasRef, startCamera, stopCamera, captureFrame } = useCamera()

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  async function handleStartLive() {
    setMode('live')
    try { await startCamera('environment') }
    catch { setMode('choose') }
  }

  async function handleCapture() {
    const result = await captureFrame()
    if (result) { stopCamera(); onImageReady(result.file, result.url) }
  }

  function handleFileInput(file) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large — max 10 MB'); return }
    const url = URL.createObjectURL(file)
    onImageReady(file, url)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    handleFileInput(e.dataTransfer.files[0])
  }

  // ── Live viewfinder ──
  if (mode === 'live') {
    return (
      <div className="animate-fade-in">
        <div className="relative rounded-bento overflow-hidden bg-black aspect-[4/3]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {camError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6">
              <div className="text-center text-white">
                <AlertCircle size={36} className="mx-auto mb-3 text-danger" />
                <p className="text-sm">{camError}</p>
                <button onClick={() => setMode('choose')} className="mt-4 btn-outline text-white border-white/30 hover:bg-white/10">
                  Use file upload instead
                </button>
              </div>
            </div>
          )}
          {/* Capture overlay */}
          {!camError && (
            <>
              {/* Viewfinder guides */}
              <div className="absolute inset-6 border-2 border-white/30 rounded-inner pointer-events-none" />
              <div className="absolute top-8 left-8 w-5 h-5 border-t-2 border-l-2 border-white" />
              <div className="absolute top-8 right-8 w-5 h-5 border-t-2 border-r-2 border-white" />
              <div className="absolute bottom-8 left-8 w-5 h-5 border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-8 right-8 w-5 h-5 border-b-2 border-r-2 border-white" />
              {/* Controls */}
              <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-8">
                <button onClick={() => { stopCamera(); setMode('choose') }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  aria-label="Cancel">
                  <X size={18} />
                </button>
                <button onClick={handleCapture}
                  className="w-16 h-16 rounded-full bg-white border-4 border-white/60 flex items-center justify-center shadow-modal hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Take photo">
                  <div className="w-10 h-10 rounded-full bg-white/80" />
                </button>
                <button onClick={() => startCamera('user')}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  aria-label="Flip camera">
                  <SwitchCamera size={18} />
                </button>
              </div>
            </>
          )}
        </div>
        <p className="text-center text-xs text-ink-tertiary mt-3">
          Centre the item in the frame for best AI results
        </p>
      </div>
    )
  }

  // ── Choose mode ──
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-[20px] bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Camera size={30} className="text-accent" strokeWidth={1.75} />
        </div>
        <h2 className="font-display font-semibold text-brand-900 text-2xl mb-2">
          Snap a found item
        </h2>
        <p className="text-sm text-ink-tertiary max-w-sm mx-auto leading-relaxed">
          Take a clear photo of the item you found. AI will identify and tag it automatically in under 3 seconds.
        </p>
      </div>

      {/* Primary options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleStartLive}
          className="bento-card-hover p-5 flex flex-col items-center gap-3 group border-brand-200/50 hover:border-brand-400"
          aria-label="Open live camera"
        >
          <div className="w-12 h-12 rounded-[14px] bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Camera size={24} className="text-accent" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-ink">Take photo</div>
            <div className="text-xs text-ink-tertiary mt-0.5">Use camera</div>
          </div>
        </button>

        <button
          onClick={() => fileRef.current.click()}
          className="bento-card-hover p-5 flex flex-col items-center gap-3 group border-surface-muted"
          aria-label="Upload from gallery"
        >
          <div className="w-12 h-12 rounded-[14px] bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Upload size={24} className="text-brand-500" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-ink">Upload photo</div>
            <div className="text-xs text-ink-tertiary mt-0.5">From gallery</div>
          </div>
        </button>
      </div>

      {/* Drag and drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-inner p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-brand-400 bg-brand-50' : 'border-surface-muted hover:border-surface-subtle'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop photo here"
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current.click()}
      >
        <p className="text-xs text-ink-tertiary">
          {dragOver ? '✦ Drop to upload' : 'or drag & drop a photo here'}
        </p>
        <p className="text-[10px] text-ink-disabled mt-1">JPEG · PNG · WEBP · HEIC · max 10 MB</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileInput(e.target.files[0])}
        aria-hidden="true"
      />

      {/* Demo shortcut */}
      <div className="text-center mt-5 pt-5 border-t border-surface-muted">
        <p className="text-xs text-ink-tertiary mb-2">No item to photograph?</p>
        <button onClick={onDemo} className="btn-outline gap-2 text-xs mx-auto">
          <Zap size={13} className="text-accent" />
          Use demo image
        </button>
      </div>
    </div>
  )
}
