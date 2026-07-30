import { firebaseClients } from '../../lib/firebase/clients'
import { FirebaseAuthRepository } from '../../features/auth/repositories/FirebaseAuthRepository'
import { E2EAuthRepository } from '../../features/auth/repositories/E2EAuthRepository'
import { AuthService } from '../../features/auth/services/AuthService'
import { FirebaseBackendHealthRepository } from '../../repositories/firebase/FirebaseBackendHealthRepository'
import { BackendHealthService } from '../../services/BackendHealthService'
import { FirestoreUserRepository } from '../../features/user/repositories/FirestoreUserRepository'
import { E2EUserRepository } from '../../features/user/repositories/E2EUserRepository'
import { UserService } from '../../features/user/services/UserService'
import { E2EGroupRepository } from '../../features/group/repositories/E2EGroupRepository'
import { FirestoreGroupRepository } from '../../features/group/repositories/FirestoreGroupRepository'
import { FirestoreMembershipRepository } from '../../features/group/repositories/FirestoreMembershipRepository'
import { FirestorePersonalGroupProvisioningRepository } from '../../features/group/repositories/FirestorePersonalGroupProvisioningRepository'
import { GroupService } from '../../features/group/services/GroupService'
import { FirestoreCategoryRepository } from '../../features/category/repositories/FirestoreCategoryRepository'
import { E2ECategoryRepository } from '../../features/category/repositories/E2ECategoryRepository'
import { CategoryService } from '../../features/category/services/CategoryService'

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
const e2eGroupRepository =
  import.meta.env.MODE === 'e2e' ? new E2EGroupRepository() : null
const groupRepository =
  e2eGroupRepository ?? new FirestoreGroupRepository(firebaseClients.firestore)
const membershipRepository =
  e2eGroupRepository ??
  new FirestoreMembershipRepository(firebaseClients.firestore)
const groupProvisioningRepository =
  e2eGroupRepository ??
  new FirestorePersonalGroupProvisioningRepository(firebaseClients.firestore)
const categoryRepository =
  import.meta.env.MODE === 'e2e'
    ? new E2ECategoryRepository()
    : new FirestoreCategoryRepository(firebaseClients.firestore)

export const services = {
  backendHealth: new BackendHealthService(backendHealthRepository),
  auth: new AuthService(authRepository),
  user: new UserService(userRepository),
  group: new GroupService(
    groupProvisioningRepository,
    groupRepository,
    membershipRepository,
    userRepository,
  ),
  category: new CategoryService(categoryRepository),
} as const
