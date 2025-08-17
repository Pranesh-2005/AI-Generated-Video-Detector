class FakeMediaDetector {
  constructor() {
    this.file = null
    this.type = "image"
    this.loading = false
    this.previewUrl = null
    this.API_BASE_URL = 'https://gradioapibackend.onrender.com/api'
    // For local development, uncomment: 
    // this.API_BASE_URL = 'http://127.0.0.1:5000/api'
    
    this.initializeElements()
    this.bindEvents()
  }

  initializeElements() {
    this.typeButtons = document.querySelectorAll(".type-button")
    this.fileInput = document.getElementById("fileInput")
    this.uploadArea = document.getElementById("uploadArea")
    this.uploadIconContainer = document.getElementById("uploadIconContainer")
    this.uploadText = document.getElementById("uploadText")
    this.analyzeButton = document.getElementById("analyzeButton")
    this.buttonContent = document.getElementById("buttonContent")
    this.resultCard = document.getElementById("resultCard")
    this.resultIcon = document.getElementById("resultIcon")
    this.resultDescription = document.getElementById("resultDescription")
    this.filePreview = document.getElementById("filePreview")
    this.previewContent = document.getElementById("previewContent")
    this.fileDetails = document.getElementById("fileDetails")
    this.removeFileBtn = document.getElementById("removeFileBtn")
  }

  bindEvents() {
    this.typeButtons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleTypeChange(e))
    })
    this.fileInput.addEventListener("change", (e) => this.handleFileChange(e))
    this.uploadArea.addEventListener("dragenter", (e) => this.handleDrag(e))
    this.uploadArea.addEventListener("dragover", (e) => this.handleDrag(e))
    this.uploadArea.addEventListener("dragleave", (e) => this.handleDrag(e))
    this.uploadArea.addEventListener("drop", (e) => this.handleDrop(e))
    this.analyzeButton.addEventListener("click", () => this.handleSubmit())
    
    if (this.removeFileBtn) {
      this.removeFileBtn.addEventListener("click", () => this.removeFile())
    }
  }

  handleTypeChange(e) {
    const newType = e.currentTarget.dataset.type
    this.type = newType

    this.typeButtons.forEach((btn) => btn.classList.remove("active"))
    e.currentTarget.classList.add("active")

    const acceptMap = {
      image: "image/*",
      video: "video/*",
      audio: "audio/*",
    }
    this.fileInput.accept = acceptMap[newType]
    this.updateUploadText()

    if (this.file) {
      this.removeFile()
    }
  }

  handleFileChange(e) {
    const file = e.target.files[0]
    if (file && this.validateFileType(file)) {
      this.file = file
      this.updateUploadDisplay()
      this.generatePreview()
    }
  }

  handleDrag(e) {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      this.uploadArea.classList.add("drag-active")
    } else if (e.type === "dragleave") {
      this.uploadArea.classList.remove("drag-active")
    }
  }

  handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    this.uploadArea.classList.remove("drag-active")

    const files = e.dataTransfer.files
    if (files && files[0] && this.validateFileType(files[0])) {
      this.file = files[0]
      this.fileInput.files = files
      this.updateUploadDisplay()
      this.generatePreview()
    }
  }

  validateFileType(file) {
    // Validate file type according to API requirements
    const allowedTypes = {
      'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
      'video': ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/x-flv'],
      'audio': ['audio/wav', 'audio/mp3', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-m4a']
    }

    if (!allowedTypes[this.type].includes(file.type) && !this.isValidFileExtension(file.name)) {
      this.showError(`Invalid file type for ${this.type}. Please select a valid ${this.type} file.`)
      return false
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      this.showError('File too large. Maximum size is 100MB.')
      return false
    }

    return true
  }

  isValidFileExtension(filename) {
    const extensions = {
      'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      'video': ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
      'audio': ['wav', 'mp3', 'flac', 'ogg', 'aac', 'm4a']
    }

    const ext = filename.split('.').pop().toLowerCase()
    return extensions[this.type].includes(ext)
  }

  showError(message) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'result error'
    errorDiv.textContent = message
    errorDiv.style.position = 'fixed'
    errorDiv.style.top = '20px'
    errorDiv.style.right = '20px'
    errorDiv.style.zIndex = '10000'
    errorDiv.style.maxWidth = '400px'
    errorDiv.style.background = '#fee2e2'
    errorDiv.style.color = '#dc2626'
    errorDiv.style.padding = '1rem'
    errorDiv.style.borderRadius = '0.5rem'
    errorDiv.style.border = '1px solid #fecaca'

    document.body.appendChild(errorDiv)

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv)
      }
    }, 5000)
  }

  removeFile() {
    this.file = null
    this.fileInput.value = ""

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
      this.previewUrl = null
    }

    this.updateUploadDisplay()
    this.hidePreview()
    // Hide results when file is removed
    this.resultCard.style.display = "none"
  }

  generatePreview() {
    if (!this.file) return

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }

    this.previewUrl = URL.createObjectURL(this.file)
    this.showPreview()
    this.updateFileDetails()
  }

  showPreview() {
    if (!this.file || !this.previewUrl) return

    let previewHTML = ""

    switch (this.type) {
      case "image":
        previewHTML = `<img src="${this.previewUrl}" alt="Preview" class="preview-image" />`
        break
      case "video":
        previewHTML = `
          <video src="${this.previewUrl}" controls class="preview-video">
            Your browser does not support video preview.
          </video>
        `
        break
      case "audio":
        previewHTML = `
          <div class="audio-placeholder">
            <svg class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <div class="audio-info">
              <div class="audio-title">Audio File Ready</div>
              <div class="audio-subtitle">Click analyze to process</div>
            </div>
            <audio src="${this.previewUrl}" controls class="preview-audio">
              Your browser does not support audio preview.
            </audio>
          </div>
        `
        break
    }

    if (this.previewContent) {
      this.previewContent.innerHTML = previewHTML
      this.filePreview.style.display = "block"
    }
  }

  hidePreview() {
    if (this.filePreview) {
      this.filePreview.style.display = "none"
      this.previewContent.innerHTML = ""
      this.fileDetails.innerHTML = ""
    }
  }

  updateFileDetails() {
    if (!this.file || !this.fileDetails) return

    const fileSize = (this.file.size / 1024 / 1024).toFixed(2)
    const fileType = this.file.type || "Unknown"
    const lastModified = new Date(this.file.lastModified).toLocaleDateString()

    this.fileDetails.innerHTML = `
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">File Name</div>
          <div class="detail-value">${this.file.name}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">File Size</div>
          <div class="detail-value">${fileSize} MB</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">File Type</div>
          <div class="detail-value">${fileType}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Last Modified</div>
          <div class="detail-value">${lastModified}</div>
        </div>
      </div>
    `
  }

  updateUploadDisplay() {
    if (this.file) {
      this.uploadArea.classList.add("has-file")
      this.uploadIconContainer.innerHTML = this.getTypeIcon(this.type)

      const fileSize = (this.file.size / 1024 / 1024).toFixed(2)
      this.uploadText.innerHTML = `
        <div class="file-info">
          <p class="file-name">${this.file.name}</p>
          <p class="file-size">${fileSize} MB</p>
          <p class="file-types">Click "Analyze ${this.type.charAt(0).toUpperCase() + this.type.slice(1)}" to process</p>
        </div>
      `

      this.analyzeButton.disabled = false
    } else {
      this.uploadArea.classList.remove("has-file")
      this.uploadIconContainer.innerHTML = `
        <svg class="upload-default-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      `
      this.updateUploadText()
      this.analyzeButton.disabled = true
    }
  }

  updateUploadText() {
    if (!this.file && this.uploadText) {
      this.uploadText.innerHTML = `
        <p class="upload-main-text">Drop your ${this.type} here or click to browse</p>
        <p class="upload-sub-text">Supports all common ${this.type} formats</p>
      `
    }
  }

  getTypeIcon(type) {
    const icons = {
      image: `
        <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      `,
      video: `
        <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23,7 16,12 23,17 23,7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      `,
      audio: `
        <svg class="type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      `,
    }
    return icons[type] || icons["image"]
  }

  async handleSubmit() {
    if (!this.file) {
      alert("Please select a file first!")
      return
    }

    this.setLoading(true)

    try {
      await this.predictFile()
    } catch (error) {
      console.error("Analysis error:", error)
      this.displayResult(`Error: ${error.message}`, false)
    }

    this.setLoading(false)
  }

  async predictFile() {
    const formData = new FormData()
    formData.append('file', this.file)

    try {
      const response = await fetch(`${this.API_BASE_URL}/predict/${this.type}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      if (data.status === 'success') {
        this.displayResult(this.formatResult(data), true)
      } else {
        this.displayResult(`Error: ${data.error || 'Unknown error occurred'}`, false)
      }

    } catch (error) {
      console.error("API request failed:", error)

      if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        throw new Error("Network error. Please check your internet connection and try again.")
      } else if (error.message.includes('HTTP error')) {
        throw new Error(`Server error: ${error.message}. Please try again later.`)
      } else {
        throw new Error(`Analysis failed: ${error.message}`)
      }
    }
  }

  formatResult(data) {
    let result = data.result.replace(/\n/g, '\n')

    // Add source information if available
    if (data.source) {
      const sourceInfo = {
        'huggingface_space': '🤖 Powered by Hugging Face Space',
        'demo_mode': '⚠️ Demo Mode - Backend Only',
        'demo_fallback': '⚠️ Demo Mode - Service Unavailable'
      }

      result += `\n\n${sourceInfo[data.source] || data.source}`
    }

    // Add file info if available
    if (data.file_info) {
      result += `\nProcessed: ${data.file_info.name} (${data.file_info.size_mb}MB)`
    }

    return result
  }

  setLoading(isLoading) {
    this.loading = isLoading

    if (isLoading) {
      this.buttonContent.innerHTML = `
        <div class="loading-spinner"></div>
        <span>Analyzing...</span>
      `
      this.analyzeButton.disabled = true
    } else {
      this.buttonContent.innerHTML = `
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Analyze Media</span>
      `
      this.analyzeButton.disabled = !this.file
    }
  }

  displayResult(result, isFromAPI = true) {
    // Enhanced result interpretation
    const resultLower = result.toLowerCase()
    
    const isAuthentic = resultLower.includes("real") || 
                       resultLower.includes("authentic") ||
                       resultLower.includes("genuine") ||
                       resultLower.includes("original") ||
                       (resultLower.includes("confidence") && resultLower.includes("real"))

    const isFake = resultLower.includes("fake") ||
                   resultLower.includes("deepfake") ||
                   resultLower.includes("manipulated") ||
                   resultLower.includes("synthetic") ||
                   resultLower.includes("generated") ||
                   resultLower.includes("artificial")

    // Update result icon and styling
    if (isAuthentic && !isFake) {
      this.resultIcon.innerHTML = `
        <svg class="result-icon authentic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
      `
      this.resultCard.className = "result-card authentic"
    } else if (isFake) {
      this.resultIcon.innerHTML = `
        <svg class="result-icon fake" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `
      this.resultCard.className = "result-card fake"
    } else {
      // Neutral/uncertain result
      this.resultIcon.innerHTML = `
        <svg class="result-icon neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
          <path d="M12,17h0"/>
        </svg>
      `
      this.resultCard.className = "result-card neutral"
    }

    // Update result text (preserve line breaks for better formatting)
    this.resultDescription.innerHTML = result.replace(/\n/g, '<br>')

    // Show result card
    this.resultCard.style.display = "block"

    // Smooth scroll to result
    setTimeout(() => {
      this.resultCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }, 100)
  }

  cleanup() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
      this.previewUrl = null
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const detector = new FakeMediaDetector()

  window.addEventListener("beforeunload", () => {
    detector.cleanup()
  })
})