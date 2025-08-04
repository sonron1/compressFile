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

// Détection mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    updateCompressButton();

    // Log pour debug mobile
    console.log('Mobile détecté:', isMobile);
    console.log('File input trouvé:', !!fileInput);
    console.log('Drop zone trouvée:', !!dropZone);
});

// Gestionnaires d'événements
function initEventListeners() {
    // Click events pour la drop zone (desktop ET mobile)
    dropZone.addEventListener('click', handleDropZoneClick);
    dropZone.addEventListener('tap', handleDropZoneClick); // Pour mobile

    // Touch events pour mobile
    if (isMobile) {
        dropZone.addEventListener('touchstart', handleTouchStart, { passive: false });
        dropZone.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Desktop drag & drop events
    if (!isMobile) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    }

    // File input change (ESSENTIEL pour mobile)
    fileInput.addEventListener('change', handleFileSelect);

    // Support pour input multiple sur mobile
    fileInput.addEventListener('input', handleFileSelect);

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

// Gestionnaire de click/tap pour la drop zone
function handleDropZoneClick(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('Drop zone cliquée/tappée');

    // Trigger le file input
    fileInput.click();

    // Pour mobile, focus sur l'input
    if (isMobile) {
        setTimeout(() => {
            fileInput.focus();
        }, 100);
    }
}

// Gestionnaires touch pour mobile
function handleTouchStart(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
    console.log('Touch start détecté');
}

function handleTouchEnd(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    console.log('Touch end détecté');

    // Ouvrir le sélecteur de fichiers
    setTimeout(() => {
        fileInput.click();
    }, 50);
}

// Gestion du drag & drop (desktop uniquement)
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

// Gestion de la sélection de fichiers (AMÉLIORÉE pour mobile)
function handleFileSelect(e) {
    console.log('File select déclenché, nombre de fichiers:', e.target.files.length);

    const files = Array.from(e.target.files);

    if (files.length === 0) {
        console.log('Aucun fichier sélectionné');
        return;
    }

    console.log('Fichiers sélectionnés:', files.map(f => f.name));
    addFiles(files);
}

// Ajouter des fichiers à la liste (AMÉLIORÉE)
function addFiles(files) {
    if (!files || files.length === 0) {
        console.log('Aucun fichier à ajouter');
        return;
    }

    let newFilesCount = 0;

    files.forEach(file => {
        // Vérifier les doublons
        const isDuplicate = selectedFiles.some(f =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        );

        if (!isDuplicate) {
            selectedFiles.push(file);
            newFilesCount++;
        }
    });

    console.log(`${newFilesCount} nouveaux fichiers ajoutés`);

    updateFileList();
    updateCompressButton();

    if (newFilesCount > 0) {
        showNotification(`${newFilesCount} fichier(s) ajouté(s) avec succès !`, 'success');

        // Faire vibrer sur mobile
        if (isMobile && navigator.vibrate) {
            navigator.vibrate(100);
        }
    } else {
        showNotification('Fichier(s) déjà dans la liste', 'warning');
    }
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

    // Scroll vers la liste sur mobile
    if (isMobile && selectedFiles.length === 1) {
        setTimeout(() => {
            fileList.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 300);
    }
}

// Créer un élément de fichier (AMÉLIORÉE pour mobile)
function createFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item animate-slide-up';

    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);

    // Nom de fichier tronqué pour mobile
    const fileName = isMobile && file.name.length > 25
        ? file.name.substring(0, 22) + '...'
        : file.name;

    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="${fileIcon}"></i>
            </div>
            <div class="file-details">
                <h6 title="${file.name}">${fileName}</h6>
                <small>${fileSize}</small>
            </div>
        </div>
        <button class="remove-file" onclick="removeFile(${index})" ${isMobile ? 'style="padding: 0.75rem;"' : ''}>
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

// Supprimer un fichier (AMÉLIORÉE)
function removeFile(index) {
    console.log('Suppression du fichier à l\'index:', index);

    const fileName = selectedFiles[index]?.name || 'Fichier';
    selectedFiles.splice(index, 1);

    updateFileList();
    updateCompressButton();

    showNotification(`${fileName} supprimé`, 'info');

    // Vibration mobile
    if (isMobile && navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
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

    // Ajout de classe pour styling mobile
    if (isMobile) {
        compressBtn.classList.add('btn-mobile');
    }
}

// Compresser les fichiers (AMÉLIORÉE)
async function compressFiles() {
    if (selectedFiles.length === 0 || isCompressing) return;

    console.log('Début de la compression de', selectedFiles.length, 'fichiers');

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

            // Petite pause pour l'UI sur mobile
            if (isMobile) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        updateProgress(50, 'Génération de l\'archive ZIP...');

        // Générer le ZIP avec callback de progression
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6
            }
        }, function(metadata) {
            updateProgress(50 + (metadata.percent * 0.5), `Compression: ${Math.round(metadata.percent)}%`);
        });

        updateProgress(100, 'Préparation du téléchargement...');

        // Télécharger le fichier
        const fileName = `CompressFile_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.zip`;

        // Méthode de téléchargement adaptée
        if (isMobile) {
            downloadFileOnMobile(zipBlob, fileName);
        } else {
            saveAs(zipBlob, fileName);
        }

        showNotification('Archive créée et téléchargée avec succès !', 'success');

        // Vibration de succès sur mobile
        if (isMobile && navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }

        // Reset après quelques secondes
        setTimeout(() => {
            resetForm();
        }, 3000);

    } catch (error) {
        console.error('Erreur lors de la compression:', error);
        showNotification('Erreur lors de la compression des fichiers', 'error');
        resetForm();
    }
}

// Téléchargement spécifique mobile
function downloadFileOnMobile(blob, fileName) {
    try {
        // Méthode 1: saveAs (FileSaver.js)
        if (typeof saveAs !== 'undefined') {
            saveAs(blob, fileName);
            return;
        }

        // Méthode 2: Créer un lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Nettoyer l'URL après un délai
        setTimeout(() => URL.revokeObjectURL(url), 5000);

    } catch (error) {
        console.error('Erreur de téléchargement mobile:', error);

        // Méthode de fallback: ouvrir dans un nouvel onglet
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
}

// Lire un fichier comme ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(`Erreur lecture fichier: ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

// Afficher la section de progression
function showProgressSection() {
    progressSection.style.display = 'block';

    // Scroll vers la progression sur mobile
    setTimeout(() => {
        progressSection.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 100);
}

// Mettre à jour la progression
function updateProgress(percent, text) {
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
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

    console.log('Formulaire réinitialisé');
}

// Afficher une notification (AMÉLIORÉE pour mobile)
function showNotification(message, type = 'info') {
    console.log('Notification:', message, type);

    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show position-fixed`;

    // Style adapté mobile/desktop
    if (isMobile) {
        notification.style.cssText = `
            top: 80px;
            left: 10px;
            right: 10px;
            z-index: 9999;
            font-size: 0.9rem;
        `;
    } else {
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
    }

    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)} me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Supprimer automatiquement
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, isMobile ? 4000 : 5000);
}

// Obtenir l'icône de notification
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
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

// Navbar scroll effect (DÉSACTIVÉ sur mobile pour performance)
if (!isMobile) {
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(44, 24, 16, 0.98)';
        } else {
            navbar.style.background = 'rgba(139, 69, 19, 0.95)';
        }
    });
}

// Debug mobile - Afficher les infos importantes
if (isMobile) {
    console.log('=== DEBUG MOBILE ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Supports vibrate:', !!navigator.vibrate);
    console.log('Supports touch:', 'ontouchstart' in window);
    console.log('File API support:', !!(window.File && window.FileReader && window.FileList && window.Blob));
}

// Événement de test pour debug mobile
document.addEventListener('touchstart', function() {
    console.log('Touch detecté globalement');
}, { once: true });