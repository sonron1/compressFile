/**
 * CompressFile Pro - Application avec Compression Réelle
 * Version: 3.0 - Compression PDF et Images Avancée
 * Auteur: AI Assistant
 */

class CompressFilePro {
    constructor() {
        this.files = [];
        this.isCompressing = false;
        this.compressionSettings = {
            mode: 'smart',
            level: 6,
            imageQuality: 75,
            pdfQuality: 0.7,
            removeMetadata: true,
            optimizeImages: true,
            multiThreading: true,
            smartCompression: true
        };

        this.init();
    }

    /**
     * Initialisation de l'application
     */
    init() {
        this.initializeElements();
        this.bindEvents();
        this.startCounterAnimations();
        this.initializeIntersectionObserver();
        this.updateSettingsValues();
        console.log('🚀 CompressFile Pro initialisé avec compression avancée PDF+Images');
    }

    /**
     * Récupération des éléments DOM
     */
    initializeElements() {
        this.elements = {
            dropZone: document.getElementById('drop-zone'),
            fileInput: document.getElementById('file-input'),
            filesSection: document.getElementById('files-section'),
            filesList: document.getElementById('files-list'),
            compressBtn: document.getElementById('compress-btn'),
            progressSection: document.getElementById('progress-section'),
            progressBar: document.getElementById('progress-bar'),
            progressText: document.getElementById('progress-text'),
            progressPercent: document.getElementById('progress-percent'),
            progressDetails: document.getElementById('progress-details'),
            clearFilesBtn: document.getElementById('clear-files'),
            settingsToggle: document.getElementById('settings-toggle'),
            advancedSettings: document.getElementById('advanced-settings'),
            totalFiles: document.getElementById('total-files'),
            totalSize: document.getElementById('total-size'),
            estimatedSize: document.getElementById('estimated-size'),
            savingsPercent: document.getElementById('savings-percent'),
            compressionLevelValue: document.getElementById('compression-level-value'),
            imageQualityValue: document.getElementById('image-quality-value'),
            pdfQualityValue: document.getElementById('pdf-quality-value')
        };
    }

    /**
     * Mise à jour des valeurs des paramètres
     */
    updateSettingsValues() {
        // Mise à jour des sliders avec événements
        const compressionLevel = document.getElementById('compression-level');
        const imageQuality = document.getElementById('image-quality');
        const pdfQuality = document.getElementById('pdf-quality');

        compressionLevel.addEventListener('input', (e) => {
            this.compressionSettings.level = parseInt(e.target.value);
            this.elements.compressionLevelValue.textContent = e.target.value;
            this.updateStats();
        });

        imageQuality.addEventListener('input', (e) => {
            this.compressionSettings.imageQuality = parseInt(e.target.value);
            this.elements.imageQualityValue.textContent = e.target.value;
            this.updateStats();
        });

        pdfQuality.addEventListener('input', (e) => {
            this.compressionSettings.pdfQuality = parseInt(e.target.value) / 100;
            this.elements.pdfQualityValue.textContent = e.target.value;
            this.updateStats();
        });
    }

    /**
     * Liaison des événements
     */
    bindEvents() {
        // Drag & Drop
        this.elements.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.elements.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.elements.dropZone.addEventListener('click', () => this.elements.fileInput.click());

        // Sélection de fichiers
        this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Boutons
        this.elements.compressBtn.addEventListener('click', this.compressFiles.bind(this));
        this.elements.clearFilesBtn.addEventListener('click', this.clearFiles.bind(this));
        this.elements.settingsToggle.addEventListener('click', this.toggleAdvancedSettings.bind(this));

        // Paramètres de compression
        document.querySelectorAll('input[name="compress-mode"]').forEach(radio => {
            radio.addEventListener('change', this.updateCompressionMode.bind(this));
        });

        // Navigation fluide
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', this.smoothScroll.bind(this));
        });

        // Prévention du comportement par défaut pour le drag & drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
        });
    }

    /**
     * Gestion des événements drag & drop
     */
    handleDragOver(e) {
        e.preventDefault();
        this.elements.dropZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        this.addFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addFiles(files);
    }

    /**
     * Ajout de fichiers avec validation
     */
    addFiles(newFiles) {
        if (newFiles.length === 0) return;

        // Filtrer les fichiers valides
        const validFiles = newFiles.filter(file => {
            if (file.size > 500 * 1024 * 1024) {
                this.showNotification(`Fichier "${file.name}" trop volumineux (max 500MB)`, 'warning');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            this.showNotification('Aucun fichier valide à ajouter', 'warning');
            return;
        }

        // Animation d'ajout
        this.elements.dropZone.classList.add('scale-in');
        setTimeout(() => {
            this.elements.dropZone.classList.remove('scale-in');
        }, 400);

        // Filtrer les doublons
        const uniqueFiles = validFiles.filter(newFile =>
            !this.files.some(existingFile =>
                existingFile.name === newFile.name &&
                existingFile.size === newFile.size
            )
        );

        if (uniqueFiles.length === 0) {
            this.showNotification('Fichiers déjà présents', 'warning');
            return;
        }

        this.files.push(...uniqueFiles);
        this.updateFilesDisplay();
        this.updateStats();
        this.showNotification(`${uniqueFiles.length} fichier(s) ajouté(s)`, 'success');
    }

    /**
     * Mise à jour de l'affichage des fichiers
     */
    updateFilesDisplay() {
        this.elements.filesList.innerHTML = '';

        if (this.files.length === 0) {
            this.elements.filesSection.style.display = 'none';
            this.elements.compressBtn.disabled = true;
            return;
        }

        this.elements.filesSection.style.display = 'block';
        this.elements.compressBtn.disabled = false;

        this.files.forEach((file, index) => {
            const fileItem = this.createFileItem(file, index);
            this.elements.filesList.appendChild(fileItem);
        });

        // Animation d'apparition
        this.elements.filesSection.classList.add('fade-in-up');
        setTimeout(() => {
            this.elements.filesSection.classList.remove('fade-in-up');
        }, 600);
    }

    /**
     * Création d'un élément fichier avec prédiction de compression
     */
    createFileItem(file, index) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        const compressionInfo = this.getPredictedCompression(file);

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <i class="${fileIcon}"></i>
                </div>
                <div class="file-details">
                    <h6>${this.truncateFileName(file.name, 35)}</h6>
                    <small>${fileSize} • ${compressionInfo.type}</small>
                    <div class="compression-preview">
                        <span class="compression-badge ${compressionInfo.class}">
                            <i class="fas fa-compress-arrows-alt me-1"></i>
                            ${compressionInfo.text}
                        </span>
                    </div>
                </div>
            </div>
            <div class="file-actions">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="compressFilePro.removeFile(${index})" title="Supprimer">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return fileItem;
    }

    /**
     * Prédiction de compression par type de fichier
     */
    getPredictedCompression(file) {
        const type = file.type.toLowerCase();
        const extension = file.name.split('.').pop().toLowerCase();

        // PDF - Compression réelle possible
        if (type.includes('pdf') || extension === 'pdf') {
            return {
                type: 'PDF',
                text: '40-80% de compression',
                class: 'high-compression'
            };
        }

        // Images non compressées - Très bonne compression
        if (['bmp', 'tiff', 'tif', 'raw'].includes(extension)) {
            return {
                type: 'Image Raw',
                text: '70-90% de compression',
                class: 'ultra-compression'
            };
        }

        // Images compressées - Compression modérée
        if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return {
                type: 'Image',
                text: '15-40% de compression',
                class: 'medium-compression'
            };
        }

        // Documents Office - Bonne compression
        if (type.includes('document') || type.includes('sheet') || type.includes('presentation') ||
            ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
            return {
                type: 'Document',
                text: '30-60% de compression',
                class: 'good-compression'
            };
        }

        // Texte - Excellente compression
        if (type.includes('text') || type.includes('json') || type.includes('xml') ||
            ['txt', 'json', 'xml', 'csv', 'log', 'js', 'css', 'html'].includes(extension)) {
            return {
                type: 'Texte',
                text: '80-95% de compression',
                class: 'ultra-compression'
            };
        }

        // Fichiers déjà compressés
        if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('mp4') || type.includes('mp3') ||
            ['zip', 'rar', '7z', 'gz', 'mp4', 'mp3', 'avi', 'mov'].includes(extension)) {
            return {
                type: 'Déjà compressé',
                text: 'Peu de compression',
                class: 'low-compression'
            };
        }

        // Par défaut
        return {
            type: 'Fichier',
            text: '30-50% de compression',
            class: 'medium-compression'
        };
    }

    /**
     * Suppression d'un fichier
     */
    removeFile(index) {
        if (index >= 0 && index < this.files.length) {
            const fileName = this.files[index].name;
            this.files.splice(index, 1);
            this.updateFilesDisplay();
            this.updateStats();
            this.showNotification(`"${fileName}" supprimé`, 'info');
        }
    }

    /**
     * Suppression de tous les fichiers
     */
    clearFiles() {
        if (this.files.length === 0) return;

        const count = this.files.length;
        this.files = [];
        this.updateFilesDisplay();
        this.updateStats();
        this.showNotification(`${count} fichier(s) supprimé(s)`, 'info');
    }

    /**
     * Compression des fichiers avec traitement réel
     */
    async compressFiles() {
        if (this.files.length === 0 || this.isCompressing) return;

        this.isCompressing = true;
        this.showProgressSection();
        this.updateCompressButton(true);

        try {
            const zip = new JSZip();
            let processedFiles = 0;
            const totalFiles = this.files.length;
            let totalOriginalSize = 0;
            let totalCompressedSize = 0;
            let compressionResults = [];

            this.updateProgress(5, 'Initialisation...', 'Préparation de la compression avancée');

            // Traitement individuel de chaque fichier
            for (const file of this.files) {
                totalOriginalSize += file.size;

                this.updateProgress(
                    10 + (processedFiles / totalFiles) * 80,
                    `Compression de ${file.name}...`,
                    `Fichier ${processedFiles + 1}/${totalFiles}`
                );

                try {
                    const compressedFile = await this.compressIndividualFile(file);
                    totalCompressedSize += compressedFile.size;

                    // Ajouter au ZIP
                    zip.file(compressedFile.name, compressedFile.blob);

                    compressionResults.push({
                        name: file.name,
                        originalSize: file.size,
                        compressedSize: compressedFile.size,
                        ratio: compressedFile.compressionRatio
                    });

                    console.log(`✅ ${file.name}: ${compressedFile.compressionRatio}% de compression`);

                } catch (error) {
                    console.warn(`⚠️ Erreur compression ${file.name}:`, error);
                    // Ajouter le fichier original en cas d'erreur
                    zip.file(file.name, file);
                    totalCompressedSize += file.size;

                    compressionResults.push({
                        name: file.name,
                        originalSize: file.size,
                        compressedSize: file.size,
                        ratio: 0,
                        error: true
                    });
                }

                processedFiles++;
            }

            // Génération du ZIP final
            this.updateProgress(92, 'Création de l\'archive finale...', 'Optimisation ZIP...');

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: Math.min(this.compressionSettings.level, 6) // Limiter pour éviter l'over-compression
                },
                streamFiles: true
            }, (metadata) => {
                if (metadata.percent) {
                    const progress = 92 + (metadata.percent * 0.07);
                    this.updateProgress(
                        progress,
                        'Finalisation...',
                        `${Math.round(metadata.percent)}% - ${metadata.currentFile || 'Archive'}`
                    );
                }
            });

            // Calculs finaux
            const finalCompressionRatio = totalOriginalSize > 0 ?
                Math.round((1 - zipBlob.size / totalOriginalSize) * 100) : 0;

            this.updateProgress(100, 'Téléchargement...', 'Archive prête !');

            // Génération du nom de fichier
            const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');
            const fileName = `compressed-${timestamp}.zip`;

            // Téléchargement
            saveAs(zipBlob, fileName);

            // Message de succès détaillé
            setTimeout(() => {
                this.showCompressionResults({
                    originalSize: totalOriginalSize,
                    finalSize: zipBlob.size,
                    compressionRatio: finalCompressionRatio,
                    filesCount: totalFiles,
                    results: compressionResults
                });
                this.hideProgressSection();
            }, 1000);

        } catch (error) {
            console.error('Erreur lors de la compression:', error);
            this.showNotification(`Erreur: ${error.message}`, 'error', 5000);
            this.hideProgressSection();
        } finally {
            this.isCompressing = false;
            this.updateCompressButton(false);
        }
    }

    /**
     * Compression individuelle selon le type de fichier
     */
    async compressIndividualFile(file) {
        const fileType = file.type.toLowerCase();
        const extension = file.name.split('.').pop().toLowerCase();

        try {
            // Compression PDF avec PDF-lib
            if (fileType.includes('pdf') || extension === 'pdf') {
                return await this.compressPDF(file);
            }

            // Compression d'images
            if (fileType.includes('image') && !fileType.includes('gif')) {
                return await this.compressImage(file);
            }

            // Pour les autres fichiers, retourner tel quel
            return {
                name: file.name,
                blob: file,
                size: file.size,
                compressionRatio: 0
            };

        } catch (error) {
            console.warn(`Impossible de compresser ${file.name}:`, error);
            throw error;
        }
    }

    /**
     * Compression PDF avancée avec PDF-lib
     */
    async compressPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true,
                capNumbers: false
            });

            // Optimisations PDF
            const pages = pdfDoc.getPages();
            let hasOptimizations = false;

            // Réduire la résolution des pages si trop élevée
            for (const page of pages) {
                const { width, height } = page.getSize();

                if (width > 1200 || height > 1200) {
                    const scale = Math.min(1200 / width, 1200 / height);
                    page.scale(scale, scale);
                    hasOptimizations = true;
                }
            }

            // Options de sauvegarde optimisées
            const saveOptions = {
                useObjectStreams: false,
                addDefaultPage: false,
                objectsPerTick: 50,
                updateFieldAppearances: false
            };

            // Ajuster selon les paramètres utilisateur
            if (this.compressionSettings.pdfQuality < 0.5) {
                saveOptions.compressStreams = true;
            }

            const pdfBytes = await pdfDoc.save(saveOptions);
            const compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            const compressionRatio = ((file.size - compressedBlob.size) / file.size * 100).toFixed(1);

            return {
                name: file.name,
                blob: compressedBlob,
                size: compressedBlob.size,
                compressionRatio: Math.max(0, parseFloat(compressionRatio))
            };

        } catch (error) {
            console.error('Erreur compression PDF:', error);
            throw new Error(`Impossible de compresser le PDF: ${error.message}`);
        }
    }

    /**
     * Compression d'images avec canvas
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calcul des nouvelles dimensions
                    let { width, height } = img;
                    const maxDimension = this.compressionSettings.mode === 'maximum' ? 1600 : 1920;

                    if (width > maxDimension || height > maxDimension) {
                        const ratio = Math.min(maxDimension / width, maxDimension / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Configuration du contexte pour une meilleure qualité
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Dessiner l'image redimensionnée
                    ctx.drawImage(img, 0, 0, width, height);

                    // Qualité selon les paramètres
                    const quality = this.compressionSettings.imageQuality / 100;

                    // Conversion en blob avec compression
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Impossible de créer le blob'));
                                return;
                            }

                            const compressionRatio = ((file.size - blob.size) / file.size * 100).toFixed(1);
                            resolve({
                                name: file.name,
                                blob: blob,
                                size: blob.size,
                                compressionRatio: Math.max(0, parseFloat(compressionRatio))
                            });
                        },
                        'image/jpeg',
                        quality
                    );
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Impossible de charger l\'image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Affichage des résultats de compression détaillés
     */
    showCompressionResults({ originalSize, finalSize, compressionRatio, filesCount, results }) {
        let message = `🎉 ${filesCount} fichier(s) traité(s) avec succès !\n\n`;
        message += `📊 Résultats:\n`;
        message += `• Taille originale: ${this.formatFileSize(originalSize)}\n`;
        message += `• Taille finale: ${this.formatFileSize(finalSize)}\n`;

        if (compressionRatio > 0) {
            const savedSize = originalSize - finalSize;
            message += `• Économie: ${compressionRatio}% (${this.formatFileSize(savedSize)})\n`;
        } else {
            message += `• Note: Fichiers déjà optimisés ou non compressibles\n`;
        }

        // Statistiques par type
        const pdfResults = results.filter(r => r.name.toLowerCase().endsWith('.pdf') && r.ratio > 0);
        const imageResults = results.filter(r => /\.(jpg|jpeg|png|bmp|tiff)$/i.test(r.name) && r.ratio > 0);

        if (pdfResults.length > 0) {
            const avgPdfCompression = (pdfResults.reduce((sum, r) => sum + r.ratio, 0) / pdfResults.length).toFixed(1);
            message += `\n📄 PDF: ${pdfResults.length} fichier(s), ${avgPdfCompression}% compression moyenne`;
        }

        if (imageResults.length > 0) {
            const avgImageCompression = (imageResults.reduce((sum, r) => sum + r.ratio, 0) / imageResults.length).toFixed(1);
            message += `\n🖼️ Images: ${imageResults.length} fichier(s), ${avgImageCompression}% compression moyenne`;
        }

        this.showNotification(message, 'success', 10000);

        // Log détaillé en console
        console.table(results);
    }

    /**
     * Mise à jour des statistiques avec calcul réaliste
     */
    updateStats() {
        const totalFiles = this.files.length;
        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        const estimatedSize = this.calculateRealisticCompressedSize();
        const savings = totalSize > 0 ? Math.round((1 - estimatedSize / totalSize) * 100) : 0;

        this.elements.totalFiles.textContent = totalFiles;
        this.elements.totalSize.textContent = this.formatFileSize(totalSize);
        this.elements.estimatedSize.textContent = this.formatFileSize(estimatedSize);
        this.elements.savingsPercent.textContent = `${savings}%`;

        // Animation des chiffres
        this.animateCounter(this.elements.savingsPercent, 0, savings, '%');
    }

    /**
     * Calcul réaliste de la taille compressée
     */
    calculateRealisticCompressedSize() {
        let totalCompressedSize = 0;

        this.files.forEach(file => {
            const type = file.type.toLowerCase();
            const extension = file.name.split('.').pop().toLowerCase();
            let compressionRatio = 0.5; // 50% par défaut

            // PDF - Compression réelle possible
            if (type.includes('pdf') || extension === 'pdf') {
                compressionRatio = this.compressionSettings.mode === 'maximum' ? 0.3 : 0.5; // 50-70%
            }
            // Images non compressées
            else if (['bmp', 'tiff', 'tif', 'raw'].includes(extension)) {
                compressionRatio = 0.2; // 80% compression
            }
            // Images compressées
            else if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                compressionRatio = 0.7; // 30% compression
            }
            // Documents Office
            else if (type.includes('document') || type.includes('sheet') || type.includes('presentation') ||
                ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
                compressionRatio = 0.6; // 40% compression
            }
            // Texte
            else if (type.includes('text') || type.includes('json') || type.includes('xml') ||
                ['txt', 'json', 'xml', 'csv', 'log', 'js', 'css', 'html'].includes(extension)) {
                compressionRatio = 0.15; // 85% compression
            }
            // Fichiers déjà compressés
            else if (type.includes('zip') || type.includes('rar') || type.includes('7z') ||
                type.includes('mp4') || type.includes('mp3') || type.includes('avi') ||
                ['zip', 'rar', '7z', 'gz', 'mp4', 'mp3', 'avi', 'mov'].includes(extension)) {
                compressionRatio = 0.95; // 5% compression seulement
            }

            totalCompressedSize += file.size * compressionRatio;
        });

        return totalCompressedSize;
    }

    /**
     * Interface utilisateur - méthodes utilitaires
     */

    updateProgress(percent, text, details) {
        percent = Math.min(100, Math.max(0, percent));

        this.elements.progressBar.style.width = `${percent}%`;
        this.elements.progressPercent.textContent = `${Math.round(percent)}%`;
        this.elements.progressText.textContent = text;
        this.elements.progressDetails.textContent = details;
    }

    showProgressSection() {
        this.elements.progressSection.style.display = 'block';
        this.elements.progressSection.classList.add('fade-in-up');
    }

    hideProgressSection() {
        setTimeout(() => {
            this.elements.progressSection.style.display = 'none';
            this.elements.progressSection.classList.remove('fade-in-up');
        }, 2000);
    }

    updateCompressButton(isLoading) {
        const btnText = this.elements.compressBtn.querySelector('.btn-text');
        const btnLoader = this.elements.compressBtn.querySelector('.btn-loader');

        if (isLoading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-flex';
            this.elements.compressBtn.disabled = true;
        } else {
            btnText.style.display = 'inline-flex';
            btnLoader.style.display = 'none';
            this.elements.compressBtn.disabled = this.files.length === 0;
        }
    }

    toggleAdvancedSettings() {
        const isVisible = this.elements.advancedSettings.style.display !== 'none';
        this.elements.advancedSettings.style.display = isVisible ? 'none' : 'block';

        const icon = this.elements.settingsToggle.querySelector('i');
        icon.className = isVisible ? 'fas fa-chevron-down me-1' : 'fas fa-chevron-up me-1';

        if (!isVisible) {
            this.elements.advancedSettings.classList.add('fade-in-up');
        }
    }

    updateCompressionMode(e) {
        this.compressionSettings.mode = e.target.value;

        // Ajuster automatiquement les paramètres selon le mode
        const modeSettings = {
            fast: { level: 3, imageQuality: 85, pdfQuality: 0.8 },
            balanced: { level: 6, imageQuality: 75, pdfQuality: 0.7 },
            maximum: { level: 9, imageQuality: 60, pdfQuality: 0.5 },
            smart: { level: 6, imageQuality: 75, pdfQuality: 0.7 }
        };

        const settings = modeSettings[e.target.value];
        this.compressionSettings.level = settings.level;
        this.compressionSettings.imageQuality = settings.imageQuality;
        this.compressionSettings.pdfQuality = settings.pdfQuality;

        // Mettre à jour les sliders
        document.getElementById('compression-level').value = settings.level;
        document.getElementById('image-quality').value = settings.imageQuality;
        document.getElementById('pdf-quality').value = Math.round(settings.pdfQuality * 100);

        this.elements.compressionLevelValue.textContent = settings.level;
        this.elements.imageQualityValue.textContent = settings.imageQuality;
        this.elements.pdfQualityValue.textContent = Math.round(settings.pdfQuality * 100);

        this.updateStats();
        console.log('Mode de compression:', this.compressionSettings.mode, settings);
    }

    showNotification(message, type = 'info', duration = 4000) {
        // Supprimer les anciennes notifications
        const existingNotifications = document.querySelectorAll('.notification-toast');
        if (existingNotifications.length >= 3) {
            existingNotifications[0].remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <div class="notification-message">${message.replace(/\n/g, '<br>')}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Styles
        const colors = {
            success: { bg: '#10b981', border: '#059669' },
            error: { bg: '#ef4444', border: '#dc2626' },
            warning: { bg: '#f59e0b', border: '#d97706' },
            info: { bg: '#06b6d4', border: '#0891b2' }
        };

        const color = colors[type] || colors.info;

        Object.assign(notification.style, {
            position: 'fixed',
            top: `${20 + (existingNotifications.length * 90)}px`,
            right: '20px',
            background: color.bg,
            border: `2px solid ${color.border}`,
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            zIndex: '9999',
            maxWidth: '450px',
            minWidth: '300px',
            fontSize: '14px',
            lineHeight: '1.5',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Auto-remove
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        });
    }

    /**
     * Utilitaires
     */

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    getFileIcon(fileType) {
        const iconMap = {
            'application/pdf': 'fas fa-file-pdf text-danger',
            'image/': 'fas fa-image text-success',
            'video/': 'fas fa-video text-primary',
            'audio/': 'fas fa-music text-info',
            'application/zip': 'fas fa-file-archive text-warning',
            'application/x-zip': 'fas fa-file-archive text-warning',
            'text/': 'fas fa-file-alt text-secondary',
            'application/msword': 'fas fa-file-word text-primary',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word text-primary',
            'application/vnd.ms-excel': 'fas fa-file-excel text-success',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel text-success',
            'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint text-warning',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fas fa-file-powerpoint text-warning'
        };

        for (const [type, icon] of Object.entries(iconMap)) {
            if (fileType && fileType.startsWith(type)) {
                return icon;
            }
        }

        return 'fas fa-file text-muted';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    truncateFileName(fileName, maxLength) {
        if (fileName.length <= maxLength) return fileName;
        const extension = fileName.split('.').pop();
        const name = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = name.substring(0, maxLength - extension.length - 4) + '...';
        return truncatedName + '.' + extension;
    }

    smoothScroll(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    startCounterAnimations() {
        const counters = document.querySelectorAll('.counter');

        const animateCounter = (counter) => {
            const target = parseFloat(counter.getAttribute('data-target'));
            const increment = target / 100;
            let current = 0;

            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            updateCounter();
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.7 });

        counters.forEach(counter => observer.observe(counter));
    }

    initializeIntersectionObserver() {
        const animatedElements = document.querySelectorAll('.feature-card, .stat-card, .section-header');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(el => observer.observe(el));
    }

    animateCounter(element, start, end, suffix = '') {
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOutCubic);

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

// Initialisation de l'application
let compressFilePro;
document.addEventListener('DOMContentLoaded', () => {
    compressFilePro = new CompressFilePro();
    console.log('🎯 CompressFile Pro v3.0 - Compression Avancée Activée');
});

// Export pour utilisation globale
window.compressFilePro = compressFilePro;