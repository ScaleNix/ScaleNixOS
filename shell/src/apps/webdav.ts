export interface WebDAVItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: string;
  contentType: string;
  etag?: string;
  fileId?: number;
}

const PROPFIND_BODY = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
  <d:prop>
    <d:getlastmodified />
    <d:getcontentlength />
    <d:getcontenttype />
    <d:resourcetype />
    <d:getetag />
    <oc:size />
    <oc:fileid />
  </d:prop>
</d:propfind>`;

function getTag(el: Element, ns: string, tag: string): string {
  return el.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? '';
}

function parseMultistatus(xml: string): WebDAVItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const DAV = 'DAV:';
  const OC = 'http://owncloud.org/ns';
  const responses = doc.getElementsByTagNameNS(DAV, 'response');
  const items: WebDAVItem[] = [];

  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];
    const href = decodeURIComponent(getTag(resp, DAV, 'href'));
    // Strip the Nextcloud DAV prefix to get relative path
    const relative = href.replace(/^\/remote\.php\/dav\/files\/[^/]+\/?/, '/').replace(/\/$/, '') || '/';
    // Skip the directory itself (first entry)
    if (i === 0) continue;

    const resourceType = resp.getElementsByTagNameNS(DAV, 'resourcetype')[0];
    const isDir = !!resourceType?.getElementsByTagNameNS(DAV, 'collection').length;
    const size = parseInt(getTag(resp, OC, 'size') || getTag(resp, DAV, 'getcontentlength') || '0', 10);
    const lastModified = getTag(resp, DAV, 'getlastmodified');
    const contentType = getTag(resp, DAV, 'getcontenttype');
    const etag = getTag(resp, DAV, 'getetag').replace(/"/g, '');
    const fileIdStr = getTag(resp, OC, 'fileid');
    const fileId = fileIdStr ? parseInt(fileIdStr, 10) : undefined;
    const name = relative.split('/').filter(Boolean).pop() ?? '';

    items.push({ name, path: relative, isDirectory: isDir, size, lastModified, contentType, etag, fileId });
  }

  return items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export interface TrashItem {
  name: string;
  href: string;
  originalLocation: string;
  originalFilename: string;
  deletionTime: number;
  isDirectory: boolean;
  size: number;
}

const TRASH_PROPFIND_BODY = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <d:prop>
    <d:getlastmodified />
    <d:getcontentlength />
    <d:resourcetype />
    <oc:size />
    <nc:trashbin-filename />
    <nc:trashbin-original-location />
    <nc:trashbin-deletion-time />
  </d:prop>
</d:propfind>`;

function parseTrashMultistatus(xml: string): TrashItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const DAV = 'DAV:';
  const NC = 'http://nextcloud.org/ns';
  const OC = 'http://owncloud.org/ns';
  const responses = doc.getElementsByTagNameNS(DAV, 'response');
  const items: TrashItem[] = [];

  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];
    const href = decodeURIComponent(getTag(resp, DAV, 'href'));
    // Skip the collection itself
    if (i === 0) continue;

    const resourceType = resp.getElementsByTagNameNS(DAV, 'resourcetype')[0];
    const isDir = !!resourceType?.getElementsByTagNameNS(DAV, 'collection').length;
    const size = parseInt(getTag(resp, OC, 'size') || getTag(resp, DAV, 'getcontentlength') || '0', 10);
    const originalFilename = getTag(resp, NC, 'trashbin-filename') || href.split('/').filter(Boolean).pop() || '';
    const originalLocation = getTag(resp, NC, 'trashbin-original-location');
    const deletionTime = parseInt(getTag(resp, NC, 'trashbin-deletion-time') || '0', 10);

    items.push({ name: originalFilename, href, originalLocation, originalFilename, deletionTime, isDirectory: isDir, size });
  }

  return items.sort((a, b) => b.deletionTime - a.deletionTime);
}

export class WebDAVClient {
  private baseUrl: string;
  private token: string;
  private username: string;

  constructor(username: string, token: string) {
    this.baseUrl = `/webdav/files/${username}`;
    this.token = token;
    this.username = username;
  }

  private headers(): HeadersInit {
    return { Authorization: `Bearer ${this.token}` };
  }

  async list(path: string): Promise<WebDAVItem[]> {
    const url = `${this.baseUrl}${path.endsWith('/') ? path : path + '/'}`;
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: { ...this.headers(), Depth: '1', 'Content-Type': 'application/xml' },
      body: PROPFIND_BODY,
    });
    if (!res.ok) throw new Error(`PROPFIND failed: ${res.status}`);
    const xml = await res.text();
    return parseMultistatus(xml);
  }

  async createFolder(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'MKCOL',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`MKCOL failed: ${res.status}`);
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
  }

  async copy(from: string, to: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${from}`, {
      method: 'COPY',
      headers: {
        ...this.headers(),
        Destination: `${this.baseUrl}${to}`,
        Overwrite: 'F',
      },
    });
    if (!res.ok) throw new Error(`COPY failed: ${res.status}`);
  }

  async uploadBlob(path: string, blob: Blob, filename: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}/${filename}`, {
      method: 'PUT',
      headers: { ...this.headers(), 'Content-Type': blob.type || 'application/octet-stream' },
      body: blob,
    });
    if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
  }

  async move(from: string, to: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${from}`, {
      method: 'MOVE',
      headers: {
        ...this.headers(),
        Destination: `${this.baseUrl}${to}`,
        Overwrite: 'F',
      },
    });
    if (!res.ok) throw new Error(`MOVE failed: ${res.status}`);
  }

  async upload(path: string, file: File): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}/${file.name}`, {
      method: 'PUT',
      headers: { ...this.headers(), 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
  }

  downloadUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // ── Trashbin API ──
  async listTrash(): Promise<TrashItem[]> {
    const url = `/webdav/trashbin/${this.username}/trash/`;
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: { ...this.headers(), Depth: '1', 'Content-Type': 'application/xml' },
      body: TRASH_PROPFIND_BODY,
    });
    if (!res.ok) throw new Error(`PROPFIND trashbin failed: ${res.status}`);
    const xml = await res.text();
    return parseTrashMultistatus(xml);
  }

  async restoreTrash(item: TrashItem): Promise<void> {
    const res = await fetch(item.href, {
      method: 'MOVE',
      headers: {
        ...this.headers(),
        Destination: `/webdav/trashbin/${this.username}/restore/${item.originalFilename}`,
        Overwrite: 'T',
      },
    });
    if (!res.ok) throw new Error(`Restore failed: ${res.status}`);
  }

  async deleteTrash(item: TrashItem): Promise<void> {
    const res = await fetch(item.href, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Permanent delete failed: ${res.status}`);
  }

  async emptyTrash(): Promise<void> {
    const url = `/webdav/trashbin/${this.username}/trash/`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`Empty trash failed: ${res.status}`);
  }
}

// File type icon mapping
export function fileIcon(item: WebDAVItem): string {
  if (item.isDirectory) return '\ud83d\udcc1';
  const ext = item.name.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: '\ud83d\udcc4', doc: '\ud83d\udcdd', docx: '\ud83d\udcdd', odt: '\ud83d\udcdd',
    xls: '\ud83d\udcca', xlsx: '\ud83d\udcca', ods: '\ud83d\udcca', csv: '\ud83d\udcca',
    ppt: '\ud83d\udcca', pptx: '\ud83d\udcca', odp: '\ud83d\udcca',
    jpg: '\ud83d\uddbc\ufe0f', jpeg: '\ud83d\uddbc\ufe0f', png: '\ud83d\uddbc\ufe0f', gif: '\ud83d\uddbc\ufe0f', svg: '\ud83d\uddbc\ufe0f', webp: '\ud83d\uddbc\ufe0f',
    mp3: '\ud83c\udfb5', wav: '\ud83c\udfb5', ogg: '\ud83c\udfb5', flac: '\ud83c\udfb5',
    mp4: '\ud83c\udfac', mkv: '\ud83c\udfac', avi: '\ud83c\udfac', mov: '\ud83c\udfac',
    zip: '\ud83d\udce6', tar: '\ud83d\udce6', gz: '\ud83d\udce6', '7z': '\ud83d\udce6', rar: '\ud83d\udce6',
    js: '\ud83d\udcdc', ts: '\ud83d\udcdc', py: '\ud83d\udcdc', java: '\ud83d\udcdc', go: '\ud83d\udcdc', rs: '\ud83d\udcdc',
    html: '\ud83c\udf10', css: '\ud83c\udfa8', json: '\ud83d\udcdc', xml: '\ud83d\udcdc', yml: '\ud83d\udcdc', yaml: '\ud83d\udcdc',
    md: '\ud83d\udcdd', txt: '\ud83d\udcc3',
    sh: '\u2699\ufe0f', bash: '\u2699\ufe0f',
  };
  return map[ext] ?? '\ud83d\udcc4';
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '--';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const VIEWABLE_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']);
const VIEWABLE_VIDEO_EXTS = new Set(['mp4', 'webm', 'ogg']);
const VIEWABLE_AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']);
const VIEWABLE_PDF_EXTS = new Set(['pdf']);
const VIEWABLE_MD_EXTS = new Set(['md', 'markdown', 'txt']);

export type ViewableFileType = 'image' | 'video' | 'pdf' | 'audio' | 'markdown';

export function getViewableFileType(filename: string): ViewableFileType | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (VIEWABLE_IMAGE_EXTS.has(ext)) return 'image';
  if (VIEWABLE_VIDEO_EXTS.has(ext)) return 'video';
  if (VIEWABLE_AUDIO_EXTS.has(ext)) return 'audio';
  if (VIEWABLE_PDF_EXTS.has(ext)) return 'pdf';
  if (VIEWABLE_MD_EXTS.has(ext)) return 'markdown';
  return null;
}

export function isViewableFile(filename: string): boolean {
  return getViewableFileType(filename) !== null;
}

const ONLYOFFICE_EXTENSIONS = new Set([
  'docx', 'doc', 'odt', 'rtf', 'txt', 'html', 'htm', 'epub',
  'xlsx', 'xls', 'ods', 'csv',
  'pptx', 'ppt', 'odp',
  'pdf',
]);

export function isOnlyOfficeCompatible(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ONLYOFFICE_EXTENSIONS.has(ext);
}

export function getOnlyOfficeUrl(fileId: number): string {
  const ncUrl = import.meta.env.VITE_NEXTCLOUD_URL ?? '';
  return `${ncUrl}/index.php/apps/onlyoffice/${fileId}`;
}
