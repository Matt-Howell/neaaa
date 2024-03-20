import {
  Link,
  Flex,
  IconButton,
  Button,
  Box,
  HStack,
  VStack,
  useDisclosure,
  CloseButton
} from "@chakra-ui/react";
import { RiMenuLine } from 'react-icons/ri'

export default function NHeader() {
  const bg = "#fafafa";
  const mobileNav = useDisclosure();

  return (
    <>
      <Box
        bg={bg}
        w="full"
        px={{
          base: 2,
          sm: 4,
        }}
        py={4}
        borderBottomWidth={1}
        borderBottomColor={"gray.200"}
      >
        <Flex alignItems="center" 
        maxWidth={1400} justifyContent="space-between" mx="auto">
          <Flex>
            NEA
          </Flex>
          <HStack display="flex" alignItems="center" spacing={1}>
            <HStack
              spacing={1}
              mr={1}
              display={{
                base: "none",
                md: "inline-flex",
              }}
            >
              <Link display={{base:"none",md:"flex"}} href="/sign-in" _hover={{ textDecoration:"none" }}><Button colorScheme="blue" size="sm">Sign In</Button></Link>
            </HStack>
            <Link display={{base:"none",md:"flex"}} href="/sign-up" _hover={{ textDecoration:"none" }}><Button colorScheme="blue" size="sm">
              Sign Up
            </Button></Link>
            <Box
              display={{
                base: "inline-flex",
                md: "none",
              }}
            >
              <IconButton
                display={{
                  base: "flex",
                  md: "none",
                }}
                ml={{ base:1, md:0 }}
                aria-label="Open menu"
                fontSize="20px"
                color="gray.800"
                _dark={{
                  color: "inherit",
                }}
                variant="ghost"
                icon={<RiMenuLine />}
                onClick={mobileNav.onOpen}
              />

              <VStack
                pos="absolute"
                top={0}
                left={0}
                right={0}
                borderBottomWidth={1}
                borderBottomColor={"gray.200"}
                display={mobileNav.isOpen ? "flex" : "none"}
                flexDirection="column"
                p={2}
                pb={4}
                m={2}
                bg={bg}
                zIndex={100}
                spacing={3}
                rounded="sm"
                shadow="sm"
              >
                <CloseButton
                  aria-label="Close menu"
                  onClick={mobileNav.onClose}
                />
              <Link href="/sign-in" _hover={{ textDecoration:"none" }}>
              <Button w={"full"} fontFamily={"'Montserrat', sans-serif!important"} variant="ghost">Sign In</Button></Link>
              <Link href="/sign-up" _hover={{ textDecoration:"none" }}><Button colorScheme="blue" w={"full"} fontFamily={"'Montserrat', sans-serif!important"} variant="solid">Get Started</Button></Link>
              </VStack>
            </Box>
          </HStack>
        </Flex>
      </Box>
    </>
  );
};