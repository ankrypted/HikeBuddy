import { Injectable, signal, inject } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { Observable, Subscription, interval } from 'rxjs';
import { tap }                        from 'rxjs/operators';
import {
  RoomSummaryDto, RoomDetailDto,
  RoomMessageDto, RoomUpdateDto, CreateRoomRequest, JoinRequestDto, RoomItineraryDto,
} from '../../../shared/models/room.dto';
import { environment }                from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/rooms`;

  readonly myRooms         = signal<RoomSummaryDto[]>([]);
  readonly openRooms       = signal<RoomSummaryDto[]>([]);
  readonly activeRoom      = signal<RoomDetailDto | null>(null);
  readonly messages        = signal<RoomMessageDto[]>([]);
  readonly updates         = signal<RoomUpdateDto[]>([]);
  readonly pendingRequests = signal<JoinRequestDto[]>([]);
  readonly itineraries     = signal<RoomItineraryDto[]>([]);

  private pollSub: Subscription | null = null;
  private lastMessageTime: string | null = null;

  // ── Rooms ────────────────────────────────────────────────────────────────

  loadMyRooms(): void {
    this.http.get<RoomSummaryDto[]>(`${this.base}/my`)
      .subscribe(rooms => this.myRooms.set(rooms));
  }

  loadOpenRooms(): void {
    this.http.get<RoomSummaryDto[]>(`${this.base}/open`)
      .subscribe(rooms => this.openRooms.set(rooms));
  }

  loadRoom(id: string): void {
    this.http.get<RoomDetailDto>(`${this.base}/${id}`)
      .subscribe(room => this.activeRoom.set(room));
  }

  createRoom(req: CreateRoomRequest): Observable<RoomDetailDto> {
    return this.http.post<RoomDetailDto>(this.base, req).pipe(
      tap(room => this.myRooms.update(list => [this.toSummary(room), ...list])),
    );
  }

  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => {
        this.myRooms.update(list => list.filter(r => r.id !== id));
        this.openRooms.update(list => list.filter(r => r.id !== id));
      }),
    );
  }

  joinRoom(id: string): Observable<RoomDetailDto> {
    return this.http.post<RoomDetailDto>(`${this.base}/${id}/join`, {}).pipe(
      tap(room => {
        this.activeRoom.set(room);
        if (!this.myRooms().find(r => r.id === id)) {
          this.myRooms.update(list => [this.toSummary(room), ...list]);
        }
      }),
    );
  }

  requestJoin(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/join-request`, {}).pipe(
      tap(() => {
        this.activeRoom.update(r => r ? { ...r, pendingRequestId: '__pending__' } : r);
      }),
    );
  }

  cancelJoinRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/join-request`).pipe(
      tap(() => {
        this.activeRoom.update(r => r ? { ...r, pendingRequestId: null } : r);
      }),
    );
  }

  loadPendingRequests(roomId: string): void {
    this.http.get<JoinRequestDto[]>(`${this.base}/${roomId}/requests`)
      .subscribe({ next: list => this.pendingRequests.set(list), error: () => {} });
  }

  approveJoinRequest(requestId: string): Observable<RoomDetailDto> {
    return this.http.post<RoomDetailDto>(`${this.base}/join-requests/${requestId}/approve`, {}).pipe(
      tap(room => {
        this.activeRoom.set(room);
        this.pendingRequests.update(list => list.filter(r => r.id !== requestId));
      }),
    );
  }

  toggleRoomStatus(id: string): Observable<RoomDetailDto> {
    return this.http.patch<RoomDetailDto>(`${this.base}/${id}/status`, {}).pipe(
      tap(room => {
        this.activeRoom.set(room);
        this.myRooms.update(list => list.map(r => r.id === id ? { ...r, status: room.status } : r));
        this.openRooms.update(list => list.filter(r => r.id !== id || room.status === 'OPEN'));
      }),
    );
  }

  declineJoinRequest(requestId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/join-requests/${requestId}/decline`, {}).pipe(
      tap(() => this.pendingRequests.update(list => list.filter(r => r.id !== requestId))),
    );
  }

  leaveRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/members/me`).pipe(
      tap(() => {
        const room = this.myRooms().find(r => r.id === id);
        this.myRooms.update(list => list.filter(r => r.id !== id));
        if (room && !this.openRooms().find(r => r.id === id)) {
          this.openRooms.update(list => [room, ...list]);
        }
        this.activeRoom.set(null);
      }),
    );
  }

  inviteToRoom(id: string, username: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/invite`, { username });
  }

  loadMyFollowers(): Observable<{ username: string; avatarUrl: string | null }[]> {
    return this.http.get<{ username: string; avatarUrl: string | null }[]>(`${this.base}/my-followers`);
  }

  getRoomsForTrail(slug: string): Observable<RoomSummaryDto[]> {
    return this.http.get<RoomSummaryDto[]>(`${this.base}/trail/${slug}`);
  }

  // ── Messages ─────────────────────────────────────────────────────────────

  loadMessages(roomId: string): void {
    const url = this.lastMessageTime
      ? `${this.base}/${roomId}/messages?since=${encodeURIComponent(this.lastMessageTime)}`
      : `${this.base}/${roomId}/messages`;

    this.http.get<RoomMessageDto[]>(url).subscribe(msgs => {
      if (msgs.length) {
        if (this.lastMessageTime) {
          this.messages.update(existing => [...existing, ...msgs]);
        } else {
          this.messages.set(msgs);
        }
        this.lastMessageTime = msgs[msgs.length - 1].sentAt;
      }
    });
  }

  sendMessage(roomId: string, content: string): Observable<RoomMessageDto> {
    return this.http.post<RoomMessageDto>(`${this.base}/${roomId}/messages`, { content }).pipe(
      tap(msg => {
        this.messages.update(list => [...list, msg]);
        this.lastMessageTime = msg.sentAt;
      }),
    );
  }

  startChatPolling(roomId: string): void {
    this.stopChatPolling();
    this.pollSub = interval(5_000).subscribe(() => this.loadMessages(roomId));
  }

  stopChatPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  resetChat(): void {
    this.messages.set([]);
    this.lastMessageTime = null;
  }

  // ── Updates ───────────────────────────────────────────────────────────────

  loadUpdates(roomId: string): void {
    this.http.get<RoomUpdateDto[]>(`${this.base}/${roomId}/updates`)
      .subscribe(upds => this.updates.set(upds));
  }

  postUpdate(roomId: string, content: string): Observable<RoomUpdateDto> {
    return this.http.post<RoomUpdateDto>(`${this.base}/${roomId}/updates`, { content }).pipe(
      tap(upd => this.updates.update(list => [upd, ...list])),
    );
  }

  getUpdatesForTrail(slug: string): Observable<RoomUpdateDto[]> {
    return this.http.get<RoomUpdateDto[]>(`${this.base}/updates/trail/${slug}`);
  }

  // ── Itineraries ───────────────────────────────────────────────────────────

  loadItineraries(roomId: string): void {
    this.http.get<RoomItineraryDto[]>(`${this.base}/${roomId}/itineraries`)
      .subscribe({ next: list => this.itineraries.set(list), error: () => {} });
  }

  uploadItinerary(roomId: string, file: File): Observable<RoomItineraryDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<RoomItineraryDto>(`${this.base}/${roomId}/itineraries`, formData).pipe(
      tap(dto => this.itineraries.update(list => [dto, ...list])),
    );
  }

  deleteItinerary(roomId: string, itineraryId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${roomId}/itineraries/${itineraryId}`).pipe(
      tap(() => this.itineraries.update(list => list.filter(i => i.id !== itineraryId))),
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toSummary(r: RoomDetailDto): RoomSummaryDto {
    return {
      id: r.id, trailId: r.trailId, trailName: r.trailName,
      plannedDate: r.plannedDate, title: r.title, status: r.status,
      creatorUsername: r.creatorUsername, memberCount: r.memberCount,
      createdAt: r.createdAt, durationDays: r.durationDays, deletesOn: r.deletesOn,
    };
  }
}
