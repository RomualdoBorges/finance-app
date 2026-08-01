import { onRequest } from 'firebase-functions/v2/https'

export const health = onRequest(
  { region: 'southamerica-east1' },
  (_request, response) => {
    response.json({
      status: 'ok',
      environment: 'emulator',
    })
  },
)
