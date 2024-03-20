import Head from 'next/head'
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Link,
  Button,
  Heading,
  Text,
  useToast,
  InputRightElement,
  InputGroup,
  Divider
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import NHeader from '../components/NHeader'
import Footer from '../components/Footer'
import { useRouter } from 'next/router';
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function SignIn() {  
  const router = useRouter();
  const toast = useToast()
  const userName = useRef("");
  const userPass = useRef("");
  const [show, setShow] = useState(false)
  const handleClick = () => setShow(!show)

  useEffect(() => {
    (async () => { 
      const response = await fetch('http://localhost:6767/user', {
        credentials:"include",
        cache:"no-cache",
      });
      if (response.ok) {
        const id = 'redir-toast'
        if (!toast.isActive(id)) {
          toast({
            id,
            title: "Redirecting...",
            description: "Already signed in.",
            status: "success",
            position: "top-end",
            duration: 7500,
            isClosable: true,
          })
        }
        router.push('/dashboard')
      }
    })();
  }, [])

  const signInEP = async () => {
    try {
      let password = String(userPass.current.value)
      let username = String(userName.current.value)
      const url = 'http://localhost:6767/sign-in';
      const data = {
        username: username,
        password: password,
      };

      fetch(url, {
        method: 'POST',
        credentials:"include",
        cache:"no-cache",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => {return response.json()})
      .then(data => {
        if (data.error) {
          const id = 'error-toast'
          if (!toast.isActive(id)) {
            toast({
              id,
              title: data.error,
              status: "error",
              position: "top-end",
              duration: 7500,
              isClosable: true,
            })
          }
        } else {
          const id = 'success-toast'
          if (!toast.isActive(id)) {
            toast({
              id,
              title: "Signed in",
              status: "success",
              position: "top-end",
              duration: 7500,
              isClosable: true,
            })
          }
          router.push('/dashboard')
        }
      })
      .catch(error => {
        const id = 'error-toast'
        if (!toast.isActive(id)) {
          toast({
            id,
            title: error.error,
            status: "warning",
            position: "top-end",
            duration: 7500,
            isClosable: true,
          })
        }
      });
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <Head>
        <title>Sign In - NEA</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <NHeader />
      <Flex as="main" mx="auto" mt={6} px={5}>
        <Flex flexDirection={"column"} w={"100%"} align={'center'} justify={'center'} py={6} mx="auto" maxWidth={"1200px"}>
            <Flex
                flexDirection={"column"}>
                <Stack spacing={5} mx={'auto'} maxW={'lg'} py={12} px={6}>
                    <Stack align={'center'}>
                    <Heading fontFamily={"'Montserrat',sans-serif!important"} textAlign="center" fontSize={'4xl'}>Sign in to your account</Heading>
                    <Text fontFamily={"'Montserrat',sans-serif!important"} textAlign="center" fontSize={'lg'} color={'gray.600'}>
                        to find new keywords! 🔍
                    </Text>
                    </Stack>
                    <Box
                    rounded={'lg'}
                    bg={'#fafafa'}
                    boxShadow={'lg'}
                    p={8}>
                    <Stack spacing={4}>
                            <FormControl id="username" isRequired>
                            <FormLabel fontFamily={"'Montserrat',sans-serif!important"}>Username</FormLabel>
                            <Input fontFamily={"'Montserrat',sans-serif!important"} ref={userName} type="text" />
                            </FormControl>
                            <FormControl id="password" isRequired>
                            <FormLabel fontFamily={"'Montserrat',sans-serif!important"}>Password</FormLabel>
                            <InputGroup><Input fontFamily={"'Montserrat',sans-serif!important"} type={show ? "text" : "password"} ref={userPass} />
                            <InputRightElement w={'fit-content'} mr={2}>
                                <Button size="sm" background={'none'} onClick={handleClick}>
                                {show ? <FaEyeSlash size={15} opacity={1} /> : <FaEye size={15} opacity={1} /> }
                                </Button>
                            </InputRightElement></InputGroup>
                            </FormControl>
                            <Stack spacing={2}>
                            <Button
                                bg={'blue.400'}
                                color={'white'}
                                type='button'
                                onClick={signInEP}
                                fontFamily={"'Montserrat',sans-serif!important"}
                                _hover={{
                                bg: 'blue.500',
                                }}>
                                Sign in
                            </Button>
                        <Text fontFamily={"'Montserrat',sans-serif!important"} mt={4} textAlign='center'>Don&apos;t have an account? <Link href="/sign-up" _hover={{ textDecoration:"none", opacity:0.8 }} color={'blue.300'}>Create one</Link>.</Text>
                        </Stack></Stack>
                    </Box>
                </Stack>
            </Flex>
        </Flex>
      </Flex>
      <Footer />
    </div>
  )
}