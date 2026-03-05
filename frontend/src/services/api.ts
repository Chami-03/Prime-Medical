import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
})

let token: string | null = null
const setToken = (t: string | null)=>{
  token = t
  if(t) instance.defaults.headers.common['Authorization'] = `Bearer ${t}`
  else delete instance.defaults.headers.common['Authorization']
}

instance.interceptors.response.use(r=>r, err=>{
  if(err.response && err.response.status===401){
    // optionally emit global event
  }
  return Promise.reject(err)
})

export default { ...instance, setToken }
