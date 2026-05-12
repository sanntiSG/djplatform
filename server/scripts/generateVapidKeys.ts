import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()
console.log('\nVAPID Keys generadas. Copiá estos valores en tu .env:\n')
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log('\nATENCION: Una vez que uses estas claves en produccion, NO las cambies.')
console.log('Cambiar las claves invalida todas las suscripciones existentes.\n')
