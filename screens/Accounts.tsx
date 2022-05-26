import React, { useEffect, useState, useContext } from 'react';
import { auth } from '../utils/hooks/useAuthentication';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Box,
    Heading,
    VStack,
    Text,
    HStack,
    Pressable,
    Spacer,
    FlatList,
    IconButton,
    Icon
} from "native-base";
import { Entypo } from "@expo/vector-icons";
import { useIsFocused } from '@react-navigation/native';
import { loadData } from './Home';

export default function AccountsScreen({ navigation, route }) { // route
    const { accountAdded, valueAdded } = route.params || {};
    const isFocused = useIsFocused();

    const { data, refetch } = loadData({
        placeholderData: {
            docs: [],
            accs: [],
            totalValue: 0
        }
    });

    const portfolios = data?.docs;


    useEffect(() => {
        refetch();
    }, [accountAdded])

    useEffect(() => {
        refetch();
    }, [valueAdded])

    const AddIcon = () => {
        return <Box alignItems="center">
            <IconButton
                onPress={() => navigation.navigate('Add Account', { portfolios })}
                icon={<Icon as={Entypo} name="circle-with-plus" />}
                borderRadius="full"
                _icon={{
                    color: "emerald.500",
                    size: "md"
                }} _hover={{
                    bg: "emerald.600:alpha.20"
                }} _pressed={{
                    bg: "emerald.600:alpha.20",
                    _icon: {
                        name: "circle-with-plus"
                    },
                    //     _ios: {
                    //         _icon: {
                    //             size: "md"
                    //         }
                    //     }
                    // }} _ios={{
                    //     _icon: {
                    //         size: "md"
                    //     }
                }} />
        </Box>;
    };

    function AccountList() {
        return (
            <Box>
                <HStack>
                    <Heading fontSize="xl" p="4" pb="3">
                        Accounts
                    </Heading>
                    <Spacer />
                    <AddIcon />
                </HStack>
                <FlatList data={data.accs} renderItem={({
                    item
                }) => <Pressable key={item.name} onPress={() => navigation.navigate('Account Details', { accountName: item.name, accountId: item.id, portfolioId: item.pf.id, accountCurrency: item.currency })}>
                        <Box borderBottomWidth="1" _dark={{
                            borderColor: "gray.600"
                        }} borderColor="coolGray.200" pl="4" pr="5" py="2">
                            <VStack>
                                <HStack>
                                    <Text _dark={{
                                        color: "warmGray.50"
                                    }} color="coolGray.800" bold fontSize="md">
                                        {item.name}
                                    </Text>
                                    <Spacer />
                                    <Text _dark={{
                                        color: "warmGray.50"
                                    }} color="coolGray.800" fontSize="sm">
                                        {item.value[0].amount} {item.value[0].currency}
                                    </Text>
                                    <Spacer />
                                    <Text _dark={{
                                        color: "warmGray.50"
                                    }} color="coolGray.800" fontSize="lg" bold>
                                        {item.valueBase[0].amount} {item.valueBase[0].currency}
                                    </Text>
                                </HStack>
                                <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Portfolio:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.pf.name}
                                    </Text>
                                </HStack>
                                {item.pfType === 'nonperforming' && <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Income:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.income} {item.valueBase[0].currency}
                                    </Text>
                                </HStack>}
                                {item.pfType === 'nonperforming' && <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Spending:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.spending} {item.valueBase[0].currency}
                                    </Text>
                                </HStack>}
                                {item.pfType === 'performing' && <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Inflows:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.inflows} {item.valueBase[0].currency}
                                    </Text>
                                </HStack>}
                                {item.pfType === 'performing' && <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Outflows:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.outflows} {item.valueBase[0].currency}
                                    </Text>
                                </HStack>}
                                {item.pfType === 'performing' && <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Performance:
                                    </Text>
                                    <Spacer />
                                    <Text mt="2" fontSize="sm" color="coolGray.700">
                                        {item.performance} {'%'}
                                    </Text>
                                </HStack>}
                                {item.pfType === 'performing' && <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Profit/Loss:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.pl} {item.valueBase[0].currency}
                                    </Text>
                                </HStack>}
                                <HStack pl='3'>
                                    <Text mt="1" fontSize="xs" color="coolGray.700">
                                        Last update:
                                    </Text>
                                    <Spacer />
                                    <Text mt="1" fontSize="sm" color="coolGray.700">
                                        {item.date}
                                    </Text>
                                </HStack>
                            </VStack>
                        </Box>
                    </Pressable>} keyExtractor={item => item.id} />
            </Box>
        )
    }
    return (
        <SafeAreaView style={{ paddingBottom: 100 }}>
            {AccountList()}
        </SafeAreaView>
    )
}
