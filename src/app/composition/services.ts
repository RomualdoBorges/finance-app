import { firebaseClients } from '../../lib/firebase/clients'
import { FirebaseAuthRepository } from '../../features/auth/repositories/FirebaseAuthRepository'
import { E2EAuthRepository } from '../../features/auth/repositories/E2EAuthRepository'
import { AuthService } from '../../features/auth/services/AuthService'
import { FirebaseBackendHealthRepository } from '../../repositories/firebase/FirebaseBackendHealthRepository'
import { BackendHealthService } from '../../services/BackendHealthService'
import { FirestoreUserRepository } from '../../features/user/repositories/FirestoreUserRepository'
import { E2EUserRepository } from '../../features/user/repositories/E2EUserRepository'
import { UserService } from '../../features/user/services/UserService'

const backendHealthRepository = new FirebaseBackendHealthRepository(
  firebaseClients,
)
const authRepository =
  import.meta.env.MODE === 'e2e'
    ? new E2EAuthRepository()
    : new FirebaseAuthRepository(firebaseClients.auth)
const userRepository =
  import.meta.env.MODE === 'e2e'
    ? new E2EUserRepository()
    : new FirestoreUserRepository(firebaseClients.firestore)

export const services = {
  backendHealth: new BackendHealthService(backendHealthRepository),
  auth: new AuthService(authRepository),
  user: new UserService(userRepository),
} as const
