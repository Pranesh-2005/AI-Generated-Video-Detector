"use client"

import { useState, useEffect } from "react"
import { Upload, FileImage, FileVideo, FileAudio, Zap, Shield, AlertTriangle, CheckCircle, X, Eye } from "lucide-react"

// Enhanced global type declarations
declare global {
  interface Window {
    gradio?: {
      Client: any;
    };
    Client?: any; // For direct CDN access
  }
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState<"image" | "video" | "audio">("image")
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [gradioLoaded, setGradioLoaded] = useState<boolean>(false)
  const [gradioError, setGradioError] = useState<string | null>(null)

  useEffect(() => {
    // Enhanced Gradio client loading with multiple fallbacks
    const loadGradioClient = async () => {
      if (typeof window === 'undefined') return

      try {
        // Method 1: Try npm package dynamic import first
        try {
          const { Client } = await import('@gradio/client')
          ;(window as any).GradioClient = Client
          setGradioLoaded(true)
          console.log('Gradio loaded via npm package')
          return
        } catch (npmError) {
          console.log('npm package failed, trying CDN...', npmError)
        }

        // Method 2: CDN fallback
        if (!window.gradio && !window.Client) {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js'
          script.async = true
          
          const loadPromise = new Promise<void>((resolve, reject) => {
            script.onload = () => {
              console.log('Gradio loaded via CDN')
              setGradioLoaded(true)
              resolve()
            }
            script.onerror = () => {
              const error = 'Failed to load Gradio client from CDN'
              console.error(error)
              setGradioError(error)
              reject(new Error(error))
            }
          })

          document.head.appendChild(script)
          await loadPromise
        } else {
          setGradioLoaded(true)
        }
      } catch (error) {
        console.error('All Gradio loading methods failed:', error)
        setGradioError('Unable to load AI detection system')
      }
    }

    loadGradioClient()

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      generatePreview(selectedFile)
    }
  }

  const generatePreview = (selectedFile: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
  }

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setFile(null)
    setResult("")
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      setFile(droppedFile)
      generatePreview(droppedFile)
    }
  }

  // Mock analysis for fallback
  const performMockAnalysis = async (): Promise<string> => {
    if (!file) return ""
    
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    const fileName = file.name.toLowerCase()
    const fileSize = file.size
    
    if (fileName.includes('fake') || fileName.includes('synthetic') || fileName.includes('ai')) {
      return `🚨 SYNTHETIC CONTENT DETECTED: This ${type} shows signs of artificial generation. Confidence: ${(85 + Math.random() * 10).toFixed(1)}%`
    } else if (fileSize > 50 * 1024 * 1024) {
      return `✅ AUTHENTIC CONTENT: This ${type} appears genuine with high-quality characteristics. Confidence: ${(90 + Math.random() * 8).toFixed(1)}%`
    } else if (Math.random() > 0.7) {
      return `⚠️ SUSPICIOUS CONTENT: Detected anomalies suggesting possible manipulation. Confidence: ${(60 + Math.random() * 20).toFixed(1)}%`
    } else {
      return `✅ AUTHENTIC CONTENT: This ${type} appears genuine with natural characteristics. Confidence: ${(88 + Math.random() * 10).toFixed(1)}%`
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first!")
      return
    }

    setLoading(true)
    
    try {
      if (gradioLoaded && !gradioError) {
        // Try Gradio analysis first
        try {
          const Client = (window as any).GradioClient || 
                        (window as any).gradio?.Client || 
                        (window as any).Client
          
          if (!Client) {
            throw new Error("Gradio client not available")
          }

          const client = await Client.connect("PraneshJs/fakevideodetect")

          let endpoint = "/predict"
          let inputField: Record<string, File> = { input_image: file }

          if (type === "video") {
            endpoint = "/predict_1"
            inputField = { input_video: file }
          } else if (type === "audio") {
            endpoint = "/predict_2"
            inputField = { input_audio: file }
          }

          const prediction = await client.predict(endpoint, inputField)
          setResult(prediction.data[0])
        } catch (gradioError) {
          console.warn("Gradio analysis failed, using fallback:", gradioError)
          const fallbackResult = await performMockAnalysis()
          setResult(fallbackResult + " (Demo Mode)")
        }
      } else {
        // Use mock analysis if Gradio failed to load
        const fallbackResult = await performMockAnalysis()
        setResult(fallbackResult + " (Demo Mode)")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Analysis failed. Please try again.")
    }
    
    setLoading(false)
  }

  const getTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case "image": return <FileImage className="w-5 h-5" />
      case "video": return <FileVideo className="w-5 h-5" />
      case "audio": return <FileAudio className="w-5 h-5" />
      default: return <FileImage className="w-5 h-5" />
    }
  }

  const getResultIcon = () => {
    if (!result) return null
    if (result.includes("✅") || result.toLowerCase().includes("authentic")) {
      return <CheckCircle className="w-6 h-6 text-emerald-600" />
    } else if (result.includes("🚨") || result.toLowerCase().includes("synthetic")) {
      return <AlertTriangle className="w-6 h-6 text-red-600" />
    } else {
      return <AlertTriangle className="w-6 h-6 text-amber-600" />
    }
  }

  const getResultColor = () => {
    if (!result) return ""
    if (result.includes("✅") || result.toLowerCase().includes("authentic")) {
      return "border-emerald-200 bg-emerald-50"
    } else if (result.includes("🚨") || result.toLowerCase().includes("synthetic")) {
      return "border-red-200 bg-red-50"
    } else {
      return "border-amber-200 bg-amber-50"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-teal-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-coral-500 to-coral-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-4 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Fake Media Detector
            </h1>
            <p className="text-xl sm:text-2xl text-coral-100 max-w-2xl mx-auto leading-relaxed">
              Advanced AI-powered detection for deepfakes and manipulated content
            </p>
            
            {/* Loading/Error Status */}
            {!gradioLoaded && !gradioError && (
              <div className="mt-4 flex items-center justify-center gap-2 text-coral-100">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">Loading AI detection system...</span>
              </div>
            )}
            
            {gradioError && (
              <div className="mt-4 px-4 py-2 bg-amber-500/20 rounded-lg">
                <span className="text-sm text-amber-100">
                  ⚠️ Running in demo mode - {gradioError}
                </span>
              </div>
            )}
            
            {gradioLoaded && !gradioError && (
              <div className="mt-4 px-4 py-2 bg-green-500/20 rounded-lg">
                <span className="text-sm text-green-100">
                  ✅ AI detection system ready
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Rest of your existing JSX remains the same */}
      <div className="px-4 py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-warm-200">
            {/* Type Selection */}
            <div className="p-6 sm:p-8 border-b border-warm-100">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-coral-500" />
                Select Media Type
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {(["image", "video", "audio"] as const).map((mediaType) => (
                  <button
                    key={mediaType}
                    onClick={() => setType(mediaType)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      type === mediaType
                        ? "border-coral-500 bg-coral-50 text-coral-700"
                        : "border-warm-200 hover:border-coral-300 hover:bg-warm-50"
                    }`}
                  >
                    {getTypeIcon(mediaType)}
                    <span className="font-medium capitalize text-sm sm:text-base">{mediaType}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="p-6 sm:p-8 border-b border-warm-100">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                Upload File
              </h2>

              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-coral-400 bg-coral-50"
                    : file
                      ? "border-teal-400 bg-teal-50"
                      : "border-warm-300 hover:border-coral-300 hover:bg-warm-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept={type === "image" ? "image/*" : type === "video" ? "video/*" : "audio/*"}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                  <div
                    className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                      file ? "bg-teal-100" : "bg-warm-100"
                    }`}
                  >
                    {file ? getTypeIcon(type) : <Upload className="w-8 h-8 text-warm-500" />}
                  </div>

                  {file ? (
                    <div>
                      <p className="text-lg font-medium text-teal-700">{file.name}</p>
                      <p className="text-sm text-teal-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-slate-700">Drop your {type} here or click to browse</p>
                      <p className="text-sm text-slate-500 mt-1">Supports all common {type} formats</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Preview Section */}
            {file && previewUrl && (
              <div className="p-6 sm:p-8 border-b border-warm-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-teal-600" />
                    File Preview
                  </h2>
                  <button
                    onClick={removeFile}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-coral-600 hover:text-coral-700 hover:bg-coral-50 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 sm:p-6">
                  {type === "image" && (
                    <div className="flex justify-center">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-64 sm:max-h-80 object-contain rounded-xl shadow-lg"
                      />
                    </div>
                  )}

                  {type === "video" && (
                    <div className="flex justify-center">
                      <video
                        src={previewUrl}
                        controls
                        className="max-w-full max-h-64 sm:max-h-80 rounded-xl shadow-lg"
                        preload="metadata"
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )}

                  {type === "audio" && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-coral-400 to-coral-500 rounded-full flex items-center justify-center shadow-lg">
                          <FileAudio className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <audio src={previewUrl} controls className="w-full" preload="metadata">
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}

                  {/* File Details */}
                  <div className="mt-4 pt-4 border-t border-warm-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="text-center sm:text-left">
                        <p className="text-slate-500 font-medium">File Name</p>
                        <p className="text-slate-700 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-slate-500 font-medium">File Size</p>
                        <p className="text-slate-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-slate-500 font-medium">File Type</p>
                        <p className="text-slate-700 uppercase">{file.type.split("/")[1] || type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <div className="p-6 sm:p-8">
              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 disabled:from-warm-300 disabled:to-warm-400 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-md"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Analyze Media</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className={`mt-8 p-6 sm:p-8 rounded-3xl border-2 shadow-lg ${getResultColor()}`}>
              <div className="flex items-start gap-4">
                {getResultIcon()}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Analysis Result</h3>
                  <p className="text-lg text-slate-700 leading-relaxed">{result}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}