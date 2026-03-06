import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment }        from '../../../../environments/environment';
import { PublicUserDto }      from '../../../shared/models/public-user.dto';

// ─── Mock public profiles ─────────────────────────────────────────────
const MOCK_PROFILES: Record<string, PublicUserDto> = {
  'mountain.wanderer': {
    id:                   'mock-u1',
    username:             'mountain.wanderer',
    avatarUrl:            null,
    bio:                  'Summits over sunsets. Chasing horizons across the Himalayas — one pass at a time. Based in Dehradun.',
    joinedAt:             '2023-03-15T00:00:00Z',
    completedTrailsCount: 12,
    reviewsCount:         8,
    savedTrailsCount:     6,
    completedTrails: [
      { id: '1',  name: 'Roopkund Trek',      slug: 'roopkund',           difficulty: 'HARD',     regionName: 'Uttarakhand',       averageRating: 4.9 },
      { id: '4',  name: 'Kedarkantha',         slug: 'kedarkantha',        difficulty: 'EASY',     regionName: 'Uttarkashi',        averageRating: 4.8 },
      { id: '3',  name: 'Hampta Pass',         slug: 'hampta-pass',        difficulty: 'MODERATE', regionName: 'Himachal Pradesh',  averageRating: 4.7 },
      { id: '2',  name: 'Valley of Flowers',   slug: 'valley-of-flowers',  difficulty: 'EASY',     regionName: 'Chamoli',           averageRating: 4.8 },
      { id: '6',  name: 'Goechala',            slug: 'goechala',           difficulty: 'HARD',     regionName: 'Sikkim',            averageRating: 4.9 },
      { id: '8',  name: 'Sandakphu',           slug: 'sandakphu',          difficulty: 'MODERATE', regionName: 'West Bengal',       averageRating: 4.7 },
      { id: '9',  name: 'Brahmatal',           slug: 'brahmatal',          difficulty: 'MODERATE', regionName: 'Uttarakhand',       averageRating: 4.6 },
      { id: '10', name: 'Rupin Pass',          slug: 'rupin-pass',         difficulty: 'HARD',     regionName: 'Uttarkashi',        averageRating: 4.8 },
    ],
    recentReviews: [
      {
        id: 'r1', trailName: 'Roopkund Trek', trailSlug: 'roopkund', rating: 5,
        comment: 'One of the most surreal experiences of my life. The skeleton lake at dusk, the ridgeline with Trishul looming above — absolutely breathtaking. Challenging but worth every step.',
        visitedOn: 'October 2024',
      },
      {
        id: 'r2', trailName: 'Goechala', trailSlug: 'goechala', rating: 5,
        comment: 'Standing face-to-face with Kangchenjunga from the viewpoint — nothing prepares you for that. The rhododendron forests on the way up are equally spectacular.',
        visitedOn: 'April 2024',
      },
      {
        id: 'r3', trailName: 'Rupin Pass', trailSlug: 'rupin-pass', rating: 5,
        comment: 'The waterfall campsite alone is worth the trek. Crossing the snow chute on Day 4 was exhilarating — this is the most visually diverse trail I have done.',
        visitedOn: 'June 2023',
      },
    ],
  },

  'trekkie_raj': {
    id:                   'mock-u2',
    username:             'trekkie_raj',
    avatarUrl:            null,
    bio:                  'Weekend trekker and occasional photographer. Started with Triund, now dreaming of Stok Kangri.',
    joinedAt:             '2024-01-20T00:00:00Z',
    completedTrailsCount: 5,
    reviewsCount:         3,
    savedTrailsCount:     10,
    completedTrails: [
      { id: '15', name: 'Triund',            slug: 'triund',            difficulty: 'EASY',     regionName: 'Himachal Pradesh', averageRating: 4.5 },
      { id: '2',  name: 'Valley of Flowers', slug: 'valley-of-flowers', difficulty: 'EASY',     regionName: 'Chamoli',          averageRating: 4.8 },
      { id: '4',  name: 'Kedarkantha',       slug: 'kedarkantha',       difficulty: 'EASY',     regionName: 'Uttarkashi',       averageRating: 4.8 },
      { id: '3',  name: 'Hampta Pass',       slug: 'hampta-pass',       difficulty: 'MODERATE', regionName: 'Himachal Pradesh', averageRating: 4.7 },
      { id: '14', name: 'Kuari Pass',        slug: 'kuari-pass',        difficulty: 'EASY',     regionName: 'Garhwal',          averageRating: 4.6 },
    ],
    recentReviews: [
      {
        id: 'r4', trailName: 'Kedarkantha', trailSlug: 'kedarkantha', rating: 5,
        comment: 'My first winter trek and I could not have picked a better one. Summit sunrise at −10°C with a 360° panorama of white peaks — absolutely magical. The guides at Sankri were excellent.',
        visitedOn: 'January 2024',
      },
      {
        id: 'r5', trailName: 'Triund', trailSlug: 'triund', rating: 4,
        comment: 'Perfect beginner trail. The sunset from the ridge with the Dhauladhar wall behind you is stunning. Can get crowded on weekends — go midweek if you can.',
        visitedOn: 'November 2023',
      },
      {
        id: 'r6', trailName: 'Hampta Pass', trailSlug: 'hampta-pass', rating: 5,
        comment: 'The contrast between the green Kullu valley and the barren Lahaul desert is jaw-dropping. The pass itself is a real achievement. Highly recommend adding Chandratal on Day 5.',
        visitedOn: 'September 2024',
      },
    ],
  },

  'trailblazer.neha': {
    id:                   'mock-u3',
    username:             'trailblazer.neha',
    avatarUrl:            null,
    bio:                  'First-generation Himalayan trekker. Making memories, not excuses.',
    joinedAt:             '2024-07-05T00:00:00Z',
    completedTrailsCount: 3,
    reviewsCount:         5,
    savedTrailsCount:     8,
    completedTrails: [
      { id: '15', name: 'Triund',            slug: 'triund',            difficulty: 'EASY', regionName: 'Himachal Pradesh', averageRating: 4.5 },
      { id: '18', name: 'Dayara Bugyal',     slug: 'dayara-bugyal',     difficulty: 'EASY', regionName: 'Uttarkashi',       averageRating: 4.6 },
      { id: '2',  name: 'Valley of Flowers', slug: 'valley-of-flowers', difficulty: 'EASY', regionName: 'Chamoli',          averageRating: 4.8 },
    ],
    recentReviews: [
      {
        id: 'r7', trailName: 'Valley of Flowers', trailSlug: 'valley-of-flowers', rating: 5,
        comment: 'The meadows were in full bloom when we visited in August. More than 300 species of wildflowers all at once — it felt unreal. The walk from Ghangaria is gentle and well-marked.',
        visitedOn: 'August 2024',
      },
      {
        id: 'r8', trailName: 'Dayara Bugyal', trailSlug: 'dayara-bugyal', rating: 5,
        comment: 'First time seeing snow in my life! The meadow at sunrise with fresh powder was something I will never forget. The guide from Barsu was incredibly knowledgeable.',
        visitedOn: 'January 2025',
      },
    ],
  },
};

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  getPublicProfile(username: string): Observable<PublicUserDto> {
    return this.http
      .get<PublicUserDto>(`${this.base}/${username}/public`)
      .pipe(
        catchError(() => {
          const mock = MOCK_PROFILES[username];
          if (mock) return of(mock);
          throw new Error(`User "${username}" not found`);
        }),
      );
  }

  getPublicProfiles(): Observable<PublicUserDto[]> {
    return of(Object.values(MOCK_PROFILES));
  }
}
