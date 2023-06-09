import { Logger } from '@/lib/logger'
import fs from 'fs'
import { execSyncCmd } from '@/lib/execSyncCmd'
import * as fileDataOf from '@/templates/init'
import { sleep } from '@/utils/time'
import {
  APP_REPO_URL,
  NEXT_REPO_URL,
  FUNCTIONS_PATH,
} from '@/lib/getSkeetConfig'
import { convertFromKebabCaseToLowerCase } from '@/utils/string'
import inquirer from 'inquirer'
import { InitQuestions } from '@/cli/init/initQuestions'

export const create = async (initAppName: string) => {
  const { template } = await askForTemplate()
  await skeetCreate(initAppName, template)
}

const askForTemplate = async () => {
  const projectInquirer = inquirer.prompt(InitQuestions.templateQuestions)
  let template = ''
  await projectInquirer.then(async (answer) => {
    template = answer.template
  })
  return { template }
}

export const skeetCreate = async (appName: string, template: string) => {
  const appDir = './' + appName
  if (fs.existsSync(appDir)) {
    Logger.error(`Directory ${appName} already exists.`)
    process.exit(0)
  }
  let gitCloneCmd = null
  if (template === 'Next.js (React)') {
    gitCloneCmd = ['git', 'clone', NEXT_REPO_URL, appName]
  } else {
    gitCloneCmd = ['git', 'clone', APP_REPO_URL, appName]
  }
  await execSyncCmd(gitCloneCmd)
  const yarnApiCmd = ['yarn']
  await execSyncCmd(yarnApiCmd, appDir)
  await execSyncCmd(yarnApiCmd, `${appDir}/${FUNCTIONS_PATH}/openai`)
  const rmDefaultGit = ['rm', '-rf', '.git']
  await execSyncCmd(rmDefaultGit, appDir)
  await sleep(1000)
  const yarnCmd = ['yarn']
  await execSyncCmd(yarnCmd, `./${appName}`)

  await generateInitFiles(appName, template)
  Logger.skeetAA()
  Logger.welcomText(appName)
  const nmb = Math.floor(Math.random() * 4 + 1)
  if (nmb === 4) {
    Logger.cmText()
  }
}

export const generateInitFiles = async (appName: string, template: string) => {
  const spinner = await Logger.syncSpinner('Generating init files...')
  // const tsconfigJson = await fileDataOf.tsconfigJson(appName)
  // fs.writeFileSync(
  //   tsconfigJson.filePath,
  //   JSON.stringify(tsconfigJson.body, null, 2)
  // )
  const defaultFunctionName = 'openai'
  await initPackageJson(appName)
  if (template === 'Expo (React Native)') {
    await initAppJson(appName)
  }

  await addAppNameToSkeetOptions(appName, defaultFunctionName)

  const eslintrcJson = await fileDataOf.eslintrcJson(appName, template)
  fs.writeFileSync(
    eslintrcJson.filePath,
    JSON.stringify(eslintrcJson.body, null, 2)
  )

  const eslintignore = await fileDataOf.eslintignore(appName, template)
  fs.writeFileSync(eslintignore.filePath, eslintignore.body)

  const firebaserc = await fileDataOf.firebaserc(appName)
  fs.writeFileSync(firebaserc.filePath, firebaserc.body)

  const firestoreIndexesJson = await fileDataOf.firestoreIndexesJson(appName)
  fs.writeFileSync(firestoreIndexesJson.filePath, firestoreIndexesJson.body)

  // Generate firestore.rules
  // const firestoreRules = await fileDataOf.firestoreRules(appName)
  // fs.writeFileSync(firestoreRules.filePath, firestoreRules.body)

  const prettierrc = await fileDataOf.prettierrc(appName)
  fs.writeFileSync(
    prettierrc.filePath,
    JSON.stringify(prettierrc.body, null, 2)
  )
  const skeetCloudConfigGen = await fileDataOf.skeetCloudConfigGen(
    appName,
    template
  )
  fs.writeFileSync(skeetCloudConfigGen.filePath, skeetCloudConfigGen.body)
  const prettierignore = await fileDataOf.prettierignore(appName, template)
  fs.writeFileSync(prettierignore.filePath, prettierignore.body)
  const gitignore = await fileDataOf.gitignore(appName, template)
  fs.writeFileSync(gitignore.filePath, gitignore.body)
  spinner.stop()
}

export const initPackageJson = async (appName: string) => {
  try {
    const filePath = `./${appName}/package.json`
    const packageJson = fs.readFileSync(filePath)
    const newPackageJson = JSON.parse(String(packageJson))
    newPackageJson.name = appName
    newPackageJson.version = '0.0.1'
    newPackageJson.description = `Full-stack Serverless Framework Skeet ${appName} App`
    fs.writeFileSync(filePath, JSON.stringify(newPackageJson, null, 2))
  } catch (error) {
    throw new Error(`initPackageJson: ${error}`)
  }
}

export const initAppJson = async (appName: string) => {
  const appDir = './' + appName
  const filePath = `${appDir}/app.json`
  const appJson = fs.readFileSync(filePath)
  const newAppJson = JSON.parse(String(appJson))
  const appNameLowerCase = convertFromKebabCaseToLowerCase(appName)
  newAppJson.expo.name = appName
  newAppJson.expo.slug = appName
  newAppJson.expo.scheme = appNameLowerCase
  newAppJson.expo.owner = 'skeet'
  newAppJson.expo.githubUrl = `https://github.com/YOUR_ACCOUNT/${appName}`
  newAppJson.expo.android.package = `com.skeet.${appNameLowerCase}`
  newAppJson.expo.ios.bundleIdentifier = `com.skeet.${appNameLowerCase}`
  fs.writeFileSync(filePath, JSON.stringify(newAppJson, null, 2))
}

export const addAppNameToSkeetOptions = async (
  appName: string,
  functionName: string
) => {
  try {
    const filePath = `./${appName}/functions/${functionName}/skeetOptions.json`
    const jsonFile = fs.readFileSync(filePath)
    const skeetOptions = JSON.parse(String(jsonFile))
    skeetOptions.name = appName
    fs.writeFileSync(filePath, JSON.stringify(skeetOptions, null, 2))
  } catch (error) {
    throw new Error(`addAppNameToSkeetOptions: ${error}`)
  }
}
