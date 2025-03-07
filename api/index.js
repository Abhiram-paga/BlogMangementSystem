const express=require('express');
const cors=require('cors');
const { mongoose } = require('mongoose');
const User=require('./models/User')
const app=express();
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const multer=require('multer');
const uploadMiddleware=multer({dest:'uploads/'});
const fs=require('fs');
const Post=require('./models/Post');


app.use('/uploads',express.static(__dirname+'/uploads'));
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}))
app.use(express.json());
app.use(cookieParser());

mongoose.connect('mongodb+srv://abhirampagadala38:w54YCnpG7igUhg1O@cluster0.3jsk6.mongodb.net/').then(()=>{console.log("Database connected")}).catch(err => console.error("Database connection error:", err));;

const salt=bcrypt.genSaltSync(10);
const secret='asdfghjkl';

app.post('/register',async (req,res)=>{
    const {username,password}=req.body;
    try{
        const userDoc=await User.create({
            username,password:bcrypt.hashSync(password,salt),
        })
        res.json(userDoc);
    }catch(e){
        res.status(400).json(e);
    }

})

app.post('/login',async (req,res)=>{
    const {username,password}=req.body;
    const userDoc=await User.findOne({username});
    const passOk=bcrypt.compareSync(password,userDoc.password);
    if(passOk){
        jwt.sign({username,id:userDoc._id},secret,{},(err,token)=>{
            if(err) throw err;
            res.cookie('token',token).json({
                id:userDoc._id,
                username,
            });
        });

    }else{
        res.status(400).json('wrong credentials');
    }
})

app.get('/profile',(req,res)=>{
    const {token}=req.cookies;
    jwt.verify(token,secret,{},(err,info)=>{
        if(err) throw err;
        res.json(info);
    })
});

app.post('/logout',(req,res)=>{
    res.cookie('token','').json('ok');
})

app.post('/post',uploadMiddleware.single('file'),async (req,res)=>{
    const {originalname,path}=req.file;
    const parts=originalname.split('.');
    const ext=parts[parts.length-1];
    const newPath=path+'.'+ext;
    fs.renameSync(path,newPath);

    const {token}=req.cookies;
    jwt.verify(token,secret,{},async (err,info)=>{
        if(err) throw err;
        const {title,summary,content}=req.body;
        const postDoc=await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author:info.id,
        });
        res.json(postDoc);
    });

   

    
});

app.get('/post',async (req,res)=>{
    res.json(
        await Post.find()
        .populate('author',['username'])
        .sort({createdAt:-1})
        .limit(20)
    );
});

app.get('/post/:id',async (req,res)=>{
    const {id}=req.params;
    const postDoc=await Post.findById(id).populate('author',['username']);
    res.json(postDoc);

})

app.put('/post',uploadMiddleware.single('file'),async (req,res)=>{
    let newPath=null;
    if(req.file){
        const {originalname,path}=req.file;
        const parts=originalname.split('.');
        const ext=parts[parts.length-1];
        newPath=path+'.'+ext;
        fs.renameSync(path,newPath);
    }

    const {token} =req.cookies;
    jwt.verify(token,secret,{},async (err,info)=>{
        if(err) throw err;
        const {id,title,summary,content}=req.body;
        const postDoc=await Post.findById(id);
        const isAuthor=JSON.stringify(postDoc.author)===JSON.stringify(info.id);
        if(!isAuthor){
            return res.status(400).json('you are not the author');
        }

        // await postDoc.update({
        //     title,
        //     summary,
        //     content,
        //     cover:newPath?newPath:postDoc.cover,
        // });
        postDoc.title = title;
        postDoc.summary = summary;
        postDoc.content = content;
        postDoc.cover = newPath ? newPath : postDoc.cover;

        await postDoc.save();


        res.json(postDoc);

        // const postDoc=await Post.create({
        //     title,
        //     summary,
        //     content,
        //     cover:newPath,
        //     author:info.id,
        // });
        // res.json(postDoc);
    });


})

app.listen(4000, () => console.log('Server running on http://localhost:4000'));

//w54YCnpG7igUhg1O