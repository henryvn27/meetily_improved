import type { Block, Summary, SummaryDataResponse } from '@/types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseSummaryData(value: unknown): SummaryDataResponse | null {
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return null;
    }
  }
  return isRecord(parsed) ? (parsed as SummaryDataResponse) : null;
}

function normalizeBlock(value: unknown, sectionKey: string, index: number): Block | null {
  if (!isRecord(value)) return null;
  return {
    id: typeof value.id === 'string' ? value.id : `${sectionKey}-block-${index}`,
    type: typeof value.type === 'string' ? value.type : 'text',
    content: typeof value.content === 'string' ? value.content.trim() : '',
    color: typeof value.color === 'string' ? value.color : 'default',
  };
}

export function normalizeLegacySummary(data: SummaryDataResponse): Summary {
  const summary: Summary = {};
  const orderedKeys = Array.isArray(data._section_order)
    ? data._section_order
    : Object.keys(data);

  for (const key of orderedKeys) {
    if (key === 'MeetingName' || key === '_section_order' || key === 'markdown' || key === 'summary_json') continue;
    const section = data[key];
    if (!isRecord(section)) continue;
    const blocks = Array.isArray(section.blocks)
      ? section.blocks.map((block, index) => normalizeBlock(block, key, index)).filter((block): block is Block => block !== null)
      : [];
    summary[key] = {
      title: typeof section.title === 'string' ? section.title : key,
      blocks,
    };
  }

  return summary;
}

export function hasSummaryContent(summary: Summary): boolean {
  return Object.values(summary).some((section) => section.blocks.length > 0);
}
