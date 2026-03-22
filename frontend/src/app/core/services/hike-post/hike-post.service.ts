import { Injectable, signal } from '@angular/core';
import { HikePostDto }        from '../../../shared/models/hike-post.dto';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const MOCK_POSTS: HikePostDto[] = [
  {
    id:        'post-001',
    author:    { username: 'rahul_hikes', avatarUrl: null },
    content:   'Just got back from Triund — snow line has pushed up, trail is completely clear. Started at 5 AM and had the summit to myself. 10/10 recommend going early this week!',
    trailName: 'Triund Trek',
    trailSlug: 'triund-trek',
    timestamp: hoursAgo(2),
  },
  {
    id:        'post-002',
    author:    { username: 'priya_peak', avatarUrl: null },
    content:   'Kedarkantha summit at sunrise hit different today. Fresh snowfall overnight made everything sparkle. Crampons essential after the third campsite.',
    trailName: 'Kedarkantha Winter Trek',
    trailSlug: 'kedarkantha-winter-trek',
    timestamp: hoursAgo(7),
  },
  {
    id:        'post-003',
    author:    { username: 'aman_wanderer', avatarUrl: null },
    content:   'Anyone planning Valley of Flowers this weekend — go early! Peak season crowds by 9 AM. Still absolutely gorgeous though, the wildflowers are insane right now.',
    timestamp: hoursAgo(14),
  },
];

@Injectable({ providedIn: 'root' })
export class HikePostService {
  private readonly _posts = signal<HikePostDto[]>(MOCK_POSTS);

  readonly posts = this._posts.asReadonly();

  add(post: HikePostDto): void {
    this._posts.update(list => [post, ...list]);
  }
}
