import Head from 'next/head'
import { Flex, Text, Button, IconButton, Spinner,
  Card, CardHeader, CardBody,
  Heading,
  Divider,
  Tooltip,
  useToast,
  InputGroup,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverHeader,
  PopoverTrigger,
  PopoverContent
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer.jsx'
import { FaArrowRight, FaPlusCircle, FaTrashAlt } from 'react-icons/fa'
import { useRouter } from 'next/router'

export default function Sites() {
    const toast = useToast()
    const router = useRouter()
    
    const [sites, setSites] = useState([])
    const [sitesLoading, setSitesLoading] = useState()

    const siteUrlAdd = useRef()

    useEffect(() => {
        (async () => { 
          setSitesLoading(true)
          const response = await fetch('http://localhost:6767/user', {
            credentials:"include",
            cache:"no-cache",
          });
          if (response.ok) {
            const data = await response.json();
            let sitesParsed = data.sites.split(",").filter(function(e){return e}); 
            setSites(sitesParsed)
            setSitesLoading(false)
          } else {
            const id = 'redir-toast'
            if (!toast.isActive(id)) {
              toast({
                id,
                title: "Redirecting...",
                description: "Sign in to use the platform.",
                status: "warning",
                position: "top-end",
                duration: 7500,
                isClosable: true,
              })
            }
            router.push('/sign-in')
          }
        })();
      }, [])
    
      async function addSite(url) {
        let domain = url.replace("https://", "").replace("http://", "").replace("www.", "").replace("/", "")
        const data = {
          domain: domain,
          modifyType: "add"
        }
        const response = await fetch('http://localhost:6767/edit-sites', {
            credentials:"include",
            cache:"no-cache",
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          if (response.ok) {
            const data = await response.json();
            setSites(data.sites)
            const id = 'site-toast'
            if (!toast.isActive(id)) {
              toast({
                id,
                title: "Site Added",
                description: "This site has been added to your account.",
                status: "success",
                position: "top-end",
                duration: 7500,
                isClosable: true,
              })
            }
          } else {
            const id = 'err-toast'
            if (!toast.isActive(id)) {
              toast({
                id,
                title: "Error Occurred",
                description: "An error occurred.",
                status: "error",
                position: "top-end",
                duration: 7500,
                isClosable: true,
              })
            }
          }
      }
    
      async function deleteSite(url) {
        const data = {
          domain: url,
          modifyType: "delete"
        }
        const response = await fetch('http://localhost:6767/edit-sites', {
            credentials:"include",
            cache:"no-cache",
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          if (response.ok) {
            const data = await response.json();
            setSites(data.sites)
            const id = 'site-toast'
            if (!toast.isActive(id)) {
              toast({
                id,
                title: "Site Deleted",
                description: "This site has been deleted from your account.",
                status: "success",
                position: "top-end",
                duration: 7500,
                isClosable: true,
              })
            }
          } else {
            const id = 'err-toast'
            if (!toast.isActive(id)) {
              toast({
                id,
                title: "Error Occurred",
                description: "An error occurred.",
                status: "error",
                position: "top-end",
                duration: 7500,
                isClosable: true,
              })
            }
          }
      }
  return (
    <div>
      <Head>
        <title>Sites - NEA</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Header />
      <Flex as="main" mx="auto" mt={6} px={5}>
        <Flex flexDirection={"column"} w={"100%"} minHeight="100vh" mx="auto" maxWidth={"1000px"}>
            <Flex mt={3} alignItems={"center"} justifyContent={"space-between"} mb={4}>
              <Flex flexDirection={"column"} maxWidth={{ base:200, md:500 }}>
                <Heading fontSize={"xl"} fontWeight={400} fontFamily={"'Montserrat', sans-serif!important"}>Your Sites</Heading>
                <Text fontSize={"xs"} mt={2} opacity={0.9} fontWeight={400} fontFamily={"'Montserrat', sans-serif!important"}>By adding your own websites, SERPs where your site already ranks will be highlighted.</Text>
              </Flex>
              <Popover placement='bottom-end'>
                <PopoverTrigger>
                  <Button colorScheme='blue' leftIcon={<FaPlusCircle />} size={"sm"}>Add Site</Button>
                </PopoverTrigger>
                <PopoverContent backgroundColor={"#fafafa"}>
                  <PopoverArrow backgroundColor={"#fafafa"} />
                  <PopoverHeader display={"flex"} alignItems="center">
                    <Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}>
                        Add Website
                        <PopoverCloseButton display={"flex"} position="inherit" />
                    </Flex>
                  </PopoverHeader>
                  <PopoverBody p={4}>
                    <Flex flexDirection={"row"} width="100%">
                      <Input ref={siteUrlAdd} placeholder='Domain' />
                    </Flex>
                    <Button mt={3} colorScheme='blue' size="sm" onClick={() => addSite(siteUrlAdd.current.value)} rightIcon={<FaArrowRight />}>Add Site</Button>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </Flex>
            <Divider mb={4} />
            {sitesLoading ? <Spinner mt={4} /> : sites.map((elm,ind,arr) => 
            <Card key={ind} mb={4} backgroundColor={"#fafafa"}>
                <CardBody justifyContent={"space-between"} flexDirection={"row"} display="flex" pt={4}>
                  <Heading color={"inherit"} size='sm' fontFamily={"'Montserrat', sans-serif!important"} alignItems="center" display="flex">{elm}</Heading>
                  <Popover placement='bottom-end'>
                    <PopoverTrigger>
                      <IconButton variant={"ghost"} colorScheme='red' justifyContent={"center"} display={"flex"} icon={<FaTrashAlt size={14} />} />
                    </PopoverTrigger>
                    <PopoverContent backgroundColor={"#fafafa"}>
                      <PopoverArrow backgroundColor={"#fafafa"} />
                      <PopoverHeader display={"flex"} alignItems="center">
                        <Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}>
                            Delete Site
                            <PopoverCloseButton display={"flex"} position="inherit" />
                        </Flex>
                      </PopoverHeader>
                      <PopoverBody p={4}>
                        <Text>Are you sure you want to delete <strong>{elm}</strong>?</Text>
                        <Button mt={3} colorScheme='red' variant={"outline"} size="sm" onClick={() => deleteSite(elm)} rightIcon={<FaArrowRight />}>Delete</Button>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </CardBody>
            </Card>
            )}
        </Flex>
      </Flex>
      <Footer />
    </div>
  )
}