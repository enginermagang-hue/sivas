import { migrate } from '../server/utils/migrate'

migrate().then(() => {
  console.log('done')
  process.exit(0)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
