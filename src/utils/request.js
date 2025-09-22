import axios from 'axios'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`
    // }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    
    // 根据后端返回的数据格式进行处理
    if (res.code !== 200) {
      // 错误处理
      console.error('API Error:', res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res.data
  },
  error => {
    console.error('Network Error:', error.message)
    // 可以在这里添加全局错误处理
    if (error.response?.status === 401) {
      // 处理认证失败
      console.log('认证失败，请重新登录')
    }
    return Promise.reject(error)
  }
)

// 封装常用的请求方法
export const get = (url, params) => request.get(url, { params })
export const post = (url, data) => request.post(url, data)
export const put = (url, data) => request.put(url, data)
export const del = (url) => request.delete(url)

export default request