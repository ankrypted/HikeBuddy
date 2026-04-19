import {
  ChangeDetectionStrategy, Component, computed, effect, ElementRef,
  inject, Input, OnDestroy, OnInit, signal, ViewChild,
} from '@angular/core';
import { Router, RouterLink }  from '@angular/router';
import { FormsModule }         from '@angular/forms';
import { NavbarComponent }     from '../../../core/layout/navbar/navbar.component';
import { SceneBackgroundComponent } from '../../../shared/components/scene-background/scene-background.component';
import { RoomService }         from '../../../core/services/room/room.service';
import { AuthService }         from '../../../core/services/auth/auth.service';

@Component({
  selector:        'hb-room-detail',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [FormsModule, RouterLink, NavbarComponent, SceneBackgroundComponent],
  templateUrl:     './room-detail.component.html',
  styleUrl:        './room-detail.component.scss',
})
export class RoomDetailComponent implements OnInit, OnDestroy {
  @Input() id = '';

  @ViewChild('chatMessages') private chatMessagesRef?: ElementRef<HTMLElement>;
  @ViewChild('fileInput') private fileInputRef?: ElementRef<HTMLInputElement>;

  private readonly roomService  = inject(RoomService);
  private readonly authService  = inject(AuthService);
  private readonly router       = inject(Router);

  readonly room        = this.roomService.activeRoom;
  readonly messages    = this.roomService.messages;
  readonly updates     = this.roomService.updates;
  readonly loading     = signal(true);
  readonly activeTab   = signal<'chat' | 'updates' | 'members' | 'requests' | 'files'>('chat');

  // Chat
  readonly chatDraft  = signal('');
  readonly sending    = signal(false);

  // Update
  readonly updateDraft   = signal('');
  readonly postingUpdate = signal(false);

  // Delete
  readonly showDeleteConfirm = signal(false);
  readonly deleting          = signal(false);
  readonly deleteError       = signal<string | null>(null);

  // Leave
  readonly leaving           = signal(false);

  // Join request
  readonly requesting        = signal(false);
  readonly cancelling        = signal(false);

  // Status toggle
  readonly togglingStatus = signal(false);

  // Pending requests (creator only)
  readonly pendingRequests  = this.roomService.pendingRequests;
  readonly approvingId      = signal<string | null>(null);
  readonly decliningId      = signal<string | null>(null);

  // Itineraries
  readonly itineraries    = this.roomService.itineraries;
  readonly uploading      = signal(false);
  readonly uploadError    = signal<string | null>(null);
  readonly deletingFileId = signal<string | null>(null);

  // Invite
  readonly showInvite      = signal(false);
  readonly followers        = signal<{ username: string; avatarUrl: string | null }[]>([]);
  readonly inviteSent       = signal<Set<string>>(new Set());
  readonly inviteError      = signal<string | null>(null);

  readonly currentUser = this.authService.currentUser;

  readonly isMember = computed(() => {
    const r = this.room();
    const u = this.currentUser();
    if (!r || !u) return false;
    return r.members.some(m => m.username === u.username);
  });

  readonly isCreator = computed(() =>
    this.room()?.creatorUsername === this.currentUser()?.username
  );

  readonly hasPendingRequest = computed(() => !!this.room()?.pendingRequestId);

  constructor() {
    effect(() => {
      this.messages(); // track signal
      setTimeout(() => {
        const el = this.chatMessagesRef?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    });

    // Load pending requests once the room is known and user is creator
    effect(() => {
      const room = this.room();
      if (room && this.isCreator()) {
        this.roomService.loadPendingRequests(room.id);
      }
    });
  }

  ngOnInit(): void {
    this.roomService.resetChat();
    this.roomService.loadRoom(this.id);
    if (this.authService.isLoggedIn()) {
      this.roomService.loadMessages(this.id);
      this.roomService.loadUpdates(this.id);
      this.roomService.loadItineraries(this.id);
      this.roomService.startChatPolling(this.id);
    }
    this.loading.set(false);
  }

  ngOnDestroy(): void {
    this.roomService.stopChatPolling();
    this.roomService.activeRoom.set(null);
    this.roomService.pendingRequests.set([]);
    this.roomService.itineraries.set([]);
  }

  // ── Join Request ──────────────────────────────────────────────────────────

  requestJoin(): void {
    if (this.requesting()) return;
    this.requesting.set(true);
    this.roomService.requestJoin(this.id).subscribe({
      next:  () => this.requesting.set(false),
      error: () => this.requesting.set(false),
    });
  }

  cancelJoinRequest(): void {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    this.roomService.cancelJoinRequest(this.id).subscribe({
      next:  () => this.cancelling.set(false),
      error: () => this.cancelling.set(false),
    });
  }

  // ── Join ──────────────────────────────────────────────────────────────────

  join(): void {
    this.roomService.joinRoom(this.id).subscribe({
      next: () => {
        this.roomService.loadMessages(this.id);
        this.roomService.loadUpdates(this.id);
        this.roomService.startChatPolling(this.id);
      },
      error: () => {},
    });
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  sendMessage(): void {
    const text = this.chatDraft().trim();
    if (!text || this.sending()) return;
    this.sending.set(true);
    this.chatDraft.set('');
    this.roomService.sendMessage(this.id, text).subscribe({
      next:  () => this.sending.set(false),
      error: () => { this.chatDraft.set(text); this.sending.set(false); },
    });
  }

  onChatKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Updates ───────────────────────────────────────────────────────────────

  submitUpdate(): void {
    const text = this.updateDraft().trim();
    if (!text || this.postingUpdate()) return;
    this.postingUpdate.set(true);
    this.roomService.postUpdate(this.id, text).subscribe({
      next:  () => { this.updateDraft.set(''); this.postingUpdate.set(false); },
      error: () => this.postingUpdate.set(false),
    });
  }

  // ── Invite ────────────────────────────────────────────────────────────────

  openInvite(): void {
    this.showInvite.set(true);
    this.roomService.loadMyFollowers().subscribe(followers => {
      this.followers.set(followers);
    });
  }

  invite(username: string): void {
    this.inviteError.set(null);
    this.roomService.inviteToRoom(this.id, username).subscribe({
      next:  () => this.inviteSent.update(s => new Set([...s, username])),
      error: err => this.inviteError.set(err.error?.message ?? 'Could not send invite'),
    });
  }

  closeInvite(): void { this.showInvite.set(false); }

  // ── Leave ────────────────────────────────────────────────────────────────

  leaveRoom(): void {
    if (this.leaving()) return;
    this.leaving.set(true);
    this.roomService.leaveRoom(this.id).subscribe({
      next:  () => this.router.navigate(['/rooms']),
      error: () => this.leaving.set(false),
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  confirmDelete(): void { this.showDeleteConfirm.set(true); this.deleteError.set(null); }
  cancelDelete():  void { this.showDeleteConfirm.set(false); }

  deleteRoom(): void {
    this.deleting.set(true);
    this.roomService.deleteRoom(this.id).subscribe({
      next:  () => this.router.navigate(['/rooms']),
      error: err => {
        this.deleteError.set(err.error?.message ?? 'Failed to delete room.');
        this.deleting.set(false);
      },
    });
  }

  // ── Status toggle ────────────────────────────────────────────────────────

  toggleStatus(): void {
    if (this.togglingStatus()) return;
    this.togglingStatus.set(true);
    this.roomService.toggleRoomStatus(this.id).subscribe({
      next:  () => this.togglingStatus.set(false),
      error: () => this.togglingStatus.set(false),
    });
  }

  // ── Pending requests (inline approve / decline) ───────────────────────────

  approveInRoom(requestId: string): void {
    if (this.approvingId()) return;
    this.approvingId.set(requestId);
    this.roomService.approveJoinRequest(requestId).subscribe({
      next:  () => this.approvingId.set(null),
      error: () => this.approvingId.set(null),
    });
  }

  declineInRoom(requestId: string): void {
    if (this.decliningId()) return;
    this.decliningId.set(requestId);
    this.roomService.declineJoinRequest(requestId).subscribe({
      next:  () => this.decliningId.set(null),
      error: () => this.decliningId.set(null),
    });
  }

  // ── Itinerary upload ──────────────────────────────────────────────────────

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    this.uploading.set(true);
    this.roomService.uploadItinerary(this.id, file).subscribe({
      next:  () => { this.uploading.set(false); input.value = ''; },
      error: err => {
        this.uploading.set(false);
        input.value = '';
        this.uploadError.set(err.error?.message ?? 'Upload failed. Check file type and size (max 10 MB).');
      },
    });
  }

  deleteFile(itineraryId: string): void {
    if (this.deletingFileId()) return;
    this.deletingFileId.set(itineraryId);
    this.roomService.deleteItinerary(this.id, itineraryId).subscribe({
      next:  () => this.deletingFileId.set(null),
      error: () => this.deletingFileId.set(null),
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  fileIcon(contentType: string): string {
    if (contentType === 'application/pdf')    return 'pdf';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return 'xls';
    if (contentType.includes('wordprocessing') || contentType.includes('msword')) return 'doc';
    if (contentType.includes('gpx') || contentType.includes('xml')) return 'gpx';
    return 'txt';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  daysUntilDeletion(deletesOn: string): number {
    return Math.ceil((new Date(deletesOn).getTime() - Date.now()) / 86_400_000);
  }

  initials(username: string): string {
    return username.slice(0, 2).toUpperCase();
  }
}
