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

export default function StatsCard(props: StatsCardProps) {
const { title, stat } = props;
return (
    <Stat
    zIndex={-1}
    px={{ base: 4, md: 8 }}
    py={"5"}
    shadow={"xl"}
    border={"1px solid"}
    borderColor={useColorModeValue("gray.800", "gray.500")}
    rounded={"lg"}
    >
    <StatLabel fontWeight={"medium"} isTruncated>
        {title}
    </StatLabel>
    <StatNumber fontSize={"2xl"} fontWeight={"medium"}>
        {stat}
    </StatNumber>
    </Stat>
);
}