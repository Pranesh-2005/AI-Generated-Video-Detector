const API_BASE_URL = 'http://127.0.0.1:5000/api';

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
    
    // Update UI to show file selected
    uploadArea.innerHTML = `
        <div class="file-preview">
            <p><strong>Selected:</strong> ${file.name}</p>
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

function predictFile(file, type) {
    const loading = document.getElementById('loading');
    const resultDiv = document.getElementById(`${type}-result`);
    
    loading.style.display = 'flex';
    resultDiv.className = 'result';
    resultDiv.textContent = '';
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch(`${API_BASE_URL}/predict/${type}`, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        loading.style.display = 'none';
        
        if (data.status === 'success') {
            resultDiv.className = 'result success';
            resultDiv.innerHTML = data.result.replace(/\n/g, '<br>');
        } else {
            resultDiv.className = 'result error';
            resultDiv.textContent = `Error: ${data.error}`;
        }
    })
    .catch(error => {
        loading.style.display = 'none';
        resultDiv.className = 'result error';
        resultDiv.textContent = `Error: ${error.message}`;
        console.error('Error:', error);
    });
}

function loadExample(type, filename) {
    const resultDiv = document.getElementById(`${type}-result`);
    
    resultDiv.className = 'result';
    resultDiv.textContent = `Example: ${filename} - Upload a file to test this functionality`;
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
        'video': 'Supported: MP4, AVI, MOV',
        'image': 'Supported: JPG, PNG, JPEG',
        'audio': 'Supported: WAV, FLAC, MP3'
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload('video');
    setupFileUpload('image');
    setupFileUpload('audio');
});