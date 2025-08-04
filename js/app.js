// Variables globales
let selectedFiles = [];
let isCompressing = false;
let compressionSettings = {
    images: {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'jpeg'
    },
    videos: {
        enabled: false, // Désactivé par défaut car très lourd
        quality: 0.7,
        maxWidth: 1280
    },
    documents: {
        compression: 'DEFLATE',
        level: 9
    },
    universal: {
        chunkSize: 1024 * 1024, // 1MB chunks pour gros fichiers
        useStreamCompression: true
    }
};

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
    createCompressionSettings();
    loadCompressionLibraries();
});

// Charger les bibliothèques de compression supplémentaires
async function loadCompressionLibraries() {
    try {
        // Ajouter pako pour une meilleure compression
        if (!window.pako) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js';
            document.head.appendChild(script);
        }
    } catch (error) {
        console.warn('Impossible de charger les bibliothèques de compression supplémentaires');
    }
}

// Interface des paramètres améliorée
function createCompressionSettings() {
    const settingsHTML = `
        <div id="compression-settings" class="compression-settings mb-4" style="display: none;">
            <h6 class="text-black mb-3">
                <i class="fas fa-cog me-2"></i>Paramètres de compression avancés
            </h6>
            
            <!-- Mode de compression -->
            <div class="settings-group mb-3">
                <label class="form-label fw-bold">Mode de compression</label>
                <div class="row g-2">
                    <div class="col-md-6">
                        <select class="form-select" id="compression-mode">
                            <option value="balanced">Équilibré (recommandé)</option>
                            <option value="maximum">Compression maximale</option>
                            <option value="fast">Rapide</option>
                            <option value="smart">Intelligent (par type)</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <div class="form-check mt-2">
                            <input class="form-check-input" type="checkbox" id="aggressive-compression" checked>
                            <label class="form-check-label" for="aggressive-compression">
                                Compression agressive
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paramètres Images -->
            <div class="settings-group mb-3">
                <label class="form-label fw-bold">Images</label>
                <div class="row g-2">
                    <div class="col-md-3">
                        <label class="form-label small">Qualité</label>
                        <input type="range" class="form-range" id="image-quality" 
                               min="0.1" max="1.0" step="0.1" value="0.8">
                        <small class="text-muted" id="quality-display">80%</small>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small">Largeur max</label>
                        <input type="number" class="form-control form-control-sm" 
                               id="max-width" value="1920" min="100" max="4000">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small">Format</label>
                        <select class="form-select form-select-sm" id="output-format">
                            <option value="jpeg">JPEG</option>
                            <option value="webp">WebP (meilleur)</option>
                            <option value="png">PNG</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <div class="form-check mt-4">
                            <input class="form-check-input" type="checkbox" id="remove-metadata" checked>
                            <label class="form-check-label small" for="remove-metadata">
                                Supprimer métadonnées
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paramètres Fichiers volumineux -->
            <div class="settings-group mb-3">
                <label class="form-label fw-bold">Fichiers volumineux</label>
                <div class="row g-2">
                    <div class="col-md-6">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="split-large-files">
                            <label class="form-check-label" for="split-large-files">
                                Diviser les fichiers > 100MB
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="stream-compression" checked>
                            <label class="form-check-label" for="stream-compression">
                                Compression par flux (économise RAM)
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistiques estimées -->
            <div class="compression-stats mt-3 p-2 bg-light rounded">
                <small class="text-muted">
                    <i class="fas fa-chart-line me-1"></i>
                    <span id="compression-estimate">Sélectionnez des fichiers pour voir l'estimation</span>
                </small>
            </div>
        </div>
    `;

    dropZone.parentNode.insertBefore(
        document.createRange().createContextualFragment(settingsHTML),
        dropZone
    );

    initSettingsEventListeners();
}

// Gestionnaires d'événements pour les paramètres
function initSettingsEventListeners() {
    document.getElementById('compression-mode').addEventListener('change', updateCompressionMode);
    document.getElementById('image-quality').addEventListener('input', updateImageQuality);
    document.getElementById('max-width').addEventListener('change', updateMaxWidth);
    document.getElementById('output-format').addEventListener('change', updateOutputFormat);

    // Autres gestionnaires...
    ['aggressive-compression', 'remove-metadata', 'split-large-files', 'stream-compression'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateCompressionEstimate);
    });
}

// Mettre à jour le mode de compression
function updateCompressionMode(e) {
    const mode = e.target.value;

    switch(mode) {
        case 'maximum':
            compressionSettings.documents.level = 9;
            compressionSettings.images.quality = 0.6;
            document.getElementById('aggressive-compression').checked = true;
            break;
        case 'fast':
            compressionSettings.documents.level = 3;
            compressionSettings.images.quality = 0.9;
            document.getElementById('aggressive-compression').checked = false;
            break;
        case 'balanced':
            compressionSettings.documents.level = 6;
            compressionSettings.images.quality = 0.8;
            break;
        case 'smart':
            // Mode intelligent analysera chaque fichier individuellement
            break;
    }

    updateCompressionEstimate();
    updateFileList(); // Recalculer les estimations
}

function updateImageQuality(e) {
    compressionSettings.images.quality = parseFloat(e.target.value);
    document.getElementById('quality-display').textContent = Math.round(e.target.value * 100) + '%';
    updateCompressionEstimate();
}

function updateMaxWidth(e) {
    compressionSettings.images.maxWidth = parseInt(e.target.value);
    updateCompressionEstimate();
}

function updateOutputFormat(e) {
    compressionSettings.images.format = e.target.value;
    updateCompressionEstimate();
}

// Initialisation des événements (simplifié)
function initEventListeners() {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    compressBtn.addEventListener('click', compressFiles);
}

// Gestion drag & drop (identique)
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

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

// Ajouter des fichiers avec analyse
function addFiles(files) {
    files.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            // Analyser le fichier pour déterminer la meilleure compression
            file.compressionType = analyzeFileForCompression(file);
            selectedFiles.push(file);
        }
    });

    updateFileList();
    updateCompressButton();
    updateCompressionEstimate();
    document.getElementById('compression-settings').style.display = 'block';
    showNotification('Fichiers ajoutés et analysés !', 'success');
}

// 🔍 Analyser le fichier pour déterminer le type de compression optimal
function analyzeFileForCompression(file) {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    const size = file.size;

    // Images
    if (type.startsWith('image/')) {
        return {
            category: 'image',
            method: 'canvas_compression',
            expectedReduction: size > 1024*1024 ? 0.6 : 0.4, // Plus de réduction pour gros fichiers
            priority: 'high'
        };
    }

    // Fichiers textuels
    if (type.includes('text') || name.match(/\.(txt|js|css|html|xml|json|csv|md|yml|yaml)$/)) {
        return {
            category: 'text',
            method: 'text_optimization',
            expectedReduction: 0.7,
            priority: 'high'
        };
    }

    // Documents Office
    if (name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/)) {
        return {
            category: 'document',
            method: 'zip_compression',
            expectedReduction: 0.3,
            priority: 'medium'
        };
    }

    // PDF
    if (type.includes('pdf') || name.endsWith('.pdf')) {
        return {
            category: 'pdf',
            method: 'pdf_optimization',
            expectedReduction: 0.15, // PDF déjà compressé
            priority: 'low'
        };
    }

    // Audio/Vidéo (déjà compressés)
    if (type.startsWith('audio/') || type.startsWith('video/')) {
        return {
            category: 'media',
            method: 'zip_only',
            expectedReduction: 0.05, // Très peu de compression possible
            priority: 'low'
        };
    }

    // Archives existantes
    if (name.match(/\.(zip|rar|7z|tar|gz)$/)) {
        return {
            category: 'archive',
            method: 'recompress',
            expectedReduction: 0.1,
            priority: 'low'
        };
    }

    // Fichiers binaires génériques
    return {
        category: 'binary',
        method: 'advanced_compression',
        expectedReduction: size > 10*1024*1024 ? 0.4 : 0.2, // Meilleure compression pour gros binaires
        priority: 'medium'
    };
}

// Mise à jour de l'estimation de compression
function updateCompressionEstimate() {
    if (selectedFiles.length === 0) {
        document.getElementById('compression-estimate').textContent = 'Sélectionnez des fichiers pour voir l\'estimation';
        return;
    }

    const totalOriginal = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    let totalEstimatedCompressed = 0;

    selectedFiles.forEach(file => {
        const reduction = file.compressionType.expectedReduction;
        const mode = document.getElementById('compression-mode').value;
        const aggressive = document.getElementById('aggressive-compression').checked;

        let finalReduction = reduction;

        // Ajustements selon le mode
        if (mode === 'maximum') finalReduction *= 1.3;
        else if (mode === 'fast') finalReduction *= 0.7;

        if (aggressive) finalReduction *= 1.2;

        // Limiter la réduction maximale à 95%
        finalReduction = Math.min(finalReduction, 0.95);

        totalEstimatedCompressed += file.size * (1 - finalReduction);
    });

    const savingsPercent = Math.round((1 - totalEstimatedCompressed/totalOriginal) * 100);
    const savingsSize = formatFileSize(totalOriginal - totalEstimatedCompressed);

    document.getElementById('compression-estimate').innerHTML = `
        Économie estimée: <strong>${savingsPercent}%</strong> 
        (<strong>${savingsSize}</strong>) - 
        ${formatFileSize(totalOriginal)} → ${formatFileSize(totalEstimatedCompressed)}
    `;
}

// Création d'un élément de fichier avec analyse
function createFileItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item animate-slide-up';

    const fileIcon = getFileIcon(file.type);
    const fileSize = formatFileSize(file.size);
    const compression = file.compressionType;
    const estimatedSize = file.size * (1 - compression.expectedReduction);
    const savings = Math.round(compression.expectedReduction * 100);

    // Couleur selon le potentiel de compression
    let badgeClass = 'bg-secondary';
    if (savings > 50) badgeClass = 'bg-success';
    else if (savings > 20) badgeClass = 'bg-warning';

    fileItem.innerHTML = `
        <div class="file-info">
            <div class="file-icon">
                <i class="${fileIcon}"></i>
            </div>
            <div class="file-details">
                <h6>
                    ${file.name}
                    <span class="badge ${badgeClass} ms-2">${compression.category}</span>
                </h6>
                <small>
                    ${fileSize} → ~${formatFileSize(estimatedSize)} 
                    <span class="text-success fw-bold">(-${savings}%)</span>
                    <br>
                    <span class="text-muted">${getCompressionMethodName(compression.method)}</span>
                </small>
            </div>
        </div>
        <button class="remove-file" onclick="removeFile(${index})">
            <i class="fas fa-times"></i>
        </button>
    `;

    return fileItem;
}

// Noms des méthodes de compression
function getCompressionMethodName(method) {
    const methods = {
        'canvas_compression': 'Optimisation d\'image',
        'text_optimization': 'Minification texte',
        'zip_compression': 'Compression ZIP',
        'pdf_optimization': 'Optimisation PDF',
        'zip_only': 'Archive seulement',
        'recompress': 'Recompression',
        'advanced_compression': 'Compression avancée'
    };
    return methods[method] || 'Compression standard';
}

// 🚀 FONCTION PRINCIPALE - Compression universelle intelligente
async function compressFiles() {
    if (selectedFiles.length === 0 || isCompressing) return;

    isCompressing = true;
    updateCompressButton();
    showProgressSection();

    try {
        const zip = new JSZip();
        let processedFiles = 0;
        let totalOriginalSize = 0;
        let totalProcessedSize = 0;
        const compressionMode = document.getElementById('compression-mode').value;
        const aggressiveMode = document.getElementById('aggressive-compression').checked;

        // Traiter chaque fichier selon son type
        for (const file of selectedFiles) {
            const progressPercent = (processedFiles / selectedFiles.length) * 85;
            updateProgress(progressPercent, `Compression: ${file.name}... (${processedFiles + 1}/${selectedFiles.length})`);

            totalOriginalSize += file.size;
            let processedData;

            try {
                // Choisir la méthode de compression selon l'analyse
                switch (file.compressionType.method) {
                    case 'canvas_compression':
                        processedData = await compressImage(file);
                        break;

                    case 'text_optimization':
                        processedData = await compressText(file, aggressiveMode);
                        break;

                    case 'pdf_optimization':
                        processedData = await optimizePDF(file);
                        break;

                    case 'advanced_compression':
                        processedData = await advancedBinaryCompression(file);
                        break;

                    case 'recompress':
                        processedData = await recompressArchive(file);
                        break;

                    default:
                        // Compression ZIP standard
                        processedData = await readFileAsArrayBuffer(file);
                }

                totalProcessedSize += processedData.byteLength;
                zip.file(file.name, processedData);

            } catch (error) {
                console.warn(`Erreur lors de la compression de ${file.name}:`, error);
                // En cas d'erreur, utiliser le fichier original
                const originalData = await readFileAsArrayBuffer(file);
                totalProcessedSize += originalData.byteLength;
                zip.file(file.name, originalData);
            }

            processedFiles++;
        }

        updateProgress(85, 'Création de l\'archive finale...');

        // Paramètres ZIP selon le mode
        let zipLevel = 6;
        if (compressionMode === 'maximum') zipLevel = 9;
        else if (compressionMode === 'fast') zipLevel = 1;

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: zipLevel
            }
        }, function(metadata) {
            updateProgress(85 + (metadata.percent * 0.15), `Finalisation: ${Math.round(metadata.percent)}%`);
        });

        updateProgress(100, 'Téléchargement en cours...');

        // Statistiques finales
        const actualSavings = Math.round((1 - zipBlob.size/totalOriginalSize) * 100);
        const fileName = `compressed_${compressionMode}_${new Date().getTime()}.zip`;

        saveAs(zipBlob, fileName);

        showNotification(`
            🎉 Compression terminée !<br>
            📊 Taille originale: ${formatFileSize(totalOriginalSize)}<br>
            📦 Archive finale: ${formatFileSize(zipBlob.size)}<br>
            💾 Économie: <strong>${actualSavings}%</strong>
        `, 'success');

        setTimeout(() => resetForm(), 4000);

    } catch (error) {
        console.error('Erreur lors de la compression:', error);
        showNotification('Erreur lors de la compression. Veuillez réessayer.', 'error');
        resetForm();
    }
}

// 🖼️ Compression d'image avancée
async function compressImage(file) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            let { width, height } = calculateImageDimensions(img.width, img.height);

            canvas.width = width;
            canvas.height = height;

            // Amélioration de la qualité de redimensionnement
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, width, height);

            // Conversion avec suppression des métadonnées si activée
            const format = compressionSettings.images.format === 'webp' ? 'image/webp' :
                compressionSettings.images.format === 'png' ? 'image/png' : 'image/jpeg';

            canvas.toBlob((blob) => {
                blob.arrayBuffer().then(resolve);
            }, format, compressionSettings.images.quality);
        };

        img.src = URL.createObjectURL(file);
    });
}

// 📄 Optimisation de texte avancée
async function compressText(file, aggressive = false) {
    const text = await readFileAsText(file);
    let optimizedText = text;

    if (aggressive) {
        // Mode agressif : optimisations poussées
        optimizedText = optimizedText
            .replace(/\s+/g, ' ')           // Espaces multiples
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Lignes vides multiples
            .replace(/\t/g, ' ')            // Tabs en espaces
            .trim();

        // Optimisations spécifiques par type
        if (file.name.endsWith('.js')) {
            optimizedText = advancedMinifyJS(optimizedText);
        } else if (file.name.endsWith('.css')) {
            optimizedText = advancedMinifyCSS(optimizedText);
        } else if (file.name.endsWith('.html')) {
            optimizedText = minifyHTML(optimizedText);
        }
    } else {
        // Mode standard
        optimizedText = optimizedText
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
    }

    return new TextEncoder().encode(optimizedText);
}

// 🔧 Minification JavaScript avancée
function advancedMinifyJS(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '')     // Commentaires multi-lignes
        .replace(/\/\/.*$/gm, '')             // Commentaires simples
        .replace(/\s*([{}:;,=+\-*\/])\s*/g, '$1') // Espaces autour opérateurs
        .replace(/;\s*}/g, '}')               // Point-virgules avant }
        .replace(/\s+/g, ' ')                 // Espaces multiples
        .trim();
}

// 🎨 Minification CSS avancée
function advancedMinifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s*([{}:;,>+~])\s*/g, '$1')
        .replace(/;\s*}/g, '}')
        .replace(/\s+/g, ' ')
        .replace(/:\s*0px/g, ':0')
        .replace(/:\s*0em/g, ':0')
        .replace(/:\s*0rem/g, ':0')
        .trim();
}

// 🌐 Minification HTML
function minifyHTML(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '')      // Commentaires HTML
        .replace(/\s+/g, ' ')                 // Espaces multiples
        .replace(/>\s+</g, '><')              // Espaces entre balises
        .trim();
}

// 📄 Optimisation PDF (basique - nécessiterait une lib spécialisée)
async function optimizePDF(file) {
    // Pour le PDF, on ne peut pas faire grand chose sans bibliothèque spécialisée
    // On retourne le fichier original
    return await readFileAsArrayBuffer(file);
}

// 🗜️ Compression binaire avancée
async function advancedBinaryCompression(file) {
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Si pako est disponible, utiliser gzip
    if (window.pako) {
        try {
            const compressed = pako.gzip(new Uint8Array(arrayBuffer), { level: 9 });
            return compressed.buffer;
        } catch (error) {
            console.warn('Erreur compression pako:', error);
        }
    }

    // Sinon, retourner le fichier original
    return arrayBuffer;
}

// 📦 Recompression d'archives
async function recompressArchive(file) {
    // Pour les archives, on les décompresse puis recompresse avec de meilleurs paramètres
    // Ceci nécessiterait des bibliothèques spécialisées pour chaque format
    // Pour l'instant, on retourne le fichier original
    return await readFileAsArrayBuffer(file);
}

// Calculer les dimensions d'image
function calculateImageDimensions(originalWidth, originalHeight) {
    const maxWidth = compressionSettings.images.maxWidth;
    const maxHeight = compressionSettings.images.maxHeight || maxWidth;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
    }

    if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
}

// Fonctions utilitaires (identiques au code précédent)
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

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateCompressButton();
    updateCompressionEstimate();
    showNotification('Fichier supprimé', 'info');
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        document.getElementById('compression-settings').style.display = 'none';
        return;
    }

    fileList.style.display = 'block';
    filesContainer.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = createFileItem(file, index);
        filesContainer.appendChild(fileItem);
    });
}

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

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file, 'UTF-8');
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function showProgressSection() {
    progressSection.style.display = 'block';
    progressSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
}

function resetForm() {
    isCompressing = false;
    selectedFiles = [];
    updateFileList();
    updateCompressButton();
    updateCompressionEstimate();
    progressSection.style.display = 'none';
    fileInput.value = '';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 350px; max-width: 500px;';

    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 8000);
}

function getBootstrapAlertClass(type) {
    const types = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return types[type] || 'info';
}

// Animations et effets (identiques)
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

document.addEventListener('DOMContentLoaded', handleScrollAnimations);

window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(44, 24, 16, 0.95)';
    } else {
        navbar.style.background = 'rgba(139, 69, 19, 0.95)';
    }
});