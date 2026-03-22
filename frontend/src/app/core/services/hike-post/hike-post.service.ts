import { Injectable, signal } from '@angular/core';
import { HikePostDto }        from '../../../shared/models/hike-post.dto';

@Injectable({ providedIn: 'root' })
export class HikePostService {
  private readonly _posts = signal<HikePostDto[]>([]);

  readonly posts = this._posts.asReadonly();

  add(post: HikePostDto): void {
    this._posts.update(list => [post, ...list]);
  }
}
