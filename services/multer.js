const multer = require('multer')

const mimeType = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
]

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './assets/img/uploads')
    },
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1]
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + "." + extension)
    }
})

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!mimeType.includes(file.mimetype)) {
            req.multerError = true;
            return cb(null, false);
        }
        cb(null, true);
    }
})

module.exports = upload