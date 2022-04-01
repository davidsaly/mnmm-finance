import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import {
  Box,
  Heading,
  VStack,
  Button,
  Center,
  Container,
  Text,
  HStack,
  Divider,
  Pressable,
  Spacer,
} from "native-base";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, DocumentData } from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();

export default function HomeScreen() {
  const { user } = useAuthentication();
  const [data, setData] = useState<DocumentData[]>([]);

  async function getPortfolios() {
    const uid: string = user?.uid || '';
    const portfolioRef = collection(db, 'users', uid, 'portfolios');
    try {
      const portfolios = await getDocs(portfolioRef);
      const docs: DocumentData[] = [];
      portfolios.forEach(doc => {
        docs.push(doc.data());
      });
      setData(docs);
    } catch (e) {
      console.error('Error fetching portfolios for user', uid);
    }
  };

  useEffect(() => {
    getPortfolios();
  });

  const portfolioList = data.map(d =>
    <Pressable key={d.name} onPress={() => console.log("I'm Pressed")}>
      <Box h="140" w="64" borderWidth="1" borderColor="coolGray.300" shadow="3" bg="coolGray.100" p="5" rounded="8">
        <HStack>
          <Text color="coolGray.800" mt="3" fontWeight="medium" fontSize="lg">
          {d.name}
          </Text>
          <Spacer />
          <Text color="coolGray.800" mt="3" fontWeight="medium" fontSize="xl">
            7500 USD
          </Text>
        </HStack>
        <HStack>
          <Text mt="2" fontSize="xs" color="coolGray.700">
            Profit and Loss:
          </Text>
          <Spacer />
          <Text mt="2" fontSize="sm" color="coolGray.700">
            1300 USD
          </Text>
        </HStack>
        <HStack>
          <Text mt="2" fontSize="xs" color="coolGray.700">
            Performance
          </Text>
          <Spacer />
          <Text mt="2" fontSize="sm" color="coolGray.700">
            13%
          </Text>
        </HStack>
      </Box>
    </Pressable>
  );

  return (
    <Center>
      <Container centerContent={true}>
        <Text mt="3" fontWeight="medium">
          Total Value
        </Text>
        <Heading>
          <Text color="darkBlue.700"> 7500 USD</Text>
        </Heading>
      </Container>
      <Divider my="5" />
      <HStack space={3} justifyContent="center">
        <Center height={60} w="20" bg="info.50" rounded="md" shadow={3}
          _text={{
            color: "blue.900",
            fontSize: "xs"
          }} >
          Add Transaction
        </Center>
        <Center height={60} w="20" bg="light.50" rounded="md" shadow={3}
          _text={{
            color: "cyan.900",
            fontSize: "xs"
          }} >
          Add Value
        </Center>
        {/* <Center height={60} w="20" bg="indigo.50" rounded="md" shadow={3} /> */}
      </HStack>
      <Divider my="5" />
      <VStack space={4} alignItems="center">
        {portfolioList}
      </VStack>
      <Divider my="5" />
      <Text>{user?.email}</Text>
      <Button variant="link" colorScheme="muted" onPress={() => signOut(auth)}>
        Sign out
      </Button>
    </Center>
  );
}