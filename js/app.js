// Variables globales
let selectedFiles = [];
let isCompressing = false;

// Éléments DOM
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const filesContainer = document.getElementById('files-container');
const compressBtn = document.getElementById('compress-btn');
const progressSection = document.getElementById('progress-section');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    updateCompressButton();
});

// Gestionnaires d'événements
function initEventListeners() {
    // Drop zone events
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // File input
    fileInput.addEventListener('change', handleFileSelect);

    // Compress button
    compressBtn.addEventListener('click', compressFiles);

    // Smooth scrolling pour les liens
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Gestion du drag & drop
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// Gestion de la sélection de fichiers
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

// Ajouter des fichiers à la liste
function addFiles(files) {
    files.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });

    updateFileList();
    updateCompressButton();
    showNotification('Fichiers ajoutés avec succès !', 'success');
}

// Mettre à jour l'affichage de la liste des fichiers
function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }

    fileList.style.display = 'block';
    filesContainer.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        filesContainer.appendChild(fileItem);
    });
}

// Créer un élément de fichier
function createFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item animate-slide-up';

    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);

    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="${fileIcon}"></i>
            </div>
            <div class="file-details">
                <h6>${file.name}</h6>
                <small>${fileSize}</small>
            </div>
        </div>
        <button class="remove-file" onclick="removeFile(${index})">
            <i class="fas fa-times"></i>
        </button>
    `;

    return fileItem;
}

// Obtenir l'icône appropriée selon le type de fichier
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return 'fas fa-image';
    if (mimeType.startsWith('video/')) return 'fas fa-video';
    if (mimeType.startsWith('audio/')) return 'fas fa-music';
    if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
    if (mimeType.includes('word')) return 'fas fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
    if (mimeType.includes('text')) return 'fas fa-file-alt';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'fas fa-file-archive';
    return 'fas fa-file';
}

// Formater la taille du fichier
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Supprimer un fichier
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateCompressButton();
    showNotification('Fichier supprimé', 'info');
}

// Mettre à jour le bouton de compression
function updateCompressButton() {
    compressBtn.disabled = selectedFiles.length === 0 || isCompressing;

    if (selectedFiles.length > 0 && !isCompressing) {
        compressBtn.innerHTML = `<i class="fas fa-compress-alt me-2"></i>Compresser ${selectedFiles.length} fichier(s)`;
    } else if (isCompressing) {
        compressBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Compression...`;
    } else {
        compressBtn.innerHTML = `<i class="fas fa-compress-alt me-2"></i>Compresser en ZIP`;
    }
}

// Compresser les fichiers
async function compressFiles() {
    if (selectedFiles.length === 0 || isCompressing) return;

    isCompressing = true;
    updateCompressButton();
    showProgressSection();

    try {
        const zip = new JSZip();
        let processedFiles = 0;

        // Ajouter chaque fichier au ZIP
        for (const file of selectedFiles) {
            updateProgress((processedFiles / selectedFiles.length) * 50, `Ajout de ${file.name}...`);

            const arrayBuffer = await readFileAsArrayBuffer(file);
            zip.file(file.name, arrayBuffer);

            processedFiles++;
        }

        updateProgress(50, 'Génération de l\'archive ZIP...');

        // Générer le ZIP
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        }, function(metadata) {
            updateProgress(50 + (metadata.percent * 0.5), `Compression: ${Math.round(metadata.percent)}%`);
        });

        updateProgress(100, 'Téléchargement en cours...');

        // Télécharger le fichier
        const fileName = `archive_${new Date().getTime()}.zip`;
        saveAs(zipBlob, fileName);

        showNotification('Archive créée et téléchargée avec succès !', 'success');

        // Reset après quelques secondes
        setTimeout(() => {
            resetForm();
        }, 2000);

    } catch (error) {
        console.error('Erreur lors de la compression:', error);
        showNotification('Erreur lors de la compression des fichiers', 'error');
        resetForm();
    }
}

// Lire un fichier comme ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Afficher la section de progression
function showProgressSection() {
    progressSection.style.display = 'block';
    progressSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Mettre à jour la progression
function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
}

// Réinitialiser le formulaire
function resetForm() {
    isCompressing = false;
    selectedFiles = [];
    updateFileList();
    updateCompressButton();
    progressSection.style.display = 'none';
    fileInput.value = '';
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';

    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Convertir le type de notification en classe Bootstrap
function getBootstrapAlertClass(type) {
    const types = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return types[type] || 'info';
}

// Animation au scroll
function handleScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
            }
        });
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
}

// Initialiser les animations au scroll
document.addEventListener('DOMContentLoaded', handleScrollAnimations);

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(17, 24, 39, 0.95)';
    } else {
        navbar.style.background = 'rgba(31, 41, 55, 0.95)';
    }
});