import {
    Box,
    SimpleGrid,
  } from '@chakra-ui/react';
import StatsCard from "./statsCard";

interface BasicStatisticsProps {
  events: string;
}
// This Basic Stats is displayed on the landing page, it provides overall data of all the NFTs minted across all events
// It uses the statsCard component, any new dashboard using the statsCard component should be a new component for modularity
export default function BasicStatistics({events}:BasicStatisticsProps) {
  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
        <StatsCard title={'Total Events'} stat={events.toString()} />
        <StatsCard title={'NFTs Minted'} stat={'0'} />
        <StatsCard title={'Revenue'} stat={'$0'} />
      </SimpleGrid>
    </Box>
  );
}