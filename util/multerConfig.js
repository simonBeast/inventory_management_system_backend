const multer = require('multer');
const multerStorage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null, 'uploads/images')
    },
    filename:(req,file,cb)=>{
        const ext = file.mimetype.split('/')[1]
        cb(null, `user-${Math.floor(Math.random()*1000000)+1}-${Date.now()}.${ext}`)
    }
})
const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }
    else{
        cb('Please Upload an image only',false)
    }
}
module.exports = multer({
    storage:multerStorage,
    fileFilter:multerFilter
})