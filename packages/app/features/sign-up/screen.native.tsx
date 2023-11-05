import { YStack, useToastController } from '@t4/ui'
import { useRouter } from 'solito/router'
import { SignUpSignInComponent } from 'app/features/sign-in/SignUpSignIn'
import type { Provider } from '@supabase/supabase-js'
import { useSupabase } from 'app/utils/supabase/hooks/useSupabase'
import * as WebBrowser from 'expo-web-browser'
import { getInitialURL } from 'expo-linking'
import { Platform } from 'react-native'
import { initiateAppleSignIn } from 'app/utils/supabase/appleAuth'
import { capitalizeWord } from '@t4/ui/src/libs/string'

export const SignUpScreen = (): React.ReactNode => {
  const { replace } = useRouter()
  const toast = useToastController()
  const supabase = useSupabase()

  const signInWithApple = async () => {
    try {
      const { token, nonce } = await initiateAppleSignIn()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token,
        nonce,
      })
      if (error) {
        return toast.show('Authentication Error', {
          description: error.message,
        })
      } else {
        replace('/')
      }
    } catch (e) {
      if (typeof e === 'object' && !!e && 'code' in e) {
        if (e.code === 'ERR_REQUEST_CANCELED') {
          toast.show('Canceled')
        } else {
          toast.show('Error')
          // handle other errors
        }
      } else {
        console.error('Unexpected error from Apple SignIn: ', e)
      }
    }
  }

  const handleOAuthWithWeb = async (provider: Provider) => {
    try {
      const redirectUri = (await getInitialURL()) || 't4://'
      const response = await WebBrowser.openAuthSessionAsync(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectUri}`,
        redirectUri
      )
      if (response.type === 'success') {
        const url = response.url
        const params = new URLSearchParams(url.split('#')[1])
        const accessToken = params.get('access_token') || ''
        const refreshToken = params.get('refresh_token') || ''
        await supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ data: { session }, error }) => {
            if (session) {
              // @ts-ignore set session does not call subscribers when session is updated
              supabase.auth._notifyAllSubscribers('SIGNED_IN', session)
              replace('/')
            } else {
              toast.show(capitalizeWord(provider) + ' sign in failed', {
                description: error?.message || 'Something went wrong, please try again.',
              })
              console.log('Supabase session error:', error)
            }
          })
      }
    } catch (error) {
      toast.show(capitalizeWord(provider) + ' sign in failed', {
        description: 'Something went wrong, please try again.',
      })
    } finally {
      WebBrowser.maybeCompleteAuthSession()
    }
  }

  const handleOAuthSignInWithPress = async (provider: Provider) => {
    if (provider === 'apple' && Platform.OS === 'ios') {
      // use native sign in with apple in ios
      await signInWithApple()
    } else {
      // use web sign in with other providers
      await handleOAuthWithWeb(provider)
    }
  }

  const handleEmailSignUpWithPress = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      console.log('error', error)
      toast.show('Sign up failed', {
        message: error.message,
      })
    } else if (data?.user) {
      toast.show('Email Confirmation', {
        message: 'Check your email ',
      })
      replace('/')
    }
  }

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" space>
      <SignUpSignInComponent
        type="sign-up"
        handleOAuthWithPress={handleOAuthSignInWithPress}
        handleEmailWithPress={handleEmailSignUpWithPress}
      />
    </YStack>
  )
}
