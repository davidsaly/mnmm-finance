import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthentication } from '../utils/hooks/useAuthentication';
import { Button, Tile } from 'react-native-elements';
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
    <Tile
      title= {d.name}
      featured
      height={200}
      style={{ marginTop: 20, margin: 20 }}
    />);

  return (
    <View style={styles.container}>
      <Text>Welcome {user?.email}!</Text>
      <Button title="Sign Out" style={styles.button} onPress={() => signOut(auth)} />
      {portfolioList}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 10
  }
});