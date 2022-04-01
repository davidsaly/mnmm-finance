import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import {
  Box,
  Heading,
  VStack,
  Button,
  Center,
  NativeBaseProvider
} from "native-base";

const WelcomeScreen: React.FC<StackScreenProps<any>> = ({ navigation }) => {
  return (
    <Center flex={1} px="3">
      <Center w="100%">
        <Box safeArea p="2" w="90%" maxW="290" py="8">
          <Heading size="lg" color="coolGray.800" _dark={{
            color: "warmGray.50"
          }} fontWeight="semibold">
            Welcome
          </Heading>
          <Heading mt="1" color="coolGray.600" _dark={{
            color: "warmGray.200"
          }} fontWeight="medium" size="xs">
            Sign in or sign up to continue!
          </Heading>
          <VStack space={3} mt="5">
            <Button mt="2" colorScheme="cyan" onPress={() => navigation.navigate('Sign In')}>
              Sign in
            </Button>
            <Button mt="2" colorScheme="cyan" onPress={() => navigation.navigate('Sign Up')}>
              Sign up
            </Button>
          </VStack>
        </Box>
      </Center>
    </Center>
  );
}

export default WelcomeScreen;