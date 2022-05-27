import React, { useEffect, useState, useContext } from 'react';
import { get, merge, findIndex, isUndefined } from 'lodash';
import { subtract, min, max, round, divide, multiply, larger } from 'mathjs';
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
  Flex,
  Button,
  Badge,
  Alert,
} from "native-base";
import { getFirestore, collection, getDocs, DocumentData, onSnapshot, doc } from "firebase/firestore";
import { getData } from '../utils/dataCallsSeries';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Line, VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryLabel, VictoryLine, VictoryTheme, VictoryTooltip, VictoryVoronoiContainer } from "victory-native";
import { auth } from '../utils/hooks/useAuthentication';

import {
  useQuery,
} from 'react-query'
import { Dimensions } from 'react-native';
import { formatISO } from 'date-fns';

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

  const chartWidth = Dimensions.get('window').width;

  const { currencyChanged } = route.params || {};
  const [calculating, setCalculating] = useState(false);
  const [cashDataX, setCashDataX] = useState();
  const [investmentDataX, setInvestmentDataX] = useState();
  const [cashDataY, setCashDataY] = useState({
    amount: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    income: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    spending: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    }
  })
  const [investmentDataY, setInvestmentDataY] = useState({
    amount: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    inflows: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    outflows: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    performance: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    pl: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
    invested: {
      latest: undefined,
      asof: undefined,
      since: undefined,
    },
  })


  const [cashTimeFrame, setCashTimeFrame] = useState('latest');
  const [investmentTimeFrame, setInvestmentTimeFrame] = useState('latest');
  const [cashDate, setCashDate] = useState('');
  const [investmentDate, setInvestmentDate] = useState('');
  const [cashLabelAnchor, setCashLabelAnchor] = useState({ anchor: 'end', dx: -4 });
  const [investmentLabelAnchor, setInvestmentLabelAnchor] = useState({ anchor: 'end', dx: -4 });

  const { data, refetch } = loadData({
    placeholderData: {
      docs: [],
      accs: [],
      totalValue: 0,
      currency: '',
    }
  });

  const handleButtonClick = (pfType: string) => {
    if (pfType === 'nonperforming') {
      if (cashTimeFrame === 'latest') {
        setCashTimeFrame('asof')
      } else if (cashTimeFrame === 'since') {
        setCashTimeFrame('asof')
      } else if (cashTimeFrame === 'asof') {
        setCashTimeFrame('since')
      }
    }
    if (pfType === 'performing') {
      if (investmentTimeFrame === 'latest') {
        setInvestmentTimeFrame('asof')
      } else if (investmentTimeFrame === 'since') {
        setInvestmentTimeFrame('asof')
      } else if (investmentTimeFrame === 'asof') {
        setInvestmentTimeFrame('since')
      }
    }
  }

  const handleTextAnchor = (length, index) => {
    const quarter = divide(length, 4);
    let anchor = {}
    if (larger(index, quarter)) {
      anchor = {
        anchor: 'end', dx: -5
      }
    } else {
      anchor = {
        anchor: 'start', dx: 3
      }
    }
    return anchor;
  }

  const buttonLabel = (timeFrame: string, date: string) => {
    if (timeFrame === 'latest') {
      return '';
    } else if (timeFrame === 'asof') {
      return `as of ${date}`;
    } else {
      return `${timeFrame} ${date}`;
    }

  }

  const handleCashDateChange = (date: string, pfId: string) => {
    const ind = findIndex(data?.docs, pf => pf.id === pfId);
    const pf = data?.docs[ind];
    if (pf.series.length) {
      const latestSeries = pf.series[pf.series.length - 1];
      const latestSeriesDate = latestSeries.date;
      const dataLength = pf.series.length;
      if (latestSeriesDate === date) {
        setCashTimeFrame('latest');
        handleTextAnchor(dataLength, dataLength);
        return;
      }
      const seriesFromDateInd = findIndex(pf.series, s => s.date === date);
      const seriesFromDate = pf.series[seriesFromDateInd];
      // label
      const anchor = handleTextAnchor(dataLength, seriesFromDateInd);
      setCashLabelAnchor(anchor);
      // amount
      const amountSince = subtract(get(latestSeries, `amount.${data.currency}`, 0), get(seriesFromDate, `amount.${data.currency}`, 0)).toString();
      const amountAsOf = get(seriesFromDate, `amount.${data.currency}`, 0);
      // income
      const incomeSince = subtract(get(latestSeries, `income.${data.currency}`, 0), get(seriesFromDate, `income.${data.currency}`, 0)).toString();
      const incomeAsOf = get(seriesFromDate, `income.${data.currency}`, 0);
      // spending
      const spendingSince = subtract(get(latestSeries, `spending.${data.currency}`, 0), get(seriesFromDate, `spending.${data.currency}`, 0)).toString();
      const spendingAsOf = get(seriesFromDate, `spending.${data.currency}`, 0);
      setCashDataY(merge(cashDataY,
        {
          amount: {
            latest: undefined,
            asof: round(amountAsOf, 0),
            since: round(amountSince, 0),
          },
          income: {
            latest: undefined,
            asof: round(incomeAsOf, 0),
            since: round(incomeSince, 0),
          },
          spending: {
            latest: undefined,
            asof: round(spendingAsOf, 0),
            since: round(spendingSince, 0),
          }
        }));
      setCashDate(date);
      const newTimeFrame = cashTimeFrame === 'latest' ? 'asof' : cashTimeFrame;
      setCashTimeFrame(newTimeFrame);
    }
  }

  const handleInvestmentDateChange = (date, pfId) => {
    // amount -> amount
    const ind = findIndex(data?.docs, pf => pf.id === pfId);
    const pf = data?.docs[ind];
    if (pf.series.length) {
      const latestSeries = pf.series[pf.series.length - 1];
      const latestSeriesDate = latestSeries.date;
      const dataLength = pf.series.length;
      if (latestSeriesDate === date) {
        const anchor = handleTextAnchor(dataLength, dataLength)
        setInvestmentLabelAnchor(anchor);
        setInvestmentTimeFrame('latest')
        return;
      }
      const seriesFromDateInd = findIndex(pf.series, s => s.date === date);
      const seriesFromDate = pf.series[seriesFromDateInd];
      // label
      const anchor = handleTextAnchor(dataLength, seriesFromDateInd);
      setInvestmentLabelAnchor(anchor);
      // amount 
      const amountSince = subtract(get(latestSeries, `amount.${data.currency}`, 0), get(seriesFromDate, `amount.${data.currency}`, 0)).toString();
      const amountAsOf = get(seriesFromDate, `amount.${data.currency}`, 0);
      // inflows 
      const inflowsSince = subtract(get(latestSeries, `inflows.index.${data.currency}`, 0), get(seriesFromDate, `inflows.index.${data.currency}`, 0)).toString();
      const inflowsAsOf = get(seriesFromDate, `inflows.index.${data.currency}`, 0);
      // outflows
      const outflowsSince = subtract(get(latestSeries, `outflows.index.${data.currency}`, 0), get(seriesFromDate, `outflows.index.${data.currency}`, 0)).toString();
      const outflowsAsOf = get(seriesFromDate, `outflows.index.${data.currency}`, 0);
      // invested 
      const investedSince = subtract(get(latestSeries, `invested.${data.currency}`, 0), get(seriesFromDate, `invested.${data.currency}`, 0)).toString();
      const investedAsOf = get(seriesFromDate, `invested.${data.currency}`, 0);
      // performance -> performance
      const performanceSince = round(
        multiply(
          subtract(
            divide(
              get(latestSeries, `performance.${data.currency}`),
              get(seriesFromDate, `performance.${data.currency}`)),
            1),
          100),
        2);
      const performanceAsOf = round(
        multiply(
          subtract(
            divide(
              get(seriesFromDate, `performance.${data.currency}`),
              100),
            1),
          100),
        2);
      // pl
      const plSince = subtract(get(latestSeries, `pl.${data.currency}`, 0), get(seriesFromDate, `pl.${data.currency}`, 0)).toString();
      const plAsOf = get(seriesFromDate, `pl.${data.currency}`, 0);

      setInvestmentDataY(merge(
        investmentDataY,
        {
          amount: {
            latest: undefined,
            asof: round(amountAsOf, 0),
            since: round(amountSince, 0),
          },
          inflows: {
            latest: undefined,
            asof: round(inflowsAsOf, 0),
            since: round(inflowsSince, 0),
          },
          outflows: {
            latest: undefined,
            asof: round(outflowsAsOf, 0),
            since: round(outflowsSince, 0),
          },
          invested: {
            latest: undefined,
            asof: round(investedAsOf, 0),
            since: round(investedSince, 0),
          },
          performance: {
            latest: undefined,
            asof: round(performanceAsOf, 2),
            since: round(performanceSince, 2),
          },
          pl: {
            latest: undefined,
            asof: round(plAsOf, 0),
            since: round(plSince, 0),
          },
        }));
      setInvestmentDate(date);
      const newTimeFrame = investmentTimeFrame === 'latest' ? 'asof' : investmentTimeFrame;
      setInvestmentTimeFrame(newTimeFrame);
    }
  }

  useEffect(() => {
    refetch();
  }, [currencyChanged]);

  useEffect(() => {
    console.log('initializing subscription');
    const user = auth.currentUser;
    const uid: string = user?.uid.toString() || '';
    const jobRef = doc(db, 'users', uid, 'jobs', 'seriescalc');
    const unsubscribe = onSnapshot(jobRef, job => {
      const j = job.data()
      if (get(j, 'running')) {
        setCalculating(true)
      } else {
        setCalculating(false);
        refetch();
      }
    });
  }, [])

  function pfListBoxes() {
    return (
      <VStack space={2} alignItems="center">
        {portfolioList}
      </VStack>
    )
  }

  const chartCash = (seriesData: any, pfId: any) => {
    const dataCash = seriesData.map(d => {
      return {
        x: d.date,
        y: d.amount[data.currency]
      }
    })
    const maxDate = dataCash.length ? dataCash[dataCash.length - 1].x : formatISO(new Date(), { representation: 'date' });
    const minAmount = dataCash.length ? min(dataCash.map(d => d.y)) : 0;
    const maxAmount = dataCash.length ? max(dataCash.map(d => d.y)) : 0;
    return (<Flex p='0' m='0' w='100%'>
      <VictoryChart height={180} width={chartWidth * 0.93} padding={10}
        containerComponent={
          <VictoryVoronoiContainer onActivated={(points, props) => {
            setCashDataX(points[0].x);
            handleCashDateChange(points[0].x, pfId);
          }}
          />}
        domainPadding={{ x: 0 }}>
        <VictoryLine
          style={{
            // data: { stroke: "#4d7c0f" }
          }}
          data={dataCash}
        />
        <VictoryLine
          labelComponent={<VictoryLabel
            textAnchor={cashLabelAnchor.anchor}
            // renderInPortal={false} 
            backgroundStyle={{ fill: "#fef3c7" }}
            backgroundPadding={5}
            dy={-11}
            dx={cashLabelAnchor.dx}
          />}
          labels={({ datum }) => datum.x}
          data={[{ x: cashDataX || maxDate, y: minAmount }, { x: cashDataX || maxDate, y: maxAmount }]}
          style={{
            data: {
              stroke: "grey",
              strokeWidth: 1
            }
          }}
        />
        <VictoryAxis style={{
          axis: { stroke: "transparent" },
          ticks: { stroke: "transparent" },
          tickLabels: { fill: "transparent" }
        }} />
      </VictoryChart>
    </Flex>)
  }

  const chartInvestment = (seriesData, pfId) => {
    const dataAmount = seriesData.map(d => {
      return {
        x: d.date,
        y: Number(d.amount[data.currency])
      }
    })
    const dataInvested = seriesData.map(d => {
      return {
        x: d.date,
        y: subtract(get(d, `inflows.index[${data.currency}]`, 0), get(d, `outflows.index[${data.currency}]`, 0))
      }
    })
    const maxDate = dataAmount.length ? dataAmount[dataAmount.length - 1].x : formatISO(new Date(), { representation: 'date' });
    const minAmount = dataAmount.length ? min(dataAmount.map(d => d.y)) : 0;
    const maxAmount = dataAmount.length ? max(dataAmount.map(d => d.y)) : 0;
    return (<Flex p='0' m='0'>
      <VictoryChart height={180} width={chartWidth * 0.93} padding={10}
        containerComponent={
          <VictoryVoronoiContainer onActivated={(points, props) => {
            setInvestmentDataX(points[0].x);
            setInvestmentDataY(merge(investmentDataY, { amount: round(points[0].y, 0) }));
            handleInvestmentDateChange(points[0].x, pfId);
          }}
          />}
        domainPadding={{ x: 0 }}>
        <VictoryLine
          style={{
            // data: { stroke: "#4d7c0f" }
          }}
          data={dataAmount}
        />
        <VictoryLine
          style={{
            data: { stroke: "#a16207" }
          }}
          data={dataInvested}
        />
        <VictoryLine
          labelComponent={<VictoryLabel
            textAnchor={investmentLabelAnchor.anchor}
            // renderInPortal={false} 
            backgroundStyle={{ fill: "#fef3c7" }}
            backgroundPadding={5}
            dy={-11}
            dx={investmentLabelAnchor.dx}
          />}
          labels={({ datum }) => datum.x}
          data={[{ x: investmentDataX || maxDate, y: minAmount }, { x: investmentDataX || maxDate, y: maxAmount }]}
          style={{
            data: {
              stroke: "grey",
              strokeWidth: 1
            }
          }}
        />
        <VictoryAxis style={{
          axis: { stroke: "transparent" },
          ticks: { stroke: "transparent" },
          tickLabels: { fill: "transparent" }
        }} />
      </VictoryChart>
    </Flex>)
  }

  function pfList() {
    return (
      <View h="77%" w="100%">
        <FlatList data={data.docs} renderItem={({
          item
        }) => <Pressable key={item.name} onPress={() => console.log("I'm Pressed", item.name)}>
            <Box borderBottomWidth="1" _dark={{
              borderColor: "gray.600"
            }} borderColor="coolGray.200" pl="4" pr="5" py="2" pb='0' pt='0' mt='0'>
              {/* <HStack space={3} justifyContent="space-between"> */}
              {/* <Avatar size="48px" source={{
                uri: item.avatarUrl
              }} /> */}
              <VStack>
                <HStack alignItems="center">
                  <Text _dark={{
                    color: "warmGray.50"
                  }} color="coolGray.800" bold>
                    {item.name}
                  </Text>
                  <Button size="sm" variant="link" colorScheme="emerald" h='8' mb='1' onPress={() => handleButtonClick(item.type)}>
                    {item.type === 'nonperforming' ? buttonLabel(cashTimeFrame, cashDate) : buttonLabel(investmentTimeFrame, investmentDate)}
                  </Button>
                  <Spacer />
                  <Text _dark={{
                    color: "warmGray.50"
                  }} color="coolGray.800" bold fontSize="lg">
                    {item.type === 'nonperforming' ? (cashDataY.amount[cashTimeFrame] || item.value) : (investmentDataY.amount[investmentTimeFrame] || item.value)} {data.currency}
                  </Text>
                </HStack>
                <HStack pl='2'>
                  <Text color="coolGray.600" fontSize="sm" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ? 'Income ' : 'Inflows '}
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ?
                      (isUndefined(cashDataY.income[cashTimeFrame]) ? item.income : cashDataY.income[cashTimeFrame]) :
                      (isUndefined(investmentDataY.inflows[investmentTimeFrame]) ? item.inflows : investmentDataY.inflows[investmentTimeFrame])} {data.currency}
                  </Text>
                </HStack>
                <HStack pl='2'>
                  <Text color="coolGray.600" fontSize="sm" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ? 'Spending ' : 'Outflows '}
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {item.type === 'nonperforming' ?
                      (isUndefined(cashDataY.spending[cashTimeFrame]) ? item.spending : cashDataY.spending[cashTimeFrame]) :
                      (isUndefined(investmentDataY.outflows[investmentTimeFrame]) ? item.outflows : investmentDataY.outflows[investmentTimeFrame])} {data.currency}
                  </Text>
                </HStack>
                {item.type === 'performing' && <HStack pl='2'>
                  <Text color="yellow.700" _dark={{
                    color: "warmGray.200"
                  }}>
                    {'Invested'}
                  </Text>
                  <Spacer />
                  <Text color="yellow.700" _dark={{
                    color: "warmGray.200"
                  }}>
                    {(isUndefined(investmentDataY.invested[investmentTimeFrame]) ? item.invested : investmentDataY.invested[investmentTimeFrame])} {data.currency}
                  </Text>
                </HStack>}
                {item.type === 'performing' && <HStack pl='2'>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {'Performance '}
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {(isUndefined(investmentDataY.performance[investmentTimeFrame]) ? item.performance : investmentDataY.performance[investmentTimeFrame])} {'%'}
                  </Text>
                </HStack>}
                {item.type === 'performing' && <HStack pl='2'>
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {'Profit/Loss '}
                  </Text>
                  <Spacer />
                  <Text color="coolGray.600" _dark={{
                    color: "warmGray.200"
                  }}>
                    {(isUndefined(investmentDataY.pl[investmentTimeFrame]) ? item.pl : investmentDataY.pl[investmentTimeFrame])} {data.currency}
                  </Text>
                </HStack>}
                {item.type === 'nonperforming' && chartCash(item.series, item.id)}
                {item.type === 'performing' && chartInvestment(item.series, item.id)}
              </VStack>
            </Box>
          </Pressable>} keyExtractor={item => item.id} />
        {/* <Alert w="100%" status='success' variant='left-accent'>
          <VStack space={2} flexShrink={1} w="100%">
            <HStack flexShrink={1} space={2} justifyContent="space-between">
              <HStack space={2} flexShrink={1}>
                <Alert.Icon mt="1" />
                <Text fontSize="md" color="coolGray.800">
                  recalculating...
                </Text>
              </HStack>
              <IconButton variant="unstyled" _focus={{
                borderWidth: 0
              }} icon={<CloseIcon size="3" />} _icon={{
                color: "coolGray.600"
              }} />
            </HStack>
          </VStack>
        </Alert> */}
      </View >
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
    <SafeAreaView style={{ paddingBottom: 20 }}>
      <View h="25%">
        <Box>
          <HStack>
            <Text pl="3" pt="5">My Net Worth:</Text>
            <Spacer />
            {calculating && <Badge colorScheme="success" h='6'>recalculating...</Badge>}
          </HStack>
          <Heading fontSize="3xl" pl="3" pb="0">
            <Text color="emerald.700">{data.totalValue} {data.currency}</Text>
          </Heading>
        </Box>
        <Divider my="3" />
        <HStack space={3} pl="3">
          <Pressable onPress={() => navigation.navigate('Add Transaction', { account: '', accountCurrency: '' })}>
            <Center h='10' w="20" bg="light.50" rounded="md" shadow={3}
              _text={{
                color: "emerald.700",
                fontSize: "xs"
              }} >
              Add Transaction
            </Center>
          </Pressable>
          <Center h='10' w="20" bg="light.50" rounded="md" shadow={3}
            _text={{
              color: "emerald.700",
              fontSize: "xs"
            }} >
            Add Value
          </Center>
          <Pressable onPress={() => refetch()}>
            <Center h='10' w="20" bg="light.50" rounded="md" shadow={3}
              _text={{
                color: "emerald.700",
                fontSize: "xs"
              }} >
              Reload data
            </Center>
          </Pressable>
        </HStack>
        <Divider my="3" />
      </View>
      {/* {pfListBoxes()} */}
      {pfList()}
    </SafeAreaView>
  );
}