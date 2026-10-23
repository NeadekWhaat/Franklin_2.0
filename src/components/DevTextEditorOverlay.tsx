import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFranklin } from '../context/FranklinContext';
import {
  Edit3,
  Check,
  RotateCcw,
  X,
  MousePointerClick,
  ListFilter,
  Sparkles,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface EditableSegment {
  originalText: string;
  currentValue: string;
  nodeRef?: Text;
}

const originalTextByNode = new WeakMap<Text, string>();
const appliedTextByNode = new WeakMap<Text, string>();

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SVG', 'PATH', 'CODE']);

function isInsideIgnoredContainer(node: Node | null): boolean {
  let curr: Node | null = node;
  while (curr && curr !== document.body) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const el = curr as HTMLElement;
      if (el.dataset && el.dataset.devEditorIgnore === 'true') {
        return true;
      }
      if (IGNORED_TAGS.has(el.tagName)) {
        return true;
      }
    }
    curr = curr.parentNode;
  }
  return false;
}

export const DevTextEditorOverlay: React.FC = () => {
  const {
    isEditMode,
    setIsEditMode,
    customTexts,
    setCustomText,
    removeCustomText,
    clearAllCustomTexts,
    language,
  } = useFranklin();

  const isRu = language === 'ru';

  const [clickMode, setClickMode] = useState<'edit' | 'navigate'>('edit');
  const [selectedSegments, setSelectedSegments] = useState<EditableSegment[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const clickedActionElementRef = useRef<HTMLElement | null>(null);
  const bypassInterceptRef = useRef<boolean>(false);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  // Synchronize customTexts with all DOM Text nodes safely (never mutates Element hierarchy)
  const syncDomTextNodes = useCallback(() => {
    const root = document.getElementById('root');
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        if (isInsideIgnoredContainer(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let currentNode = walker.nextNode() as Text | null;
    while (currentNode) {
      const rawVal = currentNode.nodeValue || '';
      const trimmedVal = rawVal.trim();

      const lastApplied = appliedTextByNode.get(currentNode);
      if (!originalTextByNode.has(currentNode) || (lastApplied !== undefined && rawVal !== lastApplied)) {
        // React updated this node's text (or first time seeing this node)
        originalTextByNode.set(currentNode, trimmedVal);
      }

      const origKey = originalTextByNode.get(currentNode) || trimmedVal;
      const customOverride = customTexts[origKey];

      const leadingSpace = rawVal.match(/^\s*/)?.[0] || '';
      const trailingSpace = rawVal.match(/\s*$/)?.[0] || '';

      const targetText =
        customOverride !== undefined
          ? `${leadingSpace}${customOverride}${trailingSpace}`
          : `${leadingSpace}${origKey}${trailingSpace}`;

      if (currentNode.nodeValue !== targetText) {
        currentNode.nodeValue = targetText;
      }
      appliedTextByNode.set(currentNode, targetText);

      currentNode = walker.nextNode() as Text | null;
    }
  }, [customTexts]);

  useEffect(() => {
    syncDomTextNodes();

    const root = document.getElementById('root');
    if (!root) return;

    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        syncDomTextNodes();
      });
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [syncDomTextNodes]);

  // Clear hover highlight helper
  const clearHoverOutline = useCallback(() => {
    if (hoveredElementRef.current) {
      hoveredElementRef.current.style.outline = '';
      hoveredElementRef.current.style.outlineOffset = '';
      hoveredElementRef.current = null;
    }
  }, []);

  // Hover & Click interception when isEditMode && clickMode === 'edit'
  useEffect(() => {
    if (!isEditMode || clickMode !== 'edit') {
      clearHoverOutline();
      return;
    }

    const collectEditableSegments = (targetEl: HTMLElement): EditableSegment[] => {
      const segments: EditableSegment[] = [];
      const seenOriginals = new Set<string>();

      const extractFromElement = (el: HTMLElement) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            if (isInsideIgnoredContainer(node)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let n = walker.nextNode() as Text | null;
        while (n && segments.length < 6) {
          const raw = n.nodeValue || '';
          const trimmed = raw.trim();
          const orig = originalTextByNode.get(n) || trimmed;
          if (orig && !seenOriginals.has(orig)) {
            seenOriginals.add(orig);
            segments.push({
              originalText: orig,
              currentValue: customTexts[orig] !== undefined ? customTexts[orig] : orig,
              nodeRef: n,
            });
          }
          n = walker.nextNode() as Text | null;
        }
      };

      extractFromElement(targetEl);
      if (segments.length === 0 && targetEl.parentElement) {
        extractFromElement(targetEl.parentElement);
      }
      return segments;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || isInsideIgnoredContainer(target)) {
        clearHoverOutline();
        return;
      }

      // Find closest meaningful text container
      const segs = collectEditableSegments(target);
      if (segs.length === 0) {
        clearHoverOutline();
        return;
      }

      if (hoveredElementRef.current !== target) {
        clearHoverOutline();
        hoveredElementRef.current = target;
        target.style.outline = '2px dashed #f59e0b';
        target.style.outlineOffset = '3px';
      }
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (bypassInterceptRef.current) return;

      const target = e.target as HTMLElement | null;
      if (!target || isInsideIgnoredContainer(target)) return;

      const segments = collectEditableSegments(target);
      if (segments.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      // Check if user clicked inside a button or interactive link
      const interactiveEl = target.closest('button, a, [role="button"]') as HTMLElement | null;
      clickedActionElementRef.current = interactiveEl;

      const initialDrafts: Record<string, string> = {};
      segments.forEach((seg) => {
        initialDrafts[seg.originalText] = seg.currentValue;
      });

      setSelectedSegments(segments);
      setDraftValues(initialDrafts);
      setIsEditorModalOpen(true);
    };

    window.addEventListener('mouseover', handleMouseOver, true);
    window.addEventListener('click', handleClickCapture, true);

    return () => {
      clearHoverOutline();
      window.removeEventListener('mouseover', handleMouseOver, true);
      window.removeEventListener('click', handleClickCapture, true);
    };
  }, [isEditMode, clickMode, customTexts, clearHoverOutline]);

  const handleSaveSegments = () => {
    selectedSegments.forEach((seg) => {
      const nextVal = draftValues[seg.originalText];
      if (nextVal !== undefined) {
        setCustomText(seg.originalText, nextVal);
      }
    });
    setIsEditorModalOpen(false);
  };

  const handleTriggerOriginalClick = () => {
    const btn = clickedActionElementRef.current;
    setIsEditorModalOpen(false);
    if (btn) {
      bypassInterceptRef.current = true;
      setTimeout(() => {
        btn.click();
        bypassInterceptRef.current = false;
      }, 20);
    }
  };

  const customCount = Object.keys(customTexts).length;

  if (!isEditMode) return null;

  return (
    <div data-dev-editor-ignore="true">
      {/* Floating Bottom Developer Editor Toolbar */}
      <div className="fixed bottom-16 lg:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-3xl bg-slate-900/95 dark:bg-[#111520]/95 text-white border border-amber-500/50 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Edit3 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-amber-300 uppercase font-mono">
                {isRu ? 'Режим редактора текста' : 'Dev Text Editor Mode'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isRu ? `Правок: ${customCount}` : `Edits: ${customCount}`}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
              {clickMode === 'edit'
                ? isRu
                  ? 'Нажмите на любой текст на странице, чтобы изменить его. Логика и кнопки защищены.'
                  : 'Click any text on the page to edit it safely.'
                : isRu
                ? 'Режим навигации: переключайте вкладки как обычно, затем вернитесь к редактированию.'
                : 'Navigation mode: click buttons/tabs normally, then switch back to edit.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setClickMode('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                clickMode === 'edit'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Edit3 size={12} />
              <span>{isRu ? 'Клик = Править' : 'Click = Edit'}</span>
            </button>
            <button
              onClick={() => setClickMode('navigate')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                clickMode === 'navigate'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MousePointerClick size={12} />
              <span>{isRu ? 'Клик = Навигация' : 'Click = Navigate'}</span>
            </button>
          </div>

          {customCount > 0 && (
            <button
              onClick={() => setIsListModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200 transition-colors"
            >
              <ListFilter size={13} className="text-amber-400" />
              <span>{isRu ? 'Все правки' : 'All Edits'}</span>
            </button>
          )}

          <button
            onClick={() => setIsEditMode(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
          >
            <Check size={13} className="text-emerald-400" />
            <span>{isRu ? 'Готово' : 'Done'}</span>
          </button>
        </div>
      </div>

      {/* Modal for Editing Clicked Element Text(s) */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRu ? 'Редактирование текста элемента' : 'Edit Element Text'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {selectedSegments.map((seg, idx) => {
                const currentDraft = draftValues[seg.originalText] ?? seg.currentValue;
                const isModified =
                  customTexts[seg.originalText] !== undefined || currentDraft !== seg.originalText;

                return (
                  <div
                    key={`${seg.originalText}-${idx}`}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 break-words">
                        <span className=" uppercase text-[10px] text-slate-400 dark:text-neutral-500 block">
                          {isRu ? 'Оригинальный текст:' : 'Original text:'}
                        </span>
                        «{seg.originalText}»
                      </div>
                      {isModified && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftValues((prev) => ({
                              ...prev,
                              [seg.originalText]: seg.originalText,
                            }))
                          }
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-mono shrink-0 transition-colors"
                          title={isRu ? 'Вернуть заводской текст' : 'Restore original text'}
                        >
                          <RotateCcw size={11} />
                          <span>{isRu ? 'Оригинал' : 'Reset'}</span>
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={seg.originalText.length > 65 ? 3 : 2}
                      value={currentDraft}
                      onChange={(e) =>
                        setDraftValues((prev) => ({
                          ...prev,
                          [seg.originalText]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#090b10] border border-slate-300 dark:border-neutral-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <div>
                {clickedActionElementRef.current && (
                  <button
                    type="button"
                    onClick={handleTriggerOriginalClick}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-medium transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>{isRu ? 'Нажать как кнопку (перейти)' : 'Trigger button click'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {isRu ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveSegments}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-colors"
                >
                  <Check size={14} />
                  <span>{isRu ? 'Сохранить текст' : 'Save Text'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Managing All Custom Text Overrides */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isRu ? `Все изменённые тексты (${customCount})` : `All Custom Texts (${customCount})`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {isRu
                    ? 'Вы можете отредактировать или вернуть к оригиналу любую фразу отдельно.'
                    : 'Inspect or restore any customized phrase individually.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsListModalOpen(false);
                  setConfirmClearAll(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {Object.entries(customTexts).map(([orig, custom]) => (
                <div
                  key={orig}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#141824] border border-slate-200/80 dark:border-neutral-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 line-through break-words">
                      {orig}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white break-words">
                      {custom}
                    </div>
                  </div>
                  <button
                    onClick={() => removeCustomText(orig)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium shrink-0 transition-colors"
                    title={isRu ? 'Вернуть оригинал' : 'Restore original'}
                  >
                    <RotateCcw size={12} />
                    <span>{isRu ? 'Сбросить' : 'Reset'}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-neutral-800">
              {!confirmClearAll ? (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
                >
                  <Trash2 size={13} />
                  <span>{isRu ? 'Сбросить все правки к оригиналу' : 'Reset All to Original'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      clearAllCustomTexts();
                      setConfirmClearAll(false);
                      setIsListModalOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                  >
                    {isRu ? 'Да, сбросить все тексты' : 'Yes, reset all'}
                  </button>
                  <button
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300"
                  >
                    {isRu ? 'Отмена' : 'Cancel'}
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsListModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
              >
                {isRu ? 'Закрыть' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
