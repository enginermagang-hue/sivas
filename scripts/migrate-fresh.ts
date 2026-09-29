import { migrateFresh } from '../server/utils/migrate'

migrateFresh().then(() => {
  console.log('done')
  process.exit(0)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
