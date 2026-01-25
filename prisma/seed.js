
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:./dev.db'
        }
    }
})

async function main() {
    const hashedPassword = await bcrypt.hash('1234', 10)

    // 1. Create Admin
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN'
        }
    })
    console.log('Admin created: admin / 1234')

    // 2. Create Teachers (if they exist, link them to users)
    // Ensure we have teachers for grade 1, 2, 3
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
