import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { serve } from '@hono/node-server'

const app = new Hono()
const prisma = new PrismaClient()

// 1. GET all students
app.get('/students', async (c) => {
  const students = await prisma.student.findMany()
  return c.json(students)
})

// 2. GET all students with proctor details
app.get('/students/enriched', async (c) => {
  const students = await prisma.student.findMany({ include: { proctor: true } })
  return c.json(students)
})

// 3. GET all professors
app.get('/professors', async (c) => {
  const professors = await prisma.professor.findMany()
  return c.json(professors)
})

// 4. POST a new student
app.post('/students', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.id || !body.name || !body.dateOfBirth || !body.aadharNumber) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const student = await prisma.student.create({
      data: {
        id: body.id, // ID taken from user input
        name: body.name,
        dateOfBirth: new Date(body.dateOfBirth),
        aadharNumber: body.aadharNumber,
      },
    })
    return c.json(student, 201)
  } catch (error) {
    console.error('Error creating student:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// 5. POST a new professor
app.post('/professors', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.id || !body.name || !body.seniority || !body.aadharNumber) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const professor = await prisma.professor.create({
      data: {
        id: body.id, // ID taken from user input
        name: body.name,
        seniority: body.seniority,
        aadharNumber: body.aadharNumber,
      },
    })
    return c.json(professor, 201)
  } catch (error) {
    console.error('Error creating professor:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

// 6. GET students under a professor's proctorship
app.get('/professors/:professorId/proctorships', async (c) => {
  const professorId = parseInt(c.req.param('professorId'))
  const students = await prisma.student.findMany({ where: { proctorId: professorId.toString() } })
  return c.json(students)
})

// 7. PATCH update student details
app.patch('/students/:studentId', async (c) => {
  const studentId = parseInt(c.req.param('studentId'))
  const body = await c.req.json()
  const updatedStudent = await prisma.student.update({ where: { id: studentId.toString() }, data: body })
  return c.json(updatedStudent)
})

// 8. PATCH update professor details
app.patch('/professors/:professorId', async (c) => {
  const professorId = parseInt(c.req.param('professorId'))
  const body = await c.req.json()
  const updatedProfessor = await prisma.professor.update({ where: { id: professorId.toString() }, data: body })
  return c.json(updatedProfessor)
})

// 9. DELETE student
app.delete('/students/:studentId', async (c) => {
  const studentId = parseInt(c.req.param('studentId'))
  await prisma.student.delete({ where: { id: studentId.toString() } })
  return c.json({ message: 'Student deleted' })
})

// 10. DELETE professor
app.delete('/professors/:professorId', async (c) => {
  const professorId = parseInt(c.req.param('professorId'))
  await prisma.professor.delete({ where: { id: professorId.toString() } })
  return c.json({ message: 'Professor deleted' })
})

// 11. Assign student to a professor's proctorship
app.post('/professors/:professorId/proctorships', async (c) => {
  const professorId = parseInt(c.req.param('professorId'))
  const { studentId } = await c.req.json()
  const student = await prisma.student.update({ where: { id: studentId }, data: { proctorId: professorId.toString() } })
  return c.json(student)
})

// 12. GET library membership details
app.get('/students/:studentId/library-membership', async (c) => {
  const studentId = parseInt(c.req.param('studentId'))
  const membership = await prisma.libraryMembership.findUnique({ where: { studentId: studentId.toString() } })
  return c.json(membership)
})

// 13. POST create library membership
app.post('/students/:studentId/library-membership', async (c) => {
  const studentId = parseInt(c.req.param('studentId'))
  const body = await c.req.json()
  const membership = await prisma.libraryMembership.create({ data: { studentId, ...body } })
  return c.json(membership, 201)
})

// 14. PATCH update library membership
app.patch('/students/:studentId/library-membership', async (c) => {
  const studentId = parseInt(c.req.param('studentId'))
  const body = await c.req.json()
  const updatedMembership = await prisma.libraryMembership.update({ where: { studentId: studentId.toString() }, data: body })
  return c.json(updatedMembership)
})

// 15. DELETE library membership
app.delete('/students/:studentId/library-membership', async (c) => {
  const studentId = parseInt(c.req.param('studentId'))
  await prisma.libraryMembership.delete({ where: { studentId: studentId.toString() } })
  return c.json({ message: 'Library membership deleted' })
})

// Start server
serve({ fetch: app.fetch, port: 3000 })
console.log('Server is running on http://localhost:3000')

export default app
