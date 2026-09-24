import { z } from 'zod';

import { fail, forbidden, ok, serverError, unauthorized, validationError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { askGemini, GeminiUnavailable } from '@/lib/admin-assistant/gemini';
import { assistantRateLimited } from '@/lib/admin-assistant/rate-limit';
import { dataOnlyAnswer, defaultToolForQuestion, optionsFromResults, runAssistantTool } from '@/lib/admin-assistant/tools';
import type { AssistantOption, AssistantReply } from '@/lib/admin-assistant/types';
import { createClient } from '@/lib/supabase/server';

const requestSchema = z.object({
  message: z.string().trim().min(2).max(500),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(800) })).max(8).default([]),
});

const notices: Record<GeminiUnavailable['reason'], string> = {
  missing_key: 'Gemini belum dikonfigurasi. Pencarian data langsung tetap tersedia.',
  quota: 'Kuota Gemini sementara habis. Pencarian data langsung tetap tersedia.',
  auth: 'Kunci Gemini tidak dapat digunakan. Periksa konfigurasi server.',
  timeout: 'Gemini terlalu lama merespons. Data langsung tetap tersedia.',
  service: 'Gemini sedang tidak tersedia. Data langsung tetap tersedia.',
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== 'admin') return forbidden();
  if (assistantRateLimited(user.id)) return fail('RATE_LIMITED', 'Terlalu banyak pertanyaan. Tunggu sebentar lalu coba lagi.', 429);

  let input: unknown;
  try { input = await request.json(); } catch { return validationError('Permintaan harus berupa JSON.'); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return validationError('Pertanyaan harus berisi 2–500 karakter.');

  try {
    const client = await createClient();
    const selected = defaultToolForQuestion(parsed.data.message);
    const initial = selected ? await runAssistantTool(client, selected.name, selected.args) : null;
    let answer = dataOnlyAnswer(initial, parsed.data.message);
    let mode: AssistantReply['mode'] = 'data';
    let notice: string | null = null;
    const results = initial ? [initial] : [];
    try {
      const reply = await askGemini(client, parsed.data.message, parsed.data.history, initial);
      answer = reply.answer;
      mode = 'gemini';
      results.push(...reply.results);
    } catch (error) {
      if (error instanceof GeminiUnavailable) notice = notices[error.reason];
      else notice = notices.service;
    }
    const options: AssistantOption[] = optionsFromResults(results);
    if (!options.length && initial?.kind === 'operations_overview') options.push(
      { kind: 'ask', label: 'Lihat tiket baru', prompt: 'Tampilkan tiket baru yang perlu ditangani' },
      { kind: 'ask', label: 'Kiriman perlu tindakan', prompt: 'Tampilkan kiriman yang perlu tindakan' },
    );
    return ok({ answer, options, mode, notice, checkedAt: new Date().toISOString() } satisfies AssistantReply);
  } catch {
    return serverError('Data operasional belum dapat dibaca. Muat ulang dan coba lagi.');
  }
}
