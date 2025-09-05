-- Search Recordings Function with Weighted Relevance
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
  exact_pattern TEXT;
BEGIN
  -- Return empty result for empty queries
  IF search_query IS NULL OR TRIM(search_query) = '' THEN
    RETURN;
  END IF;
  
  -- Sanitize the search query (basic sanitization)
  sanitized_query := REGEXP_REPLACE(TRIM(search_query), '[%_''"\\\[\]{}()*+?.,^$|#\s]', ' ', 'g');
  
  -- If sanitized query is empty after cleaning, return
  IF sanitized_query = '' THEN
    RETURN;
  END IF;
  
  -- Create search patterns
  like_pattern := '%' || sanitized_query || '%';
  exact_pattern := '^' || sanitized_query || '$';
  
  -- Search for species with weighted relevance
  -- Priority 1 (highest): Exact match on common_name (weight 100)
  -- Priority 2: Exact match on scientific_name (weight 80)
  -- Priority 3: Partial match on common_name (weight 70)
  -- Priority 4: Partial match on scientific_name (weight 60)
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
        WHEN s.common_name ILIKE sanitized_query THEN 100.0  -- Exact common name match
        WHEN s.scientific_name ILIKE sanitized_query THEN 80.0  -- Exact scientific name match
        WHEN s.common_name ILIKE like_pattern THEN 70.0      -- Partial common name match
        WHEN s.scientific_name ILIKE like_pattern THEN 60.0     -- Partial scientific name match
        ELSE 0.0
      END as relevance_score
    FROM 
      species s
    WHERE 
      s.common_name ILIKE like_pattern
      OR s.scientific_name ILIKE like_pattern
    
    UNION ALL
    
    -- Search for recordings with weighted relevance
    -- Priority 2: Rec number exact match (weight 98)
    -- Priority 3: Site name matches (weight 30 for exact, 20 for partial)
    -- Priority 4: Catalogue code matches (weight 30 for exact, 20 for partial)
    -- Priority 4: Species common_name match (weight 85 for exact, 55 for partial)
    -- Priority 5: Species scientific_name match (weight 65 for exact, 45 for partial)
    -- Priority 6: Caption match (weight 40 for exact, 30 for partial)
    SELECT 
      'recording'::TEXT as result_type,
      jsonb_build_object(
        'id', r.id,
        'species_id', r.species_id,
        'audiohqid', r.audiohqid,
        'audiolqid', r.audiolqid,
        'sonogramvideoid', r.sonogramvideoid,
        'caption', r.caption,
        'created_at', r.created_at,
        'rec_number', r.rec_number,
        'site_name', r.site_name,
        'catalogue_code', r.catalogue_code,
        'species', jsonb_build_object(
          'id', s.id,
          'common_name', s.common_name,
          'scientific_name', s.scientific_name
        )
      ) as result_data,
      CASE
        
        -- Species name matches (from joined species table)
        WHEN s.common_name ILIKE sanitized_query THEN 85.0  -- Exact species common name match
        WHEN s.scientific_name ILIKE sanitized_query THEN 65.0  -- Exact species scientific name match
        WHEN s.common_name ILIKE like_pattern THEN 55.0     -- Partial species common name match
        WHEN s.scientific_name ILIKE like_pattern THEN 45.0     -- Partial species scientific name match
        
        -- Caption matches
        WHEN r.caption ILIKE sanitized_query THEN 40.0  -- Exact caption match
        WHEN r.caption ILIKE like_pattern THEN 30.0     -- Partial caption match

        -- Site name matches
        WHEN r.site_name ILIKE sanitized_query THEN 30.0  -- Exact site name match
        WHEN r.site_name ILIKE like_pattern THEN 20.0     -- Partial site name match

        -- Catalogue code matches
        WHEN r.catalogue_code ILIKE sanitized_query THEN 30.0  -- Exact catalogue code match
        WHEN r.catalogue_code ILIKE like_pattern THEN 20.0     -- Partial catalogue code match
        
        -- Rec number match (if query is numeric)
        WHEN sanitized_query ~ '^[0-9]+$' AND r.rec_number = sanitized_query::INTEGER THEN 98.0
        
        ELSE 0.0
      END as relevance_score
    FROM 
      recordings r
      JOIN species s ON r.species_id = s.id
    WHERE 
       r.caption ILIKE like_pattern
      OR r.site_name ILIKE like_pattern
      OR r.catalogue_code ILIKE like_pattern
      OR s.common_name ILIKE like_pattern
      OR s.scientific_name ILIKE like_pattern
      OR (sanitized_query ~ '^[0-9]+$' AND r.rec_number = sanitized_query::INTEGER)
  ) results
  -- Order by relevance score (highest first)
  ORDER BY relevance_score DESC
  LIMIT 100;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION search_recordings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_recordings(TEXT) TO anon; 