import { useState, useEffect, useRef, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useKanbanStore, type KanbanCard, type KanbanColumn } from '../store/kanbanStore';

const LABEL_COLORS = ['#4361ee', '#22c55e', '#ef4444', '#f97316', '#8b5cf6', '#0ea5e9'];

/* ───────── Add / Edit Card Modal ───────── */
function CardModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: KanbanCard;
  onSave: (data: { title: string; description: string; color: string }) => void;
  onClose: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? LABEL_COLORS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), color });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-[380px] rounded-xl p-5 flex flex-col gap-4 shadow-2xl"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {initial ? 'Modifier la carte' : 'Nouvelle carte'}
        </div>

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: colors.surfaceAlt,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          rows={3}
          className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{
            backgroundColor: colors.surfaceAlt,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
        />

        <div>
          <div className="text-xs mb-2" style={{ color: colors.textSecondary }}>Couleur</div>
          <div className="flex gap-2">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: color === c ? 'scale(1.25)' : undefined,
                  boxShadow: color === c ? `0 0 0 2px ${colors.bg}, 0 0 0 4px ${c}` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-xs font-medium"
            style={{ color: colors.textSecondary }}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg px-4 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: colors.accent }}
          >
            {initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ───────── Single Card ───────── */
function CardItem({
  card,
  columnId,
  boardId,
  onEdit,
}: {
  card: KanbanCard;
  columnId: string;
  boardId: string;
  onEdit: (card: KanbanCard) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const { removeCard } = useKanbanStore();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/kanban-card', JSON.stringify({ cardId: card.id, fromColId: columnId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: colors.surfaceAlt,
        borderLeft: `3px solid ${card.color}`,
        border: `1px solid ${colors.border}44`,
        borderLeftColor: card.color,
        borderLeftWidth: 3,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: colors.textPrimary }}>
            {card.title}
          </div>
          {card.description && (
            <div className="text-[11px] mt-1 line-clamp-2" style={{ color: colors.textSecondary }}>
              {card.description}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(card)}
            className="rounded p-1 text-[10px] transition-colors hover:brightness-125"
            style={{ color: colors.textSecondary }}
            title="Modifier"
          >
            &#9998;
          </button>
          <button
            onClick={() => removeCard(boardId, columnId, card.id)}
            className="rounded p-1 text-[10px] transition-colors hover:brightness-125"
            style={{ color: colors.textSecondary }}
            title="Supprimer"
          >
            &#10005;
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Column ───────── */
function Column({
  column,
  boardId,
}: {
  column: KanbanColumn;
  boardId: string;
}) {
  const colors = useThemeStore((s) => s.colors);
  const { renameColumn, removeColumn, addCard, updateCard, moveCard } = useKanbanStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [modalCard, setModalCard] = useState<KanbanCard | 'new' | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== column.title) {
      renameColumn(boardId, column.id, trimmed);
    } else {
      setTitle(column.title);
    }
    setEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/kanban-card'));
      if (data.cardId && data.fromColId) {
        moveCard(data.cardId, data.fromColId, column.id, column.cards.length);
      }
    } catch { /* invalid data */ }
  };

  const handleCardSave = (cardData: { title: string; description: string; color: string }) => {
    if (modalCard === 'new') {
      addCard(boardId, column.id, cardData);
    } else if (modalCard) {
      updateCard(boardId, column.id, modalCard.id, cardData);
    }
    setModalCard(null);
  };

  return (
    <>
      <div
        className="flex flex-col rounded-xl shrink-0"
        style={{
          width: 280,
          backgroundColor: colors.surface,
          border: `1px solid ${dragOver ? colors.accent : colors.border}`,
          transition: 'border-color 0.15s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Column header */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {editing ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitle(column.title); setEditing(false); } }}
                className="text-xs font-semibold bg-transparent outline-none w-full px-1 py-0.5 rounded"
                style={{ color: colors.textPrimary, border: `1px solid ${colors.accent}` }}
              />
            ) : (
              <span
                className="text-xs font-semibold truncate cursor-pointer"
                style={{ color: colors.textPrimary }}
                onDoubleClick={() => setEditing(true)}
                title="Double-cliquer pour renommer"
              >
                {column.title}
              </span>
            )}
            <span
              className="text-[10px] rounded-full px-1.5 py-0.5 font-medium shrink-0"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              {column.cards.length}
            </span>
          </div>
          <button
            onClick={() => removeColumn(boardId, column.id)}
            className="text-[10px] px-1 rounded opacity-40 hover:opacity-100 transition-opacity shrink-0"
            style={{ color: colors.textSecondary }}
            title="Supprimer la colonne"
          >
            &#10005;
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-auto px-2 py-2 flex flex-col gap-1.5" style={{ maxHeight: 'calc(100% - 80px)' }}>
          {column.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              columnId={column.id}
              boardId={boardId}
              onEdit={(c) => setModalCard(c)}
            />
          ))}
        </div>

        {/* Add card button */}
        <div className="px-2 pb-2 pt-1">
          <button
            onClick={() => setModalCard('new')}
            className="w-full rounded-lg py-1.5 text-xs font-medium transition-colors hover:brightness-110"
            style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
          >
            + Ajouter carte
          </button>
        </div>
      </div>

      {modalCard && (
        <CardModal
          initial={modalCard === 'new' ? undefined : modalCard}
          onSave={handleCardSave}
          onClose={() => setModalCard(null)}
        />
      )}
    </>
  );
}

/* ───────── Main Board ───────── */
export function KanbanBoard() {
  const colors = useThemeStore((s) => s.colors);
  const {
    boards,
    activeBoardId,
    load,
    setActiveBoard,
    addBoard,
    removeBoard,
    renameBoard,
    addColumn,
    addCard,
  } = useKanbanStore();

  const [editingBoardName, setEditingBoardName] = useState(false);
  const [boardName, setBoardName] = useState('');
  const boardNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];

  useEffect(() => {
    if (activeBoard) setBoardName(activeBoard.name);
  }, [activeBoard]);

  // Listen for scalenix-file-drop events (files dragged from FileExplorer)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.appId !== 'kanban') return;
      if (!activeBoard || activeBoard.columns.length === 0) return;

      const { fileName, fileUrl } = detail;
      if (!fileName) return;

      // Add a new card to the first column with the file name and link
      const firstCol = activeBoard.columns[0];
      addCard(activeBoard.id, firstCol.id, {
        title: fileName,
        description: `Fichier: ${fileName}\nSource: ${fileUrl}`,
        color: '#0ea5e9',
      });
    };

    window.addEventListener('scalenix-file-drop', handler);
    return () => window.removeEventListener('scalenix-file-drop', handler);
  }, [activeBoard, addCard]);

  const commitBoardName = useCallback(() => {
    const trimmed = boardName.trim();
    if (trimmed && activeBoard && trimmed !== activeBoard.name) {
      renameBoard(activeBoard.id, trimmed);
    } else if (activeBoard) {
      setBoardName(activeBoard.name);
    }
    setEditingBoardName(false);
  }, [boardName, activeBoard, renameBoard]);

  const handleAddBoard = () => {
    addBoard('Nouveau tableau');
  };

  const handleAddColumn = () => {
    if (activeBoard) addColumn(activeBoard.id, 'Nouvelle colonne');
  };

  if (!activeBoard) return null;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Board tabs */}
      {boards.length > 1 && (
        <div
          className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBoard(b.id)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
              style={{
                backgroundColor: b.id === activeBoardId ? `${colors.accent}20` : 'transparent',
                color: b.id === activeBoardId ? colors.accent : colors.textSecondary,
              }}
            >
              {b.name}
              {boards.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); removeBoard(b.id); }}
                  className="ml-1 opacity-40 hover:opacity-100"
                >
                  &#10005;
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleAddBoard}
            className="rounded-lg px-2 py-1.5 text-xs transition-colors shrink-0"
            style={{ color: colors.textSecondary }}
            title="Nouveau tableau"
          >
            +
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          {editingBoardName ? (
            <input
              ref={boardNameRef}
              autoFocus
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onBlur={commitBoardName}
              onKeyDown={(e) => { if (e.key === 'Enter') commitBoardName(); if (e.key === 'Escape') { setBoardName(activeBoard.name); setEditingBoardName(false); } }}
              className="text-sm font-semibold bg-transparent outline-none px-1 py-0.5 rounded"
              style={{ color: colors.textPrimary, border: `1px solid ${colors.accent}` }}
            />
          ) : (
            <h2
              className="text-sm font-semibold cursor-pointer"
              style={{ color: colors.textPrimary }}
              onDoubleClick={() => setEditingBoardName(true)}
              title="Double-cliquer pour renommer"
            >
              {activeBoard.name}
            </h2>
          )}
          {boards.length <= 1 && (
            <button
              onClick={handleAddBoard}
              className="rounded-lg px-2 py-1 text-[11px] transition-colors"
              style={{ color: colors.textSecondary }}
              title="Nouveau tableau"
            >
              + Tableau
            </button>
          )}
        </div>
        <button
          onClick={handleAddColumn}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          + Ajouter colonne
        </button>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full">
          {activeBoard.columns.map((col) => (
            <Column key={col.id} column={col} boardId={activeBoard.id} />
          ))}
          {activeBoard.columns.length === 0 && (
            <div className="flex items-center justify-center w-full">
              <div className="text-sm text-center" style={{ color: colors.textSecondary }}>
                Aucune colonne. Cliquez sur "+ Ajouter colonne" pour commencer.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
