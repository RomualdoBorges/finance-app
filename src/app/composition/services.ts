import { firebaseClients } from '../../lib/firebase/clients'
import { FirebaseAuthRepository } from '../../features/auth/repositories/FirebaseAuthRepository'
import { E2EAuthRepository } from '../../features/auth/repositories/E2EAuthRepository'
import { AuthService } from '../../features/auth/services/AuthService'
import { FirebaseBackendHealthRepository } from '../../repositories/firebase/FirebaseBackendHealthRepository'
import { BackendHealthService } from '../../services/BackendHealthService'

const backendHealthRepository = new FirebaseBackendHealthRepository(
  firebaseClients,
)
const authRepository =
  import.meta.env.MODE === 'e2e'
    ? new E2EAuthRepository()
    : new FirebaseAuthRepository(firebaseClients.auth)

export const services = {
  backendHealth: new BackendHealthService(backendHealthRepository),
  auth: new AuthService(authRepository),
} as const
