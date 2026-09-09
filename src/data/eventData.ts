export interface EventHighlight {
  text: string;
}

export interface EventConfig {
  isActive: boolean;
  seriesName: string;
  title: string;
  subtitle: string;
  description: string;
  dateDisplay: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  timeDisplay: string;
  isoStartDate: string;
  isoEndDate: string;
  venueName: string;
  venueAddress: string;
  venuePostcode: string;
  parkingInfo: string;
  audience: string;
  cost: string;
  costNote: string;
  eventbriteUrl: string;
  googleMapsUrl: string;
  image: {
    src: string;
    srcset: string;
    alt: string;
    width: number;
    height: number;
  };
  highlights: EventHighlight[];
}

export const upcomingEvent: EventConfig = {
  isActive: true,
  seriesName: 'Regular Drop-In Networking Series',
  title: 'Construction Connections',
  subtitle: 'Finance & Networking for the Construction Industry',
  description:
    'Construction Connections is a regular drop-in networking event hosted by Roz Johnson and the Finance with Flow team, bringing together construction business owners, contractors, and industry specialists from across Essex and surrounding areas. Connect with peers, discuss practical finance challenges, and share ideas over refreshments in a relaxed setting.',
  dateDisplay: 'Thursday 24 September 2026',
  dateDay: '24',
  dateMonth: 'SEP',
  dateYear: '2026',
  timeDisplay: '4:00 PM – 6:00 PM BST',
  isoStartDate: '2026-09-24T16:00:00+01:00',
  isoEndDate: '2026-09-24T18:00:00+01:00',
  venueName: 'The Great Bromley Cross Pub',
  venueAddress: 'Ardleigh Road, Great Bromley, Colchester',
  venuePostcode: 'CO7 7TL',
  parkingInfo: 'Free parking on site',
  audience: 'Builders, contractors, surveyors, estimators, suppliers & construction sector professionals',
  cost: 'Free Admission',
  costNote: 'Places are free but limited — advance registration required',
  eventbriteUrl:
    'https://www.eventbrite.co.uk/e/construction-connections-finance-and-networking-event-for-construction-tickets-1996982538530?aff=oddtdtcreator',
  googleMapsUrl:
    'https://maps.google.com/?daddr=The+Great+Bromley+Cross+Pub,+Ardleigh+Road,+Great+Bromley,+Colchester+CO7+7TL',
  image: {
    src: '/wp-content/uploads/2026/09/construction-connections-banner.webp',
    srcset:
      '/wp-content/uploads/2026/09/construction-connections-banner.webp 1080w, /wp-content/uploads/2026/09/construction-connections-banner-768x480.webp 768w, /wp-content/uploads/2026/09/construction-connections-banner-480x300.webp 480w',
    alt: 'Construction Connections networking event with Roz Johnson from Finance with Flow',
    width: 1080,
    height: 675,
  },
  highlights: [
    { text: 'Meet local construction business owners and industry professionals' },
    { text: 'Discuss cashflow, project finance, CIS, and industry challenges' },
    { text: 'Informal, relaxed setting with drinks and refreshments included' },
    { text: 'Free admission with complimentary on-site parking' },
  ],
};
