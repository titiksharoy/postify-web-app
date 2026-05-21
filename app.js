const express=require('express');
const app=express();
const cookieParser = require('cookie-parser');
app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded ({extended : true}));
app.use(cookieParser());
const userModel=require("./models/user");
const postModel=require("./models/posts");
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const posts = require('./models/posts');

app.get('/', function(req,res){
    res.render("index");
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
        let token = jwt.sign({email: email,userid:user._id},"shhhhhh");
        res.cookie("token",token);
        res.send("registered");
   })
   })
  
});

app.post('/post', isLoggedIn, async function(req,res){
  let user=await  userModel.findOne({email : req.user.email});
  let {content}=req.body
  let post =  await postModel.create({
    user: user._id,
    content: content
  })
  user.posts.push(post._id);
  await user.save();
    res.redirect("/profile");
})

app.get('/profile', isLoggedIn, async function(req,res){
  let user=await  userModel.findOne({email : req.user.email}).populate("posts");
  
    console.log(user);
    res.render("profile",{user});
})

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
     res.redirect("/profile");

});

app.get('/edit/:id', isLoggedIn, async function(req,res){
  let post=await  postModel.findOne({_id : req.params.id}).populate("user");
 res.render("edit",{post});
 
});

app.post('/comment/:id', isLoggedIn, async function(req,res){
  let post=await  postModel.findById(req.params.id);
  post.comments.push({
    user : req.user.userid,
    text : req.body.comment
  });
  await post.save();
  res.redirect("/profile");

 
}); 

app.get('/deletecomment/:postid/:commentid', isLoggedIn, async function(req,res){
  let post=await  postModel.findById(req.params.postid);
  post.comments.pull(req.params.commentid);
  await post.save();
  res.redirect("/profile");
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
        let token = jwt.sign({email: email,userid:user._id},"shhhhhh");
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
  let data = jwt.verify(req.cookies.token, "shhhhhh");
    req.user = data;
    next();
}


app.listen(3000);