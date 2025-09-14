import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { Database, sql } from '@/lib/database';
import { createScriptGenerator } from '@/lib/scriptGenerator';
import crypto from 'crypto';

// POST /api/scripts - Generate or retrieve cached script
async function POST(request: NextRequest & { user: any }) {
  try {
    const { assessment_data, session_config } = await request.json();

    // Create a hash of the assessment data to use as cache key
    const cacheKey = crypto
      .createHash('md5')
      .update(JSON.stringify({
        goal: assessment_data.goal,
        currentState: assessment_data.currentState,
        duration: assessment_data.duration,
        experience: assessment_data.experience,
        timeOfDay: assessment_data.timeOfDay
      }))
      .digest('hex');

    // Check if we have a cached script for this combination
    const cachedScript = await sql`
      SELECT * FROM cached_meditation_scripts
      WHERE cache_key = ${cacheKey}
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (cachedScript.rows.length > 0) {
      console.log('✅ Serving cached meditation script');
      const script = cachedScript.rows[0];

      // Update cache hit count
      await sql`
        UPDATE cached_meditation_scripts
        SET hit_count = hit_count + 1,
            last_accessed = NOW()
        WHERE id = ${script.id}
      `;

      return NextResponse.json({
        script: {
          intro_text: script.intro_text,
          main_content: script.main_content,
          closing_text: script.closing_text,
          total_words: script.total_words,
          estimated_duration: script.estimated_duration
        },
        cached: true,
        cache_key: cacheKey
      });
    }

    // Generate new script
    console.log('🔄 Generating new meditation script');
    const scriptGenerator = createScriptGenerator();
    const script = await scriptGenerator.generateScript(assessment_data);

    // Cache the generated script
    try {
      await sql`
        INSERT INTO cached_meditation_scripts (
          cache_key,
          goal,
          current_state,
          duration,
          experience,
          time_of_day,
          intro_text,
          main_content,
          closing_text,
          total_words,
          estimated_duration,
          hit_count,
          last_accessed
        )
        VALUES (
          ${cacheKey},
          ${assessment_data.goal},
          ${assessment_data.currentState},
          ${assessment_data.duration},
          ${assessment_data.experience},
          ${assessment_data.timeOfDay},
          ${script.intro_text},
          ${script.main_content},
          ${script.closing_text},
          ${script.total_words},
          ${script.estimated_duration},
          1,
          NOW()
        )
      `;
      console.log('💾 Script cached successfully');
    } catch (cacheError) {
      // Non-fatal error - we still return the script even if caching fails
      console.warn('⚠️  Failed to cache script:', cacheError);
    }

    return NextResponse.json({
      script,
      cached: false,
      cache_key: cacheKey
    });
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meditation script' },
      { status: 500 }
    );
  }
}

// GET /api/scripts/stats - Get caching statistics (admin/debug)
async function GET(request: NextRequest & { user: any }) {
  try {
    const stats = await sql`
      SELECT
        COUNT(*) as total_cached_scripts,
        SUM(hit_count) as total_cache_hits,
        AVG(hit_count) as avg_hits_per_script,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as scripts_cached_today,
        COUNT(CASE WHEN last_accessed > NOW() - INTERVAL '1 day' THEN 1 END) as scripts_accessed_today
      FROM cached_meditation_scripts
    `;

    const topScripts = await sql`
      SELECT goal, current_state, duration, experience, hit_count, created_at
      FROM cached_meditation_scripts
      ORDER BY hit_count DESC
      LIMIT 10
    `;

    return NextResponse.json({
      stats: stats.rows[0],
      top_scripts: topScripts.rows
    });
  } catch (error) {
    console.error('Get script stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get script statistics' },
      { status: 500 }
    );
  }
}

const authenticatedPOST = withAuth(POST);
const authenticatedGET = withAuth(GET);

export { authenticatedPOST as POST, authenticatedGET as GET };