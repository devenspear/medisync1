import { NextRequest, NextResponse } from 'next/server';
import { Auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 [Signup] Starting signup request...');
    const { email, password, firstName } = await request.json();

    console.log('🔐 [Signup] Request params:', {
      hasEmail: !!email,
      emailLength: email?.length || 0,
      hasPassword: !!password,
      passwordLength: password?.length || 0,
      hasFirstName: !!firstName,
      firstNameLength: firstName?.length || 0
    });

    const result = await Auth.signUp(email, password, firstName);

    console.log('🔐 [Signup] Auth.signUp result:', {
      success: result.success,
      hasUser: !!result.user,
      hasToken: !!result.token,
      error: result.error
    });

    if (!result.success) {
      console.error('🔐 [Signup] Signup failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('✅ [Signup] Signup successful');
    return NextResponse.json({
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('❌ [Signup] API error:', error);
    console.error('❌ [Signup] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}