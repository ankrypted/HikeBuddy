import { Injectable, inject }          from '@angular/core';
import { HttpClient, HttpParams }      from '@angular/common/http';
import { Observable, of }              from 'rxjs';
import { environment }                 from '../../../../environments/environment';
import {
  TrailSummaryDto, TrailDetailDto, TrailFilterDto, ReviewDto,
} from '../../../shared/models/trail.dto';
import { PageResponseDto }             from '../../../shared/models/pagination.dto';

// ─── Mock summary data ────────────────────────────────────────────────
const MOCK_FEATURED_TRAILS: TrailSummaryDto[] = [
  {
    id: '1', name: 'Roopkund Trek', slug: 'roopkund',
    region: { id: 'r1', name: 'Uttarakhand', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 53, durationMinutes: 540, elevationGainM: 3270,
    thumbnailUrl: '', averageRating: 4.9, reviewCount: 215, isFeatured: true,
  },
  {
    id: '2', name: 'Valley of Flowers', slug: 'valley-of-flowers',
    region: { id: 'r2', name: 'Uttarakhand', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 38, durationMinutes: 300, elevationGainM: 1170,
    thumbnailUrl: '', averageRating: 4.8, reviewCount: 178, isFeatured: true,
  },
  {
    id: '3', name: 'Hampta Pass', slug: 'hampta-pass',
    region: { id: 'r3', name: 'Himachal Pradesh', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 35, durationMinutes: 480, elevationGainM: 1600,
    thumbnailUrl: '', averageRating: 4.7, reviewCount: 134, isFeatured: true,
  },
];

// ─── Mock detail data ─────────────────────────────────────────────────
const MOCK_TRAIL_DETAILS: Record<string, TrailDetailDto> = {
  'roopkund': {
    ...MOCK_FEATURED_TRAILS[0],
    description:
      `Roopkund Trek leads you to one of India's most enigmatic destinations — a glacial lake at 5,029 metres littered with ancient human skeletons. The trek traverses dense oak and rhododendron forests, sweeping alpine meadows carpeted with wildflowers, and a final dramatic ascent over the Junargali ridge. Each campsite reveals a new face of the Himalayas: Bedni Bugyal's vast rolling meadows, the haunting stillness of Patar Nachauni, and the awe-inspiring Trishul and Nanda Ghunti peaks dominating the skyline. The skeletons, carbon-dated to around 850 CE, remain a subject of scientific fascination. This is a trek that tests your endurance, rewards your courage, and leaves you with memories that last a lifetime.`,
    startLatitude: 30.2525, startLongitude: 79.7365,
    routeGeoJsonUrl: '', media: [],
    tags: ['High Altitude', 'Glacial Lake', 'Mystery', 'Camping', 'Himalayas'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'valley-of-flowers': {
    ...MOCK_FEATURED_TRAILS[1],
    description:
      `Valley of Flowers National Park is a UNESCO World Heritage Site nestled at 3,658 metres in the Chamoli district of Uttarakhand. Open only from July to September, the valley transforms into a riot of colour as over 300 species of wildflowers bloom across the meadows — orchids, poppies, marigolds, and the rare Brahma Kamal. The approach from Govindghat follows the Pushpawati river through dense forests to the base camp at Ghangaria, from where the valley is a gentle day hike. The same base camp also serves as the starting point for the Hemkund Sahib pilgrimage, a sacred Sikh shrine at 4,329 metres. The Valley of Flowers is one of the few treks in the Himalayas that is equally rewarding for casual walkers and seasoned trekkers alike.`,
    startLatitude: 30.7283, startLongitude: 79.6050,
    routeGeoJsonUrl: '', media: [],
    tags: ['UNESCO', 'Wildflowers', 'Photography', 'Summer Only', 'Beginner Friendly'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'hampta-pass': {
    ...MOCK_FEATURED_TRAILS[2],
    description:
      `Hampta Pass is a crossover trek in Himachal Pradesh that offers one of the most dramatic landscape contrasts in the Himalayas. Beginning in the lush green Kullu valley near Manali, the trail ascends through dense alpine forests and flower-filled meadows before reaching the pass at 4,270 metres. The descent on the other side into Lahaul is nothing short of surreal — you step from a world of rivers and greenery into a stark, high-altitude desert of brown and grey. The trek passes through Jobra, Chika, Balu ka Ghera and Siagoru before culminating at Chatru in the Lahaul valley, where jeeps ferry trekkers to Chandratal lake. Best done from June to mid-October, Hampta Pass is an ideal choice for trekkers looking for a mid-level challenge with maximum scenic reward.`,
    startLatitude: 32.2396, startLongitude: 77.1887,
    routeGeoJsonUrl: '', media: [],
    tags: ['Crossover', 'Snow Pass', 'Camping', 'Himachal', 'Scenic'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
};

// ─── Mock reviews ─────────────────────────────────────────────────────
const MOCK_REVIEWS: Record<string, ReviewDto[]> = {
  'roopkund': [
    {
      id: 'rv1', authorName: 'Arjun Mehra', authorAvatarInitials: 'AM', rating: 5,
      visitedOn: 'September 2024',
      comment: 'One of the most intense and unforgettable experiences of my life. The skeleton lake is absolutely surreal — standing at 5,000 metres with ancient bones around the shore and Trishul peak towering above is something I\'ll never forget. The Bedni Bugyal campsite on Day 3 was pure magic.',
    },
    {
      id: 'rv2', authorName: 'Priya Sharma', authorAvatarInitials: 'PS', rating: 4,
      visitedOn: 'June 2024',
      comment: 'The trek is genuinely hard — don\'t underestimate it. The final push from Patar Nachauni to the lake is steep and exhausting at high altitude. But the payoff is absolutely worth every painful step. Tip: acclimatise well at Loharjung before starting.',
    },
    {
      id: 'rv3', authorName: 'Vikram Nair', authorAvatarInitials: 'VN', rating: 5,
      visitedOn: 'October 2023',
      comment: 'Did this with a group of six and it was the best decision we ever made. The night skies at Bhagwabasa are absolutely insane — more stars than I\'ve ever seen. The mystery of the lake adds a completely different dimension to the experience. Will do it again!',
    },
    {
      id: 'rv4', authorName: 'Sneha Reddy', authorAvatarInitials: 'SR', rating: 4,
      visitedOn: 'September 2023',
      comment: 'Stunning trek but the weather can be very unpredictable. We had a snowstorm on Day 5 which made things intense. Make sure you have proper layering and waterproof gear. The views from Junargali ridge are breathtaking on a clear day.',
    },
  ],
  'valley-of-flowers': [
    {
      id: 'rv5', authorName: 'Rahul Joshi', authorAvatarInitials: 'RJ', rating: 5,
      visitedOn: 'August 2024',
      comment: 'I went during peak bloom in early August and it was like walking through a painting. The sheer variety of flowers is staggering — I counted at least 30 different species just on the main trail. Ghangaria is a comfortable base camp and the trek itself is perfect for families.',
    },
    {
      id: 'rv6', authorName: 'Ananya Iyer', authorAvatarInitials: 'AI', rating: 5,
      visitedOn: 'July 2024',
      comment: 'Absolutely magical. The combination of Valley of Flowers and Hemkund Sahib in a 5-day itinerary is perfect. The valley fully deserves its UNESCO status — it\'s unlike anything else in the world. The stream running through the centre of the valley completes the picture.',
    },
    {
      id: 'rv7', authorName: 'Deepak Chaudhary', authorAvatarInitials: 'DC', rating: 4,
      visitedOn: 'August 2023',
      comment: 'A genuinely beautiful place but go in the right month — July to mid-August is when flowers are at their peak. We went in late September and many blooms had faded. The trail from Ghangaria is well-maintained and great for photography!',
    },
    {
      id: 'rv8', authorName: 'Meera Pillai', authorAvatarInitials: 'MP', rating: 5,
      visitedOn: 'August 2023',
      comment: 'I\'ve done many Himalayan treks and this one holds a special place. The variety of flora is remarkable — it feels like a different world. The Brahma Kamal flowers near the upper valley are especially striking. Camp at Ghangaria and do early morning walks for the best experience.',
    },
  ],
  'hampta-pass': [
    {
      id: 'rv9', authorName: 'Karan Singh', authorAvatarInitials: 'KS', rating: 5,
      visitedOn: 'July 2024',
      comment: 'The landscape contrast when you cross the pass is absolutely mindblowing. One moment you\'re in green meadows, the next you\'re in a lunar desert. Balu ka Ghera campsite with the glacial river is simply stunning. My go-to recommendation for anyone wanting a memorable trek without extreme difficulty.',
    },
    {
      id: 'rv10', authorName: 'Tanya Menon', authorAvatarInitials: 'TM', rating: 4,
      visitedOn: 'August 2024',
      comment: 'Did this as my first proper Himalayan trek and it was perfect for the experience level. The pass was covered in snow even in August which made for spectacular photos. The river crossing on Day 3 was the most exciting part. Excellent guides from the operator we chose.',
    },
    {
      id: 'rv11', authorName: 'Siddharth Roy', authorAvatarInitials: 'SR', rating: 5,
      visitedOn: 'September 2023',
      comment: 'Hampta Pass is massively underrated compared to Roopkund or Kashmir treks. The Balu ka Ghera camp is one of the most beautiful campsites I\'ve ever seen — ringed by massive peaks with a glacial stream running through it. The barren Lahaul descent is an experience unlike any other.',
    },
    {
      id: 'rv12', authorName: 'Neha Kulkarni', authorAvatarInitials: 'NK', rating: 4,
      visitedOn: 'June 2024',
      comment: 'The June crossing meant the pass had significant snow. Challenging but safe with proper gear and a good guide. The contrast between the two sides of the pass is genuinely breathtaking. Easy logistics from Manali make this a great long-weekend trek.',
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class TrailService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/trails`;

  getTrails(filter: TrailFilterDto): Observable<PageResponseDto<TrailSummaryDto>> {
    const params = new HttpParams({ fromObject: { ...filter } as Record<string, string> });
    return this.http.get<PageResponseDto<TrailSummaryDto>>(this.base, { params });
  }

  getFeaturedTrails(): Observable<TrailSummaryDto[]> {
    // Swap for real HTTP call when backend is ready:
    // return this.http.get<TrailSummaryDto[]>(`${this.base}/featured`);
    return of(MOCK_FEATURED_TRAILS);
  }

  getTrailBySlug(slug: string): Observable<TrailDetailDto> {
    // Swap for real HTTP call when backend is ready:
    // return this.http.get<TrailDetailDto>(`${this.base}/${slug}`);
    return of(MOCK_TRAIL_DETAILS[slug]);
  }

  getTrailReviews(slug: string): Observable<ReviewDto[]> {
    // Swap for real HTTP call when backend is ready:
    // return this.http.get<ReviewDto[]>(`${this.base}/${slug}/reviews`);
    return of(MOCK_REVIEWS[slug] ?? []);
  }
}
