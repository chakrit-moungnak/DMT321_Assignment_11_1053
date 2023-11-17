const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

  const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

//ทำให้สมบูรณ์
app.post('/profilepic', (req,res) => {
    let upload = multer({ storage: storage, fileFilter: imageFilter }).single('avatar');

    upload(req, res, async (err) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        }
        console.log('You uploaded this image filename: '+ req.file.filename);
        

        const img_file = req.file.filename;
        const user_username = req.cookies["username"];
        await res.cookie("img",img_file)
        await updateImg(user_username,img_file);
        return res.redirect('feed.html')
    });

 })

//ทำให้สมบูรณ์
// ถ้าต้องการจะลบ cookie ให้ใช้
// res.clearCookie('username');
app.get('/logout', (req,res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('index.html');
})

//ทำให้สมบูรณ์
app.get('/readPost', async (req,res) => {
    const log_data = await readJson("./js/postDB.json");
    await res.json(log_data)
    res.end();
})

//ทำให้สมบูรณ์
app.post('/writePost',async (req,res) => {
    const get_data = await req.body
    const req_username = get_data["user"];
    const req_msg = get_data["message"];

    const read_log = await readJson("./js/postDB.json");
    const length_log = Object.keys(read_log).length

    const count_post = ("post"+(length_log+1))
    const new_post = {}
    new_post[count_post] = {user:req_username,message:req_msg};

    const new_data = {...read_log,...new_post}

    console.log(new_data);
    const write = await writeJson(new_data,'./js/postDB.json');
    res.end();
})

//ทำให้สมบูรณ์
app.post('/checkLogin',async (req,res) => {
    // ถ้าเช็คแล้ว username และ password ถูกต้อง
    // return res.redirect('feed.html');
    // ถ้าเช็คแล้ว username และ password ไม่ถูกต้อง
    // return res.redirect('index.html?error=1')
    const get_data = await req.body

    const req_username = get_data["username"];
    const req_password = get_data["password"];

    const read_datauser = await readJson("./js/userDB.json");
    const length_user = Object.keys(read_datauser).length

    // console.log(length_user);

    for(let i = 0 ; i < length_user ; i++){
        
        let date_username = await read_datauser["user"+(i+1)]["username"];
        let date_password = await read_datauser["user"+(i+1)]["password"];
        let date_img = await read_datauser["user"+(i+1)]["img"];

        console.log(date_username);
        console.log(date_password);
        console.log(req_username);
        console.log(req_password);

        if((req_username == date_username )&& (req_password == date_password)){
            console.log("login pass");
            res.cookie("username",req_username)
            res.cookie("img",date_img)
            return  res.redirect('feed.html');
        }
    }

    return  res.redirect('index.html?error=1')
})

//ทำให้สมบูรณ์
const readJson = (file_name) => {
    return new Promise((resolve,reject) => {
        fs.readFile(file_name,'utf-8',(err,data)=>{
          if(err){
            reject(err);
          }
          else{
            resolve(JSON.parse(data));
          }
        })
    })
}

//ทำให้สมบูรณ์
const writeJson = (data,file_name) => {
    data = JSON.stringify(data,null,2)
    return new Promise((resolve,reject) => {
        fs.writeFile(file_name, data , (err) => {
            if (err) 
                reject(err);
            else
                resolve("SAVE!")
        })
    })
}

//ทำให้สมบูรณ์
const updateImg = async (username, fileimg) => {
    const read_data =  await readJson('./js/userDB.json');
    // console.log(read_data);
    let edit_data = read_data;

    const length_user = Object.keys(read_data).length
    
    for(let i = 0 ; i < length_user ; i++){
        if(edit_data["user"+(i+1)]["username"] == username){
            edit_data["user"+(i+1)]["img"] = fileimg;
        }
    }
    console.log(edit_data);
    await writeJson(edit_data,"./js/userDB.json");
}

 app.listen(port, hostname, () => {
        console.log(`Server running at   http://${hostname}:${port}/`);
});
