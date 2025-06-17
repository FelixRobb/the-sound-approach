export type Species = {
  id: string;
  common_name: string;
  scientific_name: string;
  created_at: string;
};

export type Recording = {
  id: string;
  species_id: string;
  title: string;
  audiohqid: string;
  audiolqid: string;
  sonogramvideoid: string;
  book_page_number: number;
  caption: string;
  orderInBook: number;
  createdAt: string;
  species?: Species;
};
