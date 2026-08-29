import type { IAuthRepository } from '@/domain/auth/AuthSession'

export class Login {
  private readonly authRepository: IAuthRepository

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository
  }

  execute(email: string, password: string) {
    return this.authRepository.login(email, password)
  }
}

export class RefreshSession {
  private readonly authRepository: IAuthRepository

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository
  }

  execute(refreshToken: string) {
    return this.authRepository.refresh(refreshToken)
  }
}

export class GetMe {
  private readonly authRepository: IAuthRepository

  constructor(authRepository: IAuthRepository) {
    this.authRepository = authRepository
  }

  execute() {
    return this.authRepository.getMe()
  }
}
