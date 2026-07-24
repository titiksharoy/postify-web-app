const express=require('express');
const app=express();

require("dotenv").config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);
require("./config/mongoose-configuration");

const cookieParser = require('cookie-parser');
const path=require("path");
app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded ({extended : true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));
const userModel=require("./models/user");
const postModel=require("./models/posts");
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const posts = require('./models/posts');
const crypto=require("crypto");

const upload= require("./config/multerconfig");


app.get("/", function(req,res){
    res.render("index");
});


app.post("/upload", isLoggedIn , upload.single("image"), async (req,res)=>{
   let user = await userModel.findOne({ email : req.user.email });
  if (!req.file) {
    return res.status(400).send("Please select an image.");
}

user.profilepic = req.file.filename; 

   await user.save();
   res.redirect("/profile");
});

app.get("/profile/upload", function(req,res){
    res.render("profileupload");
});




app.get('/login', function(req,res){
    res.render("login");
});

app.post('/register', async function(req,res){
    let {email,password,name,username,age}=req.body
   let user = await userModel.findOne({email});
  if(user) return res.status(500).send("User already registerd");

   bcrypt.genSalt(10, function(err,salt){
   bcrypt.hash(password, salt, async function(err,hash){
     let user = await userModel.create({
            username,
            email,
            age,
            name,
           password : hash
        });
        let token = jwt.sign({email: email,userid:user._id},process.env.JWT_SECRET);
        res.cookie("token",token);
      res.redirect("/profile");
   })
   })
  
});

app.post('/post', isLoggedIn,  upload.single("image"), async function(req,res){
  let user=await  userModel.findOne({email : req.user.email});
  let {content}=req.body
  let image = "";
if(req.file){
    image = req.file.filename;
}
  let post =  await postModel.create({
    user: user._id,
    content: content,
   image: image
  });
  user.posts.push(post._id);
  await user.save();
    res.redirect("/profile");
})

app.get('/profile', isLoggedIn, async function(req,res){
  let user=await  userModel.findOne({email : req.user.email}).populate("posts");
  
    console.log(user);
    res.render("profile",{user});
});

/*app.get("/feed", isLoggedIn, async function(req, res){
let user = await userModel.findOne({ email: req.user.email });
    let posts = await postModel.find().populate("user");
    res.render("feed", { posts, user });

});*/
app.get("/feed", isLoggedIn, async function(req, res){
    let user = await userModel.findOne({ email: req.user.email });

    let posts = await postModel.find().populate("user");

   
    posts = posts.filter(post => post.user);

    res.render("feed", { posts, user });
});

app.get('/like/:id', isLoggedIn, async function(req,res){
  let post=await  postModel.findOne({_id : req.params.id}).populate("user");
  console.log(req.user);
  if(post.likes.indexOf(req.user.userid) == -1){
      post.likes.push(req.user.userid);
 
  }
else{
 post.likes.splice(post.likes.indexOf(req.user.userid),1);
}
 await post.save();
   // console.log(user);
   if(req.query.from === "feed"){
    res.redirect("/feed");
              }
           else{
    res.redirect("/profile");
     }

});

app.get('/edit/:id', isLoggedIn, async function(req,res){
  let post=await  postModel.findOne({_id : req.params.id}).populate("user");
 res.render("edit",{post});
 
});

app.get("/deletepost/:id", isLoggedIn, async function(req, res){
   let post = await postModel.findById(req.params.id);
   if(!post.user.equals(req.user.userid)){
    return res.send("Unauthorized");
   }
    let user = await userModel.findById(req.user.userid);
    user.posts.pull(post._id);
    await user.save();
    await post.deleteOne();
  if (req.query.from === "feed") {
    res.redirect("/feed");
} else {
    res.redirect("/profile");
}

});

app.post('/comment/:id', isLoggedIn, async function(req,res){
  let post=await  postModel.findById(req.params.id);
  post.comments.push({
    user : req.user.userid,
    text : req.body.comment
  });
  await post.save();
   if(req.query.from === "feed"){
    res.redirect("/feed");
              }
           else{
    res.redirect("/profile");
     }

 
}); 

app.get('/deletecomment/:postid/:commentid', isLoggedIn, async function(req,res){
  let post=await  postModel.findById(req.params.postid);
  post.comments.pull(req.params.commentid);
  await post.save();
 if(req.query.from === "feed"){
    res.redirect("/feed");
              }
           else{
    res.redirect("/profile");
     }
});  

app.post('/update/:id', isLoggedIn, async function(req,res){
  let post=await  postModel.findOneAndUpdate({_id : req.params.id},{content : req.body.content});
 res.redirect("/profile");

});
app.post('/login', async function(req,res){
    let {email,password,username}=req.body;
   let user = await userModel.findOne({email});
  if(!user) return res.status(500).send("User not registerd");

  bcrypt.compare(password,user.password,function(err,result){
     if(result) {
        let token = jwt.sign({email: email,userid:user._id},process.env.JWT_SECRET);
        res.cookie("token",token);
        res.status(200).redirect("/profile");  
     }
        else res.redirect("/login");
  })
  
});

app.get('/logout', function(req,res){
   res.cookie("token","");
   res.redirect("/login");
});

function isLoggedIn(req,res,next){
    if(!req.cookies.token) return res.send("you must be logged in");
  let data = jwt.verify(req.cookies.token,process.env.JWT_SECRET);
    req.user = data;
    next();
}


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});