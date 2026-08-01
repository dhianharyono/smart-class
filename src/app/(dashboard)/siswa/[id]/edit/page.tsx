import React from 'react';
import EditSiswaClient from './EditSiswaClient';

export const dynamic = 'force-dynamic';

export default async function EditSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditSiswaClient id={id} />;
}
