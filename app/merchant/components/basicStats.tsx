import {
    Box,
    SimpleGrid,
  } from '@chakra-ui/react';
import StatsCard from "./statsCard";

interface BasicStatisticsProps {
  events: { [key: string]: string };
}
export default function BasicStatistics({events}:BasicStatisticsProps) {
  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <SimpleGrid columns={{ base: 1, md: Object.keys(events).length }} spacing={{ base: 5, lg: 8 }}>
        {Object.entries(events).map(([title, stat], index) => (
          <StatsCard key={index} title={title} stat={stat} />
        ))}
      </SimpleGrid>
    </Box>
  );
}