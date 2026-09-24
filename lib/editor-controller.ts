import { parseDraft, UUID } from './domain.ts';
import { documentKey, parseDocument, readJournal } from './editor-document.ts';
import type { EditorDocument, EditorJournal, PendingSave } from './editor-document.ts';
export type EditorPhase = 'idle' | 'saving' | 'error' | 'conflict' | 'auth' | 'recovery';
export type EditorState = {
  document: EditorDocument; savedDocument: EditorDocument | null; revision: number;
  pending: PendingSave | null; phase: EditorPhase; message: string;
  storageError: boolean; online: boolean; updatedAt: string | null; recovery: EditorJournal | null;
};
type Reply = { ok: boolean; status: number; body: unknown };
export type EditorIO = {
  read: () => string | null; write: (raw: string) => void; remove: () => void;
  send: (payload: PendingSave['payload']) => Promise<Reply>; uuid: () => string;
};
export type EditorOptions = { owner: string; id: string; document: EditorDocument; revision: number; updatedAt?: string; lastRequestId?: string };
/** One writer, explicit acknowledgements. No timers or React dependency: directly testable. */
export class EditorController {
  private options: EditorOptions;
  private io: EditorIO;
  private state: EditorState;
  private listeners = new Set<() => void>();
  private initialized = false;
  private inFlight = false;
  constructor(options: EditorOptions, io: EditorIO) {
    this.options = options; this.io = io;
    this.state = {document:structuredClone(options.document),savedDocument:structuredClone(options.document),revision:options.revision,pending:null,phase:'idle',message:'',storageError:false,online:true,updatedAt:options.updatedAt||null,recovery:null};
  }
  getSnapshot = (): EditorState => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit(patch: Partial<EditorState>) { this.state = {...this.state,...patch}; this.listeners.forEach(listener => listener()); }
  isDirty() { return documentKey(this.state.document) !== documentKey(this.state.savedDocument); }
  private journal(): EditorJournal {
    const s = this.state;
    return {format:'kastriva-editor-session',version:1,owner:this.options.owner,id:this.options.id,document:s.document,savedDocument:s.savedDocument,revision:s.revision,pending:s.pending,timestamp:Date.now()};
  }
  private persist(): boolean {
    try {
      // Never remove an unresolved request, including when the user types the old value again.
      if (this.isDirty() || this.state.pending) this.io.write(JSON.stringify(this.journal())); else this.io.remove();
      if (this.state.storageError) this.emit({storageError:false});
      return true;
    } catch { this.emit({storageError:true}); return false; }
  }
  initialize() {
    if (this.initialized) return; this.initialized = true;
    try {
      const raw = this.io.read(); if (!raw) return;
      const saved = readJournal(raw,this.options.owner,this.options.id);
      if (!saved.pending && documentKey(saved.document) === documentKey(this.state.savedDocument)) { this.io.remove(); return; }
      this.emit({phase:'recovery',recovery:saved,message:'Ada salinan perubahan dari sesi tab ini. Pilih Pulihkan atau gunakan versi server.'});
    } catch { this.emit({storageError:true,message:'Salinan lokal tidak dapat dibaca. Unduh salinan sebelum berpindah halaman; penyimpanan akan dicoba lagi saat Anda menekan Simpan.'}); }
  }
  restore() {
    const saved = this.state.recovery; if (!saved || this.inFlight) return;
    let revision = saved.revision, pending = saved.pending, base = saved.savedDocument;
    let conflict = this.options.revision !== revision;
    // First save can have committed even if the browser never received its response.
    if (pending && this.options.lastRequestId === pending.payload.request_id && this.options.revision === pending.payload.expected_revision+1 && this.options.document.theme === pending.payload.theme_slug && JSON.stringify(parseDraft(this.options.document.content,this.options.owner)) === JSON.stringify(pending.payload.content)) {
      revision = this.options.revision; base = pending.document; pending = null; conflict = false;
    }
    this.emit({document:saved.document,savedDocument:base,revision,pending:conflict?null:pending,recovery:null,phase:conflict?'conflict':'idle',message:conflict?'Versi server sudah berubah. Salinan lokal dipulihkan untuk diperiksa/diunduh, bukan untuk menimpa server.':'Salinan lokal dipulihkan. Perubahan baru dikirim setelah validasi.'});
    this.persist();
  }
  discardRecovery() {
    if (this.inFlight) return;
    try { this.io.remove(); } catch { this.emit({storageError:true}); return; }
    this.emit({phase:'idle',recovery:null,message:'Menggunakan data server; salinan lokal pada tab ini dihapus.',storageError:false});
  }
  edit(document: EditorDocument) {
    if (this.state.phase === 'recovery' || this.state.phase === 'auth') return;
    // Shape validation only: half-typed dates/URLs may remain in the local journal.
    const next = parseDocument(document,this.options.owner,true);
    this.emit({document:next,message:this.state.phase==='idle'?'':this.state.message}); this.persist();
  }
  setOnline(online: boolean) {
    const wasOffline = !this.state.online;
    this.emit({online,...(online && wasOffline && this.state.phase==='error'?{phase:'idle' as const,message:'Koneksi kembali. Memeriksa ulang simpan tertunda.'}:{})});
  }
  pauseForAccountChange() {
    // Keep the journal under the old user ID; do not transmit it using a new account.
    this.emit({phase:'auth',message:'Sesi akun berubah atau berakhir. Unduh salinan lalu login kembali dengan akun pemilik.'});
    this.persist();
  }
  async save() {
    if (!this.initialized || this.inFlight || !this.state.online || ['conflict','auth','recovery'].includes(this.state.phase) || (this.state.revision>0&&!this.isDirty()&&!this.state.pending)) return;
    let job = this.state.pending;
    if (!job) {
      try {
        const current = structuredClone(this.state.document), requestId = this.io.uuid();
        if (!UUID.test(requestId)) throw new Error('Browser tidak dapat membuat ID penyimpanan.');
        job = {document:current,payload:{id:this.options.id,theme_slug:current.theme,content:parseDraft(current.content,this.options.owner),expected_revision:this.state.revision,request_id:requestId}};
        this.emit({pending:job});
      } catch (error) { this.emit({phase:'error',message:error instanceof Error?error.message:'Periksa isian draft.'}); return; }
    }
    // Journal the EXACT request before crossing the network; retries must reuse it.
    if (!this.persist()) { this.emit({phase:'error',message:'Penyimpanan lokal diblokir/penuh. Belum ada data dikirim. Unduh salinan, izinkan penyimpanan browser, lalu coba kembali.'}); return; }
    this.inFlight = true; this.emit({phase:'saving',message:'Menyimpan ke server…'});
    try {
      const reply = await this.io.send(structuredClone(job.payload));
      if (!reply.ok) {
        if (this.state.phase==='auth') { this.persist(); return; }
        // A structured 4xx from our JSON API is a definitive rejection. HTML/proxy errors are uncertain.
        const error = reply.body && typeof reply.body==='object' && 'error' in reply.body && typeof reply.body.error==='string' ? reply.body.error : null;
        if (!error) throw new Error('Balasan belum dapat dipastikan. Gunakan Coba simpan kembali.');
        if (reply.status===409) this.emit({pending:null,phase:'conflict',message:error});
        else if ([401,403].includes(reply.status)) this.emit({pending:null,phase:'auth',message:error});
        else if (reply.status>=400 && reply.status<500) this.emit({pending:null,phase:'error',message:error});
        else this.emit({phase:'error',message:error});
        this.persist(); return;
      }
      const draft = (reply.body as {draft?:{id?:unknown;revision?:unknown;updated_at?:unknown}}|null)?.draft;
      if (!draft || draft.id!==this.options.id || draft.revision!==job.payload.expected_revision+1 || typeof draft.updated_at!=='string' || !Number.isFinite(Date.parse(draft.updated_at))) throw new Error('Balasan simpan tidak sesuai. Isian belum ditandai tersimpan.');
      // Never overwrite edits typed WHILE this request was in flight.
      const phase = this.state.phase==='auth' ? 'auth' : 'idle';
      this.emit({revision:draft.revision,pending:null,savedDocument:job.document,phase,updatedAt:draft.updated_at,message:phase==='auth'?this.state.message:'Perubahan diterima server. Undangan tetap draft privat.'});
      this.persist();
    } catch (error) {
      this.emit({phase:this.state.phase==='auth'?'auth':'error',message:error instanceof Error?error.message:'Jaringan terputus. Hasil simpan belum pasti; coba kembali dengan permintaan yang sama.'}); this.persist();
    } finally { this.inFlight = false; }
  }
  /** An edit may clear a validation failure, but never an uncertain network request. */
  resumeAfterEdit() {
    if (this.state.phase==='error' && !this.state.pending && !this.state.storageError) this.emit({phase:'idle',message:''});
  }
}
