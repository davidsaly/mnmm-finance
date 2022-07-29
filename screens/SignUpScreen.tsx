import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Box,
  Heading,
  VStack,
  Input,
  Button,
  Center,
} from "native-base";
import { StackScreenProps } from '@react-navigation/stack';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc } from "firebase/firestore";

const auth = getAuth();

// to connect to local emulator
// connectAuthEmulator(auth, "http://localhost:9099");
const db = getFirestore();

const SignUpScreen: React.FC<StackScreenProps<any>> = ({ navigation }) => {
  const [value, setValue] = React.useState({
    email: '',
    password: '',
    error: ''
  });

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  async function signUp() {
    if (value.email === '' || value.password === '') {
      setValue({
        ...value,
        error: 'Email and password are mandatory.'
      })
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, value.email, value.password);
      const currentUser = auth.currentUser;
      await createUserAndPortfolios(currentUser);
      navigation.navigate('Sign In');
    } catch (error) {
      setValue({
        ...value,
        error: error.message,
      })
    }
  }

  async function createUserAndPortfolios(user: any) {
    const email = user?.email;
    const uid: string = user?.uid || '';

    try {
      const docRef = await setDoc(doc(db, 'users', uid), {
        name: email,
        email,
        currency: 'EUR'
      }, { merge: true });
      console.log('User document written with ID: ', uid);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
    try {
      const docRef = await setDoc(doc(db, 'users', uid, 'portfolios', 'performing'), {
        name: 'Investments',
        type: 'performing',
      }, { merge: true });
      console.log('Portfolio document written with ID: ', 'performing');
    } catch (e) {
      console.error('Error adding document: ', e);
    }
    try {
      const docRef = await setDoc(doc(db, 'users', uid, 'portfolios', 'nonperforming'), {
        name: 'Cash',
        type: 'nonperforming',
      }, { merge: true });
      console.log('Portfolio document written with ID: ', 'nonperforming');
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  return (
    <Center flex={1} px="3">
      <Center w="100%">
        <Box safeArea p="2" w="90%" maxW="290" py="8">
          <Heading size="lg" color="coolGray.800" _dark={{
            color: "warmGray.50"
          }} fontWeight="semibold">
            Sign up
          </Heading>
          {!!value.error && <View style={styles.error}><Text>{value.error}</Text></View>}
          <VStack space={3} mt="5">
            <Input
              type="text"
              w="full"
              maxW="300px"
              // py="0"
              value={value.email}
              onChangeText={(text) => setValue({ ...value, email: text })}
              placeholder="email" />
            <Input
              type={show ? "text" : "password"}
              w="full"
              maxW="300px"
              // py="0"
              value={value.password}
              onChangeText={(text) => setValue({ ...value, password: text })}
              InputRightElement={
                <Button colorScheme="emerald" size="xs" rounded="none" w="1/5" h="full" onPress={handleClick}>
                  {show ? "Hide" : "Show"}
                </Button>
              }
              placeholder="password" />
            <Button colorScheme="emerald" mt="2" onPress={signUp}>
              Sign up
            </Button>
          </VStack>
        </Box>
      </Center>
    </Center>
  );
}

const styles = StyleSheet.create({
  error: {
    marginTop: 10,
    padding: 10,
    color: '#fff',
    backgroundColor: '#D54826FF',
  }
});

export default SignUpScreen;