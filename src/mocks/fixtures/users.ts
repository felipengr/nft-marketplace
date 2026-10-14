export type UserRecord = {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  ensName: string | null
  passwordSalt: string
  passwordHash: string
  createdAt: string
}

export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: 'usr_ana',
      username: 'ana.lima',
      displayName: 'Ana Lima',
      email: 'ana@kurio.dev',
      avatarUrl: null,
      ensName: 'analima',
      passwordSalt: 'ana-7f3c9a',
      passwordHash: '97ab6e63c5295c65de7625fd180913cbef6d0a45dc3d73926ae99eecc7a9b1ed',
      createdAt: '2026-08-02T14:20:00.000Z',
    },
    {
      id: 'usr_bruno',
      username: 'bruno.costa',
      displayName: 'Bruno Costa',
      email: 'bruno@kurio.dev',
      avatarUrl: null,
      ensName: null,
      passwordSalt: 'bruno-2b9e41',
      passwordHash: 'c39f8c8764ffc103d4e24370757de5bc16848164c03e0027919bc54e6dd01f12',
      createdAt: '2026-09-11T09:05:00.000Z',
    },
  ]
}
