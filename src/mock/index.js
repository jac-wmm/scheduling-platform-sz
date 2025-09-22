import Mock from 'mockjs'
import scheduleMock from './modules/schedule'
import commonMock from './modules/common'

// 合并所有mock模块
const mockModules = [...scheduleMock, ...commonMock]

// 注册mock接口
mockModules.forEach(module => {
  Mock.mock(module.url, module.method || 'get', module.response)
})

export default Mock