'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Globe, Lock, Users, Download, Edit2, Link2, Check, Eye, EyeOff, Upload, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface Props {
  user: any;
}

export function MaterialsClient({ user }: Props) {
  const { currentSpaceId, currentRole } = useAuthStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const role = currentRole() ?? 'EMPLOYEE';
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);

  useEffect(() => {
    if (!currentSpaceId) { setMaterials([]); return; }
    api.get(`/spaces/${currentSpaceId}/materials`).then(setMaterials).catch(() => setMaterials([]));
  }, [currentSpaceId]);

  function onSaved(material: any) {
    setMaterials((prev) => {
      const idx = prev.findIndex((m) => m.id === material.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = material; return next; }
      return [material, ...prev];
    });
    setSelected(material);
    setCreating(false);
  }

  function onDeleted(id: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  }

  return (
    <div className="flex h-full">
      {/* List panel */}
      <div className="w-72 flex-shrink-0 border-r border-card bg-sidebar flex flex-col">
        <div className="p-4 border-b border-card flex items-center justify-between">
          <h2 className="font-semibold text-primary text-sm">Материалы</h2>
          {canCreate && (
            <button onClick={() => { setSelected(null); setCreating(true); }}
              className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <Plus size={16} className="text-secondary" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {materials.map((m) => (
            <button key={m.id}
              onClick={() => { setSelected(m); setCreating(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${selected?.id === m.id ? 'border' : 'hover:bg-black/5 border border-transparent'}`}
              style={selected?.id === m.id ? { background: 'rgba(212,160,64,0.12)', borderColor: 'rgba(212,160,64,0.35)' } : undefined}>
              <div className="flex items-center gap-2 mb-0.5">
                {m.isPublic ? <Globe size={11} className="text-green-500 flex-shrink-0" />
                  : m.isSpaceWide ? <Users size={11} className="text-blue-400 flex-shrink-0" />
                    : <Lock size={11} className="text-muted flex-shrink-0" />}
                <span className="text-xs px-1.5 py-0.5 rounded bg-black/5 text-muted">{m.type}</span>
              </div>
              <div className="text-sm font-medium text-primary truncate">{m.title}</div>
              <div className="text-xs text-muted mt-0.5">{new Date(m.updatedAt).toLocaleDateString('ru')}</div>
            </button>
          ))}
          {materials.length === 0 && (
            <div className="text-center py-8 text-muted text-sm">
              {currentSpaceId ? 'Материалов нет' : 'Выберите пространство'}
            </div>
          )}
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 overflow-y-auto">
        {creating ? (
          <MaterialEditor spaceId={currentSpaceId!} material={null} onSaved={onSaved} onCancel={() => setCreating(false)} />
        ) : selected ? (
          <MaterialView
            material={selected}
            role={role}
            spaceId={currentSpaceId!}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted">
            <div className="text-center">
              <div className="text-4xl mb-3">📄</div>
              <p>Выберите материал</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialView({ material, role, spaceId, onSaved, onDeleted }: any) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role);
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  useEffect(() => {
    if (material.type !== 'HTML' || !iframeRef.current) return;
    const content = material.content || (material.htmlUrl ? '' : '');
    if (!content && material.htmlUrl) {
      iframeRef.current.src = material.htmlUrl;
      return;
    }
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(wrapHtml(material.title, content));
    doc.close();
  }, [material]);

  async function handleDelete() {
    if (!confirm(`Удалить материал «${material.title}»?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/spaces/${spaceId}/materials/${material.id}`);
      onDeleted(material.id);
    } finally {
      setDeleting(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/m/${material.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const content = material.type === 'HTML'
      ? (material.content ? wrapHtml(material.title, material.content) : null)
      : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${material.title}</title></head><body>${material.content ?? ''}</body></html>`;
    if (!content) { if (material.htmlUrl) window.open(material.htmlUrl, '_blank'); return; }
    const blob = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${material.title}.html`;
    a.click();
  }

  if (editing) {
    return <MaterialEditor spaceId={spaceId} material={material}
      onSaved={(m: any) => { onSaved(m); setEditing(false); }}
      onCancel={() => setEditing(false)} />;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <h1 className="text-3xl font-semibold text-primary leading-tight"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {material.title}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card text-secondary text-sm hover:bg-black/5 transition-colors">
            {copied ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
            <span>{copied ? 'Скопировано' : 'Ссылка'}</span>
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card text-secondary text-sm hover:bg-black/5 transition-colors">
            <Download size={14} />
          </button>
          {canEdit && (
            <button onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg gold-gradient text-white text-sm hover:opacity-90 transition-opacity">
              <Edit2 size={14} />
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} disabled={deleting}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        {material.type === 'MARKDOWN' ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{material.content ?? ''}</ReactMarkdown>
        ) : (
          <iframe
            ref={iframeRef}
            src={!material.content && material.htmlUrl ? material.htmlUrl : undefined}
            className="w-full rounded-2xl border border-card shadow-card"
            style={{ minHeight: '60vh', background: '#FDFAF4' }}
            sandbox="allow-scripts allow-same-origin"
            title={material.title}
          />
        )}
      </div>

      {material.attachments?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-card">
          <h3 className="text-sm font-semibold text-secondary mb-3">Прикреплённые файлы</h3>
          <div className="space-y-2">
            {material.attachments.map((att: any) => (
              <a key={att.id} href={att.url} download
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-card hover:bg-black/5 transition-colors text-sm text-secondary">
                📎 {att.filename}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialEditor({ spaceId, material, onSaved, onCancel }: any) {
  const [form, setForm] = useState({
    title: material?.title ?? '',
    type: material?.type ?? 'MARKDOWN',
    content: material?.content ?? '',
    isPublic: material?.isPublic ?? false,
    isSpaceWide: material?.isSpaceWide ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (form.type !== 'HTML' || !preview || !iframeRef.current || !form.content) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(wrapHtml(form.title || 'Предпросмотр', form.content));
    doc.close();
  }, [preview, form.content, form.title, form.type]);

  function handleHtmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, content: ev.target?.result as string }));
    };
    reader.readAsText(file, 'utf-8');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = material
        ? await api.patch(`/spaces/${spaceId}/materials/${material.id}`, form)
        : await api.post(`/spaces/${spaceId}/materials`, form);
      onSaved(result);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border bg-panel text-sm focus:outline-none transition-all";
  const inputStyle = { borderColor: 'var(--border-card)' };

  return (
    <form onSubmit={handleSubmit} className="p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-primary" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {material ? 'Редактировать' : 'Новый материал'}
        </h2>
        {form.type === 'MARKDOWN' && (
          <button type="button" onClick={() => setPreview(!preview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card text-secondary text-sm hover:bg-black/5 transition-colors">
            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{preview ? 'Скрыть' : 'Предпросмотр'}</span>
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Название *</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputCls} style={inputStyle} />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
          <span className="text-sm text-secondary flex items-center gap-1"><Globe size={13} />Публичный</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isSpaceWide} onChange={(e) => setForm({ ...form, isSpaceWide: e.target.checked })} />
          <span className="text-sm text-secondary flex items-center gap-1"><Users size={13} />Всем в пространстве</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary mb-1.5">Тип</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, content: '' })}
          className={inputCls} style={{ ...inputStyle, width: 'auto' }}>
          <option value="MARKDOWN">Markdown</option>
          <option value="HTML">HTML</option>
        </select>
      </div>

      {form.type === 'MARKDOWN' && (
        <div className={`grid gap-4 ${preview ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Текст (Markdown)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={20}
              className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
              style={inputStyle} />
          </div>
          {preview && (
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Предпросмотр</label>
              <div className="prose prose-sm max-w-none p-4 rounded-lg border bg-panel overflow-y-auto"
                style={{ borderColor: 'var(--border-card)', minHeight: '520px' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '*Начните вводить текст...*'}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {form.type === 'HTML' && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-secondary">HTML файл</label>
          <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer hover:bg-black/5 transition-colors"
            style={{ borderColor: 'var(--border-card)' }}>
            <Upload size={18} className="text-muted" />
            <span className="text-sm text-secondary">
              {form.content ? 'Файл загружен — нажмите чтобы заменить' : 'Выберите .html файл'}
            </span>
            <input type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlFile} />
          </label>

          {form.content && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setPreview(!preview)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card text-secondary text-sm hover:bg-black/5 transition-colors">
                  {preview ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{preview ? 'Скрыть' : 'Предпросмотр'}</span>
                </button>
              </div>
              {preview && (
                <iframe ref={iframeRef}
                  className="w-full rounded-xl border border-card shadow-card"
                  style={{ minHeight: '50vh', background: '#FDFAF4' }}
                  sandbox="allow-scripts allow-same-origin"
                  title="Предпросмотр"
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-card text-secondary text-sm font-medium hover:bg-black/5 transition-colors">
          Отмена
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2.5 rounded-xl gold-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
}

function wrapHtml(title: string, content: string) {
  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: 'Georgia', serif; line-height: 1.7; color: #2C2416;
             max-width: 800px; margin: 0 auto; padding: 2rem; background: #FDFAF4; }
      h1,h2,h3 { font-family: 'Cormorant Garamond', Georgia, serif; }
      a { color: #C8773B; } code { background: rgba(44,36,22,0.06); padding: 2px 6px; border-radius: 4px; }
      pre { background: rgba(44,36,22,0.06); padding: 1rem; border-radius: 8px; overflow-x: auto; }
      img { max-width: 100%; border-radius: 8px; }
      table { border-collapse: collapse; width: 100%; }
      th,td { border: 1px solid rgba(200,169,110,0.3); padding: 8px 12px; }
      th { background: rgba(200,169,110,0.1); }
    </style>
    <title>${title}</title>
  </head><body>${content}</body></html>`;
}
