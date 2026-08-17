import React, { useState, useEffect, useRef } from 'react';
import { GuideArticle, GuideSection, Drill } from '../../types';
import { extractYoutubeId } from '../../lib/youtube';
import { normalizeImageUrl, isImgurAlbumUrl } from '../../lib/imageUtils';
import { X, Youtube, Dumbbell, Image as ImageIcon, Sparkles, Check, Heading3, List, Bold, Minus, Eye, Edit3, Plus, ImagePlus } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    sectionId: string;
    title: string;
    summary?: string;
    content: string;
    status: 'draft' | 'published';
    youtubeUrls?: string[];
    drillIds?: string[];
    photos?: { url: string; caption?: string }[];
  }) => Promise<void>;
  articleToEdit?: GuideArticle | null;
  defaultSectionId: string;
  sections: GuideSection[];
  drills: Drill[];
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  articleToEdit,
  defaultSectionId,
  sections,
  drills
}) => {
  const [sectionId, setSectionId] = useState(defaultSectionId || sections[0]?.id || '');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedDrillIds, setSelectedDrillIds] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photos, setPhotos] = useState<{ url: string; caption?: string }[]>([]);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [insertedPhotoIdx, setInsertedPhotoIdx] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing article on edit
  useEffect(() => {
    if (articleToEdit) {
      setSectionId(articleToEdit.sectionId);
      setTitle(articleToEdit.title);
      setSummary(articleToEdit.summary || '');
      setContent(articleToEdit.content);
      setStatus(articleToEdit.status || 'published');
      setYoutubeUrl(articleToEdit.youtubeUrls?.[0] || '');
      setSelectedDrillIds(articleToEdit.drillIds || []);
      setPhotos(articleToEdit.photos || []);
    } else {
      setSectionId(defaultSectionId || sections[0]?.id || '');
      setTitle('');
      setSummary('');
      setContent('');
      setStatus('published');
      setYoutubeUrl('');
      setSelectedDrillIds([]);
      setPhotos([]);
    }
  }, [articleToEdit, defaultSectionId, sections, isOpen]);

  // Insert markdown helpers (at cursor position if available)
  const insertMarkdown = (syntax: string) => {
    setPreviewTab('edit');
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + syntax + after;
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + syntax.length, start + syntax.length);
      }, 0);
    } else {
      setContent(prev => prev + syntax);
    }
  };

  // Helper to insert a photo markdown embed directly into article body
  const insertPhotoIntoArticle = (url: string, caption?: string, index?: number) => {
    const normalized = normalizeImageUrl(url);
    const altText = caption?.trim() || 'Reference Diagram';
    const embedSyntax = `\n![${altText}](${normalized})\n`;
    
    insertMarkdown(embedSyntax);

    if (index !== undefined) {
      setInsertedPhotoIdx(index);
      setTimeout(() => setInsertedPhotoIdx(null), 2000);
    }
  };

  const handleAddPhoto = () => {
    if (!photoUrl.trim()) return;
    const normalized = normalizeImageUrl(photoUrl.trim());
    setPhotos(prev => [...prev, { url: normalized, caption: photoCaption.trim() || undefined }]);
    setPhotoUrl('');
    setPhotoCaption('');
  };

  const handleAddAndInsertPhoto = () => {
    if (!photoUrl.trim()) return;
    const normalized = normalizeImageUrl(photoUrl.trim());
    const caption = photoCaption.trim() || undefined;
    const newPhoto = { url: normalized, caption };
    
    setPhotos(prev => [...prev, newPhoto]);
    insertPhotoIntoArticle(normalized, caption);
    
    setPhotoUrl('');
    setPhotoCaption('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const toggleDrill = (drillId: string) => {
    setSelectedDrillIds(prev =>
      prev.includes(drillId) ? prev.filter(id => id !== drillId) : [...prev, drillId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !sectionId) return;

    setIsSubmitting(true);
    try {
      await onSave({
        sectionId,
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: content.trim(),
        status,
        youtubeUrls: youtubeUrl.trim() ? [youtubeUrl.trim()] : [],
        drillIds: selectedDrillIds,
        photos
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const validYoutubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {articleToEdit ? 'Edit Coaching Guide' : 'Write New Coaching Guide'}
              </h2>
              <p className="text-xs text-slate-500">Capture fundamentals, cues, drills, and video links</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 flex-1">
          {/* Section & Status Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Section Category *
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Publication Status
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    status === 'published'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Published (Live)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    status === 'draft'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Draft (Private)
                </button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Article Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Batting Fundamentals (6-Step Sequence)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Quick Coaching Summary / Key Takeaways
            </label>
            <textarea
              rows={2}
              placeholder="1-2 sentences summarizing the core focus for coaches and players..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* YouTube Video URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              YouTube Video Link (Optional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-3 text-red-500">
                  <Youtube size={18} />
                </div>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {youtubeUrl && (
              <div className="mt-2 text-xs">
                {validYoutubeId ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check size={14} /> Valid YouTube link recognized (Video ID: {validYoutubeId})
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Note: Please verify link format (e.g. youtu.be/xxx or youtube.com/watch?v=xxx)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Markdown Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Written Guide Content (Markdown Supported) *
              </label>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('edit')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      previewTab === 'edit'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Edit3 size={12} />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('preview')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      previewTab === 'preview'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Eye size={12} />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Markdown Toolbar */}
            {previewTab === 'edit' && (
              <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800/80 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n### Step Title\n')}
                  className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-bold flex items-center gap-1 hover:bg-slate-50"
                  title="Header"
                >
                  <Heading3 size={12} /> H3
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**bold text**')}
                  className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-bold flex items-center gap-1 hover:bg-slate-50"
                  title="Bold"
                >
                  <Bold size={12} /> Bold
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n- Bullet point 1\n- Bullet point 2\n')}
                  className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-bold flex items-center gap-1 hover:bg-slate-50"
                  title="List"
                >
                  <List size={12} /> List
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n---\n')}
                  className="px-2 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-bold flex items-center gap-1 hover:bg-slate-50"
                  title="Divider"
                >
                  <Minus size={12} /> Divider
                </button>

                {photos.length > 0 && (
                  <div className="relative group ml-auto">
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold flex items-center gap-1 text-xs shadow-2xs transition-colors"
                      title="Insert reference photo at cursor position"
                    >
                      <ImageIcon size={12} />
                      <span>Insert Photo ({photos.length})</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 w-64 max-h-52 overflow-y-auto">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                        Click photo to insert at cursor:
                      </div>
                      {photos.map((p, idx) => {
                        const normalizedSrc = normalizeImageUrl(p.url);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => insertPhotoIntoArticle(p.url, p.caption, idx)}
                            className="w-full text-left px-2 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs flex items-center gap-2 transition-colors truncate group/item"
                          >
                            <img src={normalizedSrc} alt="" className="w-7 h-7 object-cover rounded-md shrink-0 border border-slate-200 dark:border-slate-700" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-bold text-slate-700 dark:text-slate-200 text-[11px]">
                                {p.caption || `Photo ${idx + 1}`}
                              </div>
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400">Click to embed</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewTab === 'edit' ? (
              <textarea
                ref={textareaRef}
                rows={12}
                required
                placeholder="Write step-by-step cues, positioning checkpoints, common flaws, and corrections..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-b-xl text-slate-900 dark:text-white text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[300px]">
                <MarkdownContent content={content || '*No content entered yet.*'} />
              </div>
            )}
          </div>

          {/* Cross-Link Drills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Cross-Link Practice Drills ({selectedDrillIds.length} Selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
              {drills.length === 0 ? (
                <div className="col-span-full p-4 text-center text-xs text-slate-400">
                  No drills in library yet.
                </div>
              ) : (
                drills.map(drill => {
                  const isSelected = selectedDrillIds.includes(drill.id);
                  return (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() => toggleDrill(drill.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{drill.title}</div>
                        <div className="text-[10px] opacity-75">{drill.category}</div>
                      </div>
                      {isSelected ? (
                        <Check size={14} className="shrink-0" />
                      ) : (
                        <Dumbbell size={14} className="shrink-0 opacity-40" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Photo Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Reference Photos ({photos.length})
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Tip: Click <strong>"Insert into Article"</strong> on any photo below to embed it into your text
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="url"
                placeholder="Image URL (e.g., https://i.imgur.com/xxx.jpg or Imgur link)"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Caption (e.g. Elbow slotting angle)"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={!photoUrl.trim()}
                  className="px-3 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                  title="Add to reference photos gallery"
                >
                  Add Photo
                </button>
                <button
                  type="button"
                  onClick={handleAddAndInsertPhoto}
                  disabled={!photoUrl.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors flex items-center gap-1 shadow-xs"
                  title="Add to gallery AND embed directly into article text"
                >
                  <ImagePlus size={14} />
                  <span>Add & Insert</span>
                </button>
              </div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((p, idx) => {
                  const normalizedSrc = normalizeImageUrl(p.url);
                  const isJustInserted = insertedPhotoIdx === idx;
                  return (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex flex-col shadow-2xs">
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-900">
                        <img src={normalizedSrc} alt={p.caption || 'Reference'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                        {p.caption && (
                          <div className="absolute inset-x-0 bottom-0 p-1 bg-black/75 text-[10px] text-white truncate px-2 font-medium">
                            {p.caption}
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => insertPhotoIntoArticle(p.url, p.caption, idx)}
                        className={`w-full py-2 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isJustInserted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isJustInserted ? (
                          <>
                            <Check size={13} />
                            <span>Inserted into Article!</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Insert into Article</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              {isSubmitting ? 'Saving Guide...' : articleToEdit ? 'Update Guide' : 'Publish Guide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
