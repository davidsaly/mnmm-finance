import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';

import HomeScreen from '../screens/Home';
import AccountsScreen from '../screens/Accounts';
import SettingsScreen from '../screens/Settings';
import AddAccountScreen from '../screens/AddAccountScreen';
import AccountDetailsScreen from '../screens/AccountDetailsScreen';
import AddValueScreen from '../screens/AddValueScreen';

import { Button, VStack, Box, Text } from "native-base";
import { signOut, getAuth } from "firebase/auth";
import { useAuthentication } from '../utils/hooks/useAuthentication';

const auth = getAuth();

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: '#fff' },
        headerShown: false
      }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function AccountStackScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: '#fff' },
        headerShown: false,
        // headerTitle: "",
      }}>
      <Stack.Screen name="Account List" component={AccountsScreen} />
      <Stack.Screen name="Account Details" component={AccountDetailsScreen} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Add Account" component={AddAccountScreen} />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="Add Value" component={AddValueScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

function HomeBottomTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false
    }}>
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }} />
      <Tab.Screen
        name="Accounts"
        component={AccountStackScreen}
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
        }} />
    </Tab.Navigator>
  )
}

function CustomDrawerContent({ props }) {
  const { user } = useAuthentication();
  return (
    <DrawerContentScrollView {...props} safeArea>
      <VStack space="6" my="2" mx="1">
        <Box px="4">
          <Text bold color="gray.700">
            E-mail
          </Text>
          <Text fontSize="14" mt="1" color="gray.500" fontWeight="500">
            {user?.email}
          </Text>
        </Box>
        <Button
          variant="link"
          colorScheme="muted"
          onPress={() => signOut(auth)}>
          Sign out
        </Button>
      </VStack>
    </DrawerContentScrollView>
  );
}

export default function UserStack() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{ headerShown: false }}
        drawerContent={(props: any) => <CustomDrawerContent {...props} />}>
        <Drawer.Screen name="HomeTabs" component={HomeBottomTabs} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
