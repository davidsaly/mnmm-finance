import {
    Stack,
    Box,
    Text,
    FormControl,
    Input,
    WarningOutlineIcon,
    Select,
    CheckIcon,
    Button,
    HStack,
    Spacer,
} from "native-base";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection } from "firebase/firestore";
import { useForm, Controller } from 'react-hook-form';
import { AccountType, PortfolioType } from "../types";
import { Key } from "react";

const auth = getAuth();
const db = getFirestore();

export default function AddAccountScreen({ route, navigation }) {
    const { portfolios } = route.params;

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            portfolio: '',
            currency: '',
        }
    });
    async function onSubmit(data: AccountType) {
        await createAccount(data);
        navigation.navigate('AccountScreen', { accountAdded: data });
    };

    async function createAccount(acc: AccountType) {
        const user = auth.currentUser;
        const email = user?.email;
        const uid: string = user?.uid || '';
        try {
            const docRef = await addDoc(collection(db, 'users', uid, 'portfolios', acc.portfolio, 'accounts'), {
                name: acc.name,
                currency: acc.currency
            });
            console.log('Created an account with id', docRef.id);
        } catch (e) {
            console.error('Error adding document: ', e);
        }
    }

    function cancel() {
        navigation.navigate('AccountScreen', { accountAdded: null });
    }

    const portfolioItems = portfolios.map((pf: PortfolioType) => <Select.Item key={pf.id} label={pf.name} value={pf.id} />);

    return (
        <KeyboardAwareScrollView style={{
            width: "100%"
        }}>
            <Stack space={2.5} alignSelf="center" px="4" safeArea mt="4" w={{
                base: "100%",
                md: "25%"
            }}>
                <Box>
                    <Text bold fontSize="xl" mb="4">
                        Add Account
                    </Text>
                    <FormControl mb="5" isRequired isInvalid={'name' in errors}>
                        <FormControl.Label>Account Name</FormControl.Label>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    placeholder="Account Name"
                                    onChangeText={onChange}
                                    value={value}
                                />
                            )}
                            name="name"
                            rules={{ required: 'Field is required' }}
                            defaultValue=""
                        />
                        <FormControl.ErrorMessage>
                            {errors.name?.message}
                            {/* {errors.name?.type === 'required'
                                ? errors.name?.message
                                : errors.name?.type === 'minLength' ?? 'Minimum length 3.'} */}
                        </FormControl.ErrorMessage>
                        <FormControl.HelperText>
                            Give your account a name.
                        </FormControl.HelperText>
                    </FormControl>
                    <FormControl mb="5" isRequired isInvalid={'portfolio' in errors}>
                        <FormControl.Label>Portfolio</FormControl.Label>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Select minWidth="200"
                                    accessibilityLabel="Choose Portfolio"
                                    placeholder="Portfolio"
                                    _selectedItem={{
                                        bg: "teal.600",
                                        endIcon: <CheckIcon size={5} />
                                    }}
                                    mt="1"
                                    selectedValue={value}
                                    onValueChange={(itemValue: string) => {
                                        onChange(itemValue);
                                    }}
                                >
                                    {portfolioItems}
                                </Select>
                            )}
                            name="portfolio"
                            rules={{ required: 'Please make a selection' }}
                            defaultValue=""
                        />

                        <FormControl.HelperText>
                            Select a portfolio
                        </FormControl.HelperText>
                        <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                            {errors.portfolio?.message}
                        </FormControl.ErrorMessage>
                    </FormControl>
                    <FormControl mb="5" isRequired isInvalid={'currency' in errors}>
                        <FormControl.Label>Currency</FormControl.Label>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Select minWidth="200"
                                    accessibilityLabel="Choose Currency"
                                    placeholder="Currency"
                                    _selectedItem={{
                                        bg: "teal.600",
                                        endIcon: <CheckIcon size={5} />
                                    }}
                                    mt="1"
                                    selectedValue={value}
                                    onValueChange={(itemValue: string) => {
                                        onChange(itemValue);
                                    }}
                                >
                                    <Select.Item label="EUR" value="EUR" />
                                    <Select.Item label="USD" value="USD" />
                                    <Select.Item label="CHF" value="CHF" />
                                    <Select.Item label="GBP" value="GBP" />
                                </Select>
                            )}
                            name="currency"
                            rules={{ required: 'Please make a selection' }}
                            defaultValue=""
                        />
                        <FormControl.HelperText>
                            Default currency of the account.
                        </FormControl.HelperText>
                        <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                            {errors.currency?.message}
                        </FormControl.ErrorMessage>
                    </FormControl>
                    <HStack>
                        <Button onPress={handleSubmit(onSubmit)} colorScheme="cyan">
                            Save
                        </Button>
                        <Spacer />
                        <Button mt="2" variant="unstyled" onPress={cancel}>
                            Cancel
                        </Button>
                    </HStack>
                </Box>
            </Stack>
        </KeyboardAwareScrollView>
    );
}
