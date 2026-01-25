
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/lib/security'

async function main() {
    const hashedPassword = await hashPassword('1234')

    // 1. Create Admin
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })
    console.log('Admin created: admin / 1234')

    // 2. Create Teachers
    const grades = [1, 2, 3]

    for (const grade of grades) {
        let teacher = await prisma.teacher.findUnique({ where: { grade } })

        if (!teacher) {
            teacher = await prisma.teacher.create({
                data: {
                    name: `Teacher Grade ${grade}`,
                    grade: grade
                }
            })
        }

        const username = `teacher${grade}`
        await prisma.user.upsert({
            where: { username },
            update: {
                teacherId: teacher.id
            },
            create: {
                username,
                password: hashedPassword,
                role: 'TEACHER',
                teacherId: teacher.id
            }
        })
        console.log(`Teacher created: ${username} / 1234`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
