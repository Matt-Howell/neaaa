import Head from 'next/head'
import { Flex, Text, Button, IconButton, Spinner,
  Card, CardHeader, CardBody,
  Heading,
  Divider,
  Tooltip,
  useToast,
  InputGroup,
  Input,
  InputRightElement
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer.jsx'
import { FaExternalLinkAlt, FaSearch } from 'react-icons/fa'
import Flag from 'react-flagkit';
import { useRouter } from 'next/router'

export default function Reports() {
    const toast = useToast()
    const router = useRouter()
    useEffect(() => {
        (async () => { 
          const response = await fetch('http://localhost:6767/user', {
            credentials:"include",
            cache:"no-cache",
          });
          if (response.ok) {
            setReportsLoading(true)
            await fetch('http://localhost:6767/reports', {
                credentials:"include",
                cache:"no-cache",
            }).then( async (res) => {
                let reports = await res.json()
                setReportsBack(reports.reports)
                setReportsState(reports.reports)
                setReportsLoading(false)
            });
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

    const [reportsState, setReportsState] = useState([])
    const [reportsBack, setReportsBack] = useState([])
    const [reportsLoading, setReportsLoading] = useState()
  
    const textColor = '#4A5568'
    const popBack = "#fafafa";
  
    const searchBar = useRef("")
  
    const setValues = (elem) => {
      localStorage.setItem("keywordReport", elem.report_content)
      let kws = []
      JSON.parse(elem.report_content).report.forEach((el) => {
        let newKW = el.kw.replace("how to ", "").replace("best ", "").replace("what ", "").replace("in ", "").replace("a ", "").replace("and ", "").replace("a ", "").replace("i ", "")
        newKW.split(" ").forEach((elem) => {
          kws.push(elem)
        })
      })
      let kwsset = [...new Set(kws)];
      let kwsWLen = []
      kwsset.forEach((el) => {
        if(kws.filter(function(item){ return item === el; }).length > 3){
          kwsWLen.push({ kw: el, occ: kws.filter(function(item){ return item === el; }).length })
        }
      })
      localStorage.setItem("wordsToFilter", JSON.stringify([...kwsWLen.sort((a, b) => b.occ - a.occ)]))
      localStorage.setItem("keyword", elem.keyword)
      localStorage.setItem("geo", elem.location)
      localStorage.setItem("reportSet", "true")
      localStorage.setItem("reportID", elem.id)
  
      router.push('/dashboard')
    }
  
    function searchReports(query) {
      if (query.length > 0) {
        setReportsState(reps => reps.filter(value => value.keyword.includes(query)))
      } else {
        setReportsState(reportsBack)
      }
    }

  return (
    <div>
      <Head>
        <title>Reports - NEA</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Header />
      <Flex as="main" mx="auto" mt={6} px={5}>
      <Flex flexDirection={"column"} w={"100%"} minHeight="100vh" mx="auto" maxWidth={"1000px"}>
          <Flex mt={3} alignItems={"center"} justifyContent={"space-between"} mb={4}>
              <Flex flexDirection={"column"} maxWidth={{ base:400, md:500 }}>
                <Heading fontSize={"xl"} fontWeight={400} fontFamily={"'Montserrat', sans-serif!important"}>Your Reports</Heading>
                <Text fontSize={"xs"} mt={2} opacity={0.9} fontWeight={400} fontFamily={"'Montserrat', sans-serif!important"}>Check out and go back to any of your old keyword reports, right where you left off!</Text>
              </Flex>
          </Flex>
          <Divider mb={4} />
            <form onSubmit={(e) => {
              e.preventDefault()
              searchReports(searchBar.current.value)
            }}>
            <InputGroup mb={4} size='md'>
              <Input
                type={'text'}
                placeholder='Search Reports'
                ref={searchBar}
              />
              <InputRightElement width='3rem'>
                <IconButton h='1.75rem' size='sm' type='submit' icon={<FaSearch />} />
              </InputRightElement>
            </InputGroup>
            </form>
            {reportsLoading ? <Spinner mt={4} /> : reportsState.map((elm,ind,arr) => 
            <Card key={ind} mb={4} backgroundColor={popBack}>
                <CardHeader pb={0}>
                  <Flex justifyContent={"space-between"}>
                  <Tooltip label={`Country: ${elm.location.split(",")[0]}, Language: ${elm.location.split(",")[1]}`} placement='bottom'><Heading color={textColor} size='sm' fontFamily={"'Montserrat', sans-serif!important"} alignItems="center" display="flex" textTransform={"capitalize"}><Flag country={elm.location.split(",")[0]} size={24} style={{ borderRadius:3, marginRight:"1rem" }} /><Flex><>{elm.keyword}</></Flex></Heading></Tooltip>
                  </Flex>
                </CardHeader>
                <CardBody flexDirection={"column"} display="flex" pt={4}>
                  <Text color={textColor}>Date Generated: {`${new Date(elm.created_at).toDateString()}`}</Text>
                  <Text color={textColor}>Keywords Found: {JSON.parse(elm.report_content).report.length}</Text>
                  <Text color={textColor}>SERPs Analysed: {JSON.parse(elm.report_content).report.filter(obj => obj.serp !== null).length}</Text>
                  <Button mt={3} rightIcon={<FaExternalLinkAlt size={14} />} onClick={() => setValues(elm)} width="fit-content">Load Report</Button>
                </CardBody>
            </Card>
            )}
        </Flex>
      </Flex>
      <Footer />
    </div>
  )
}