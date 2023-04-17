import { File } from 'buffer'
import { ZendeskServiceProvider, ZendeskServiceProviderParams } from './ZendeskServiceProvider'
import { JsonDecoder } from 'ts.data.json'

export enum ServiceProviders {
  ZENDESK = 'zendesk',
}

export interface IServiceProvider {
  build(): Promise<{
    trainingData: File
    validationData?: File
  }>
}

export type TrainingData = {
  trainingData: File
  validationData?: File
}

export async function createServiceProvider(
  serviceProvider: string,
  params: string | never
): Promise<IServiceProvider> | never {
  switch (serviceProvider) {
    case ServiceProviders.ZENDESK: {
      const p = await JsonDecoder.object<ZendeskServiceProviderParams>(
        {
          apiKey: JsonDecoder.string,
        },
        'ZendeskServiceProviderParams'
      ).decodeToPromise(JSON.parse(params))
      return new ZendeskServiceProvider(p)
    }
    default:
      throw new Error(`Unknown service provider: ${serviceProvider}`)
  }
}
