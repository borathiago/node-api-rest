import { app } from './app.ts'
import { env } from './env'

app.listen({
    port: env.PORT
}).then(()=>{
    console.log('HTTP Server Running')
})