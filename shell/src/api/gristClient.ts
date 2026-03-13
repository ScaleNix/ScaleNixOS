/**
 * Grist API client.
 * Proxied through shell nginx at /grist-api/
 * Uses Grist API key for server-to-server calls.
 */

const GRIST_API = '/grist-api';

export interface GristOrg {
  id: number;
  name: string;
  domain: string;
}

export interface GristWorkspace {
  id: number;
  name: string;
  docs: GristDoc[];
}

export interface GristDoc {
  id: string;
  name: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GristColumn {
  id: string;
  fields: {
    label: string;
    type: string;
  };
}

export interface GristRecord {
  id: number;
  fields: Record<string, any>;
}

async function gristFetch(path: string, apiKey: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`${GRIST_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Grist API error: ${res.status}`);
  return res.json();
}

export async function getOrgs(apiKey: string): Promise<GristOrg[]> {
  return gristFetch('/orgs', apiKey);
}

export async function getWorkspaces(apiKey: string, orgId: number): Promise<GristWorkspace[]> {
  return gristFetch(`/orgs/${orgId}/workspaces`, apiKey);
}

export async function getDocTables(apiKey: string, docId: string): Promise<string[]> {
  const data = await gristFetch(`/docs/${docId}/tables`, apiKey);
  return (data.tables || []).map((t: any) => t.id);
}

export async function getTableColumns(apiKey: string, docId: string, tableId: string): Promise<GristColumn[]> {
  const data = await gristFetch(`/docs/${docId}/tables/${tableId}/columns`, apiKey);
  return data.columns || [];
}

export async function getTableRecords(apiKey: string, docId: string, tableId: string): Promise<GristRecord[]> {
  const data = await gristFetch(`/docs/${docId}/tables/${tableId}/records`, apiKey);
  return data.records || [];
}

export async function createDoc(apiKey: string, workspaceId: number, name: string): Promise<string> {
  return gristFetch(`/workspaces/${workspaceId}/docs`, apiKey, {
    method: 'POST',
    body: JSON.stringify({ name, isPinned: true }),
  });
}

export async function addColumns(apiKey: string, docId: string, tableId: string, columns: GristColumn[]): Promise<void> {
  await gristFetch(`/docs/${docId}/tables/${tableId}/columns`, apiKey, {
    method: 'POST',
    body: JSON.stringify({ columns }),
  });
}

export async function addRecords(apiKey: string, docId: string, tableId: string, records: Array<{ fields: Record<string, any> }>): Promise<void> {
  await gristFetch(`/docs/${docId}/tables/${tableId}/records`, apiKey, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

/**
 * Import a CSV file into a new Grist document.
 * Creates the doc, parses CSV, creates columns and adds records.
 */
export async function importCsvToGrist(
  apiKey: string,
  workspaceId: number,
  docName: string,
  csvContent: string,
): Promise<string> {
  const lines = csvContent.split('\n').filter((l) => l.trim());
  if (lines.length < 1) throw new Error('Empty CSV');

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const docId = await createDoc(apiKey, workspaceId, docName);

  // Add columns
  const columns: GristColumn[] = headers.map((h, i) => ({
    id: `col_${i}`,
    fields: { label: h.trim(), type: 'Text' },
  }));
  await addColumns(apiKey, docId, 'Table1', columns);

  // Parse data rows
  const records = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const fields: Record<string, any> = {};
    headers.forEach((_, i) => {
      fields[`col_${i}`] = values[i]?.trim() || '';
    });
    return { fields };
  });

  if (records.length > 0) {
    // Grist API accepts max 500 records per request
    for (let i = 0; i < records.length; i += 500) {
      await addRecords(apiKey, docId, 'Table1', records.slice(i, i + 500));
    }
  }

  return docId;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
