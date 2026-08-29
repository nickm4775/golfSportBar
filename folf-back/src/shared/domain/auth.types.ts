export interface JwtBusinessClaim {
  id: string;
  slug: string;
  name: string;
  role: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  kind?: 'STAFF' | 'CUSTOMER';
  customerId?: string;
  activeBusinessId?: string;
  permissions?: string[];
  businesses?: JwtBusinessClaim[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  activeBusinessId?: string;
  permissions: string[];
}
