import { NextRequest } from 'next/server'

const DEFAULT_USERNAME = 'ammarasad321993'
const DEFAULT_PASSWORD = 'i$b2334009'

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || DEFAULT_USERNAME
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD
  return { username, password }
}

export function getAdminSessionToken(): string {
  const { username, password } = getAdminCredentials()
  // Generate a simple secure token based on the credentials
  return Buffer.from(`${username}:${password}`).toString('base64')
}

export function verifyAdminCredentials(usernameInput: string, passwordInput: string): boolean {
  const { username, password } = getAdminCredentials()
  return usernameInput === username && passwordInput === password
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const adminSession = request.cookies.get('admin_session')?.value
  if (!adminSession) return false
  
  const expectedToken = getAdminSessionToken()
  return adminSession === expectedToken
}
