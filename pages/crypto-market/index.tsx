import React, { useState } from "react";
import {
  Badge,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Image,
  Text,
  Spinner,
  Grid,
  Box,
  Button,
} from "@chakra-ui/react";
import Layout from "../../components/Layout";
import { useQuery, QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

type Price = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
};

type PageProps = {
  initialPrice: Price[];
};

const getMarket = async (page = 1) => {
  const URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=10&page=${page}&sparkline=false`;
  const response = await fetch(URL);
  if (!response.ok) {
    throw new Error("Fetch");
  }
  return await response.json();
};

const formatNumber = (num: number) => {
  return Intl.NumberFormat("id-Id").format(num);
};

const Percentage = ({ percent }: { percent: number }) => {
  const formatPercent = Intl.NumberFormat("id-Id", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent / 100);

  let color = "black";
  if (percent > 0) {
    color = "green.500";
  } else if (percent < 0) {
    color = "red.500";
  }

  return <Text color={color}>{formatPercent}</Text>;
};

//SSR With Initial Data
// export async function getStaticProps() {
//   const initialPrice = await getMarket();
//   return { props: { initialPrice } };
// }

//SSR With Hydrate
export async function getStaticProps() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(["market", 1], () => getMarket());

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}

export default function Market() {
  const [page, setPage] = useState(1);
  const nextPage = () => {
    setPage((currentPage) => currentPage + 1);
  };
  const previousPage = () => {
    setPage((currentPage) => currentPage - 1);
  };

  const { data, isError, isLoading, isFetching, isSuccess } = useQuery(
    ["market", page],
    () => getMarket(page),
    {
      staleTime: 3000,
      refetchInterval: 3000,
      // initialData: initialPrice,
    }
  );
  return (
    <Layout title="Crypto Market">
      {isFetching && (
        <Spinner color="blue.500" position="fixed" top={10} right={10} />
      )}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Coin</Th>
            <Th>Last Price</Th>
            <Th>24h % Change</Th>
            <Th isNumeric>Total Volume</Th>
            <Th isNumeric>Market Cap</Th>
          </Tr>
        </Thead>
        <Tbody>
          {isError && <Text>Terjadi kesalahan dalam memuat data</Text>}
          {isSuccess &&
            data?.map((crypto: Price) => (
              <Tr>
                <Td>
                  <Flex alignItems="center">
                    <Image
                      src={crypto.image}
                      boxSize="24px"
                      ignoreFallback={true}
                    />

                    <Text pl={2} fontWeight="bold" textTransform="capitalize">
                      {crypto.id}
                    </Text>
                    <Badge ml={3}>{crypto.symbol}</Badge>
                  </Flex>
                </Td>
                <Td>{formatNumber(crypto.current_price)}</Td>
                <Td>
                  <Percentage percent={crypto.price_change_percentage_24h} />
                </Td>
                <Td isNumeric>{formatNumber(crypto.total_volume)}</Td>
                <Td isNumeric>{formatNumber(crypto.market_cap)}</Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
      <Grid templateColumns="70% 1fr auto 1fr" gap={6} mt={10}>
        <Box></Box>
        <Button
          colorScheme="facebook"
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={page === 1 ? true : false}
        >
          Previous
        </Button>
        <Text>{page}</Text>
        <Button
          colorScheme="facebook"
          variant="outline"
          size="sm"
          onClick={nextPage}
        >
          Next
        </Button>
      </Grid>
    </Layout>
  );
}
