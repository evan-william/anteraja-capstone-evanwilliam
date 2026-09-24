'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUp, MessageCircleMore, X } from 'lucide-react';

import type { ApiResponse } from '@/lib/api';
import type { AssistantHistoryItem, AssistantOption, AssistantReply } from '@/lib/admin-assistant/types';

type ChatItem = { id: number; role: 'user' | 'assistant'; text: string; options?: AssistantOption[]; notice?: string | null; mode?: 'gemini' | 'data'; checkedAt?: string };

const starters = [
  'Apa prioritas operasi hari ini?',
  'Tampilkan tiket baru yang perlu ditangani',
  'Tampilkan kiriman yang perlu tindakan',
];

export function OperationsAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<Extract<AssistantOption, { kind: 'ticket_status' }> | null>(null);
  const [actionError, setActionError] = useState('');
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    end.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' });
  }, [messages, busy, confirmAction, open]);
  useEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); setConfirmAction(null); requestAnimationFrame(() => launcher.current?.focus()); } }
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open]);

  async function ask(text: string) {
    const message = text.trim();
    if (busy || !message || message.length > 500) return;
    const history: AssistantHistoryItem[] = messages.slice(-8).map(({ role, text: content }) => ({ role, text: content.slice(0, 800) }));
    setMessages((current) => [...current, { id: nextId.current++, role: 'user', text: message }]);
    setDraft(''); setBusy(true); setConfirmAction(null); setActionError('');
    try {
      const response = await fetch('/api/v1/admin/assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, history }),
      });
      const body = await response.json() as ApiResponse<AssistantReply>;
      if (!body.success) throw new Error(body.error.message);
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: body.data.answer, options: body.data.options, notice: body.data.notice, mode: body.data.mode, checkedAt: body.data.checkedAt }]);
    } catch (error) {
      setDraft(message);
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', text: error instanceof Error ? error.message : 'Pertanyaan belum terkirim. Coba lagi.' }]);
    } finally { setBusy(false); }
  }

  async function confirmTicketStatus() {
    if (!confirmAction || busy) return;
    setBusy(true); setActionError('');
    try {
      const response = await fetch('/api/v1/admin/assistant/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: confirmAction.ticketId, status: confirmAction.status }),
      });
      const body = await response.json() as ApiResponse<{ ticketNumber: string; status: string }>;
      if (!body.success) throw new Error(body.error.message);
      setMessages((current) => [...current.map((item) => ({ ...item, options: item.options?.filter((option) => option.kind !== 'ticket_status' || option.ticketId !== confirmAction.ticketId) })), { id: nextId.current++, role: 'assistant', text: `Status ${body.data.ticketNumber} berhasil diperbarui menjadi ${body.data.status === 'in_progress' ? 'Sedang ditangani' : 'Selesai'}. Perubahan tercatat atas akun Admin kamu.` }]);
      setConfirmAction(null);
      router.refresh();
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Tindakan belum berhasil. Coba lagi.'); }
    finally { setBusy(false); }
  }

  function close() { setOpen(false); setConfirmAction(null); requestAnimationFrame(() => launcher.current?.focus()); }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void ask(draft); }

  return <div className="assistant-shell">
    <button ref={launcher} type="button" aria-label="Buka asisten operasi" aria-controls="operations-assistant-panel" aria-expanded={open} onClick={() => setOpen(true)} className={open ? 'assistant-launcher hidden' : 'assistant-launcher inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#2a2026] px-4 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(36,29,33,.22)] hover:bg-[#3a2b34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'}>
      <MessageCircleMore className="size-5 shrink-0" aria-hidden="true" /> Asisten operasi
    </button>
    <section id="operations-assistant-panel" role="dialog" aria-label="Asisten operasi Admin" aria-hidden={!open} inert={!open} data-open={open} className="assistant-panel flex flex-col overflow-hidden rounded-2xl bg-[#fbfaf9] shadow-[0_24px_70px_rgba(36,29,33,.25)] ring-1 ring-black/10">
      <header className="flex shrink-0 items-center gap-3 bg-[#2a2026] px-5 py-4 text-white">
        <Image src="/brand/anteraja-mark-small.png" alt="" width={32} height={32} className="size-8 shrink-0 object-contain" unoptimized />
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold">Asisten operasi</h2><p className="text-sm text-white/70">Data kiriman dan tiket Admin</p></div>
        <button type="button" aria-label="Tutup asisten" onClick={close} className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X className="size-5" aria-hidden="true" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5" role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? <section className="space-y-4"><div><p className="text-base font-semibold">Mulai dari pertanyaan operasional.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Aku bisa memeriksa tiket, mencari resi, dan merangkum kiriman berisiko. Perubahan tiket selalu menunggu konfirmasi kamu.</p></div><div className="grid gap-2" aria-label="Contoh pertanyaan">{starters.map((starter) => <button key={starter} type="button" onClick={() => void ask(starter)} className="rounded-lg bg-white px-4 py-3 text-left text-sm font-medium text-[#40333b] ring-1 ring-black/10 hover:bg-[#fce9f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{starter}</button>)}</div></section> : <ol role="list" className="space-y-5">{messages.map((item) => <li key={item.id} className={item.role === 'user' ? 'flex justify-end' : ''}>
          <div className={item.role === 'user' ? 'max-w-[88%] rounded-2xl rounded-br-md bg-[#2a2026] px-4 py-3 text-sm leading-6 text-white' : 'space-y-3 text-sm leading-6 text-[#30272d]'}>
            <p className="whitespace-pre-wrap break-words">{item.text}</p>
            {item.mode ? <p className="text-xs text-muted-foreground">{item.mode === 'gemini' ? 'Gemini' : 'Data langsung'}{item.checkedAt ? ` · dicek ${new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.checkedAt))}` : ''}</p> : null}
            {item.notice ? <p className="text-sm text-[#80521a]">{item.notice}</p> : null}
            {item.options?.length ? <div className="flex flex-wrap gap-2" aria-label="Pilihan lanjutan">{item.options.map((option, index) => option.kind === 'link' ?
              <Link key={`${item.id}-${index}`} href={option.href} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#9d0055] ring-1 ring-black/10 hover:bg-[#fce9f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{option.label}</Link> :
              <button key={`${item.id}-${index}`} type="button" onClick={() => option.kind === 'ask' ? void ask(option.prompt) : (setConfirmAction(option), setActionError(''))} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#9d0055] ring-1 ring-black/10 hover:bg-[#fce9f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{option.label}</button>)}</div> : null}
          </div>
        </li>)}</ol>}
        {busy ? <p role="status" className="mt-5 text-sm text-muted-foreground">Memeriksa data…</p> : null}
        <div ref={end} />
      </div>

      {confirmAction ? <div className="shrink-0 border-t bg-[#fff7e8] px-5 py-4"><p className="text-sm font-semibold">{confirmAction.status === 'in_progress' ? 'Mulai tangani' : 'Selesaikan'} {confirmAction.ticketNumber}?</p><p className="mt-1 text-sm text-[#6b5543]">Status akan berubah dan identitas Admin tercatat dalam riwayat tiket.</p>{actionError ? <p role="alert" className="mt-2 text-sm text-destructive">{actionError}</p> : null}<div className="mt-3 flex gap-2"><button type="button" disabled={busy} onClick={() => setConfirmAction(null)} className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-black/5">Batal</button><button type="button" disabled={busy} onClick={() => void confirmTicketStatus()} className="rounded-md bg-[#2a2026] px-3 py-2 text-sm font-semibold text-white hover:bg-[#46353f] disabled:opacity-50">{busy ? 'Menyimpan…' : confirmAction.status === 'in_progress' ? 'Mulai tangani tiket' : 'Tandai tiket selesai'}</button></div></div> : null}

      <form onSubmit={submit} className="shrink-0 border-t bg-white p-4 sm:p-5"><label htmlFor="admin-assistant-input" className="sr-only">Tanya asisten operasi</label><div className="flex items-end gap-2"><textarea ref={input} id="admin-assistant-input" name="question" rows={2} maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void ask(draft); } }} placeholder="Tanya tentang tiket atau kiriman…" className="min-h-16 min-w-0 flex-1 resize-none rounded-lg bg-[#f7f5f3] px-3 py-2 text-base outline-none ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-primary sm:text-sm" /><button type="submit" aria-label="Kirim pertanyaan" disabled={busy || draft.trim().length < 2} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-[#c8006d] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowUp className="size-5" aria-hidden="true" /></button></div><p className="mt-2 text-xs text-muted-foreground">Enter untuk kirim · Shift+Enter untuk baris baru</p></form>
    </section>
  </div>;
}
