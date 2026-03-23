import { Injectable, signal, inject } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { tap }                        from 'rxjs/operators';
import { Observable }                 from 'rxjs';
import { HikePostDto }                from '../../../shared/models/hike-post.dto';

export interface CreateHikePostRequest {
  trailName:      string;
  trailSlug:      string;
  experience:     string;
  condition:      string;
  recommendation: string;
  tip?:           string;
}

@Injectable({ providedIn: 'root' })
export class HikePostService {
  private readonly http    = inject(HttpClient);
  private readonly _posts  = signal<HikePostDto[]>([]);

  readonly posts = this._posts.asReadonly();

  loadFeed(): void {
    this.http.get<HikePostDto[]>('/api/v1/hike-posts/feed')
      .subscribe(posts => this._posts.set(posts));
  }

  create(req: CreateHikePostRequest): Observable<HikePostDto> {
    return this.http.post<HikePostDto>('/api/v1/hike-posts', req).pipe(
      tap(post => this._posts.update(list => [post, ...list])),
    );
  }
}
