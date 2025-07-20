# Weighted Search Function for Recordings and Species

This PostgreSQL function provides a weighted search capability for recordings and species in the Sound Approach app.

## Features

- Prioritizes search results based on relevance
- Weights exact matches higher than partial matches
- Searches across multiple fields (titles, species names, scientific names, captions)
- Returns both recordings and species in a single query
- Results are ordered by relevance score
- Limited to 100 results maximum for performance

## Priority Weighting

The function uses the following weighting system:

### Species Weights

- Exact match on common_name: 100 (highest priority)
- Exact match on scientific_name: 80
- Partial match on common_name: 70
- Partial match on scientific_name: 60

### Recording Weights

- Exact match on recording title: 95
- Book page number match: 98
- Partial match on recording title: 75
- Exact match on species common_name: 85
- Exact match on species scientific_name: 65
- Partial match on species common_name: 55
- Partial match on species scientific_name: 45
- Exact match on caption: 40
- Partial match on caption: 30

## Deployment

To deploy this function to your Supabase project:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `search_recordings.sql` or upload the file
3. Execute the SQL to create the function

## Usage from TypeScript/JavaScript

```typescript
// Example usage in your application
const { data, error } = await supabase.rpc("search_recordings", {
  search_query: "robin",
});

if (error) {
  console.error("Search error:", error);
  return;
}

// Process results
const recordings = [];
const species = [];

data.forEach((item) => {
  if (item.result_type === "recording") {
    recordings.push(item.result_data);
  } else if (item.result_type === "species") {
    species.push(item.result_data);
  }
});

// Results are already sorted by relevance
console.log(`Found ${recordings.length} recordings and ${species.length} species`);
```

## Return Format

The function returns a table with the following columns:

- `result_type`: Either 'species' or 'recording'
- `result_data`: JSONB object containing all fields of the species or recording
- `relevance_score`: Numerical score (NUMERIC type) indicating the relevance (higher is more relevant)

## Security

The function has `SECURITY DEFINER` set, which means it runs with the permissions of the user who created it. Execute permissions are granted to both authenticated and anonymous users.
