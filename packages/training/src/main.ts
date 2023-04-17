import * as core from '@actions/core'
import { run } from './run'
import { createServiceProvider } from './ServiceProviders'

const main = async (): Promise<void> => {
  await run({
    ghToken: core.getInput('ghToken', { required: true }),
    serviceProvider: createServiceProvider(
      core.getInput('serviceProvider', { required: true }),
      core.getInput('serviceProviderParams', { required: true })
    ),
    openaiApiKey: core.getInput('openaiApiKey', { required: true }),
  })
}

main().catch((e) => core.setFailed(e instanceof Error ? e : String(e)))
