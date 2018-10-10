import * as Stream from 'stream'

export function unwrapStream<T>(stream: Stream): Promise<T> {
  return new Promise<any>((resolve, reject) => {
    const data: string[] = []
    stream.on('data', chunk => {
      if (chunk instanceof Buffer) {
        data.push(chunk.toString('utf8'))
      } else {
        data.push(chunk)
      }
    })
    stream.once('end', () => {
      const allData = data.join()
      if (allData === '' || allData === undefined) {
        resolve(undefined)
      } else {
        try {
          resolve(JSON.parse(allData))
        } catch (err) {
          reject(err)
        }
      }
    })
    stream.on('error', err => reject(err))
  })
}
