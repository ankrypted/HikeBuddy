import { Injectable, signal } from '@angular/core';
import { HikePostDto }        from '../../../shared/models/hike-post.dto';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const MOCK_POSTS: HikePostDto[] = [
  {
    id:             'post-001',
    author:         { username: 'rahul_hikes', avatarUrl: null },
    trailName:      'Triund Trek',
    trailSlug:      'triund-trek',
    experience:     'Absolutely stunning — snow line has pushed up and the trail is completely clear. Had the summit to myself at sunrise.',
    condition:      'GREAT',
    recommendation: 'YES',
    tip:            'Start before 6 AM to beat the crowd and catch golden hour.',
    timestamp:      hoursAgo(2),
  },
  {
    id:             'post-002',
    author:         { username: 'priya_peak', avatarUrl: null },
    trailName:      'Kedarkantha Winter Trek',
    trailSlug:      'kedarkantha-winter-trek',
    experience:     'Summit at sunrise was breathtaking. Fresh snowfall overnight made everything sparkle.',
    condition:      'SNOWY',
    recommendation: 'YES',
    tip:            'Crampons are essential after the third campsite.',
    timestamp:      hoursAgo(7),
  },
  {
    id:             'post-003',
    author:         { username: 'aman_wanderer', avatarUrl: null },
    trailName:      'Valley of Flowers Trek',
    trailSlug:      'valley-of-flowers-trek',
    experience:     'Wildflowers are insane right now — peak bloom. Trail was packed by 9 AM though.',
    condition:      'CROWDED',
    recommendation: 'MAYBE',
    timestamp:      hoursAgo(14),
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
