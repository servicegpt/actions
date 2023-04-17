import fs from 'fs/promises'
import * as artifact from '@actions/artifact'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'
import { Configuration, OpenAIApi, CreateFineTuneRequest } from 'openai'
import { IServiceProvider } from './ServiceProviders'

export type RunParams = {
  ghToken: string
  serviceProvider: IServiceProvider
  openaiApiKey: string
  model?: string
}

export const RunParamsDefaults = {
  model: 'davinci',
}

// eslint-disable-next-line @typescript-eslint/require-await
export const run = async (params: RunParams): Promise<void> => {
  const { ghToken, serviceProvider, openaiApiKey, model = RunParamsDefaults.model } = params
  core.info(`Using model: ${model}`)

  const oktokit = github.getOctokit(ghToken)

  const configuration = new Configuration({
    apiKey: openaiApiKey,
  })
  const openai = new OpenAIApi(configuration)

  try {
    core.info('Initalizing...')
    await io.mkdirP('data')

    core.info('Creating training data...')
    await fs.writeFile('data/train.jsonl', 'train data')

    core.info('Creating validation data...')
    await fs.writeFile('data/valid.jsonl', 'valid data')

    core.info('Uploading training data...')
    const trainingFile = await fs.readFile('data/train.jsonl')
    const createTrainingFileResp = await openai.createFile(trainingFile, 'fine-tune')
    if (createTrainingFileResp.status !== 200) {
      core.setFailed(`Failed to upload training data with status ${createTrainingFileResp.status}`)
      return
    }
    const trainingFileId = createTrainingFileResp.data.id

    core.info('Uploading training data...')
    const validationFile = await fs.readFile('data/valid.jsonl')
    const createValidationFileResp = await openai.createFile(validationFile, 'fine-tune')
    if (createValidationFileResp.status !== 200) {
      core.setFailed(`Failed to upload validation data with status ${createTrainingFileResp.status}`)
      return
    }
    const validationFileId = createValidationFileResp.data.id

    core.info('Building fine-tune request...')
    const request: CreateFineTuneRequest = {
      model,
      // Id of the uploaded file that contains the training data
      training_file: trainingFileId,
      // Id of the uploaded file that contains the validation data
      validation_file: validationFileId,
      n_epochs: null,
      batch_size: null,
      learning_rate_multiplier: null,
      prompt_loss_weight: null,
      compute_classification_metrics: null,
      classification_n_classes: null,
      classification_positive_class: null,
      classification_betas: null,
      suffix: null,
    }

    core.info('Starting training...')
    const resp = await openai.createFineTune(request)
    if (resp.status !== 200) {
      core.setFailed(`Training failed with status ${resp.status}`)
      return
    }

    core.info(`Saving fine-tuned model: ${resp.data.fine_tuned_model || 'none'}`)
    await io.mkdirP('model')
    await fs.writeFile('model/resp.json', JSON.stringify(resp.data))
    await artifact.create().uploadArtifact('model', ['*'], 'model')

    // Set the fine-tuned model as a secret
    await oktokit.rest.actions.createOrUpdateRepoSecret({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      secret_name: 'OPENAI_FINE_TUNED_MODEL',
      encrypted_value: resp.data.fine_tuned_model || '',
    })
    core.info('Saved fine-tuned model as a secret')
  } catch (err: unknown) {
    if (err instanceof Error) {
      core.setFailed(err)
    } else {
      core.setFailed(String(err))
    }
  }
}

async function buildTrainingModel(openai: OpenAIApi, serviceProvider: ServiceProvider) {
  const data = await serviceProvider.build()

  await openai.createFile(data.trainingData, 'fine-tune')

  if (data.validationData) {
    await openai.createFile(data.validationData, 'fine-tune')
  }
}
