-- Improved Search Recordings Function with Weighted Relevance
-- This function performs a weighted search across recordings and species
-- with priority given to exact matches in species names

CREATE OR REPLACE FUNCTION search_recordings(search_query TEXT)
RETURNS TABLE (
  result_type TEXT,
  result_data JSONB,
  relevance_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_query TEXT;
  like_pattern TEXT;
  is_numeric BOOLEAN;
  numeric_value INTEGER;
BEGIN
  -- Return empty result for empty queries
  IF search_query IS NULL OR TRIM(search_query) = '' THEN
    RETURN;
  END IF;
  
  -- Basic sanitization - escape SQL wildcards but preserve spaces and useful characters
  sanitized_query := REGEXP_REPLACE(TRIM(search_query), '[%_]', '\\&', 'g');
  
  -- If sanitized query is empty after cleaning, return
  IF sanitized_query = '' THEN
    RETURN;
  END IF;
  
  -- Create search pattern
  like_pattern := '%' || sanitized_query || '%';
  
  -- Check if query is numeric for rec_number matching
  is_numeric := sanitized_query ~ '^[0-9]+$';
  IF is_numeric THEN
    numeric_value := sanitized_query::INTEGER;
  END IF;
  
  -- Search for species with weighted relevance
  RETURN QUERY
  SELECT * FROM (
    SELECT 
      'species'::TEXT as result_type,
      jsonb_build_object(
        'id', s.id,
        'common_name', s.common_name,
        'scientific_name', s.scientific_name,
        'created_at', s.created_at
      ) as result_data,
      CASE
        WHEN LOWER(s.common_name) = LOWER(sanitized_query) THEN 100.0     -- Exact common name match
        WHEN LOWER(s.scientific_name) = LOWER(sanitized_query) THEN 90.0   -- Exact scientific name match
        WHEN s.common_name ILIKE like_pattern THEN 
          -- Boost score if query is at start of common name
          CASE WHEN s.common_name ILIKE sanitized_query || '%' THEN 80.0 ELSE 70.0 END
        WHEN s.scientific_name ILIKE like_pattern THEN
          -- Boost score if query is at start of scientific name  
          CASE WHEN s.scientific_name ILIKE sanitized_query || '%' THEN 70.0 ELSE 60.0 END
        ELSE 0.0
      END as relevance_score
    FROM 
      species s
    WHERE 
      s.common_name ILIKE like_pattern
      OR s.scientific_name ILIKE like_pattern
    
    UNION ALL
    
    -- Search for recordings with weighted relevance
    SELECT 
      'recording'::TEXT as result_type,
      jsonb_build_object(
        'id', r.id,
        'species_id', r.species_id,
        'audiohqid', r.audiohqid,
        'audiolqid', r.audiolqid,
        'sonagramvideoid', r.sonagramvideoid,
        'caption', r.caption,
        'created_at', r.created_at,
        'rec_number', r.rec_number,
        'site_name', r.site_name,
        'catalogue_code', r.catalogue_code,
        'recorded_by', r.recorded_by,
        'species', jsonb_build_object(
          'id', s.id,
          'common_name', s.common_name,
          'scientific_name', s.scientific_name
        )
      ) as result_data,
      GREATEST(
        -- Rec number match (highest priority for recordings)
        CASE WHEN is_numeric AND r.rec_number = numeric_value THEN 98.0 ELSE 0.0 END,
        
        -- Species name matches (from joined species table)
        CASE 
          WHEN LOWER(s.common_name) = LOWER(sanitized_query) THEN 85.0
          WHEN LOWER(s.scientific_name) = LOWER(sanitized_query) THEN 75.0
          WHEN s.common_name ILIKE sanitized_query || '%' THEN 65.0
          WHEN s.scientific_name ILIKE sanitized_query || '%' THEN 60.0
          WHEN s.common_name ILIKE like_pattern THEN 55.0
          WHEN s.scientific_name ILIKE like_pattern THEN 45.0
          ELSE 0.0
        END,
        
        -- Recorded by matches
        CASE 
          WHEN LOWER(r.recorded_by) = LOWER(sanitized_query) THEN 50.0
          WHEN r.recorded_by ILIKE sanitized_query || '%' THEN 40.0
          WHEN r.recorded_by ILIKE like_pattern THEN 25.0
          ELSE 0.0
        END,
        
        -- Site name and catalogue code matches
        CASE 
          WHEN LOWER(r.site_name) = LOWER(sanitized_query) THEN 35.0
          WHEN LOWER(r.catalogue_code) = LOWER(sanitized_query) THEN 35.0
          WHEN r.site_name ILIKE sanitized_query || '%' THEN 30.0
          WHEN r.catalogue_code ILIKE sanitized_query || '%' THEN 30.0
          WHEN r.site_name ILIKE like_pattern THEN 20.0
          WHEN r.catalogue_code ILIKE like_pattern THEN 20.0
          ELSE 0.0
        END,
        
        -- Caption matches (lower priority)
        CASE 
          WHEN r.caption ILIKE like_pattern THEN 15.0
          ELSE 0.0
        END
      ) as relevance_score
    FROM 
      recordings r
      JOIN species s ON r.species_id = s.id
    WHERE 
       r.caption ILIKE like_pattern
      OR r.site_name ILIKE like_pattern
      OR r.catalogue_code ILIKE like_pattern
      OR s.common_name ILIKE like_pattern
      OR s.scientific_name ILIKE like_pattern
      OR r.recorded_by ILIKE like_pattern
      OR (is_numeric AND r.rec_number = numeric_value)
  ) results
  WHERE results.relevance_score > 0  -- Only return results with some relevance
  -- Order by relevance score (highest first), then by result type (species first)
  ORDER BY results.relevance_score DESC, results.result_type ASC
  LIMIT 100;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION search_recordings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_recordings(TEXT) TO anon;

-- Recommended indexes for better performance:
CREATE INDEX CONCURRENTLY idx_species_common_name_lower ON species (LOWER(common_name));
CREATE INDEX CONCURRENTLY idx_species_scientific_name_lower ON species (LOWER(scientific_name));
CREATE INDEX CONCURRENTLY idx_species_common_name_text ON species USING gin(common_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_species_scientific_name_text ON species USING gin(scientific_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_recordings_rec_number ON recordings (rec_number);
CREATE INDEX CONCURRENTLY idx_recordings_site_name_text ON recordings USING gin(site_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_recordings_catalogue_code_text ON recordings USING gin(catalogue_code gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_recordings_recorded_by_text ON recordings USING gin(recorded_by gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_recordings_caption_text ON recordings USING gin(caption gin_trgm_ops);