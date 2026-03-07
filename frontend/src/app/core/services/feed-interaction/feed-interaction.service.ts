import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { environment }        from '../../../../environments/environment';
import { FeedCommentDto, FeedEventRef, InteractionSummaryDto } from '../../../shared/models/feed-interaction.dto';

@Injectable({ providedIn: 'root' })
export class FeedInteractionService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/feed`;

  /** Toggle like on an activity event. Returns updated summary. */
  toggleLike(ownerUsername: string, eventId: string,
             trailName: string, eventType: string): Observable<InteractionSummaryDto> {
    return this.http.post<InteractionSummaryDto>(
      `${this.base}/events/${ownerUsername}/${eventId}/like`,
      { trailName, eventType });
  }

  /** Post a comment on an activity event. */
  postComment(ownerUsername: string, eventId: string,
              body: string, trailName: string, eventType: string): Observable<FeedCommentDto> {
    return this.http.post<FeedCommentDto>(
      `${this.base}/events/${ownerUsername}/${eventId}/comments`,
      { body, trailName, eventType });
  }

  /** Fetch interaction summaries for a list of feed events in one call. */
  batchSummaries(refs: FeedEventRef[]): Observable<Record<string, InteractionSummaryDto>> {
    return this.http.post<Record<string, InteractionSummaryDto>>(
      `${this.base}/interactions/summaries`, refs);
  }
}