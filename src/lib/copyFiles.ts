import fs from 'fs'
import { Logger } from './logger'

const copyFile = (
  sourceFilePath: string,
  destinationFilePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourceFilePath)
    const writeStream = fs.createWriteStream(destinationFilePath)

    readStream.on('error', (error) => reject(error))
    writeStream.on('error', (error) => reject(error))

    writeStream.on('finish', () => resolve())

    readStream.pipe(writeStream)
  })
}

export const copyFileWithOverwrite = async (
  sourceFilePath: string,
  destinationFilePath: string
): Promise<void> => {
  try {
    if (fs.existsSync(destinationFilePath)) {
      fs.unlinkSync(destinationFilePath) // 既存のファイルを削除
    }
    await copyFile(sourceFilePath, destinationFilePath)
    Logger.success(`✔️ File copied: ${destinationFilePath}`)
  } catch (error) {
    console.error('Error copying file:', error)
  }
}
