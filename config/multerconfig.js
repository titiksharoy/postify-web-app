const multer=require('multer');
const path=require('path');
const crypto=require('crypto');

 // Disk storage setup
 
const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb (null , './public/images/uploads');
    },
    filename: function (req, file, cb) {
   crypto.randomBytes(12 , (err,name)=>{ //creates a random name of the uploaded files so that they dont overwrite each other
    const fn = name.toString("hex")+ path.extname(file.originalname) // random name+ extraxting extension of the org_file using path.extname() method
    cb(null, fn)
   })
    
  }
})

// export upload variable

const upload= multer({storage : storage})
 module.exports = upload;