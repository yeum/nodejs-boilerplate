const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
// salt가 몇 글자인지 표시
const saltRounds = 10
const jwt = require('jsonwebtoken')


const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})
// 유저모델의 유저정보를 저장하기 전에 작업을 할 수 있게함.
// next 함수 작업이후 저장작업 진행하도록
// 비밀번호 암호화 수행
userSchema.pre('save', function(next) {
    // client로부터 받아온 유저정보 가져옴
    var user = this;
    
    // password가 변환될 때에만 암호화 하도록 조건작성
    if(user.isModified('password')) {
        // salt 생성
        // 에러나면 err, 성공하면 salt 전달
        bcrypt.genSalt(saltRounds, function(err,salt){
            if(err) return next(err)
            // 에러나면 err, 성공하면 hash된 비밀번호 전달
            bcrypt.hash(user.password, salt, function(err, hash){
                if(err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        next()
    }
})

userSchema.methods.comparePassword = function(plainPassword, callbackfunction) {
    // plainPassword 1234567    암호화된 비밀번호 $2b$10$bcv1PWCa2PiscU8lGZlkneNVvgHpJi1BqYH59Pxmukl.Rso1PsIce
    // 암호화 후 비교해야 함
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return callbackfunction(err)
        // 같으면 에러없고 isMatch 넘김
        callbackfunction(null, isMatch)
    })
}

userSchema.methods.generateToken = function(callbackfunction) {
    var user = this;

    // json web token 생성
    var token = jwt.sign(user._id.toHexString(), 'secretToken')
    // user._id + 'secretToken' = token
    // 이렇게 생성된 토큰을 이용해서 secretToken 으로 user._id가져올 수 있음

    user.token = token
    user.save(function(err, user) {
        if(err) return callbackfunction(err)
        callbackfunction(null, user)
    })
}

userSchema.statics.findByToken = function(token, callbackfunction) {
    var user = this;

    // 토큰을 복호화
    jwt.verify(token, 'secretToken', function(err, decoded) {
        // 유저 아이디를 이용해 유저를 찾은 후
        // 클라이언트에서 가져온 토큰과 DB에 보관된 토큰 비교
        user.findOne({"_id": decoded, "token": token}, function(err, user) {
            if(err) return callbackfunction(err)
            callbackfunction(null, user)
        })
    })
}

const User = mongoose.model('User', userSchema)

module.exports = {User}