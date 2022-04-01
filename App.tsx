
import React from 'react';
import './config/firebase';
import { NativeBaseProvider, extendTheme } from "native-base";
import RootNavigation from './navigation';

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
    <NativeBaseProvider>
      <RootNavigation />
    </NativeBaseProvider>
  );
}

// export default function App() {
//   return (
//     <NativeBaseProvider>
//       <RootNavigation />
//     </NativeBaseProvider>
//   );
// }