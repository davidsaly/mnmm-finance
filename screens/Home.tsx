import React, { useEffect, useState } from 'react';
import { auth } from '../utils/hooks/useAuthentication';
import {
  Box,
  Heading,
  VStack,
  Center,
  Container,
  Text,
  HStack,
  Divider,
  Pressable,
  Spacer,
  FlatList,
  View,
} from "native-base";
import { getFirestore, collection, getDocs, DocumentData } from "firebase/firestore";
import { getPortfolios } from '../utils/dataCalls';

const db = getFirestore();

export default function HomeScreen() {
  const [data, setData] = useState<DocumentData[] | undefined>([]);

  async function setPortfolios() {
    const docs: DocumentData[] | undefined = await getPortfolios(db, auth);
    setData(docs);
  }

  useEffect(() => {
    setPortfolios();
  }, []);

  function pfListBoxes() {
    return (
      <VStack space={2} alignItems="center">
        {portfolioList}
      </VStack>
    )
  }

  function pfList() {
    return (
      <Box>
        <Heading fontSize="xl" p="4" pb="3">
          Portfolios
        </Heading>
        <FlatList data={data} renderItem={({
          item
        }) => <Pressable key={item.name} onPress={() => console.log("I'm Pressed", item.name)}>
            <Box borderBottomWidth="1" _dark={{
              borderColor: "gray.600"
            }} borderColor="coolGray.200" pl="4" pr="5" py="2">
              {/* <HStack space={3} justifyContent="space-between"> */}
              {/* <Avatar size="48px" source={{
                uri: item.avatarUrl
              }} /> */}
              <VStack>
                <HStack>
                  <Text _dark={{
                    color: "warmGray.50"
                  }} color="coolGray.800" bold>
                    {item.name}
                  </Text>
                  <Spacer />
                  <Text _dark={{
                    color: "warmGray.50"
                  }} color="coolGray.800" bold fontSize="lg">
                    5000 USD
                  </Text>
                </HStack>
                <HStack>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    Profit/Loss
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    0 EUR
                  </Text>
                </HStack>
                <HStack>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    Performance
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    0%
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </Pressable>} keyExtractor={item => item.id} />
      </Box>
    )
  }

  const portfolioList = data.map(d =>
    <Pressable key={d.name} onPress={() => console.log("I'm Pressed", d.name)}>
      <Box h="130" w="64" borderWidth="1" borderColor="coolGray.300" shadow="3" bg="coolGray.100" p="5" rounded="8">
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
    <View>
      <Center safeArea>
        <Container centerContent={false}>
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
              color: "emerald.900",
              fontSize: "xs"
            }} >
            Add Value
          </Center>
        </HStack>
        <Divider my="5" />
        {/* {pfListBoxes()} */}
      </Center>
      {pfList()}
    </View>
  );
}