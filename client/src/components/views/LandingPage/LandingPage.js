import React,{useEffect} from 'react'
import axios from 'axios'

function LandingPage() {

    useEffect(() => {
        // 서버로 리퀘스트 보냄. 엔드포인트는 /api/hello
       axios.get('/api/hello')
       // 받은걸 출력
       .then(response => console.log(response.data))
    }, [])

    return (
        <div>
            LandingPage
        </div>
    )
}

export default LandingPage
