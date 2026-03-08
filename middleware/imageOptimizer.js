const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Middleware pour optimiser les images après upload.
 * Redimensionne et compresse les images en WebP/JPEG.
 */
const optimizeImages = async (req, res, next) => {
  try {
    const files = [];

    // Collecter tous les fichiers uploadés
    if (req.file) files.push(req.file);
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        // req.files est un objet (multer .fields())
        Object.values(req.files).forEach(arr => files.push(...arr));
      }
    }

    if (files.length === 0) return next();

    for (const file of files) {
      const filePath = path.resolve(file.path);

      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) continue;

      const ext = path.extname(file.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;

      // Déterminer la taille max selon le type
      let maxWidth = 1200;
      let quality = 80;

      if (file.fieldname === 'logo') {
        maxWidth = 400;
        quality = 85;
      } else if (file.fieldname === 'photos') {
        maxWidth = 1200;
        quality = 80;
      } else if (file.fieldname === 'document' || file.fieldname === 'selfie') {
        maxWidth = 1600;
        quality = 85;
      }

      const tempPath = filePath + '.tmp';

      await sharp(filePath)
        .resize(maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .jpeg({ quality, mozjpeg: true })
        .toFile(tempPath);

      // Remplacer l'original par la version optimisée
      fs.unlinkSync(filePath);
      fs.renameSync(tempPath, filePath);

      // Mettre à jour les infos du fichier
      const stats = fs.statSync(filePath);
      const originalSize = file.size;
      file.size = stats.size;

      logger.info('Image optimisée', {
        file: file.filename,
        originalSize,
        newSize: stats.size,
        reduction: `${Math.round((1 - stats.size / originalSize) * 100)}%`,
      });
    }

    next();
  } catch (err) {
    logger.error('Erreur optimisation image:', { error: err.message });
    // Ne pas bloquer la requête si l'optimisation échoue
    next();
  }
};

module.exports = { optimizeImages };
