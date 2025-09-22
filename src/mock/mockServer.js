import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'
import scheduleMock from './modules/schedule'
import commonMock from './modules/common'

export function setupProdMockServer() {
  createProdMockServer([...scheduleMock, ...commonMock])
}