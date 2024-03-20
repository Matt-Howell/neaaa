import Head from 'next/head'
import { Flex, Table, Thead, Tbody, Tr, Th, Td, Text, TableCaption, TableContainer, Button, Input, IconButton, Spinner, useToast, Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  ListItem,
  OrderedList,
  Link,
  StatHelpText,
  StatNumber,
  StatLabel,
  Stat,
  NumberInput,
  NumberInputField,
  Tooltip,
  Box,
  Card, CardHeader, CardBody,
  Heading,
  Divider,
  Checkbox,
  CheckboxGroup,
  Stack,
  Highlight,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer.jsx'
import { useRouter }  from 'next/router'
import { HiOutlineMagnifyingGlassPlus, HiOutlineArrowTopRightOnSquare, HiOutlineArrowTrendingUp } from 'react-icons/hi2'
import { FaArrowAltCircleRight, FaArrowLeft, FaArrowRight, FaChartBar, FaCheckCircle, FaChevronLeft, FaChevronRight, FaClipboard, FaExternalLinkAlt, FaInfoCircle, FaLeaf, FaMinusSquare, FaPercentage, FaPlusCircle, FaPlusSquare, FaSearch, FaTape } from 'react-icons/fa'
import { RxLetterCaseCapitalize } from 'react-icons/rx'
import { AiOutlineQuestionCircle } from 'react-icons/ai'
import { saveAs } from 'file-saver';
import { Select as ReactSel } from "chakra-react-select";
import { BiCopy } from 'react-icons/bi'
import { MdClose } from 'react-icons/md'
import Flag from 'react-flagkit';
import countryList from '../components/utils/geos.json'
import Label from '../components/graph-features/Label.jsx'
import LineChart from '../components/Graphing.jsx'

export default function Dashboard() { 
  const volumeMin = useRef(0)
  const volumeMax = useRef(0)

  const lengthMin = useRef(0)
  const lengthMax = useRef(0)

  const scoreMin = useRef(0)
  const scoreMax = useRef(0)

  const includeWords = useRef("")
  const excludeWords = useRef("")

  const router = useRouter()
  const inputBox = useRef("")
  const toast = useToast()

  const [userID, setUserID] = useState("")
  const [pageConstant, setPageConstant] = useState(50)
  const [userSites, setUserSites] = useState([])

  useEffect(() => {
    (async () => { 
      const response = await fetch('http://localhost:6767/user', {
        credentials:"include",
        cache:"no-cache",
      });
      if (response.ok) {
        const data = await response.json();
        setUserID(data.user_id);
        setUserSites(data.sites);
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

  const [kwsBackup, setKwsBackup] = useState([])
  const [kwsFinal, setKwsFinal] = useState([])
  const [showAllWords, setShowAllWords] = useState(false)
  const [loadingWords, setLoadingWords] = useState([])

  const [kwsChecked, setKwsChecked] = useState([])
  const [searchGeo, setSearchGeo] = useState(["US","en"])

  const [showPage, setShowPage] = useState(1)

  const [reportID, setReportID] = useState("")

  const [kwsLoading, setKwsLoading] = useState(false)

  const [loadingKWs, setLoadingKWs] = useState([])

  const [fetchingReader, setFetchingReader] = useState()

  const fetchKWs = async () => {
    let seed = inputBox.current.value
    setKwsLoading(true)
    setKwsBackup([])
    setKwsFinal([])
    setShowPage(1)
    setKwsChecked([])

    let searchToSend = searchGeo[0].length == 0 ? "US" : searchGeo[0]
    let langToSend = searchGeo[1].length == 0 ? "en" : searchGeo[1]

    const response = await fetch(`http://localhost:6767/get-kws?seed=${seed}&geo=${searchToSend}&lang=${langToSend}`, {
      credentials:"include",
      cache:"no-cache",
    });
    const decoder = new TextDecoder();

    const reader = response.body.getReader();
    setFetchingReader(reader)

    async function readAllChunks() {
      const chunks = [];
      
      let done, value;
      let pushing = []
      while (!done) {
        ({ value, done } = await reader.read());
        chunks.push(decoder.decode(value));
        let newValues = decoder.decode(value).split(",")
        let toAppend = []
        for (let i = 0; i < newValues.length; i++) {
          let val = newValues[i]
          if (val.length > 0) {
            toAppend.push({kw:val, serp:null, vols:{volume:null,cpc:null,trend:null,keyword:null}})
            pushing.push({kw:val, serp:null, vols:{volume:null,cpc:null,trend:null,keyword:null}})
          }
        }
        setKwsFinal(keywords => [...toAppend, ...keywords])
        setKwsBackup(keywords => [...toAppend, ...keywords])
      }
      setKwsLoading(false)
      return pushing
    }

    await readAllChunks().then((toAppend) => {
      let allKws = toAppend
      let kws = []
      allKws.forEach((el) => {
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
      setLoadingWords(kwsWLen.sort((a, b) => b.occ - a.occ))
    });

    const reportIdHeader = String(response.headers.get('X-Report-Id'));
    setReportID(reportIdHeader)
  }

  const [wordsFiltered, setWordsFiltered] = useState([])
  
  const [filteredByWords, setFilteredByWords] = useState([])
  const [paaLoading, setPaaLoading] = useState([])  

  async function postData(url) {
    const response = await fetch("http://localhost:6767"+url, {
      credentials:"include",
      cache:"no-cache",
    })
    return response.json()
  }

  const addPAA = (paa) => {
    setPaaLoading(current => [paa, ...current])
    setKwsFinal([{kw: paa.toLowerCase(), serp:null, vols:{volume:null,cpc:null,trend:null,keyword:null}}, ...kwsFinal])
    setKwsBackup([{kw: paa.toLowerCase(), serp:null, vols:{volume:null,cpc:null,trend:null,keyword:null}}, ...kwsBackup])
    setPaaLoading(current => [...current.filter(kw => kw != paa)])
  }

  const fetchSERP = (kw, pa) => {
    return new Promise( async (resolve, reject) => {
      (async () => { 
        setLoadingKWs(kws => [kw, ...kws])
        
        let searchToSend = searchGeo[0].length == 0 ? "US" : searchGeo[0]
        let langToSend = searchGeo[1].length == 0 ? "en" : searchGeo[1]
        await postData(`/analyse-kw?seed=${kw}&geo=${searchToSend}&lang=${langToSend}&reportId=${reportID}`).then( async (newserp) => {
      
          let keywordsFromState 
          let oldKW
          setKwsFinal((keywords) => {
            oldKW = keywords.filter(item => item.kw === kw)[0]
            oldKW.serp = newserp.serp
            oldKW.vols = newserp.vols
            keywordsFromState = [oldKW, ...keywords.filter(item => item.kw !== kw)]
            return keywordsFromState
          })

          let keywordsFromState_second
          let orKw
          setKwsBackup((keywords) => {
            orKw = keywords.filter(item => item.kw === kw)[0]
            orKw.serp = newserp.serp
            orKw.vols = newserp.vols
            keywordsFromState_second = [oldKW, ...keywords.filter(item => item.kw !== kw)]
            return keywordsFromState_second
          })

          setLoadingKWs(kws => [...kws.filter(el => el !== kw)])

          resolve(oldKW);
        });
      })();
    })
  }

  function filterByWords(word, func){
    if(func == "remove") {  
      setShowPage(1)
      let wordsFilteredTemp = wordsFiltered.filter(e => e !== word)
      setWordsFiltered(wordsFiltered.filter(e => e !== word))
      setFilteredByWords(kwsBackup.filter(value => wordsFilteredTemp.every(element => value.kw.includes(element))))
    } else { 
      setShowPage(1)
      let wordsFilteredTemp = [...wordsFiltered, word]
      setWordsFiltered(wordsFilteredTemp)
      setFilteredByWords(kwsFinal.filter(value => wordsFilteredTemp.every(element => value.kw.includes(element))))
    }
  }

  // filters other than wrds

  const [filtersActive, setFiltersActive] = useState([])

  useEffect(() => {
    let kwsF = kwsBackup;
    setShowPage(1)

    if(filtersActive.includes("length")){
      if (lengthMin.current.value && lengthMax.current.value) {
        kwsF = kwsF.filter(value => value.kw.split(" ").length >= lengthMin.current.value && value.kw.split(" ").length <= lengthMax.current.value)
      } else if (lengthMin.current.value) {
        kwsF = kwsF.filter(value => value.kw.split(" ").length >= lengthMin.current.value)
      } else if (lengthMax.current.value) {
        kwsF = kwsF.filter(value => value.kw.split(" ").length <= lengthMax.current.value)
      }
      if (!(lengthMin.current.value) && !(lengthMax.current.value)) {
        setFiltersActive(filtersActive.filter(item => item !== "length"))
      }
    }

    if(filtersActive.includes("volume")){
      if (volumeMin.current.value && volumeMax.current.value) {
       kwsF = kwsF.filter(value => parseInt(value.vols.volume) >= volumeMin.current.value && parseInt(value.vols.volume) <= volumeMax.current.value)
      } else if (volumeMin.current.value) {
       kwsF = kwsF.filter(value => parseInt(value.vols.volume) >= volumeMin.current.value)
      } else if (volumeMax.current.value) {
       kwsF = kwsF.filter(value => parseInt(value.vols.volume) <= volumeMax.current.value)
      }
      if (!(parseInt(volumeMin.current.value)) && !(parseInt(volumeMax.current.value))) {
        setFiltersActive(filtersActive.filter(item => item !== "volume"))
      }
    }

    if (filtersActive.includes("trending")) {
      kwsF = kwsF.filter(value => value.vol > 0).filter(value => value.vol > value.volAvg)
    }

    if (filtersActive.includes("seasonal")) {
      kwsF = kwsF.filter(value => value.vol > 0).filter((value) => {
        let aboveBasline = 0
        for (let i = 0; i < value.trend.length; i++) {
          if (value.trend[i].searches > value.volAvg) {
            aboveBasline += 1
          }
        } 
        if (aboveBasline > 2) {
          return true
        } else {
          return false
        }
      })
    }

    if (filtersActive.includes("score")) {
      if (scoreMin.current.value && scoreMax.current.value) {
        kwsF = kwsF.filter(value => value.serp != null).filter(value => value.serp.score >= scoreMin.current.value && value.serp.score <= scoreMax.current.value)
       } else if (scoreMin.current.value) {
        kwsF = kwsF.filter(value => value.serp != null).filter(value => value.serp.score >= scoreMin.current.value)
       } else if (scoreMax.current.value) {
        kwsF = kwsF.filter(value => value.serp != null).filter(value => value.serp.score <= scoreMax.current.value)
       }
       if (!(parseInt(scoreMin.current.value)) && !(parseInt(scoreMax.current.value))) {
         setFiltersActive(filtersActive.filter(item => item !== "score"))
       }
    }

    if (filtersActive.includes("include")) {
      if (includeWords.current.value.length > 0) {
        kwsF = kwsF.filter(value => includeWords.current.value.split(",").some(element => value.kw.includes(element.trim())))
      } else {
        setFiltersActive(filtersActive.filter(item => item !== "include"))
      }
    }

    if (filtersActive.includes("exclude")) {
      if (excludeWords.current.value.length > 0) {
        kwsF = kwsF.filter(value => excludeWords.current.value.split(",").every(element => !value.kw.includes(element.trim())))
      } else {
        setFiltersActive(filtersActive.filter(item => item !== "exclude"))
      }
    }

    setKwsFinal(kwsF)
  }, [filtersActive])

  // remove fitler

  function removeFilter(filter){
    setShowPage(1)
    setFiltersActive(filtersActive.filter(item => item !== filter))
  }

  const saveToCSV = () => {
    let dataString = "Keyword,Search Volume,Trend,SERP Score,\n\n"+kwsFinal.map(u => `${u.kw},${u.vols.volume!==null?u.vols.volume:"N/A"},${u.vols.trend!==null?u.vols.trend[u.vols.trend.length - 1].searches - u.vols.volume > 0 ? "Up" : "Down" : "N/A"},${u.serp ? u.serp.score : "SERP Not Analysed"}`).join(',\n')
    const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'keyword_export.csv');
  }

  const popBack = "#fafafa"
  const textColor = '#4A5568'

  const { isOpen, onOpen, onClose } = useDisclosure()

  const [modalKeyword, setModalKeyword] = useState("")

  const averageDa = () => {
    let totalDa = 0; 
    kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.results.map((el, i, ar) => totalDa += parseInt(el.da)); 
    return String(parseInt(Math.floor(parseFloat(totalDa/kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.results.length))))
  }

  useEffect(() => {
    if (localStorage.getItem("keywordReport") && localStorage.getItem("wordsToFilter") && localStorage.getItem("reportSet")) {
      if (kwsBackup.length < 1 && JSON.parse(localStorage.getItem("keywordReport")).report.length > 0 || localStorage.getItem("reportLoaded") == true && JSON.parse(localStorage.getItem("keywordReport")).report.length > 0) {
        setKwsFinal(() => {
          let cur = localStorage.getItem("keywordReport")
          return [...JSON.parse(cur).report]
        })
        setKwsBackup(() => {
          let cur = localStorage.getItem("keywordReport")
          return [...JSON.parse(cur).report]
        })
        setLoadingWords(() => {
          let cur = localStorage.getItem("wordsToFilter")
          return [...JSON.parse(cur)]
        })
        setReportID(localStorage.getItem("reportID"))
        inputBox.current.value = localStorage.getItem("keyword")
        setSearchGeo(localStorage.getItem("geo").split(","))
        setTimeout(() => {  
          localStorage.removeItem("keyword")
          localStorage.removeItem("reportSet")
          localStorage.removeItem("wordsToFilter")
          localStorage.removeItem("geo")
        }, 1000);
      } else {
        localStorage.setItem("keywordReport", "")
        localStorage.setItem("wordsToFilter", "")
        localStorage.setItem("keyword", "")
      }
    } else {
      localStorage.setItem("keywordReport", "")
      localStorage.setItem("wordsToFilter", "")
      localStorage.setItem("keyword", "")
    }
  }, [])

  return (
    <div>
      <Head>   
        <title>Dashboard - NEA</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Header />
      <Flex as="main" mx="auto" mt={6} px={5}>
        <Modal motionPreset="slideInBottom" onClose={onClose} size={"full"} isOpen={isOpen}>
          <ModalOverlay />
          <ModalContent>
            <Header />
            {kwsFinal.filter(kws => kws.kw === modalKeyword)[0]&&kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp?<ModalHeader p={0} mb={3} mt={0} display={"flex"} flexDirection={{base:"column", md:"row"}} justifyContent={"space-between"}>
            <Flex px={12} pt={6} pb={6} backgroundColor={"#edf2f7"} width={"100%!important"} justifyContent={"space-between"} flexDirection={{base:"column",lg:"row"}}>
              <Flex flexDirection={"column"}>
              <Button variant={"outline"} mb={12} size={"sm"} onClick={() => {
                router.push({ query: {} }, undefined, { shallow: true });
                onClose()
              }} alignItems={"center"} backgroundColor={"#FFFFFF"} width={"fit-content"} leftIcon={<FaArrowLeft size={16} />}>&nbsp;Back</Button>
                <Flex alignItems={"center"}><Box><Flag country={searchGeo[0]} size={24} style={{ borderRadius:3, marginRight:"1rem" }} /></Box>
                  {modalKeyword}
                </Flex>
                <Flex mb={3} alignItems={"end"} flexWrap={"wrap"} mt={2}>
                  <Badge backgroundColor={"#FFFFFF"} fontSize={"sm"} display={"flex"} flexDirection={"row"} alignItems={"center"} mt={{ base:2,md:0 }} px={3} py={2} textTransform="normal" borderColor={"gray.300"} boxShadow={"none!important"} borderWidth={"1px"} color={kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.score > 3 ? "red" : kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.score > 1 ? "orange" : "green"} rounded="base"><Text as="span">Difficulty: {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.score > 3 ? "Hard" : kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.score > 1 ? "Medium" : "Easy"}</Text></Badge>
                  <Badge backgroundColor={"#FFFFFF"} borderColor={"gray.300"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} textTransform="normal" ml={2} px={3} py={2} mt={{ base:2,md:0 }} rounded="base">Avg Words: {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.avgWc}</Badge>
                  <Badge backgroundColor={"#FFFFFF"} borderColor={"gray.300"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} textTransform="normal" ml={2} px={3} py={2} mt={2} rounded="base">CPC: ${kwsFinal.filter(kws => kws.kw === modalKeyword)[0].vols.cpc || "0.00"}</Badge>
                  <Badge backgroundColor={"#FFFFFF"} borderColor={"gray.300"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} textTransform="normal" ml={2} px={3} py={2} mt={2} rounded="base">Avg DA: {averageDa()}</Badge>
                  <Link href={`https://${countryList.filter(el => el.cc == searchGeo[0] && el.langCode == searchGeo[1])[0].gdomain}/search?q=${modalKeyword}`} textDecoration="none" _hover={{ textDecoration:"none", opacity:0.8 }} target="_blank"><Badge backgroundColor={"#FFFFFF"} borderColor={"gray.300"} boxShadow={"none!important"} borderWidth={"1px"} color={"inherit"} variant={"outline"} fontSize={"sm"} textTransform="normal" display={"flex"} alignItems="center" ml={2} px={3} py={2} mt={2} rounded="base" as={"button"}>Open SERP <HiOutlineArrowTopRightOnSquare size={15} style={{ marginLeft:"0.25rem" }} /></Badge></Link>
                </Flex>
              </Flex>
              </Flex>
            </ModalHeader>:<Spinner size="md" />}
            <ModalBody>
                {kwsFinal.filter(kws => kws.kw === modalKeyword)[0]&&kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp?<Flex flexDirection={"column"} width={"100%"} py={2} px={3}>
                  <Flex flexWrap={"wrap"} mb={4}>
                    <TableContainer width={"100%"}>
                      <Table variant='simple'>
                        <Thead>
                          <Tr>
                            <Th textAlign={"center"} width={"fit-content"} fontFamily={"'Montserrat', sans-serif!important"}>Position</Th>
                            <Th fontFamily={"'Montserrat', sans-serif!important"}>Page</Th>
                            <Tooltip label='Domain authority as measured by MOZ.' placement='bottom'><Th fontFamily={"'Montserrat', sans-serif!important"}>DA</Th></Tooltip>
                            <Tooltip label='Total links to this domain.' placement='bottom'><Th fontFamily={"'Montserrat', sans-serif!important"}>Backlinks</Th></Tooltip>
                            <Th fontFamily={"'Montserrat', sans-serif!important"}>Words on Page</Th>
                            <Th fontFamily={"'Montserrat', sans-serif!important"}>Page Speed</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.results.map((el, i, ar) => <Tr key={i}>
                            <Td textAlign={"center"} width={"fit-content"}><Badge backgroundColor={"#FFFFFF"} borderColor={"gray.200"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} textTransform="normal" py={2} px={4} textAlign="center" rounded="base">{el.rank}</Badge></Td>
                            <Td>
                              <Flex maxWidth={750} alignItems={"start"} style={{textWrap:"wrap"}} flexWrap={"wrap"} flexDirection={"column"}>
                                  <Flex><Highlight textTransform="capitalize" query={userSites.includes((new URL(el.url)).hostname.replace('www.','')) ? el.title : []} styles={{ px: '2', py: '1px', rounded: 'full', bg: 'yellow.200' }}>{el.title}</Highlight></Flex>
                                  <Text fontSize={"smaller"} opacity={0.8} mt={2}>{el.desc || "No description found."}</Text>
                                  <Link mt={3} color={"blue.300"} href={el.url} target="_blank">{el.url.length > 70 ? el.url.substring(0, 70) + "..." : el.url.substring(0, 70)}</Link>
                              </Flex>
                            </Td>
                            <Td><Badge backgroundColor={"#FFFFFF"} borderColor={"gray.200"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} height={"fit-content"} mt={{ base:2,md:0 }} px={3} py={2} textTransform="normal" variant={"outline"} colorScheme={el.da > 60 ? "orange" : el.da > 40 ? "orange" : "green"} rounded="base">{el.da}</Badge></Td>
                            <Td><Badge backgroundColor={"#FFFFFF"} borderColor={"gray.200"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} height={"fit-content"} mt={{ base:2,md:0 }} px={3} py={2} textTransform="normal" variant={"outline"} rounded="base"><Tooltip label={parseInt(el.links).toLocaleString()} placement='bottom'>{Intl.NumberFormat('en', { notation: 'compact' }).format(el.links)}</Tooltip></Badge></Td>
                            <Td><Badge backgroundColor={"#FFFFFF"} borderColor={"gray.200"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} height={"fit-content"} mt={{ base:2,md:0 }} px={3} py={2} textTransform="normal" variant={"outline"} colorScheme={el.wc < kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.avgWc ? "orange" : "green"} rounded="base">{el.wc} Words</Badge></Td>
                            <Td><Badge backgroundColor={"#FFFFFF"} borderColor={"gray.200"} boxShadow={"none!important"} borderWidth={"1px"} fontSize={"sm"} height={"fit-content"} mt={{ base:2,md:0 }} px={3} py={2} textTransform="normal" variant={"outline"} colorScheme={parseFloat(el.timeFetch).toFixed(2) > 5.8 ? "red" : parseFloat(el.timeFetch).toFixed(2) > 3.4 ? "orange" : "green"} rounded="base">{parseFloat(el.timeFetch).toFixed(2)}s</Badge></Td>
                          </Tr>)}
                        </Tbody>
                      </Table>
                    </TableContainer>
                    </Flex>
                    <Flex maxWidth={1000} width={"100%"} flexDirection={{base:"column", md:"row"}} mx={"auto"} mt={6} justifyContent={"center"}>
                      <Card width={{base:"100%",md:"50%"}} overflow='hidden' background={"#FFFFFF"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline'>
                        <CardHeader fontSize={"lg"} mb={0} pb={0} fontWeight={600}>
                          People Also Ask
                        </CardHeader>
                        <CardBody>
                        {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.queries.length > 0 ? <OrderedList px={4}>
                           {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.queries.map((el, i, ar) => 
                             <ListItem key={i} className='boldList' mb={2}>
                               <Flex flexDirection={"row"}>
                                 <Flex mr={4} alignItems={"center"} textTransform="capitalize">{el}</Flex>
                                 {kwsBackup.some(kw => kw.kw == el.toLowerCase())?<Button width={"fit-content"} colorScheme="green" my={1} ml={0} py={0} leftIcon={<FaCheckCircle />} isDisabled variant={"outline"} size="sm" overflow='hidden' background={"#fafafa"}>Added</Button>:<Button overflow='hidden' background={"#fafafa"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline' width={"fit-content"} my={2} ml={0} py={0} leftIcon={<FaPlusCircle />} isLoading={paaLoading.includes(el)} onClick={() => addPAA(el)} size="sm">Add</Button>}
                               </Flex>
                             </ListItem>
                           )}
                          </OrderedList> : <Text fontWeight={600}>No PAAs in SERP</Text>}
                        </CardBody>
                      </Card>
                      <Card overflow='hidden' background={"#FFFFFF"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline' width={{base:"100%",md:"50%"}} mt={{base:4,md:0}} ml={{base:0,md:4}}>
                        <CardHeader fontSize={"lg"} mb={0} pb={0} fontWeight={600}>
                          Related Searches
                        </CardHeader>
                        <CardBody>
                        {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.rel.length > 0 ? <OrderedList px={4}>
                                 {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].serp.rel.map((el, i, ar) => 
                                   <ListItem key={i} className='boldList' mb={2}>
                                     <Flex flexDirection={"row"}>
                                       <Flex mr={4} alignItems={"center"} textTransform="capitalize">{el}</Flex>
                                       {kwsBackup.some(kw => kw.kw == el.toLowerCase())?<Button overflow='hidden' background={"#fafafa"} width={"fit-content"} colorScheme="green" my={1} ml={0} py={0} leftIcon={<FaCheckCircle />} isDisabled variant={"outline"} size="sm">Added</Button>:<Button overflow='hidden' background={"#fafafa"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline' width={"fit-content"} my={2} ml={0} py={0} leftIcon={<FaPlusCircle />} isLoading={paaLoading.includes(el)} onClick={() => addPAA(el)} size="sm">Add</Button>}
                                     </Flex>
                                   </ListItem>
                                 )}
                                </OrderedList> : <Text fontWeight={600}>No PAAs in SERP</Text>}
                        </CardBody>
                      </Card>
                    </Flex>
                  <Flex maxWidth={1000} mx={"auto"} width={{base:"100%",md:"75%"}} flexDirection={{base:"column", md:"row"}} mt={6} justifyContent={"center"}>
                  <Card mt={0} width={"100%"} overflow='hidden' background={"#FFFFFF"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline'>
                    <CardBody>
                      <Flex flexDirection={"column"} alignItems={"start"} height={"100%"}>
                        <Stat>
                          <StatLabel>Avg. Monthly Volume</StatLabel>
                          <StatNumber my={2} fontSize={"3xl"}>{parseInt(kwsFinal.filter(kws => kws.kw === modalKeyword)[0].vols.volume).toLocaleString()} Searches</StatNumber>
                          <StatHelpText>
                            {kwsFinal.filter(kws => kws.kw === modalKeyword)[0].vols.trend[0].month}&nbsp;to&nbsp;{kwsFinal.filter(kws => kws.kw === modalKeyword)[0].vols.trend[kwsFinal.filter(kws => kws.kw === modalKeyword)[0].vols.trend.length - 1].month}
                          </StatHelpText>
                        </Stat>
                        <div style={{ display: 'grid', gridTemplateColumns: 'max-content 700px', alignItems: 'center' }}>
                          <Label text="Searches" rotate/>
                          <div style={{ maxWidth: "100%", alignSelf: 'flex-start' }}>
                            <LineChart
                              width={500}
                              height={300}
                              data={kwsFinal.filter(kws => kws.kw === modalKeyword)[0].vols.trend.map((el, ind) => {return {x:ind, label:el.month, y:el.searches}})}
                              horizontalGuides={5}
                              verticalGuides={1}
                            />
                          </div>
                          <div/>
                          <Label text="Month"/>
                        </div>
                      </Flex>
                    </CardBody>
                  </Card>
                  </Flex>
                </Flex>:<Spinner size="md" />}
            </ModalBody>
            <Footer />
          </ModalContent>
        </Modal>
        <Flex flexDirection={"column"} w={"100%"} minHeight="100vh" mx="auto" maxWidth={"1200px"}>
        <Flex flexDirection={"column"}>
          <form onSubmit={(e) => {
              e.preventDefault()
              fetchKWs()
            }}>
              <Flex flexDirection={{base:"column",md:"row"}} alignItems={"center"} mt={6} mb={4}>
                <Input isRequired flex={{base:"inherit", md:1}} ref={inputBox} placeholder='Base Keyword' />
                <Box flex={{base:"inherit", md:0}} minWidth={"25%"} ml={{base:0,md:2}} mt={{base:2,md:0}}><ReactSel 
                  placeholder="Country/Language"
                  defaultValue={{ label: "United States / English", value: "US,en" }}
                  useBasicStyles
                  value={{ label: `${countryList.filter(el => el.cc == searchGeo[0] && el.langCode == searchGeo[1])[0].country} / ${countryList.filter(el => el.cc == searchGeo[0] && el.langCode == searchGeo[1])[0].lang}`, value: searchGeo.join(",") }}
                  onChange={(e) => setSearchGeo(e.value.split(","))}
                  options={countryList.map(el => ({label:`${el.country} / ${el.lang}`, value:`${el.cc},${el.langCode}`})
                  )}
                /></Box>
                {kwsLoading ? <IconButton px={4} onClick={async (e) => {e.preventDefault();fetchingReader.cancel();setKwsLoading(false)}} type="button" ml={{base:0,md:2}} my={{base:3,md:0}} width={{base:"100%",md:"fit-content"}} colorScheme="blue" icon={<MdClose size={15} />} fontSize="sm" />:<IconButton px={4} type={"submit"} ml={{base:0,md:2}} my={{base:3,md:0}} width={{base:"100%",md:"fit-content"}} colorScheme="blue" icon={<FaSearch size={15} />} fontSize="sm" />}
              </Flex>
            </form>
          {kwsBackup.length > 0 ? <Flex mb={6} flexDirection="column">
            <Flex mb={4}>
              {kwsChecked.length > 0 ? <Badge mr={2} px={2} py={1} rounded="md" fontSize={"xs"} textTransform="capitalize">{kwsChecked.length} Keywords Selected</Badge> : null}
              {filtersActive.length > 0? <Badge mr={2} px={2} py={1} rounded="md" fontSize={"xs"} textTransform="capitalize">{kwsFinal.length} Keyword{kwsFinal.length > 1 ? "s" : null} Found</Badge> : null}
              {wordsFiltered.length > 0 ? <Badge mr={2} px={2} py={1} rounded="md" fontSize={"xs"} textTransform="capitalize">{filteredByWords.length} Keywords Found</Badge> : null}
              <Badge px={2} py={1} rounded="md" fontSize={"xs"} textTransform="capitalize">{kwsBackup.length} Keywords Generated</Badge>
            </Flex>
            <Flex flexWrap="wrap">
              <Popover placement='bottom-start'>
                <PopoverTrigger>
                  <Button colorScheme={wordsFiltered.length > 0 ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<RxLetterCaseCapitalize />} size="sm" mr={3} variant={"outline"}>
                    Words
                  </Button>
                </PopoverTrigger>
                <PopoverContent minWidth={{ base:"300px", md:"500px", lg:"750px", xl:"1200px" }} backgroundColor={popBack}>
                  <PopoverArrow backgroundColor={popBack} />
                  <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Filter Words <Tooltip label='Filter keywords by selecting individual words they must contain - multiple can be selected.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></Tooltip></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                  <PopoverBody p={0}>
                    <Flex flexWrap={"wrap"} p={3} width="100%" backgroundColor={popBack} borderRadius={5}>
                    {showAllWords ? <>
                      {loadingWords.map((elem,index,array) => <Button key={index} onClick={wordsFiltered.includes(elem.kw) ? () => filterByWords(elem.kw, "remove") : () => filterByWords(elem.kw, "add")} p={0} mb={2} mx={1}><Badge opacity={wordsFiltered.includes(elem.kw) ? 0.8 : 1} variant={wordsFiltered.includes(elem.kw) ? "outline" : "subtle"} colorScheme={wordsFiltered.includes(elem.kw) ? "blue" : null} textTransform={"capitalize"} minHeight={"40px"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">{elem.kw}<Text as="span" fontWeight={"bold!important"} ml={1}>({elem.occ})</Text></Badge></Button>)}
                      <Button onClick={() => setShowAllWords(false)} p={0} mb={2} mx={1}><Badge textTransform={"capitalize"} minHeight={"40px"} fontWeight={"700!important"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">View Less...</Badge></Button>
                      </> 
                    : loadingWords.length > 0 ? <>{loadingWords.slice(0, 30).map((elem,index,array) => <Button key={index} onClick={wordsFiltered.includes(elem.kw) ? () => filterByWords(elem.kw, "remove") : () => filterByWords(elem.kw, "add")} p={0} mb={2} mx={1}><Badge opacity={wordsFiltered.includes(elem.kw) ? 0.8 : 1} variant={wordsFiltered.includes(elem.kw) ? "outline" : "subtle"} colorScheme={wordsFiltered.includes(elem.kw) ? "blue" : null} textTransform={"capitalize"} minHeight={"40px"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">{elem.kw}<Text as="span" fontWeight={"bold!important"} ml={1}>({elem.occ})</Text></Badge></Button>)}
                      <Button onClick={() => setShowAllWords(true)} p={0} mb={2} mx={1}><Badge textTransform={"capitalize"} minHeight={"40px"} fontWeight={"700!important"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">View More...</Badge></Button>
                      </> : <Spinner />
                    }
                    </Flex>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
                <Popover placement='bottom-start'>
                  <PopoverTrigger>
                    <Button colorScheme={filtersActive.includes("length") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaTape />} size="sm" mr={3} variant={"outline"}>
                    Length
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent backgroundColor={popBack}>
                    <PopoverArrow backgroundColor={popBack} />
                    <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Keyword Length <Tooltip label='Filter keywords by the number of words they contain.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></Tooltip></Flex><PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                    <PopoverBody p={4}>
                      <Flex flexDirection={"row"} width="100%">
                        <NumberInput mr={2}>
                          <NumberInputField ref={lengthMin} placeholder='Min' />
                        </NumberInput>
                        <NumberInput>
                          <NumberInputField ref={lengthMax} placeholder='Max' />
                        </NumberInput>
                      </Flex>
                      <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "length"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                        Filter 
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Popover placement='bottom-start'>
                  <PopoverTrigger>
                    <Button mb={{ base:2, md:0 }} leftIcon={<FaPlusSquare />} size="sm" mr={3} variant={"outline"}>
                      Include
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent backgroundColor={popBack}>
                    <PopoverArrow backgroundColor={popBack} />
                    <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Include Words/Phrases <Tooltip label='Filter keywords by individual words or phrases that they contain. For multiple, enter them comma seperated.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></Tooltip></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                    <PopoverBody p={4}>
                      <Flex flexDirection={"row"} width="100%">
                        <Input ref={includeWords} placeholder='Phrases (Comma Seperated)' />
                      </Flex>
                      <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "include"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                        Filter 
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Popover placement='bottom-start'>
                  <PopoverTrigger>
                    <Button mb={{ base:2, md:0 }} leftIcon={<FaMinusSquare />} size="sm" mr={3} variant={"outline"}>
                      Exclude
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent backgroundColor={popBack}>
                    <PopoverArrow backgroundColor={popBack} />
                    <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Exclude Words/Phrases <Tooltip label='Filter keywords by individual words or phrases that they do not contain. For multiple, enter them comma seperated.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></Tooltip></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                    <PopoverBody p={4}>
                      <Flex flexDirection={"row"} width="100%">
                        <Input ref={excludeWords} placeholder='Phrases (Comma Seperated)' />
                      </Flex>
                      <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "exclude"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                        Filter 
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Popover placement='bottom-start'>
                  <PopoverTrigger>
                    <Button colorScheme={filtersActive.includes("score") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaPercentage />} size="sm" mr={3} variant={"outline"}>
                      SERP Score
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent backgroundColor={popBack}>
                    <PopoverArrow backgroundColor={popBack} />
                    <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">SERP Score <Tooltip label='Filter keywords by their ranking difficulty score (1/Easy - 5/Difficult). You must analyse the SERP of the keyword to get its ranking score.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></Tooltip></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                    <PopoverBody p={4}>
                      <Flex flexDirection={"row"} width="100%">
                        <NumberInput mr={2}>
                          <NumberInputField ref={scoreMin} placeholder='Min' />
                        </NumberInput>
                        <NumberInput>
                          <NumberInputField ref={scoreMax} placeholder='Max' />
                        </NumberInput>
                      </Flex>
                      <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "score"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                        Filter 
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Popover placement='bottom-start'>
                  <PopoverTrigger>
                    <Button colorScheme={filtersActive.includes("volume") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaChartBar />} size="sm" mr={3} variant={"outline"}>
                      Volume
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent backgroundColor={popBack}>
                    <PopoverArrow backgroundColor={popBack} />
                    <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Keyword Volume <Tooltip label='Filter keywords by the search volume they recieve. You must analyse the SERP of the keyword to get its volume.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></Tooltip></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                    <PopoverBody p={4}>
                      <Flex flexDirection={"row"} width="100%">
                        <NumberInput mr={2}>
                          <NumberInputField ref={volumeMin} placeholder='Min' />
                        </NumberInput>
                        <NumberInput>
                          <NumberInputField ref={volumeMax} placeholder='Max' />
                        </NumberInput>
                      </Flex>
                      <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "volume"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                        Filter 
                      </Button>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Button onClick={() => filtersActive.includes("trending") ? removeFilter("trending") : setFiltersActive([...new Set([...filtersActive, "trending"])])} colorScheme={filtersActive.includes("trending") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<HiOutlineArrowTrendingUp />} size="sm" mr={3} variant={"outline"}>
                  Trending
                </Button>
                <Button onClick={() => filtersActive.includes("seasonal") ? removeFilter("seasonal") : setFiltersActive([...new Set([...filtersActive, "seasonal"])])} colorScheme={filtersActive.includes("seasonal") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaLeaf />} size="sm" mr={3} variant={"outline"}>
                  Seasonal
                </Button>
              </Flex></Flex> : null}
              {kwsFinal.length > 0 ? <Flex mb={3}>
                <Button width={"fit-content"} mr={2} size="sm" colorScheme={"blue"} variant="outline" rightIcon={<FaExternalLinkAlt />} onClick={saveToCSV}>Export to CSV</Button></Flex> : null}
              {kwsChecked.length > 0 ? <><Divider /><Flex my={4} flexWrap={"wrap"}>
                <Button isLoading={loadingKWs.length > 0} width={"fit-content"} size="sm" colorScheme={"blue"} variant="solid" leftIcon={<FaClipboard />} onClick={
                    () => {
                      const text = kwsChecked.join('\n');
                      navigator.clipboard.writeText(text)
                      toast({
                        title: `Keyword${kwsChecked.length > 1 ? "s" : ""} Copied`,
                        description: "The selected keywords have been copied to your clipboard.",
                        status: "success",
                        position: "top-end",
                        duration: 7500,
                        isClosable: true,
                      })
                    }}>Copy {kwsChecked.length} Keyword{kwsChecked.length > 1 ? "s" : null} to Clipboard</Button>
                </Flex></> : null}
            <TableContainer maxW="100vw" overflow="auto">
            <Table overflow="auto" style={{ tableLayout:"auto" }} variant='simple'>
              <TableCaption fontFamily={"'Montserrat', sans-serif!important"} mb={15} pt={4}>{kwsLoading ? <Spinner /> : filteredByWords.length > 0 ? <Flex alignItems={"center"} justifyContent={"center"} flexDirection={"column"}>
                <Select maxWidth={250} mb={5} onChange={(e) => setPageConstant(String(e.target.value).length > 0 ? e.target.value : 50)} placeholder='Keywords per page'>
                  <option value='50'>50</option>
                  <option value='100'>100</option>
                  <option value='200'>200</option>
                  <option value='500'>500</option>
                </Select>
                <Stack direction={"row"} spacing={3} alignItems={"center"} justifyContent={"center"}><IconButton isDisabled={showPage == 1} onClick={() => setShowPage(showPage - 1)} icon={<FaChevronLeft />} />{[...Array(Math.ceil(filteredByWords.length / pageConstant)).keys()].map((val) => <Button key={val+1} isDisabled={val+1 == showPage ? true : false} display={{ base:val+1 == showPage ? "flex" : "none", md:"flex" }} onClick={() => setShowPage(val + 1)}>{val + 1}</Button>)}<IconButton isDisabled={showPage == Math.ceil(filteredByWords.length / pageConstant)} onClick={() => setShowPage(showPage + 1)} icon={<FaChevronRight />} /></Stack>
              </Flex> 
              
              : kwsFinal.length > 0 ? 
              <Flex alignItems={"center"} justifyContent={"center"} flexDirection={"column"}>
                <Select maxWidth={250} mb={5} onChange={(e) => setPageConstant(String(e.target.value).length > 0 ? e.target.value : 50)} placeholder='Keywords per page'>
                  <option value='50'>50</option>
                  <option value='100'>100</option>
                  <option value='200'>200</option>
                  <option value='500'>500</option>
                </Select>
                <Stack direction={"row"} spacing={3} alignItems={"center"} justifyContent={"center"}><IconButton isDisabled={showPage == 1} onClick={() => setShowPage(showPage - 1)} icon={<FaChevronLeft />} />{[...Array(Math.ceil(kwsFinal.length / pageConstant)).keys()].map((val) => <Button key={val+1} isDisabled={val+1 == showPage ? true : false} display={{ base:val+1 == showPage ? "flex" : "none", md:"flex" }} onClick={() => setShowPage(val + 1)}>{val + 1}</Button>)}<IconButton isDisabled={showPage == Math.ceil(kwsFinal.length / pageConstant)} onClick={() => setShowPage(showPage + 1)} icon={<FaChevronRight />} />
                </Stack></Flex>
                 : "Fetched Keywords"}</TableCaption>
              <Thead overflow="auto">
                <Tr overflow="auto">
                  <Th width={'fit-content'} fontFamily={"'Montserrat', sans-serif!important"}><Checkbox isDisabled={!(kwsFinal.length > 0)} onChange={e => e.target.checked ? setKwsChecked(filteredByWords.length>0?[...filteredByWords.slice(showPage * 50 - 50, showPage * 50).filter(el => el.serp == null).map(el => el.kw)]:[...kwsFinal.slice(showPage * 50 - 50, showPage * 50).filter(el => el.serp == null).map(el => el.kw)]) : setKwsChecked([])} /></Th>
                  <Th textAlign={"start!important"} fontFamily={"'Montserrat', sans-serif!important"} width={"35%"}>Keyword</Th>
                  <Th textAlign={"start!important"} fontFamily={"'Montserrat', sans-serif!important"} width={"20%"}>Volume</Th>
                  <Th textAlign={"start!important"} fontFamily={"'Montserrat', sans-serif!important"} width={"20%"}>CPC</Th>
                  <Th textAlign={"start!important"} fontFamily={"'Montserrat', sans-serif!important"} width={"25%"}>Trend</Th>
                  <Th textAlign={"center!important"} fontFamily={"'Montserrat', sans-serif!important"} width={"30%"}>Ranking <br />Difficulty</Th>
                </Tr>
              </Thead>
              <Tbody overflow="auto">
                {wordsFiltered.length < 1 ? 
                
                kwsFinal.slice(showPage * pageConstant - pageConstant, showPage * pageConstant).map((elem, index, arr) => <Tr key={index}><CheckboxGroup value={[...kwsChecked]}><><Td py={3}>
                  <Checkbox isChecked={false} onChange={(e) => e.target.checked === true ? setKwsChecked(kws => [elem.kw, ...kws]) : setKwsChecked(kws => [...kws.filter(key => key !== elem.kw)])} value={String(elem.kw)} />
                  </Td><Td py={3} style={{textWrap:"wrap"}}><Flex alignItems="center">{elem.serp ? <Link color={"blue.300"} textDecoration={"none"} onClick={() => {
                    setModalKeyword(elem.kw)
                    router.push({ query: { kid:elem.kw } }, undefined, { shallow: true });
                    onOpen()
                  }} _hover={{textDecoration:"none!important",opacity:0.8}}>{elem.kw}</Link> : elem.kw}
                  <Tooltip label='Open in Google.' placement='bottom'><IconButton background={"none"} p={2} ml={2} height={"fit-content"} minWidth={"fit-content"} onClick={() => window.open(`https://${countryList.filter(el => el.cc == searchGeo[0] && el.langCode == searchGeo[1])[0].gdomain}/search?q=${elem.kw}`, "_blank")} icon={<FaExternalLinkAlt />} /></Tooltip>
                  <Tooltip label='Copy keyword to clipboard.' placement='bottom'><IconButton background={"none"} p={2} ml={2} height={"fit-content"} minWidth={"fit-content"} onClick={() => {navigator.clipboard.writeText(elem.kw);toast({title:"📋 Keyword Copied",duration:3000,status:"success",position:"top-right"})}} icon={<BiCopy />} /></Tooltip>
                  {elem.serp ? elem.serp.results.some(e => userSites.includes((new URL(e.url)).hostname.replace('www.',''))) ? <Badge ml={4} colorScheme='blue' textTransform="normal" my={{ base:2, md:0 }} alignItems="center" display={"flex"} px={2} rounded="base" height={18}>Ranking</Badge> : null : null}
                  </Flex></Td><Td py={3}><Tooltip label={elem.vols.volume !== null ? "Monthly search volume for this keyword - use this metric to determine the traffic potential for this keyword." : "Analyze the SERP to get the search volume for this keyword."} placement="bottom">{elem.vols.volume !== null ? parseInt(elem.vols.volume).toLocaleString() : "-"}</Tooltip></Td><Td py={3}><Tooltip label={elem.vols.cpc !== null ? "Average CPC for this keyword - use this metric to determine how valuable it is to advertisers." : "Analyze the SERP to get the CPC of this keyword."} placement='bottom'>{elem.vols.cpc !== null ? "$".concat(String(parseInt(elem.vols.cpc).toFixed(2))) : "-"}</Tooltip></Td>
                <Td><Tooltip label={elem.vols.volume !== null ? "Monthly search volume trend for this keyword - use this metric to determine if this keyword is gaining or losing popularity." : "Analyze the SERP to get the search volume trend for this keyword."} placement="bottom">{elem.vols.trend != null ? 
                <Flex>
                  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 150px', alignItems: 'center' }}>
                    <Label text="" rotate/>
                    <div style={{ maxWidth: "100%", alignSelf: 'flex-start' }}>
                      <LineChart
                        preview
                        width={150}
                        height={100}
                        data={elem.vols.trend.map((el, ind) => {return {x:ind, label:el.month, y:el.searches}})}
                        horizontalGuides={5}
                        verticalGuides={1}
                      />
                    </div>
                  </div>
                </Flex>:"-"}</Tooltip></Td>
              <Td py={3} textAlign={"center"}>{elem.serp?<Flex flexDirection="column" alignItems="center">
              <Badge variant={"outline"} alignItems="center" px={2} display={"flex"} colorScheme={elem.serp.score > 3 ? "red" : elem.serp.score > 1 ? "orange" : "green"} py={2} textAlign="center" rounded="base" maxHeight={"40px!important"}>{elem.serp.score > 3 ? "Hard" : elem.serp.score > 1 ? "Medium" : "Easy"} - {elem.serp.score}</Badge>
                <Button backgroundColor={"#ffffff"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline' mt={2} onClick={() => {
                    setModalKeyword(elem.kw)
                    router.push({ query: { kid:elem.kw } }, undefined, { shallow: true });
                    onOpen()
                  }} isLoading={loadingKWs.includes(elem.kw) ? true : false} fontSize={"sm"} py={1} rightIcon={<FaArrowAltCircleRight />} _hover={{opacity:0.8}} height={"fit-content"} mx="auto" cursor={"pointer"}><span>Open<br/>Report</span></Button></Flex>: <Tooltip label='Analyze SERP and get ranking difficulty.' placement='bottom'><Button cursor={"pointer"} backgroundColor={"#ffffff"} color={"inherit"} borderColor={"gray.200"} pointerEvents={"auto"} colorScheme={"grey"} variant='outline' onClick={() => fetchSERP(elem.kw)} isLoading={loadingKWs.includes(elem.kw) ? true : false} padding={"0!important"} height={"fit-content"}>
                  <Badge minHeight={"40px"} justifyContent="center" alignItems={"center"} display={"flex"} p={1} textAlign="center" cursor={"pointer"} width={"100%"} rounded="base" _hover={{ opacity:0.85 }} pointerEvents={"auto"}><HiOutlineMagnifyingGlassPlus style={{cursor:"pointer"}} size={16} /></Badge></Button></Tooltip>}</Td> </></CheckboxGroup></Tr>)

                :

                filteredByWords.slice(showPage * pageConstant - pageConstant, showPage * pageConstant).map((elem, index, arr) =><Tr key={index}><CheckboxGroup value={[...kwsChecked]}><><Td py={3}>
                <Checkbox isChecked={false} onChange={(e) => e.target.checked === true ? setKwsChecked(kws => [elem.kw, ...kws]) : setKwsChecked(kws => [...kws.filter(key => key !== elem.kw)])} value={String(elem.kw)} />
                  </Td><Td py={3} style={{textWrap:"wrap"}}><Flex alignItems="center">{elem.serp ? <Link color={"blue.300"} textDecoration={"none"} onClick={() => {
                    setModalKeyword(elem.kw)
                    router.push({ query: { kid:elem.kw } }, undefined, { shallow: true });
                    onOpen()
                  }} _hover={{textDecoration:"none!important",opacity:0.8}}>{elem.kw}</Link> : elem.kw}
                  <Tooltip label='Open in Google.' placement='bottom'><IconButton background={"none"} p={2} ml={2} height={"fit-content"} minWidth={"fit-content"} onClick={() => window.open(`https://${countryList.filter(el => el.cc == searchGeo[0] && el.langCode == searchGeo[1])[0].gdomain}/search?q=${elem.kw}`, "_blank")} icon={<FaExternalLinkAlt />} /></Tooltip>
                  <Tooltip label='Copy keyword to clipboard.' placement='bottom'><IconButton background={"none"} p={2} ml={2} height={"fit-content"} minWidth={"fit-content"} onClick={() => {navigator.clipboard.writeText(elem.kw);toast({title:"📋 Keyword Copied",duration:3000,status:"success",position:"top-right"})}} icon={<BiCopy />} /></Tooltip>
                  {elem.serp ? elem.serp.results.some(e => userSites.includes((new URL(e.url)).hostname.replace('www.',''))) ? <Badge ml={4} colorScheme='blue' textTransform="normal" my={{ base:2, md:0 }} alignItems="center" display={"flex"} px={2} rounded="base" height={18}>Ranking</Badge> : null : null}
                  </Flex></Td><Td py={3}><Tooltip label={elem.vols.volume !== null ? "Monthly search volume for this keyword - use this metric to determine the traffic potential for this keyword." : "Analyze the SERP to get the search volume for this keyword."} placement="bottom">{elem.vols.volume !== null ? parseInt(elem.vols.volume).toLocaleString() : "-"}</Tooltip></Td><Td py={3}><Tooltip label={elem.vols.cpc !== null ? "Average CPC for this keyword - use this metric to determine how valuable it is to advertisers." : "Analyze the SERP to get the CPC of this keyword."} placement='bottom'>{elem.vols.cpc !== null ? "$".concat(String(parseInt(elem.vols.cpc).toFixed(2))) : "-"}</Tooltip></Td>
                <Td><Tooltip label={elem.vols.volume !== null ? "Monthly search volume trend for this keyword - use this metric to determine if this keyword is gaining or losing popularity." : "Analyze the SERP to get the search volume trend for this keyword."} placement="bottom">{elem.vols.trend != null ? 
                <Flex>
                  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 150px', alignItems: 'center' }}>
                    <Label text="" rotate/>
                    <div style={{ maxWidth: "100%", alignSelf: 'flex-start' }}>
                      <LineChart
                        preview
                        width={150}
                        height={100}
                        data={elem.vols.trend.map((el, ind) => {return {x:ind, label:el.month, y:el.searches}})}
                        horizontalGuides={5}
                        verticalGuides={1}
                      />
                    </div>
                  </div>
                </Flex>:"-"}</Tooltip></Td>
              <Td py={3} textAlign={"center"}>{elem.serp?<Flex flexDirection="column" alignItems="center">
              <Badge variant={"outline"} alignItems="center" px={2} display={"flex"} colorScheme={elem.serp.score > 3 ? "red" : elem.serp.score > 1 ? "orange" : "green"} py={2} textAlign="center" rounded="base" maxHeight={"40px!important"}>{elem.serp.score > 3 ? "Hard" : elem.serp.score > 1 ? "Medium" : "Easy"} - {elem.serp.score}</Badge>
                <Button backgroundColor={"#ffffff"} color={"inherit"} borderColor={"gray.200"} colorScheme={"grey"} variant='outline' mt={2} onClick={() => {
                    setModalKeyword(elem.kw)
                    router.push({ query: { kid:elem.kw } }, undefined, { shallow: true });
                    onOpen()
                  }} isLoading={loadingKWs.includes(elem.kw) ? true : false} fontSize={"sm"} py={1} rightIcon={<FaArrowAltCircleRight />} _hover={{opacity:0.8}} height={"fit-content"} mx="auto" cursor={"pointer"}><span>Open<br/>Report</span></Button></Flex>: <Tooltip label='Analyze SERP and get ranking difficulty.' placement='bottom'><Button cursor={"pointer"} backgroundColor={"#ffffff"} color={"inherit"} borderColor={"gray.200"} pointerEvents={"auto"} colorScheme={"grey"} variant='outline' onClick={() => fetchSERP(elem.kw)} isLoading={loadingKWs.includes(elem.kw) ? true : false} padding={"0!important"} height={"fit-content"}>
                  <Badge minHeight={"40px"} justifyContent="center" alignItems={"center"} display={"flex"} p={1} textAlign="center" cursor={"pointer"} width={"100%"} rounded="base" _hover={{ opacity:0.85 }} pointerEvents={"auto"}><HiOutlineMagnifyingGlassPlus style={{cursor:"pointer"}} size={16} /></Badge></Button></Tooltip>}</Td> </></CheckboxGroup></Tr>)}
              </Tbody>
              </Table>
            </TableContainer>
            {kwsBackup.length < 1 ? <Flex mt={3} flexDirection={"column"}>
              <Card backgroundColor={popBack}>
                <CardHeader pb={0}>
                  <Heading color={textColor} size='sm' fontFamily={"'Montserrat', sans-serif!important"} alignItems="center" display="flex"><FaInfoCircle />&nbsp;&nbsp;Use Long, Detailed Base Keywords</Heading>
                </CardHeader>
                <CardBody pt={4}>
                  <Text color={textColor}>The longer and more specific your base keywords are, the more low competition long-tail keywords it can generate.</Text>
                </CardBody>
              </Card>
              <Card backgroundColor={popBack} mt={4}>
                <CardHeader pb={0}>
                  <Heading color={textColor} size='sm' fontFamily={"'Montserrat', sans-serif!important"} alignItems="center" display="flex"><FaInfoCircle />&nbsp;&nbsp;Utilize Filters</Heading>
                </CardHeader>
                <CardBody pt={4}>
                  <Text color={textColor}>Use filters to find the most underserved and relevant keywords from the list of all the generated keywords.</Text>
                </CardBody>
              </Card>
              <Card backgroundColor={popBack} mt={4}>
                <CardHeader pb={0}>
                  <Heading color={textColor} size='sm' fontFamily={"'Montserrat', sans-serif!important"} alignItems="center" display="flex"><FaInfoCircle />&nbsp;&nbsp;Export Your Reports</Heading>
                </CardHeader>
                <CardBody pt={4}>
                  <Text color={textColor}>Export your reports to CSV files to sort and filter data in more detail, by column.</Text>
                </CardBody>
              </Card>
            </Flex> : null}
          </Flex>
          </Flex>
      </Flex>
      <Footer />
    </div>
  )
}
