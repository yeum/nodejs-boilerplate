const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const config = require('./config/key')

const {auth} = require('./middleware/auth')
const {User} = require('./models/User')

// client에서 오는 정보를 server에서 분석해서 가져올 수 있게함
// application/x-www-form-urlencoded 를 분석해서 가져올 수 있게함
app.use(bodyParser.urlencoded({extended: true}))
// application/json 타입을 분석해서 가져올 수 있게힘
app.use(bodyParser.json())
app.use(cookieParser())

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI,{
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/api/users/register', (req, res) => {
    // bcrypt로 비밀번호 암호화(Users.js의 next함수)

    // 회원가입 할 때 필요한 정보들을 client에서 가져오면
    // 그것들을 데이터베이스에 넣어준다.
    const user = new User(req.body)

    user.save((err, userInfo) => {
        if(err) return res.json({success: false, err})
        // status(200)은 성공했다는 표시
        return res.status(200).json({
            success: true
        })
    })
})

app.post('/api/users/login', (req, res) => {
    // 요청된 이메일을 데이터베이스에서 있는지 찾는다
    User.findOne({email: req.body.email}, (err, userInfo) => {
        // 일치하는 유저가 없으면
        if(!userInfo) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }

        // 일치하는 유저가 있다면 비밀번호가 같은지 확인
        userInfo.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch)
                return res.json({loginSuccess: false, massage: "비밀번호가 틀렸습니다."})
            
            // 비밀번호 일치 => 토큰생성
            userInfo.generateToken((err, userInfo) => {
                // 400은 에러
                if(err) return res.status(400).send(err)

                // 토큰을 쿠키, 로컬스토리지 등에 저장한다.
                // 이번에는 쿠키에 저장
                res.cookie("x_auth", userInfo.token)
                .status(200)
                .json({loginSuccess: true, userId: userInfo._id})
            })
        })
    })
})

// req 받은 후 callbackfunction받기 전에 작업을 수행하는 auth 미들웨어
app.get('/api/users/auth', auth, (req, res) => {
    // 여기까지 미들웨어를 통과해 왔다는 얘기는 Auth가 true 라는 것
    res.statusCode(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id: req.user._id}, 
        {token: ""},
    (err, user) => {
        if(err)return res.json({success: false, err})
        return res.status(200).send({
            success: true
        })
    })
})

app.listen(port, () => console.log('Example app listening on port ${port}!'))