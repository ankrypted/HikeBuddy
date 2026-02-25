import { Injectable, inject }          from '@angular/core';
import { HttpClient, HttpParams }      from '@angular/common/http';
import { Observable, of }              from 'rxjs';
import { environment }                 from '../../../../environments/environment';
import {
  TrailSummaryDto, TrailDetailDto, TrailFilterDto, ReviewDto,
} from '../../../shared/models/trail.dto';
import { PageResponseDto }             from '../../../shared/models/pagination.dto';

// ─── Mock data — all 20 trails ────────────────────────────────────────
const MOCK_ALL_TRAILS: TrailSummaryDto[] = [
  {
    id: '1', name: 'Roopkund Trek', slug: 'roopkund',
    region: { id: 'r1', name: 'Uttarakhand', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 53, durationMinutes: 540, elevationGainM: 3270,
    thumbnailUrl: '', averageRating: 4.9, reviewCount: 215, isFeatured: true,
  },
  {
    id: '2', name: 'Valley of Flowers', slug: 'valley-of-flowers',
    region: { id: 'r2', name: 'Chamoli', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 38, durationMinutes: 300, elevationGainM: 1170,
    thumbnailUrl: '', averageRating: 4.8, reviewCount: 178, isFeatured: true,
  },
  {
    id: '3', name: 'Hampta Pass', slug: 'hampta-pass',
    region: { id: 'r3', name: 'Himachal Pradesh', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 35, durationMinutes: 480, elevationGainM: 1600,
    thumbnailUrl: '', averageRating: 4.7, reviewCount: 134, isFeatured: true,
  },
  {
    id: '4', name: 'Kedarkantha', slug: 'kedarkantha',
    region: { id: 'r4', name: 'Uttarkashi', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EASY', distanceKm: 20, durationMinutes: 360, elevationGainM: 1640,
    thumbnailUrl: '', averageRating: 4.7, reviewCount: 312, isFeatured: false,
  },
  {
    id: '5', name: 'Chadar Trek', slug: 'chadar-trek',
    region: { id: 'r5', name: 'Ladakh', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 105, durationMinutes: 720, elevationGainM: 400,
    thumbnailUrl: '', averageRating: 4.9, reviewCount: 156, isFeatured: false,
  },
  {
    id: '6', name: 'Goechala', slug: 'goechala',
    region: { id: 'r6', name: 'Sikkim', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 90, durationMinutes: 600, elevationGainM: 2700,
    thumbnailUrl: '', averageRating: 4.8, reviewCount: 198, isFeatured: false,
  },
  {
    id: '7', name: 'Tarsar Marsar', slug: 'tarsar-marsar',
    region: { id: 'r7', name: 'Kashmir', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 48, durationMinutes: 360, elevationGainM: 2050,
    thumbnailUrl: '', averageRating: 4.7, reviewCount: 142, isFeatured: false,
  },
  {
    id: '8', name: 'Sandakphu Trek', slug: 'sandakphu',
    region: { id: 'r8', name: 'Darjeeling', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 55, durationMinutes: 480, elevationGainM: 1950,
    thumbnailUrl: '', averageRating: 4.6, reviewCount: 224, isFeatured: false,
  },
  {
    id: '9', name: 'Brahmatal Trek', slug: 'brahmatal',
    region: { id: 'r2', name: 'Chamoli', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EASY', distanceKm: 22, durationMinutes: 300, elevationGainM: 1500,
    thumbnailUrl: '', averageRating: 4.6, reviewCount: 188, isFeatured: false,
  },
  {
    id: '10', name: 'Rupin Pass', slug: 'rupin-pass',
    region: { id: 'r4', name: 'Uttarkashi', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 52, durationMinutes: 540, elevationGainM: 3050,
    thumbnailUrl: '', averageRating: 4.8, reviewCount: 167, isFeatured: false,
  },
  {
    id: '11', name: 'Kashmir Great Lakes', slug: 'kashmir-great-lakes',
    region: { id: 'r7', name: 'Kashmir', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 70, durationMinutes: 480, elevationGainM: 3800,
    thumbnailUrl: '', averageRating: 4.9, reviewCount: 245, isFeatured: false,
  },
  {
    id: '12', name: 'Pin Parvati Pass', slug: 'pin-parvati-pass',
    region: { id: 'r9', name: 'Kullu', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EXPERT', distanceKm: 110, durationMinutes: 720, elevationGainM: 4600,
    thumbnailUrl: '', averageRating: 4.9, reviewCount: 89, isFeatured: false,
  },
  {
    id: '13', name: 'Markha Valley', slug: 'markha-valley',
    region: { id: 'r5', name: 'Ladakh', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 80, durationMinutes: 540, elevationGainM: 2950,
    thumbnailUrl: '', averageRating: 4.6, reviewCount: 178, isFeatured: false,
  },
  {
    id: '14', name: 'Kuari Pass', slug: 'kuari-pass',
    region: { id: 'r2', name: 'Chamoli', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EASY', distanceKm: 22, durationMinutes: 360, elevationGainM: 1600,
    thumbnailUrl: '', averageRating: 4.5, reviewCount: 203, isFeatured: false,
  },
  {
    id: '15', name: 'Triund', slug: 'triund',
    region: { id: 'r3', name: 'Himachal Pradesh', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EASY', distanceKm: 18, durationMinutes: 240, elevationGainM: 900,
    thumbnailUrl: '', averageRating: 4.4, reviewCount: 412, isFeatured: false,
  },
  {
    id: '16', name: 'Har Ki Dun', slug: 'har-ki-dun',
    region: { id: 'r4', name: 'Uttarkashi', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 42, durationMinutes: 420, elevationGainM: 2250,
    thumbnailUrl: '', averageRating: 4.7, reviewCount: 231, isFeatured: false,
  },
  {
    id: '17', name: 'Pangarchulla Peak', slug: 'pangarchulla-peak',
    region: { id: 'r2', name: 'Chamoli', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'HARD', distanceKm: 24, durationMinutes: 420, elevationGainM: 2800,
    thumbnailUrl: '', averageRating: 4.6, reviewCount: 122, isFeatured: false,
  },
  {
    id: '18', name: 'Dayara Bugyal', slug: 'dayara-bugyal',
    region: { id: 'r4', name: 'Uttarkashi', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EASY', distanceKm: 22, durationMinutes: 300, elevationGainM: 1100,
    thumbnailUrl: '', averageRating: 4.5, reviewCount: 176, isFeatured: false,
  },
  {
    id: '19', name: 'Phulara Ridge', slug: 'phulara-ridge',
    region: { id: 'r4', name: 'Uttarkashi', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'MODERATE', distanceKm: 16, durationMinutes: 240, elevationGainM: 1050,
    thumbnailUrl: '', averageRating: 4.4, reviewCount: 145, isFeatured: false,
  },
  {
    id: '20', name: 'Stok Kangri', slug: 'stok-kangri',
    region: { id: 'r5', name: 'Ladakh', country: 'India', countryCode: 'IN', thumbnailUrl: '' },
    difficulty: 'EXPERT', distanceKm: 32, durationMinutes: 480, elevationGainM: 3900,
    thumbnailUrl: '', averageRating: 4.8, reviewCount: 134, isFeatured: false,
  },
];

const MOCK_FEATURED_TRAILS = MOCK_ALL_TRAILS.filter(t => t.isFeatured);

// ─── Mock detail data ─────────────────────────────────────────────────
const MOCK_TRAIL_DETAILS: Record<string, TrailDetailDto> = {
  'roopkund': {
    ...MOCK_ALL_TRAILS[0],
    description:
      `Roopkund Trek leads you to one of India's most enigmatic destinations — a glacial lake at 5,029 metres littered with ancient human skeletons. The trek traverses dense oak and rhododendron forests, sweeping alpine meadows carpeted with wildflowers, and a final dramatic ascent over the Junargali ridge. Each campsite reveals a new face of the Himalayas: Bedni Bugyal's vast rolling meadows, the haunting stillness of Patar Nachauni, and the awe-inspiring Trishul and Nanda Ghunti peaks dominating the skyline. The skeletons, carbon-dated to around 850 CE, remain a subject of scientific fascination. This is a trek that tests your endurance, rewards your courage, and leaves you with memories that last a lifetime.`,
    startLatitude: 30.2525, startLongitude: 79.7365,
    routeGeoJsonUrl: '', media: [],
    tags: ['High Altitude', 'Glacial Lake', 'Mystery', 'Camping', 'Himalayas'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'valley-of-flowers': {
    ...MOCK_ALL_TRAILS[1],
    description:
      `Valley of Flowers National Park is a UNESCO World Heritage Site nestled at 3,658 metres in the Chamoli district of Uttarakhand. Open only from July to September, the valley transforms into a riot of colour as over 300 species of wildflowers bloom across the meadows — orchids, poppies, marigolds, and the rare Brahma Kamal. The approach from Govindghat follows the Pushpawati river through dense forests to the base camp at Ghangaria, from where the valley is a gentle day hike. The same base camp also serves as the starting point for the Hemkund Sahib pilgrimage, a sacred Sikh shrine at 4,329 metres. The Valley of Flowers is one of the few treks in the Himalayas that is equally rewarding for casual walkers and seasoned trekkers alike.`,
    startLatitude: 30.7283, startLongitude: 79.6050,
    routeGeoJsonUrl: '', media: [],
    tags: ['UNESCO', 'Wildflowers', 'Photography', 'Summer Only', 'Beginner Friendly'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'hampta-pass': {
    ...MOCK_ALL_TRAILS[2],
    description:
      `Hampta Pass is a crossover trek in Himachal Pradesh that offers one of the most dramatic landscape contrasts in the Himalayas. Beginning in the lush green Kullu valley near Manali, the trail ascends through dense alpine forests and flower-filled meadows before reaching the pass at 4,270 metres. The descent on the other side into Lahaul is nothing short of surreal — you step from a world of rivers and greenery into a stark, high-altitude desert of brown and grey. The trek passes through Jobra, Chika, Balu ka Ghera and Siagoru before culminating at Chatru in the Lahaul valley, where jeeps ferry trekkers to Chandratal lake. Best done from June to mid-October, Hampta Pass is an ideal choice for trekkers looking for a mid-level challenge with maximum scenic reward.`,
    startLatitude: 32.2396, startLongitude: 77.1887,
    routeGeoJsonUrl: '', media: [],
    tags: ['Crossover', 'Snow Pass', 'Camping', 'Himachal', 'Scenic'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'kedarkantha': {
    ...MOCK_ALL_TRAILS[3],
    description:
      `Kedarkantha is one of the most rewarding winter treks in India, taking you to a summit at 3,810 metres that offers a breathtaking 360° panorama of Himalayan peaks — Swargarohini, Bandarpoonch, Ranglana, and Black Peak among them. The trail passes through dense pine and oak forests, open meadows blanketed in snow, and charming forest campsites. The summit push begins at midnight and rewards early risers with a sunrise over a sea of white peaks. Best from December to April when the entire route is carpeted in snow, Kedarkantha is the ideal first Himalayan winter trek — accessible, spectacularly scenic, and deeply satisfying.`,
    startLatitude: 31.0294, startLongitude: 78.2122,
    routeGeoJsonUrl: '', media: [],
    tags: ['Winter Trek', 'Summit', 'Snow', 'Beginner Friendly', 'Sunrise Views'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'chadar-trek': {
    ...MOCK_ALL_TRAILS[4],
    description:
      `The Chadar Trek is one of the most unique and exhilarating expeditions in the world — a winter walk on the frozen surface of the Zanskar river in Ladakh. Undertaken only in January and February when temperatures plunge to −20°C and below, the trek follows the river canyon through a landscape of frozen waterfalls, ice sculptures, and sheer cliff faces. The name 'Chadar' means 'sheet' in Hindi, referring to the flat sheet of ice that forms over the river. Villages like Tibb and Naerak, otherwise inaccessible in winter, are reached on foot. This is a physically demanding, logistically complex expedition that demands acclimatisation, the right gear, and a high tolerance for extreme cold — and rewards those who attempt it with an otherworldly experience.`,
    startLatitude: 33.8524, startLongitude: 76.9642,
    routeGeoJsonUrl: '', media: [],
    tags: ['Winter', 'Frozen River', 'Extreme Cold', 'Ladakh', 'Unique Experience'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'goechala': {
    ...MOCK_ALL_TRAILS[5],
    description:
      `Goechala is Sikkim's premier trekking destination, offering close-up views of Kangchenjunga — the world's third-highest peak — from the viewpoint at 4,940 metres. The route passes through Kanchenjunga National Park, a UNESCO World Heritage Site, traversing rhododendron forests, high-altitude lakes including Samiti Lake, and remote ridges. The approach from Yuksom is scenic from the very first day, with forested trails giving way to increasingly dramatic mountain vistas. Permits are required and campsite numbers are strictly limited to preserve the fragile ecosystem. Goechala is one of the few treks in India that gets you this close to a 8,000-metre peak without technical climbing.`,
    startLatitude: 27.3498, startLongitude: 88.3240,
    routeGeoJsonUrl: '', media: [],
    tags: ['Kangchenjunga', 'UNESCO', 'High Altitude', 'Sikkim', 'Restricted'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'tarsar-marsar': {
    ...MOCK_ALL_TRAILS[6],
    description:
      `Tarsar Marsar is one of Kashmir's hidden gems — a moderately challenging trek that loops through two high-altitude alpine lakes set against a backdrop of the Pir Panjal range. Tarsar Lake, a perfect teardrop of turquoise water at 3,800 metres, and Marsar Lake, more remote and wild at 4,200 metres, are the twin destinations. The route from Aru valley passes through meadows of wildflowers, riverside campsites along the Lidder, and steep ridgeline crossings with sweeping views. The region is significantly less crowded than the Kashmir Great Lakes circuit, making it ideal for trekkers seeking solitude. Best done July to September, this is arguably the most scenically intense trek in the Kashmir valley.`,
    startLatitude: 34.0837, startLongitude: 75.3412,
    routeGeoJsonUrl: '', media: [],
    tags: ['Alpine Lakes', 'Kashmir', 'Solitude', 'Wildflowers', 'Scenic'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'sandakphu': {
    ...MOCK_ALL_TRAILS[7],
    description:
      `Sandakphu, at 3,636 metres the highest peak in West Bengal, sits on the border between India and Nepal and offers one of the finest mountain views on Earth. On a clear day from the summit, four of the world's five highest peaks are visible simultaneously — Everest, Kangchenjunga, Lhotse, and Makalu. The classic route from Maneybhanjang follows the Singalila Ridge through rhododendron forests that blaze with colour in spring and oak groves that glow gold in autumn. The trail passes the fairy-tale village of Tumling, the viewpoint at Kalipokhri, and the high camps at Sabargram and Phalut. This is one of the few major Indian treks where you walk the ridge separating two countries for much of the route.`,
    startLatitude: 27.1032, startLongitude: 88.0015,
    routeGeoJsonUrl: '', media: [],
    tags: ['Himalayan Panorama', '4 Peaks View', 'Ridge Walk', 'Darjeeling', 'Spring Rhododendron'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'brahmatal': {
    ...MOCK_ALL_TRAILS[8],
    description:
      `Brahmatal is one of the finest winter treks in Uttarakhand, offering the rare combination of a frozen lake, dense snow-covered forests, and an open ridge with views of some of the highest peaks in the Garhwal Himalayas — Trishul, Nanda Ghunti, Mt. Kamet, and Hathi Ghoda. The trek begins at Lohajung and climbs through oak and rhododendron forests to the ridge above the treeline, where the frozen Brahmatal and Bekaltal lakes sit like mirrors in the snow. The ridge viewpoint at 3,800 metres is one of the most rewarding final-day climbs in the Indian Himalayas. An excellent moderate trek for those seeking a Himalayan winter experience without the demands of Roopkund or Kedarkantha summits.`,
    startLatitude: 30.0512, startLongitude: 79.8744,
    routeGeoJsonUrl: '', media: [],
    tags: ['Frozen Lake', 'Winter', 'Forest', 'Garhwal', 'Ridge Views'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'rupin-pass': {
    ...MOCK_ALL_TRAILS[9],
    description:
      `Rupin Pass is widely regarded as one of India's most beautiful and technically varied treks, combining dense forests, gushing waterfalls, hanging villages, snow bridges, and a thrilling high-altitude pass at 4,650 metres. The trail begins in the Dhaula valley in Uttarkashi and crosses into Himachal Pradesh at the pass, descending to Sangla in the Baspa valley. The changing landscapes are staggering — dense alpine forests give way to open meadows, which yield to dramatic snow chutes and finally the stark beauty of the Himalayan high desert. The waterfall campsite below the pass is one of the most photographed spots on any Indian trek. A five-to-seven-day itinerary is standard, and the trek demands good fitness and a head for heights.`,
    startLatitude: 31.3815, startLongitude: 77.8023,
    routeGeoJsonUrl: '', media: [],
    tags: ['Waterfall', 'Snow Chute', 'Crossover', 'Varied Terrain', 'Photography'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'kashmir-great-lakes': {
    ...MOCK_ALL_TRAILS[10],
    description:
      `The Kashmir Great Lakes trek is one of the most visually spectacular multi-day treks in the world, taking you through seven high-altitude alpine lakes set in sweeping meadows ringed by the Pir Panjal and Greater Himalayas. The lakes — Vishansar, Kishansar, Gadsar, Satsar, Gangabal, and Nundkol among them — each have their own distinct colour and character, from deep cobalt blue to vivid emerald green. The route from Sonamarg to Naranag passes over passes reaching 4,100 metres and through some of the most expansive high-altitude meadows in the Indian Himalayas. Permits are strictly managed. July and August are the best months, when the meadows are carpeted with wildflowers and the passes are free of snow. An absolute bucket-list trek.`,
    startLatitude: 34.3020, startLongitude: 75.2866,
    routeGeoJsonUrl: '', media: [],
    tags: ['Alpine Lakes', 'Meadows', 'Kashmir', 'Passes', 'Bucket List'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'pin-parvati-pass': {
    ...MOCK_ALL_TRAILS[11],
    description:
      `Pin Parvati Pass is one of the most demanding high-altitude crossovers in India, connecting the lush Parvati Valley in Kullu with the stark, arid Pin Valley in Spiti. The pass sits at 5,319 metres and is open only during the brief summer window of July to September. The route climbs from the pilgrimage town of Kheerganga through alpine meadows to the base camp at Mantalai Lake, a sacred lake at 4,150 metres, before the brutal ascent to the pass itself. The descent into Spiti is a world apart — you cross from a landscape of glacial streams and green meadows into a high-altitude cold desert of rock and scree. This is a route for experienced trekkers only, requiring glacier crossing skills, crampon use, and strong acclimatisation.`,
    startLatitude: 31.9745, startLongitude: 77.5623,
    routeGeoJsonUrl: '', media: [],
    tags: ['Expert Only', 'Glacier', 'Crossover', 'High Altitude', 'Remote'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'markha-valley': {
    ...MOCK_ALL_TRAILS[12],
    description:
      `The Markha Valley trek is Ladakh's classic wilderness experience, traversing the Hemis National Park — home to the elusive snow leopard — along a route that connects Chilling on the Zanskar river with the Kongmaru La pass at 5,150 metres. The valley itself is a study in contrast: barren, wind-sculpted ridges give way to the fertile terraced fields of the Markha village, and the towering bulk of Kang Yatze (6,400 m) dominates the skyline for much of the upper valley. The route passes ancient gompas, traditional Ladakhi homesteads offering homestays, and sweeping vistas of the Zanskar range. Best done from June to September, the Markha Valley trek gives you the full spectrum of Ladakhi landscape and culture in a single route.`,
    startLatitude: 33.8748, startLongitude: 77.6527,
    routeGeoJsonUrl: '', media: [],
    tags: ['Snow Leopard', 'Ladakhi Culture', 'Homestay', 'National Park', 'High Pass'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'kuari-pass': {
    ...MOCK_ALL_TRAILS[13],
    description:
      `Kuari Pass, known as Lord Curzon's Trail after the British Viceroy who popularised it in the early 1900s, is one of the most panoramically rewarding treks in the Garhwal Himalayas. The pass at 3,650 metres opens up a sweeping view of Nanda Devi (7,816 m) — India's second-highest peak — along with Hathi Ghoda, Dronagiri, Bethartoli, Kamet, and a score of other high Himalayan peaks. The route from Auli passes through oak and rhododendron forests, open ridge traverses, and the wide meadows of Khullara and Pangarchulla before reaching the pass. A mid-level trek that is particularly spectacular in winter when the entire landscape is buried under snow, and in spring when rhododendrons are in bloom.`,
    startLatitude: 30.5118, startLongitude: 79.5643,
    routeGeoJsonUrl: '', media: [],
    tags: ['Nanda Devi Views', 'Curzon Trail', 'Ridge Walk', 'Garhwal', 'Accessible'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'triund': {
    ...MOCK_ALL_TRAILS[14],
    description:
      `Triund is the most accessible alpine trek in the Dhauladhar range, beginning just above McLeod Ganj — home to the Tibetan government in exile and the Dalai Lama's residence. The trail climbs steeply through oak and rhododendron forest to an open ridge at 2,850 metres, from where the sheer southern face of the Dhauladhar rises like a wall of rock and snow to heights of over 4,500 metres. The views from the ridge at sunset and sunrise are among the most dramatic accessible by a short trek anywhere in India. Camping is permitted on the ridge, and a clear night sky here is spectacular. The further extension to Snowline Café and Lahesh Cave adds challenge for those with more time.`,
    startLatitude: 32.2791, startLongitude: 76.3326,
    routeGeoJsonUrl: '', media: [],
    tags: ['Short Trek', 'Camping', 'Dhauladhar', 'McLeod Ganj', 'Day Trek'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'har-ki-dun': {
    ...MOCK_ALL_TRAILS[15],
    description:
      `Har Ki Dun — literally 'Valley of Gods' — is one of the most ancient and mystically charged valleys in the Garhwal Himalayas, believed to be the route taken by the Pandavas on their final journey to heaven. The trail follows the Tons river through dense deodar and pine forest, passing the wooden-roofed Govind Wildlife Sanctuary villages of Osla and Datmir, whose residents maintain centuries-old traditions and architecture. The valley itself at 3,566 metres is a flat, wide meadow ringed by glaciated peaks including Swargarohini (6,252 m) and Bandarpoonch. The approach is gentle throughout, making this a superb moderate trek for families and those new to Himalayan trekking. The autumn colours in the valley are world class.`,
    startLatitude: 31.1582, startLongitude: 78.2394,
    routeGeoJsonUrl: '', media: [],
    tags: ['Heritage', 'Mythology', 'Forest', 'Wildlife Sanctuary', 'Family Friendly'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'pangarchulla-peak': {
    ...MOCK_ALL_TRAILS[16],
    description:
      `Pangarchulla Peak at 4,700 metres is one of the finest summit treks in Uttarakhand, offering a genuine high-altitude summit experience without the technical demands of mountaineering. The route follows the Kuari Pass trail from Auli to the ridge, then branches off to the Pangarchulla base camp at Tali before a steep summit push through deep snow. The view from the top is staggering — a 360° panorama of 12 Himalayan peaks including Nanda Devi, Trishul, Kamet, Hathi Ghoda, and Dronagiri, spread out in a great arc across the horizon. The summit push requires crampons and ice axes in winter and early spring, and the final ridge is narrow with steep drops on both sides. An unforgettable achievement for fit trekkers ready for a serious challenge.`,
    startLatitude: 30.5293, startLongitude: 79.5788,
    routeGeoJsonUrl: '', media: [],
    tags: ['Summit', 'Snow', 'Crampons Required', 'Panoramic Views', 'Challenging'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'dayara-bugyal': {
    ...MOCK_ALL_TRAILS[17],
    description:
      `Dayara Bugyal is one of the most beautiful high-altitude meadows in India, a vast rolling landscape at 3,658 metres that transforms completely with the seasons — a carpet of wildflowers in summer, and a boundless snowfield in winter. The approach from Barsu takes you through dense oak and rhododendron forest before breaking out onto the open meadow, where the sudden exposure to the great arc of the Garhwal Himalayas — Bandarpoonch, Srikanth, Jaundhar Glacier and Draupadi ka Danda — comes as a shock. Dayara is accessible to almost any fitness level and is particularly magical as a winter snow trek or summer camping destination. The meadow at sunset, when the peaks turn gold and the grassland glows amber, is one of the great visual experiences the Indian Himalayas offer.`,
    startLatitude: 30.9874, startLongitude: 78.4423,
    routeGeoJsonUrl: '', media: [],
    tags: ['Alpine Meadow', 'Bugyal', 'Winter Snow', 'Easy Summit', 'Photography'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'phulara-ridge': {
    ...MOCK_ALL_TRAILS[18],
    description:
      `Phulara Ridge is one of the most underrated treks in Uttarakhand, offering a long ridgeline walk at altitudes between 3,500 and 3,800 metres with unbroken views of the Garhwal Himalayas on both sides. Unlike most Himalayan treks that follow river valleys, Phulara Ridge keeps you on the spine of the mountain for almost the entire route — with Bandarpoonch, Kala Nag, Draupadi ka Danda, and the peaks of the Har Ki Dun basin visible to the north, and the forested valley of Purola stretching south. The meadows along the ridge are covered in wildflowers in summer and snow in winter. The short overall distance and gentle gradient make this ideal for beginners seeking their first ridge-walk experience.`,
    startLatitude: 31.0623, startLongitude: 78.1847,
    routeGeoJsonUrl: '', media: [],
    tags: ['Ridge Walk', 'Wildflowers', 'Easy', 'Underrated', 'Panoramic'],
    createdAt: '2024-01-01', updatedAt: '2024-01-01',
  },
  'stok-kangri': {
    ...MOCK_ALL_TRAILS[19],
    description:
      `Stok Kangri at 6,153 metres is the highest trekking peak in Ladakh and one of the most accessible 6,000-metre summits in the world, requiring no prior technical climbing experience — only exceptional fitness, good acclimatisation, and the right gear. The base camp at 5,050 metres is reached in two to three days from Stok village, and the summit push begins at 1 AM to catch the sunrise from the top. The view from the summit encompasses the entire Karakoram range to the north, the Zanskar range to the south, Leh in the valley below, and on a clear day, peaks of the Kashmir Himalayas. The technical section involves a fixed-rope traverse across a steep snowfield and a rocky scramble to the summit ridge. Guides and crampons are mandatory; acclimatisation to 3,500 metres is essential before attempting.`,
    startLatitude: 34.0163, startLongitude: 77.5542,
    routeGeoJsonUrl: '', media: [],
    tags: ['6000m Peak', 'Expert Only', 'Summit', 'Acclimatisation', 'Ladakh'],
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

  getAllTrails(): Observable<TrailSummaryDto[]> {
    // Swap for real HTTP call when backend is ready:
    // return this.http.get<TrailSummaryDto[]>(this.base);
    return of(MOCK_ALL_TRAILS);
  }

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
