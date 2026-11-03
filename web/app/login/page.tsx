'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (res.ok) {
      localStorage.setItem('maru-token', data.token)
      router.push('/')
    } else {
      setError(data.error)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold text-white mb-8">🦆 maru</h1>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className="px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-yellow-400"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-8 py-4 bg-yellow-400 text-black font-bold rounded-xl text-xl disabled:opacity-40 hover:bg-yellow-300 transition"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>
    </main>
  )
}
