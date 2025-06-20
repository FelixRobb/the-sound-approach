CREATE TABLE public.book_codes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  code text NOT NULL,
  max_activations integer NOT NULL DEFAULT 3,
  activations_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT book_codes_pkey PRIMARY KEY (id),
  CONSTRAINT book_codes_code_key UNIQUE (code)
);

CREATE TABLE public.recordings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  species_id uuid NOT NULL,
  title text NOT NULL,
  audio_id text NOT NULL,
  sonogram_id text NOT NULL,
  book_page_number integer NOT NULL,
  caption text NOT NULL,
  order_in_book integer NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT recordings_pkey PRIMARY KEY (id),
  CONSTRAINT recordings_species_id_fkey FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE CASCADE
);

CREATE TABLE public.species (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  common_name text NOT NULL,
  scientific_name text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT species_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_activations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  book_code_id uuid NOT NULL,
  activated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_activations_pkey PRIMARY KEY (id),
  CONSTRAINT user_activations_user_id_book_code_id_key UNIQUE (user_id, book_code_id),
  CONSTRAINT user_activations_book_code_id_fkey FOREIGN KEY (book_code_id) REFERENCES book_codes(id) ON DELETE CASCADE,
  CONSTRAINT user_activations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.user_downloads (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  recording_id uuid NOT NULL,
  downloaded_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_downloads_pkey PRIMARY KEY (id),
  CONSTRAINT user_downloads_user_id_recording_id_key UNIQUE (user_id, recording_id),
  CONSTRAINT user_downloads_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE,
  CONSTRAINT user_downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);