import { NextResponse } from 'next/server';

export async function GET() {
  // Map server env to role limits; keep compatibility with legacy keys
  const limitUser = Number(process.env.CHAT_LIMIT_USER || 20);
  const limitMember = Number(process.env.CHAT_LIMIT_MEMBER || 100);
  const limitProfessor = Number(process.env.CHAT_LIMIT_PROFESSOR || 300);
  const limitAdmin = Number(process.env.CHAT_LIMIT_ADMIN || 1000);
  const policy = {
    volunteer: limitMember,
    member: limitMember,
    executive: limitProfessor,
    admin: limitAdmin,
    // for completeness
    user: limitUser,
    professor: limitProfessor,
  };
  return NextResponse.json({ policy });
}

