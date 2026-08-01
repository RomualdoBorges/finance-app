import type {
  BackendHealth,
  BackendHealthRepository,
} from '../repositories/contracts/BackendHealthRepository'

export class BackendHealthService {
  private readonly repository: BackendHealthRepository

  constructor(repository: BackendHealthRepository) {
    this.repository = repository
  }

  getHealth(): BackendHealth {
    return this.repository.getHealth()
  }
}
