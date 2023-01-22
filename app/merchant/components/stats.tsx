import {
    Box,
    chakra,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    useColorModeValue,
  } from '@chakra-ui/react';
  
  interface StatsCardProps {
    title: string;
    stat: string;
  }
  function StatsCard(props: StatsCardProps) {
    const { title, stat } = props;
    return (
      <Stat
        zIndex={-1}
        px={{ base: 4, md: 8 }}
        py={'5'}
        shadow={'xl'}
        border={'1px solid'}
        borderColor={useColorModeValue('gray.800', 'gray.500')}
        rounded={'lg'}>
        <StatLabel fontWeight={'medium'} isTruncated>
          {title}
        </StatLabel>
        <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
          {stat}
        </StatNumber>
      </Stat>
    );
  }
  
  interface BasicStatisticsProps {
    events: string;
  }

  export default function BasicStatistics({events}:BasicStatisticsProps) {
    return (
      <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
          <StatsCard title={'Total Events'} stat={events.toString()} />
          <StatsCard title={'NFTs Minted'} stat={'43'} />
          <StatsCard title={'Revenue'} stat={'$1030'} />
        </SimpleGrid>
      </Box>
    );
  }