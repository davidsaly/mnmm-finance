import 'react-native-gesture-handler';
import React from 'react';
import './config/firebase';
import { NativeBaseProvider, extendTheme } from "native-base";
import RootNavigation from './navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function () {
  const theme = extendTheme({
    colors: {
      // primary: {
      // 50: 'white',
      // },
    },
    config: {
      // initialColorMode: 'dark',
    },
  });
  return (
    <SafeAreaProvider>
      <NativeBaseProvider>
        <RootNavigation />
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}