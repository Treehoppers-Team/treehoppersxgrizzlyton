import {
    Box,
    SimpleGrid,
  } from '@chakra-ui/react';
import StatsCard from "./statsCard";

interface EventStatisticsProps {
  events: string;
}

export default function EventStatistics({events}:EventStatisticsProps) {
  return (
    <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
        <StatsCard title={'Total Registered'} stat={events.toString()} />
        <StatsCard title={'Attendance'} stat={'0'} />
        <StatsCard title={'Total $ Sales'} stat={'$0'} />
      </SimpleGrid>
    </Box>
  );
}