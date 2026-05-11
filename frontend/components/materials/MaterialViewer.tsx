'use client';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Globe, Lock, Users, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  material: any;
}

export function MaterialViewer({ material }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (material.type !== 'HTML' || !iframeRef.current) return;
    const content = material.content || '';
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.7; color: #2C2416;
               max-width: 800px; margin: 0 auto; padding: 2rem; background: #FDFAF4; }
        h1,h2,h3 { font-family: 'Cormorant Garamond', Georgia, serif; }
        a { color: #C8773B; }
        code { background: rgba(44,36,22,0.06); padding: 2px 6px; border-radius: 4px; }
        pre { background: rgba(44,36,22,0.06); padding: 1rem; border-radius: 8px; overflow-x: auto; }
        img { max-width: 100%; border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; }
        th,td { border: 1px solid rgba(200,169,110,0.3); padding: 8px 12px; text-align: left; }
        th { background: rgba(200,169,110,0.1); }
      </style>
    </head><body>${content}</body></html>`);
    doc.close();
  }, [material]);

  const accessIcon = material.isPublic
    ? <Globe size={13} className="text-green-500" />
    : material.isSpaceWide
    ? <Users size={13} className="text-blue-400" />
    : <Lock size={13} className="text-muted" />;

  const accessLabel = material.isPublic ? 'Публичный' : material.isSpaceWide ? 'Пространство' : 'Приватный';

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-card bg-panel/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted hover:text-secondary transition-colors">
            <ArrowLeft size={15} />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 600 }}>
              Norm Tracker
            </span>
          </Link>
          <div className="h-4 w-px bg-card ml-1" />
          <div className="flex items-center gap-2 text-xs text-muted">
            {accessIcon}
            <span>{accessLabel}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted ml-auto">
            <Calendar size={12} />
            <span>{new Date(material.updatedAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-semibold text-primary mb-8 leading-tight"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {material.title}
        </h1>

        {material.type === 'MARKDOWN' ? (
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {material.content ?? ''}
            </ReactMarkdown>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full rounded-2xl border border-card shadow-card"
            style={{ minHeight: '70vh', background: '#FDFAF4' }}
            sandbox="allow-scripts allow-same-origin"
            title={material.title}
          />
        )}

        {material.attachments?.length > 0 && (
          <div className="mt-12 pt-8 border-t border-card">
            <h3 className="text-sm font-semibold text-secondary mb-4">Прикреплённые файлы</h3>
            <div className="space-y-2">
              {material.attachments.map((att: any) => (
                <a key={att.id} href={att.url} download
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-card hover:bg-black/5 transition-colors text-sm text-secondary">
                  📎 {att.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
