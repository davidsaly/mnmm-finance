import 'react-native-gesture-handler';
import React from 'react';
import './config/firebase';
import { NativeBaseProvider, extendTheme } from "native-base";
import RootNavigation from './navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'

const queryClient = new QueryClient()

export default function () {
  const theme = extendTheme({
    colors: {
      // primary: {
      // 50: 'white',
      // },
    },
    components: {
      Input: {
        variants: {
          outline: {
            _focus: {
              _stack: {
                style: {
                  outlineColor: 'emerald.100'
                }
              },
              borderColor: 'muted.700',
              borderWidth: '0',
              bg: 'emerald.100'
            },
          },
        },
      },
    },
    config: {
      // initialColorMode: 'dark',
    },
  });
  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <RootNavigation />
        </QueryClientProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}