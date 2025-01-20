import fs from 'fs'
import fspromise from 'fs/promises'


/* Synchronious File Reading */
const fileRead = fs.copyFileSync('./file.txt', 'sync-file.txt')



/*  Async File Reading */
const asyncRead = async () => {
  try {
    await fspromise.copyFile('./file.txt', 'copied.txt')
    console.log('File is copied successfully!!')
  } catch (error) {
    console.log(error)
  }
}

asyncRead()

/* Call Back Copy FIle */

fs.copyFile('./file.txt', 'callback.txt', (err) => {
  if (err) console.log(err)
})