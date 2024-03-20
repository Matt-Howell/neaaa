import {
  Box,
  Container,
  Link,
  SimpleGrid,
  Stack,
  Text,
  HStack
} from '@chakra-ui/react';

const ListHeader = ({ children }) => {
  return (
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  );
};

export default function Footer() {
  return (
    <Box
      mt={12}
      bg={"#fafafa"}
      color={'gray.700'}>
      <Container as={Stack} maxW={'6xl'} py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
          <Stack align={'flex-start'}>
            <ListHeader>Links</ListHeader>
            <Link _hover={{ color:"blue.300" }} href={'/sign-in'}>Sign In</Link>
            <Link _hover={{ color:"blue.300" }} href={'/sign-up'}>Sign Up</Link>
            <Link _hover={{ color:"blue.300" }} href={'/dashboard'}>Dashboard</Link>
            <Link _hover={{ color:"blue.300" }} href={'/reports'}>Reports</Link>
            <Link _hover={{ color:"blue.300" }} href={'/sites'}>Sites</Link>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}