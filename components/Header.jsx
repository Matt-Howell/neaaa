import { useState, useRef, useEffect } from "react";
import {
  HStack,
  Link,
  Flex,
  IconButton,
  Button,
  Box,
  useToast,
  Menu,
  MenuList,
  MenuItem,
  MenuButton,
  Text,
  MenuDivider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Stack,
  Collapse,
  useDisclosure,
  Icon
} from "@chakra-ui/react";
import { FaUserCircle, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoMdClose } from 'react-icons/io'
import { RiMenuLine } from 'react-icons/ri'
import { MdOutlineExitToApp } from 'react-icons/md'
import { useRouter }  from 'next/router'

export default function Header() {
  const router = useRouter()
  const bg = "#fafafa"
  const ref = useRef();
  const toast = useToast();
  const [user, setUser] = useState("")

  useEffect(() => {
    (async () => { 
      const response = await fetch('http://localhost:6767/user', {
        credentials:"include",
        cache:"no-cache",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.username);
      }
    })();
  }, [])

  const cols = "gray.700"

  const logOutSB = async () => {
    const response = await fetch('http://localhost:6767/logout', {
      method: 'POST',
      credentials:"include",
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (response.ok) {
      toast({
        title: "Signed Out!",
        description: "You have successfully signed out from your account.",
        status: "success",
        position: "top-end",
        duration: 7500,
        isClosable: true,
      })
    }
    router.reload()
  }

  const { isOpen, onToggle } = useDisclosure();
  return (
    <>
    <Flex flexDirection={"column"} as="header"
        borderBottomWidth={1}
        borderBottomColor={"gray.200"}
        bg={bg}>
      <Box
        ref={ref}
        transition="box-shadow 0.2s"
        bg={bg}
        zIndex={isOpen?15:null}
        w={"100%"}
        borderBottomWidth={1}
        borderBottomColor={"gray.200"}
      >
        <Box h="4.5rem" maxWidth={1400} mx="auto">
          <Flex
            h="full"
            px="6"
            alignItems="center"
            justifyContent="space-between"
          >
            <Flex flex={1}>
              <Link href="/dashboard">
                <HStack>
                  <Text>NEA</Text>
                </HStack>
              </Link>
            </Flex>
            <Flex
            display={{ base: 'flex', md: 'none' }}>
            <IconButton
              onClick={onToggle}
              icon={
                isOpen ? <IoMdClose w={3} h={3} /> : <RiMenuLine w={5} h={5} />
              }
              variant={'ghost'}
              aria-label={'Toggle Navigation'}
            />
          </Flex>
            <Flex justify="flex-end" align="center" color="gray.400">
              <Menu placement="bottom-end">
                <MenuButton as={IconButton}
                  size="md"
                  fontSize="lg"
                  justifyContent={'center'}
                  display={{ base:"none", md:'flex' }}
                  variant="ghost"
                  color="current"
                  mx={{ base: "2", md: "3" }}
                  className="noFocus"
                ><FaUserCircle style={{ margin:"0 auto" }} /></MenuButton>
                <MenuList zIndex={151} position="relative">
                  <Text fontSize={"medium"} fontWeight={500} color={cols} p={4}>Username: {user ?? null}</Text>
                  <MenuDivider />
                  <MenuItem _focus={{ background:"inherit" }} _hover={{ background:"inherit" }}><Button rightIcon={<MdOutlineExitToApp />} onClick={logOutSB} color={cols} variant="ghost" w="full">Sign Out</Button></MenuItem>
                  </MenuList>
              </Menu>
            </Flex>
          </Flex>
        </Box>
        <Collapse in={isOpen} animateOpacity>
          <MobileNav username={user} />
        </Collapse>
      </Box>
      <Box><Flex p={5} justifyContent="center" display={{ base: 'none', md: 'flex' }}>
        <DesktopNav username={user} />
      </Flex></Box>
    </Flex>
    </>
  );
}

const DesktopSubNav = ({ label, href, subLabel }) => {
    return (
      <Link
        href={href}
        role={'group'}
        display={'block'}
        p={2}
        rounded={'md'}
        _hover={{ textDecoration:"none" }}>
        <Stack direction={'row'} align={'center'}>
          <Box>
            <Text
              transition={'all .3s ease'}
              _groupHover={{ color: 'blue.300' }}
              fontSize="0.95rem"
              fontWeight={600}>
              {label}
            </Text>
            <Text fontSize={'sm'}>{subLabel}</Text>
          </Box>
          <Flex
            transition={'all .3s ease'}
            transform={'translateX(-10px)'}
            opacity={0}
            _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
            justify={'flex-end'}
            align={'center'}
            flex={1}>
            <Icon color={'blue.300'} w={5} h={5} as={FaChevronRight} />
          </Flex>
        </Stack>
      </Link>
    );
  };

const MobileNav = ({ username }) => {
    const logOutSB = async () => {
      const response = await fetch('http://localhost:6767/logout', {
        method: 'POST',
        credentials:"include",
        headers: {
          'Content-Type': 'application/json',
        },
      });
    
      if (response.ok) {
        if (response.ok) {
          toast({
            title: "Signed Out!",
            description: "You have successfully signed out from your account.",
            status: "success",
            position: "top-end",
            duration: 7500,
            isClosable: true,
          })
        }
      }
      router.reload()
    }
    const toast = useToast()
    const router = useRouter()
    let coll = 'gray.600'
    const cols = "gray.700"
    const [arrowDir, setArrowDir] = useState(true)
    return (
      <Stack
        bg={'#fafafa'}
        p={4}
        display={{ md: 'none' }}>
        <>{NAV_ITEMS.map((navItem) => (
          <MobileNavItem key={navItem.label} {...navItem} />
        ))}</>
        <Menu onClose={() => setArrowDir(false)} onOpen={() => setArrowDir(true)}>
          <MenuButton as={Text}
            justifyContent={'center'}
            className="noFocus"
            fontWeight={600}
            my={2}
            pt={2}
            color={coll}
            pointerEvents="all"
          ><Flex alignItems={"center"} w="100%"> <Text mr={3}>Account</Text> {arrowDir ? <FaChevronDown /> : <FaChevronUp />} </Flex></MenuButton>
          <MenuList>
            <Text fontSize={"medium"} fontWeight={500} color={cols} p={4}>Username: {username ?? null}</Text>
            <MenuDivider />
            <MenuItem _focus={{ background:"inherit" }} _hover={{ background:"inherit" }}><Button rightIcon={<MdOutlineExitToApp />} onClick={logOutSB} color={cols} variant="ghost" w="full">Sign Out</Button></MenuItem>
            </MenuList>
        </Menu>
      </Stack>
    );
  };
  
  const MobileNavItem = ({ label, children, href }) => {
    const { isOpen, onToggle } = useDisclosure();
    let coll = 'gray.600'
  
    return (
      <Stack spacing={4} onClick={children && onToggle}>
        <Flex
          py={2}
          as={Link}
          href={href ?? '#'}
          pointerEvents={"all"}
          opacity={"1"}
          justify={'space-between'}
          align={'center'}
          _hover={{
            textDecoration: 'none',
          }}>
          <Text
            fontWeight={600}
            color={coll}>
            {label}
          </Text>
          {children && (
            <Icon
              as={FaChevronDown}
              color={coll}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={3}
              h={3}
            />
          )}
        </Flex>
  
        <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
          <Stack
            mb={3}
            pl={4}
            borderLeft={1}
            borderStyle={'solid'}
            borderColor={'gray.200'}
            align={'start'}>
            {children &&
              children.map((child) => (
                <Link _hover={{ color:"blue.300" }} key={child.label} py={2} href={child.href}>
                  {child.label}
                </Link>
              ))}
          </Stack>
        </Collapse>
      </Stack>
    );
  };

  const DesktopNav = ({ username })  => {
    const linkColor = 'gray.600'
    const linkHoverColor = 'rgb(37, 37, 37)'
    const popBack = "#fafafa"

    const borderBottomColor = "gray.200"
  
    return (
      <Stack zIndex={150} position="relative" direction={'row'} spacing={4}>
        {NAV_ITEMS.map((navItem, i) => (
          <Box key={i}>
            <Popover trigger={'hover'} placement={'bottom'}>
              <PopoverTrigger>
                <Link
                  p={2}
                  href={navItem.href ?? '#'}
                  fontWeight={500}
                  fontSize="0.95rem"
                  color={linkColor}
                  pointerEvents={"all"}
                  opacity={"1"}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}>
                  {navItem.label}
                </Link>
              </PopoverTrigger>
  
              {navItem.children && (
                <PopoverContent
                  boxShadow={'xl'}
                  bg={popBack}
                  border={"1px solid"}
                  borderColor={borderBottomColor}
                  p={4}
                  rounded={'xl'}
                  minW={'sm'}>
                  <Stack>
                    {navItem.children.map((child) => (
                      <DesktopSubNav key={child.label} {...child} />
                    ))}
                  </Stack>
                </PopoverContent>
              )}
            </Popover>
          </Box>
        ))}
      </Stack>
    );
  };

const NAV_ITEMS = [
    {
      label: 'Your Sites',
      href: '/sites',
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      label: 'Reports',
      href: '/reports',
    }
];