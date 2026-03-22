import { Injectable, signal } from '@angular/core';
import { HikePostDto }        from '../../../shared/models/hike-post.dto';

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const MOCK_POSTS: HikePostDto[] = [
  {
    id:        'post-001',
    author:    { username: 'rahul_hikes', avatarUrl: null },
    trailName: 'Triund Trek',
    trailSlug: 'triund-trek',
    condition: 'GREAT',
    caption:   'Absolutely stunning up there today. Snow line has pushed up nicely — trail is clear all the way to the top. Highly recommend starting before 6 AM.',
    timestamp: hoursAgo(2),
  },
  {
    id:        'post-002',
    author:    { username: 'priya_peak', avatarUrl: null },
    trailName: 'Kedarkantha Winter Trek',
    trailSlug: 'kedarkantha-winter-trek',
    condition: 'SNOWY',
    caption:   'Fresh snowfall overnight. Crampons essential after the third campsite. Views from the summit are worth every step though!',
    timestamp: hoursAgo(5),
  },
  {
    id:        'post-003',
    author:    { username: 'aman_wanderer', avatarUrl: null },
    trailName: 'Valley of Flowers Trek',
    trailSlug: 'valley-of-flowers-trek',
    condition: 'CROWDED',
    caption:   'It\'s peak season — trail was packed by 9 AM. Go early or expect queues at the narrow sections. Still gorgeous though.',
    timestamp: hoursAgo(9),
  },
  {
    id:        'post-004',
    author:    { username: 'meera_summit', avatarUrl: null },
    trailName: 'Hampta Pass Trek',
    trailSlug: 'hampta-pass-trek',
    condition: 'MUDDY',
    caption:   'Two days of rain have left the descent from the pass really slippery. Trekking poles are a must. The pass itself is breathtaking.',
    timestamp: hoursAgo(18),
  },
  {
    id:        'post-005',
    author:    { username: 'dev_trails', avatarUrl: null },
    trailName: 'Roopkund Trek',
    trailSlug: 'roopkund-trek',
    condition: 'AVOID',
    caption:   'Bridge near Bedni Bugyal is damaged from the last storm. Authorities have not cleared it yet — check with local guides before you go.',
    timestamp: hoursAgo(26),
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
