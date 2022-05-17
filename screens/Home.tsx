import React, { useEffect, useState, useContext } from 'react';
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
import { getData } from '../utils/dataCallsSeries';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useQuery,
} from 'react-query'

const db = getFirestore();

export const loadData = () => useQuery('getData', getData, {
  placeholderData: {
    docs: [],
    accs: [],
    totalValue: 0,
    currency: '',
  }
})

export default function HomeScreen({ route, navigation }) {

  const { currencyChanged } = route.params || {};

  const { data, refetch } = loadData({
    placeholderData: {
      docs: [],
      accs: [],
      totalValue: 0,
      currency: '',
    }
  });

  useEffect(() => {
    refetch();
  }, [currencyChanged]);

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
        {/* <Heading fontSize="xl" p="4" pb="3">
          Portfolios
        </Heading> */}
        <FlatList data={data.docs} renderItem={({
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
                    {item.value} {data.currency}
                  </Text>
                </HStack>
                <HStack>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ? 'Income' : 'Inflows'}
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ? item.income : item.inflows} {data.currency}
                  </Text>
                </HStack>
                <HStack>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ? 'Spending' : 'Outflows'}
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ? item.spending : item.outflows} {data.currency}
                  </Text>
                </HStack>
                {item.type === 'performing' && <HStack>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    Performance
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.performance} {'%'}
                  </Text>
                </HStack>}
                {item.type === 'performing' && <HStack>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    Profit/Loss
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.pl} {data.currency}
                  </Text>
                </HStack>}
              </VStack>
            </Box>
          </Pressable>} keyExtractor={item => item.id} />
      </Box>
    )
  }

  const portfolioList = data.docs.map(d =>
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
    <SafeAreaView>
      <Box>
        <Text pl="3" pt="5">My Net Worth:</Text>
        <Heading fontSize="3xl" pl="3" pb="0">
          <Text color="emerald.700">{data.totalValue} {data.currency}</Text>
        </Heading>
      </Box>
      <Divider my="3" />
      <HStack space={3} pl ="3">
        <Pressable onPress={() => navigation.navigate('Add Transaction', { account: '', accountCurrency: '' })}>
          <Center height={60} w="20" bg="light.50" rounded="md" shadow={3}
            _text={{
              color: "emerald.700",
              fontSize: "xs"
            }} >
            Add Transaction
          </Center>
        </Pressable>
        <Center height={60} w="20" bg="light.50" rounded="md" shadow={3}
          _text={{
            color: "emerald.700",
            fontSize: "xs"
          }} >
          Add Value
        </Center>
        <Pressable onPress={() => refetch()}>
          <Center height={60} w="20" bg="light.50" rounded="md" shadow={3}
            _text={{
              color: "emerald.700",
              fontSize: "xs"
            }} >
            Reload data
          </Center>
        </Pressable>
      </HStack>
      <Divider my="3" />
      {/* {pfListBoxes()} */}
      {pfList()}
    </SafeAreaView>
  );
}