export interface NavBarProps {
  onRefresh: () => void
}

export interface ShowCardProps {
  show: AnimeShow
}

export interface AnimeShow {
  mal_id: number
  url: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  title: string
  title_english: string
  type: string
  genre: string
  synopsis: string
  rating: string
  score: number
  genres: [
    {
      mal_id: number
      type: string
      name: string
      url: string
    }
  ]
  aired: {
    from: string
    to: string
    prop: {
      from: {
        day: number
        month: number
        year: number
      }
      to: {
        day: number
        month: number
        year: number
      }
    }
  }
}

export interface ShowContextType {
  favorites: AnimeShow[]
  addToFavorites: (show: AnimeShow) => void
  removeFromFavorites: (showId: number) => void
  isFavorite: (showId: number) => boolean
}


export interface SuggestionProps {
  onSuggest: (suggestedShows: AnimeShow[]) => void 
}

/// COMPLETE RESPONSE from API

// export interface AnimeResponse {
//   data:       Datum[];
//   pagination: Pagination;
// }

// export interface Datum {
//   mal_id:          number;
//   url:             string;
//   images:          { [key: string]: Image };
//   trailer:         Trailer;
//   approved:        boolean;
//   titles:          Title[];
//   title:           string;
//   title_english:   string;
//   title_japanese:  string;
//   title_synonyms:  string[];
//   type:            string;
//   source:          string;
//   episodes:        number;
//   status:          string;
//   airing:          boolean;
//   aired:           Aired;
//   duration:        string;
//   rating:          string;
//   score:           number;
//   scored_by:       number;
//   rank:            number;
//   popularity:      number;
//   members:         number;
//   favorites:       number;
//   synopsis:        string;
//   background:      string;
//   season:          string;
//   year:            number;
//   broadcast:       Broadcast;
//   producers:       Demographic[];
//   licensors:       Demographic[];
//   studios:         Demographic[];
//   genres:          Demographic[];
//   explicit_genres: Demographic[];
//   themes:          Demographic[];
//   demographics:    Demographic[];
// }

// export interface Aired {
//   from: string;
//   to:   string;
//   prop: Prop;
// }

// export interface Prop {
//   from:   From;
//   to:     From;
//   string: string;
// }

// export interface From {
//   day:   number;
//   month: number;
//   year:  number;
// }

// export interface Broadcast {
//   day:      string;
//   time:     string;
//   timezone: string;
//   string:   string;
// }

// export interface Demographic {
//   mal_id: number;
//   type:   string;
//   name:   string;
//   url:    string;
// }

// export interface Image {
//   image_url:       string;
//   small_image_url: string;
//   large_image_url: string;
// }

// export interface Title {
//   type:  string;
//   title: string;
// }

// export interface Trailer {
//   youtube_id: string;
//   url:        string;
//   embed_url:  string;
// }

// export interface Pagination {
//   last_visible_page: number;
//   has_next_page:     boolean;
//   items:             Items;
// }

// export interface Items {
//   count:    number;
//   total:    number;
//   per_page: number;
// }
