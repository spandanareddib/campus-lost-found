// ─── useCamera — browser camera API with gallery fallback ────────────────────

import { useState, useRef, useCallback } from 'react'

export function useCamera() {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const startCamera = useCallback(async (facingMode = 'environment') => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(mediaStream)
      setIsActive(true)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      return mediaStream
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Camera unavailable. Please upload a photo instead.'
      setError(msg)
      setIsActive(false)
      throw new Error(msg)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    setIsActive(false)
  }, [stream])

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        resolve({ file, url })
      }, 'image/jpeg', 0.92)
    })
  }, [])

  return { stream, error, isActive, videoRef, canvasRef, startCamera, stopCamera, captureFrame }
}
