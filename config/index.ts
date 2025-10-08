import { developmentConfig } from './environments/development'
import { stagingConfig } from './environments/staging'
import { productionConfig } from './environments/production'
import type { AppConfig, Environment } from './types'

const getConfig = (): AppConfig => {
  const env = (process.env.NODE_ENV || 'development') as Environment
  
  switch (env) {
    case 'staging':
      return stagingConfig as AppConfig
    case 'production':
      return productionConfig as AppConfig
    case 'development':
    default:
      return developmentConfig as AppConfig
  }
}

export const config = getConfig()
export type Config = AppConfig
