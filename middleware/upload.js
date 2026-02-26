const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'logo') {
      uploadPath += 'logos/';
    } else if (file.fieldname === 'photos') {
      uploadPath += 'produits/';
    } else {
      uploadPath += 'autres/';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// Filtrer les types de fichiers (images uniquement)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP.'), false);
  }
};

// Upload pour le logo (1 fichier)
const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max
}).single('logo');

// Upload pour les photos produit (max 5 fichiers)
const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo par fichier
}).array('photos', 5);

module.exports = { uploadLogo, uploadPhotos };
