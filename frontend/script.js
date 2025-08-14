const API_BASE_URL = 'http://127.0.0.1:5000/api';
// For local development, use: const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Tab functionality
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    const tabbuttons = document.getElementsByClassName("tab-button");
    
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    
    for (let i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].classList.remove("active");
    }
    
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// File upload functionality
function setupFileUpload(type) {
    const uploadArea = document.getElementById(`${type}-upload`);
    const fileInput = document.getElementById(`${type}-input`);
    const predictBtn = document.getElementById(`${type}-predict`);
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file, type);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            handleFileSelect(file, type);
        }
    });
    
    predictBtn.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (file) {
            predictFile(file, type);
        }
    });
}

function handleFileSelect(file, type) {
    const uploadArea = document.getElementById(`${type}-upload`);
    const predictBtn = document.getElementById(`${type}-predict`);
    
    // Validate file type
    const allowedTypes = {
        'image': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
        'video': ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/x-flv'],
        'audio': ['audio/wav', 'audio/mp3', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/x-m4a']
    };
    
    if (!allowedTypes[type].includes(file.type) && !isValidFileExtension(file.name, type)) {
        showError(`Invalid file type for ${type}. Please select a valid ${type} file.`);
        resetUploadArea(type);
        return;
    }
    
    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        showError('File too large. Maximum size is 100MB.');
        resetUploadArea(type);
        return;
    }
    
    // Update UI to show file selected
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    uploadArea.innerHTML = `
        <div class="file-preview">
            <p><strong>Selected:</strong> ${file.name}</p>
            <p><strong>Size:</strong> ${fileSizeMB} MB</p>
            <p class="file-types">Click "Analyze ${type.charAt(0).toUpperCase() + type.slice(1)}" to process</p>
        </div>
    `;
    
    // Show preview for images
    if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadArea.innerHTML += `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
    
    // Show preview for videos
    if (type === 'video' && file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadArea.innerHTML += `<video controls src="${e.target.result}"></video>`;
        };
        reader.readAsDataURL(file);
    }
    
    predictBtn.disabled = false;
}

function isValidFileExtension(filename, type) {
    const extensions = {
        'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
        'video': ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
        'audio': ['wav', 'mp3', 'flac', 'ogg', 'aac', 'm4a']
    };
    
    const ext = filename.split('.').pop().toLowerCase();
    return extensions[type].includes(ext);
}

async function predictFile(file, type) {
    const loading = document.getElementById('loading');
    const resultDiv = document.getElementById(`${type}-result`);
    
    loading.style.display = 'flex';
    resultDiv.className = 'result';
    resultDiv.textContent = '';
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict/${type}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        loading.style.display = 'none';
        
        if (data.status === 'success') {
            resultDiv.className = 'result success';
            resultDiv.innerHTML = formatResult(data);
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `Error: ${data.error}`;
        }
        
    } catch (error) {
        loading.style.display = 'none';
        resultDiv.className = 'result error';
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Error:', error);
    }
}

function formatResult(data) {
    let html = data.result.replace(/\n/g, '<br>');
    
    // Add source information
    if (data.source) {
        const sourceInfo = {
            'huggingface_space': '🤖 Powered by Hugging Face Space',
            'demo_mode': '⚠️ Demo Mode - Backend Only',
            'demo_fallback': '⚠️ Demo Mode - Service Unavailable'
        };
        
        html += `<br><br><small style="color: #666; font-style: italic;">${sourceInfo[data.source] || data.source}</small>`;
    }
    
    // Add file info if available
    if (data.file_info) {
        html += `<br><small style="color: #888;">Processed: ${data.file_info.name} (${data.file_info.size_mb}MB)</small>`;
    }
    
    return html;
}

function loadExample(type, filename) {
    const resultDiv = document.getElementById(`${type}-result`);
    
    resultDiv.className = 'result';
    resultDiv.innerHTML = `
        <strong>Example: ${filename}</strong><br>
        Upload your own ${type} file to test the deepfake detection functionality.<br>
        <small style="color: #666;">This is a demonstration of the available example files.</small>
    `;
}

function resetUploadArea(type) {
    const uploadArea = document.getElementById(`${type}-upload`);
    const predictBtn = document.getElementById(`${type}-predict`);
    const fileInput = document.getElementById(`${type}-input`);
    
    const icons = {
        'video': '📹',
        'image': '🖼️',
        'audio': '🎵'
    };
    
    const fileTypes = {
        'video': 'Supported: MP4, AVI, MOV, MKV, WebM',
        'image': 'Supported: JPG, PNG, GIF, BMP, WebP',
        'audio': 'Supported: WAV, MP3, FLAC, OGG, AAC'
    };
    
    uploadArea.innerHTML = `
        <div class="upload-placeholder">
            <i class="upload-icon">${icons[type]}</i>
            <p>Click to upload ${type} or drag and drop</p>
            <p class="file-types">${fileTypes[type]}</p>
        </div>
    `;
    
    fileInput.value = '';
    predictBtn.disabled = true;
}

function showError(message) {
    // Create a temporary error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'result error';
    errorDiv.textContent = message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '10000';
    errorDiv.style.maxWidth = '400px';
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload('video');
    setupFileUpload('image');
    setupFileUpload('audio');
});