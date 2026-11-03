'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import mqtt from 'mqtt'

const BROKER_URL = 'ws://43.202.237.62:9001'
const TOPIC_COMMAND  = 'home/light/command'
const TOPIC_STATUS   = 'home/light/status'
const TOPIC_COMMAND2 = 'home/light2/command'
const TOPIC_STATUS2  = 'home/light2/status'

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export default function Home() {
  const router = useRouter()
  const [client, setClient] = useState<mqtt.MqttClient | null>(null)
  const [connected, setConnected] = useState(false)

  const [lightOn,  setLightOn]  = useState(false)
  const [brightness,  setBrightness]  = useState(255)
  const [lightOn2, setLightOn2] = useState(false)
  const [brightness2, setBrightness2] = useState(255)

  useEffect(() => {
    const token = localStorage.getItem('maru-token')
    if (!token) { router.push('/login'); return }

    const payload = parseJwt(token)
    if (!payload) { router.push('/login'); return }

    const mqttClient = mqtt.connect(BROKER_URL, {
      username: payload.mqttUsername,
      password: payload.mqttPassword,
    })

    mqttClient.on('connect', () => {
      setConnected(true)
      mqttClient.subscribe(TOPIC_STATUS)
      mqttClient.subscribe(TOPIC_STATUS2)
    })

    mqttClient.on('message', (topic, payload) => {
      const message = payload.toString()
      try {
        const data = JSON.parse(message)
        if (topic === TOPIC_STATUS) {
          setLightOn(data.status === 'ON')
          if (data.brightness !== undefined) setBrightness(data.brightness)
        } else if (topic === TOPIC_STATUS2) {
          setLightOn2(data.status === 'ON')
          if (data.brightness !== undefined) setBrightness2(data.brightness)
        }
      } catch {
        if (topic === TOPIC_STATUS)  setLightOn(message.includes('ON'))
        if (topic === TOPIC_STATUS2) setLightOn2(message.includes('ON'))
      }
    })

    mqttClient.on('disconnect', () => setConnected(false))
    setClient(mqttClient)
    return () => { mqttClient.end() }
  }, [router])

  const sendCommand = (topic: string, action: string, value?: number) => {
    if (!client || !connected) return
    const payload = value !== undefined
      ? JSON.stringify({ action, value })
      : JSON.stringify({ action })
    client.publish(topic, payload)
  }

  const handleLogout = () => {
    localStorage.removeItem('maru-token')
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-10 px-6 py-10">
      <div className="w-full max-w-sm flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white">maru 🦆</h1>
        <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm transition">
          로그아웃
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-gray-300">{connected ? '브로커 연결됨' : '연결 중...'}</span>
      </div>

      {/* LED1 */}
      <div className="w-full max-w-sm flex flex-col gap-4 bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">💡 LED 1 (D4)</span>
          <div
            className="w-6 h-6 rounded-full transition-all duration-300"
            style={{ background: lightOn ? `rgba(250,204,21,${brightness / 255 * 0.8 + 0.2})` : '#374151' }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { sendCommand(TOPIC_COMMAND, 'ON'); setLightOn(true) }}
            disabled={!connected || lightOn}
            className="flex-1 py-3 bg-yellow-400 text-black font-bold rounded-xl disabled:opacity-40 hover:bg-yellow-300 transition"
          >켜기</button>
          <button
            onClick={() => { sendCommand(TOPIC_COMMAND, 'OFF'); setLightOn(false) }}
            disabled={!connected || !lightOn}
            className="flex-1 py-3 bg-gray-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-gray-500 transition"
          >끄기</button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-gray-300 text-sm">
            <span>밝기</span>
            <span>{Math.round(brightness / 255 * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={255} value={brightness}
            onChange={(e) => {
              const v = Number(e.target.value)
              setBrightness(v)
              sendCommand(TOPIC_COMMAND, 'BRIGHTNESS', v)
              setLightOn(v > 0)
            }}
            disabled={!connected}
            className="w-full accent-yellow-400 disabled:opacity-40"
          />
        </div>
      </div>

      {/* LED2 */}
      <div className="w-full max-w-sm flex flex-col gap-4 bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">💡 LED 2 (D17)</span>
          <div
            className="w-6 h-6 rounded-full transition-all duration-300"
            style={{ background: lightOn2 ? `rgba(52,211,153,${brightness2 / 255 * 0.8 + 0.2})` : '#374151' }}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { sendCommand(TOPIC_COMMAND2, 'ON'); setLightOn2(true) }}
            disabled={!connected || lightOn2}
            className="flex-1 py-3 bg-emerald-400 text-black font-bold rounded-xl disabled:opacity-40 hover:bg-emerald-300 transition"
          >켜기</button>
          <button
            onClick={() => { sendCommand(TOPIC_COMMAND2, 'OFF'); setLightOn2(false) }}
            disabled={!connected || !lightOn2}
            className="flex-1 py-3 bg-gray-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-gray-500 transition"
          >끄기</button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-gray-300 text-sm">
            <span>밝기</span>
            <span>{Math.round(brightness2 / 255 * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={255} value={brightness2}
            onChange={(e) => {
              const v = Number(e.target.value)
              setBrightness2(v)
              sendCommand(TOPIC_COMMAND2, 'BRIGHTNESS', v)
              setLightOn2(v > 0)
            }}
            disabled={!connected}
            className="w-full accent-emerald-400 disabled:opacity-40"
          />
        </div>
      </div>
    </main>
  )
}
