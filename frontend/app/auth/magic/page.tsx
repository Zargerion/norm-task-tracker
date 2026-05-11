'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

function MagicContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }

    api.get(`/auth/magic?token=${encodeURIComponent(token)}`)
      .then(() => { setStatus('ok'); setTimeout(() => router.push('/projects'), 1500); })
      .catch(() => setStatus('error'));
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-8">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin mx-auto mb-4" />
            <p className="text-secondary">Выполняем вход...</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-primary font-medium">Добро пожаловать!</p>
            <p className="text-muted text-sm mt-1">Перенаправляем...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-primary font-medium">Ссылка недействительна</p>
            <p className="text-muted text-sm mt-1 mb-4">Запросите новую ссылку в Telegram-боте</p>
            <a href="/login" className="text-sm font-medium" style={{ color: '#C8773B' }}>← К форме входа</a>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function MagicPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="w-10 h-10 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin" />
      </div>
    }>
      <MagicContent />
    </Suspense>
  );
}
