import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!
const ADMIN_USERNAME = process.env.ADMIN_USERNAME!
const ADMIN_PASSWORD_HASH = bcryptjs.hashSync(process.env.ADMIN_PASSWORD!, 10)

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (username !== ADMIN_USERNAME) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 })
  }

  const valid = bcryptjs.compareSync(password, ADMIN_PASSWORD_HASH)
  if (!valid) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 틀렸습니다.' }, { status: 401 })
  }

  const token = jwt.sign(
    {
      username,
      mqttUsername: process.env.MQTT_USERNAME,
      mqttPassword: process.env.MQTT_PASSWORD,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return NextResponse.json({ token })
}
