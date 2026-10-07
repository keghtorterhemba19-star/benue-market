import type { BenueLGA, CategoryInfo } from '../types';

export const BENUE_LGAS: { name: BenueLGA; majorMarket: string; zone: 'Zone A' | 'Zone B' | 'Zone C' }[] = [
  { name: 'Ado', majorMarket: 'Igumale Produce Depot', zone: 'Zone C' },
  { name: 'Agatu', majorMarket: 'Obagaji Fish & Crop Market', zone: 'Zone C' },
  { name: 'Apa', majorMarket: 'Ugbokpo Central Market', zone: 'Zone C' },
  { name: 'Buruku', majorMarket: 'Buruku River Port Market', zone: 'Zone B' },
  { name: 'Gboko', majorMarket: 'Gboko Central Market / Rice Mill', zone: 'Zone B' },
  { name: 'Guma', majorMarket: 'Yelewata Market', zone: 'Zone B' },
  { name: 'Gwer East', majorMarket: 'Aliade Produce Depot', zone: 'Zone B' },
  { name: 'Gwer West', majorMarket: 'Naka Agricultural Hub', zone: 'Zone B' },
  { name: 'Katsina-Ala', majorMarket: 'Katsina-Ala Main Market', zone: 'Zone A' },
  { name: 'Konshisha', majorMarket: 'Tse-Agberagba Market', zone: 'Zone A' },
  { name: 'Kwande', majorMarket: 'Adikpo Grain Market', zone: 'Zone A' },
  { name: 'Logo', majorMarket: 'Ugba Produce Hub', zone: 'Zone A' },
  { name: 'Makurdi', majorMarket: 'Wadata Market / Modern Market', zone: 'Zone B' },
  { name: 'Obi', majorMarket: 'Ibarakpa Market', zone: 'Zone C' },
  { name: 'Ogbadibo', majorMarket: 'Otukpa Grain Hub', zone: 'Zone C' },
  { name: 'Ohimini', majorMarket: 'Idekpa Agricultural Market', zone: 'Zone C' },
  { name: 'Oju', majorMarket: 'Oju Yam Market', zone: 'Zone C' },
  { name: 'Okpokwu', majorMarket: 'Okpoga Central Market', zone: 'Zone C' },
  { name: 'Otukpo', majorMarket: 'Otukpo Main Market', zone: 'Zone C' },
  { name: 'Tarka', majorMarket: 'Wannune Grain Market', zone: 'Zone B' },
  { name: 'Ukum', majorMarket: 'Zaki Biam Yam Market', zone: 'Zone A' },
  { name: 'Ushongo', majorMarket: 'Lessor Produce Market', zone: 'Zone A' },
  { name: 'Vandeikya', majorMarket: 'Ihugh / Vandeikya Central', zone: 'Zone A' },
];

export const PRODUCE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'tubers',
    name: 'Tubers & Roots',
    iconName: 'grass',
    description: 'White Yams, Yellow Yams, Cassava, Sweet Potatoes & Cocoyams',
    popularItems: ['Export White Yam', 'Cassava Chips', 'Sweet Potatoes'],
    imageUrl: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'grains',
    name: 'Grains & Cereals',
    iconName: 'grain',
    description: 'Paddy Rice, Milled White Rice, Yellow Maize & White Maize',
    popularItems: ['Benue Rice', 'Yellow Maize', 'Sorghum'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'legumes',
    name: 'Legumes & Seeds',
    iconName: 'eco',
    description: 'Brown Beans, Groundnuts, Gboko Soybeans & Sesame (Benniseed)',
    popularItems: ['Brown Beans', 'Raw Groundnuts', 'Gboko Soybeans'],
    imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'vegetables',
    name: 'Fresh Vegetables',
    iconName: 'nutrition',
    description: 'Makurdi Tomatoes, Ripe Pepper, Okra, Onions & Fresh Ugwu',
    popularItems: ['Makurdi Tomatoes', 'Habenero Pepper', 'Fresh Okra'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'fruits',
    name: 'Oranges & Fruits',
    iconName: 'sunny',
    description: 'Benue Sweet Oranges, Grapefruits, Mangoes, Bananas & Cashew',
    popularItems: ['Valencia Sweet Oranges', 'Grapefruit', 'Cashew Nuts'],
    imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'livestock',
    name: 'Cattle & Livestock',
    iconName: 'pets',
    description: 'Healthy Farm Goats, Grazing Sheep, Rams & Cattle',
    popularItems: ['Red Sokoto Goats', 'Balami Rams', 'Farm Sheep'],
    imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'poultry',
    name: 'Poultry & Eggs',
    iconName: 'egg',
    description: 'Fresh Farm Crate Eggs, Broilers, Layers & Local Turkeys',
    popularItems: ['Fresh Crate Eggs', 'Live Broilers', 'Day-Old Chicks'],
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'fish',
    name: 'Fish & Aquaculture',
    iconName: 'set_meal',
    description: 'Fresh Catfish, Dried Smoked Catfish, Tilapia & Fingerlings',
    popularItems: ['Smoked Catfish', 'Live Table-size Catfish', 'Tilapia'],
    imageUrl: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'other',
    name: 'Other Farm Inputs',
    iconName: 'agriculture',
    description: 'Organic Fertilizer, Planting Seeds, Palm Oil & Farm Tools',
    popularItems: ['Organic Fertilizer', 'Planting Seeds', 'Red Palm Oil'],
    imageUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800'
  }
];
