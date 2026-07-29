import { firebaseClients } from '../../lib/firebase/clients'
import { FirebaseBackendHealthRepository } from '../../repositories/firebase/FirebaseBackendHealthRepository'
import { BackendHealthService } from '../../services/BackendHealthService'

const backendHealthRepository = new FirebaseBackendHealthRepository(
  firebaseClients,
)

export const services = {
  backendHealth: new BackendHealthService(backendHealthRepository),
} as const
