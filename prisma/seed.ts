import { PrismaClient, Role, FileStatus, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const [admin, hr, fin, it] = await Promise.all([
    prisma.department.create({ data: { name: "Administration", code: "ADM" } }),
    prisma.department.create({ data: { name: "Human Resources", code: "HR" } }),
    prisma.department.create({ data: { name: "Finance", code: "FIN" } }),
    prisma.department.create({ data: { name: "Information Technology", code: "IT" } }),
  ]);
  await prisma.department.createMany({
    data: [{ name: "Legal", code: "LGL" }, { name: "Operations", code: "OPS" }],
  });

  const users = await prisma.user.createManyAndReturn({
    data: [
      { email: "admin@fts.local", name: "System Administrator", passwordHash: hash("Admin@123"), role: Role.ADMIN, departmentId: admin.id },
      { email: "hr.officer@fts.local", name: "Hanna Rahman", passwordHash: hash("Officer@123"), role: Role.OFFICER, departmentId: hr.id },
      { email: "fin.officer@fts.local", name: "Fikru Tesfaye", passwordHash: hash("Officer@123"), role: Role.OFFICER, departmentId: fin.id },
      { email: "it.officer@fts.local", name: "Ismail Ahmed", passwordHash: hash("Officer@123"), role: Role.OFFICER, departmentId: it.id },
    ],
  });
  const [adminU, hrU, finU, itU] = users;

  const y = new Date().getFullYear();
  // File 1: HR -> Finance (received)
  const f1 = await prisma.file.create({
    data: {
      trackingNumber: `FTS-${y}-00001`, title: "Q3 Budget Proposal",
      description: "Departmental budget proposal for review.",
      status: FileStatus.RECEIVED, createdById: hrU.id, currentDepartmentId: fin.id,
    },
  });
  await prisma.fileMovement.createMany({
    data: [
      { fileId: f1.id, type: MovementType.CREATED, fromDepartmentId: hr.id, sentById: hrU.id, sentAt: new Date(Date.now() - 864e5 * 6), comment: "File registered" },
      { fileId: f1.id, type: MovementType.SENT, fromDepartmentId: hr.id, toDepartmentId: fin.id, sentById: hrU.id, sentAt: new Date(Date.now() - 864e5 * 5), comment: "For budget review", receivedById: finU.id, receivedAt: new Date(Date.now() - 864e5 * 4) },
    ],
  });
  // File 2: IT -> Finance (in transit)
  const f2 = await prisma.file.create({
    data: {
      trackingNumber: `FTS-${y}-00002`, title: "IT Equipment Purchase Request",
      description: "Procurement request for 15 workstations.",
      status: FileStatus.IN_TRANSIT, createdById: itU.id, currentDepartmentId: it.id,
    },
  });
  await prisma.fileMovement.createMany({
    data: [
      { fileId: f2.id, type: MovementType.CREATED, fromDepartmentId: it.id, sentById: itU.id, sentAt: new Date(Date.now() - 864e5 * 2), comment: "File registered" },
      { fileId: f2.id, type: MovementType.SENT, fromDepartmentId: it.id, toDepartmentId: fin.id, sentById: itU.id, sentAt: new Date(Date.now() - 864e5 * 1), comment: "Awaiting finance approval" },
    ],
  });
  // File 3: registered in HR (not sent)
  const f3 = await prisma.file.create({
    data: {
      trackingNumber: `FTS-${y}-00003`, title: "Employee Onboarding Checklist",
      status: FileStatus.REGISTERED, createdById: hrU.id, currentDepartmentId: hr.id,
    },
  });
  await prisma.fileMovement.create({
    data: { fileId: f3.id, type: MovementType.CREATED, fromDepartmentId: hr.id, sentById: hrU.id, sentAt: new Date(Date.now() - 864e5 * 3), comment: "File registered" },
  });

  console.log("Seed complete.", { admin: adminU.email });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());