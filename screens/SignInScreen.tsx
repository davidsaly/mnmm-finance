import React from 'react';
import {
  Box,
  Heading,
  VStack,
  Input,
  Button,
  Center
} from "native-base";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

const SignInScreen = () => {
  const [value, setValue] = React.useState({
    email: '',
    password: '',
    error: ''
  })

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  async function signIn() {
    if (value.email === '' || value.password === '') {
      setValue({
        ...value,
        error: 'Email and password are mandatory.'
      })
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, value.email, value.password);
    } catch (error) {
      setValue({
        ...value,
        error: error.message,
      })
    }
  }

  return (
    <Center flex={1} px="3">
      <Center w="100%">
        <Box safeArea p="2" w="90%" maxW="290" py="8">
          <Heading size="lg" color="coolGray.800" _dark={{
            color: "warmGray.50"
          }} fontWeight="semibold">
            Sign in
          </Heading>
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
                <Button size="xs" rounded="none" w="1/6" h="full" onPress={handleClick}>
                  {show ? "Hide" : "Show"}
                </Button>
              }
              placeholder="password" />
            <Button mt="2" colorScheme="emerald" onPress={signIn}>
              Sign in
            </Button>
          </VStack>
        </Box>
      </Center>
    </Center>
  );
}

export default SignInScreen;