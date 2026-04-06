import { Injectable, signal, inject } from '@angular/core';
import { HttpClient }                 from '@angular/common/http';
import { tap }                        from 'rxjs/operators';
import { Observable }                 from 'rxjs';
import { HikePostDto }                from '../../../shared/models/hike-post.dto';
import { environment }                from '../../../../environments/environment';

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
  private readonly base    = `${environment.apiUrl}/hike-posts`;
  private readonly _posts  = signal<HikePostDto[]>([]);

  readonly posts = this._posts.asReadonly();

  loadFeed(): void {
    this.http.get<HikePostDto[]>(`${this.base}/feed`)
      .subscribe(posts => this._posts.set(posts));
  }

  create(req: CreateHikePostRequest): Observable<HikePostDto> {
    return this.http.post<HikePostDto>(this.base, req).pipe(
      tap(post => this._posts.update(list => [post, ...list])),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this._posts.update(list => list.filter(p => p.id !== id))),
    );
  }
}
