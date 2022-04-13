import React, { useEffect, useState } from 'react';
import { auth } from '../utils/hooks/useAuthentication';
import { getFirestore, DocumentData } from "firebase/firestore";
import { getPortfolios, getAccounts } from '../utils/dataCalls';
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

const db = getFirestore();

export default function AccountsScreen({ navigation, route }) { // route
    const [data, setData] = useState<DocumentData[]>([]);
    const [portfolios, setPortfolios] = useState<DocumentData[] | undefined>([]);
    const { accountAdded } = route.params || {};
    const isFocused = useIsFocused();

    async function setAccountsData() {
        const portfolios: DocumentData[] | undefined = await getPortfolios(db, auth);
        setPortfolios(portfolios);
        const accounts = await getAccounts(db, auth, portfolios);
        setData(accounts);
    };

    useEffect(() => {
        isFocused && setAccountsData()
    }, [isFocused]);

    useEffect(() => {
        setAccountsData();
    }, []);

    useEffect(() => {
        setAccountsData();
    }, [accountAdded])

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
                <FlatList data={data} renderItem={({
                    item
                }) => <Pressable key={item.name} onPress={() => navigation.navigate('Account Details', { accountName: item.name, accountId: item.id, portfolioId: item.pf.id, accountCurrency: item.currency })}>
                        <Box borderBottomWidth="1" _dark={{
                            borderColor: "gray.600"
                        }} borderColor="coolGray.200" pl="4" pr="5" py="2">
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
                                    }} color="coolGray.800" fontSize="md">
                                        {item.value[0].amount} {item.value[0].currency}
                                    </Text>
                                </HStack>
                                <HStack>
                                    <Text mt="2" fontSize="xs" color="coolGray.700">
                                        Portfolio:
                                    </Text>
                                    <Spacer />
                                    <Text mt="2" fontSize="sm" color="coolGray.700">
                                        {item.pf.name}
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
