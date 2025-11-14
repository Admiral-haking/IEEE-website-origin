import React from 'react';
import '@/lib/mongoose';
import Project from '@/models/Project';
import { Container, Typography } from '@mui/material';
import ProjectDetailClient, { ProjectView } from '@/views/projects/ProjectDetailClient';
import { getTokenFromCookies } from '@/server/auth/jwt';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string; locale: 'en'|'fa' }> }) {
  const { id } = await params;
  const p = await Project.findById(id).lean();
  if (!p || !p.published) {
    return (
      <Container sx={{ py: 6 }}>
        <Typography>Not found</Typography>
      </Container>
    );
  }
  let userId: string | null = null;
  let role: string | null = null;
  try {
    const t = await getTokenFromCookies();
    userId = t.sub; role = t.role;
  } catch {}
  const canEdit = !!(userId && (userId === String(p.createdBy) || role === 'admin' || role === 'executive'));
  const view: ProjectView = {
    id: String(p._id),
    title: p.title as any,
    description: (p as any).description || '',
    tags: (p as any).tags || [],
    createdBy: String((p as any).createdBy)
  };
  return <ProjectDetailClient project={view} canEditInitial={canEdit} />;
}
