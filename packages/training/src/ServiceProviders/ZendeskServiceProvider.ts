import { File } from 'buffer'
import { TrainingData, IServiceProvider } from './ServiceProviders'

export interface ZendeskServiceProviderParams {
  apiKey: string
}

export class ZendeskServiceProvider implements IServiceProvider {
  private readonly apiKey: string

  /**
   *
   * @param p {ZendeskServiceProviderParams}
   */
  constructor(p: ZendeskServiceProviderParams) {
    this.apiKey = p.apiKey
  }

  async build(): Promise<TrainingData> {
    // TODO: fetch data from zendesk
    await new Promise((resolve) => setTimeout(() => resolve(this.apiKey), 1000))

    return {
      trainingData: new File(['train data'], 'train.jsonl'),
      validationData: new File(['valid data'], 'valid.jsonl'),
    }
  }
}
