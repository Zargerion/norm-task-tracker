'use client';
import { useEffect } from 'react';
import { getTaskSocket } from '@/lib/socket';

interface TaskSocketCallbacks {
  onCreated?: (task: any) => void;
  onUpdated?: (task: any) => void;
  onStatus?: (task: any) => void;
  onDeleted?: (payload: { id: string }) => void;
}

export function useTaskSocket(projectId: string | null, callbacks: TaskSocketCallbacks) {
  useEffect(() => {
    if (!projectId) return;

    const socket = getTaskSocket();

    const join = () => socket.emit('join', { projectId });

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const { onCreated, onUpdated, onStatus, onDeleted } = callbacks;

    if (onCreated) socket.on('task:created', onCreated);
    if (onUpdated) socket.on('task:updated', onUpdated);
    if (onStatus) socket.on('task:status', onStatus);
    if (onDeleted) socket.on('task:deleted', onDeleted);

    return () => {
      socket.emit('leave', { projectId });
      socket.off('connect', join);
      if (onCreated) socket.off('task:created', onCreated);
      if (onUpdated) socket.off('task:updated', onUpdated);
      if (onStatus) socket.off('task:status', onStatus);
      if (onDeleted) socket.off('task:deleted', onDeleted);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
}
