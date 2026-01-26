import bcrypt from "bcryptjs"
import prismaPkg from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pgPkg from "pg"

const { PrismaClient } = prismaPkg
const { Pool } = pgPkg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
})

async function main() {
  const passwordHash = await bcrypt.hash("test123", 12)

  await prisma.admin.upsert({
    where: { email: "test@example.com" },
    update: {
      fullName: "Testing Test",
      password: passwordHash,
    },
    create: {
      fullName: "Testing Test",
      email: "test@example.com",
      password: passwordHash,
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
