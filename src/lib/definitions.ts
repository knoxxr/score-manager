
import { type JWTPayload } from 'jose'

export interface SessionUser extends JWTPayload {
    id: number
    username: string
    role: 'ADMIN' | 'TEACHER'
    teacherId?: number
    grade?: number
}
