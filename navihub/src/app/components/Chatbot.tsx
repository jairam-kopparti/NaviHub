'use client';
import {useState, useEffect, useCallback} from 'react';
import {motion} from 'framer-motion';
import {
  BotMessageSquare,
  Newspaper,
  Search,
  Locate,
  CircleQuestionMark,
  LucideProps,
  SendHorizontal,
  X,
  Loader2
} from 'lucide-react'
import type { NewsArticle } from "../lib/types";


interface ChatbotOptionProps{
  icon:React.ElementType<LucideProps>;
  content:string;
  action: () => void;
}
interface LoaderProps{
  id:string;
}
function Loader({id}:LoaderProps){
  return(
    <motion.div id={id}
      animate={{rotate:360}}
      transition={{duration:1, repeat:Infinity, ease:"linear"}}>
        <Loader2/>
    </motion.div>
  )
}
function ChatbotOption({icon: Icon, content, action}: ChatbotOptionProps){
  return(
    <button onMouseEnter={()=> 
      {
        const prelimMessage = document.getElementById("to-send")
        if(prelimMessage){
          prelimMessage.textContent=content || "Questions? I can help!"
        }
      }
    } 
    onMouseLeave={()=> 
      {
        const prelimMessage = document.getElementById("to-send")
        if(prelimMessage){
          prelimMessage.textContent="Questions? I can help!"
        }
      }
    }
    onClick={action}
    className='inline-flex group shadow-sm whitespace-nowrap flex-shrink-0 w-auto relative cursor-pointer bg-[#404E3B] p-3 m-2 hover:flex1 hover:bg-[#7B9669] transition duration-300'>
      <span className='grow inline-flex'>
        <Icon className='block'/>
      </span>
    </button>
  )
}

export default function Chatbot() {
  const [isOpen, setChatbotState] = useState(false)
  const [isClicked, setClicked] = useState(false)
  const [newsClicked, setNewsClicked] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const changePanelState = ()=> {
    setChatbotState(!isOpen)
  }
  const changeClickedState = () => {
    setClicked(true)
  }
  const changedNewsClickedState = () => {
    setNewsClicked(true)
  }
  const fetchMessage = useCallback(async (message:string)=>{
      setClicked(false)
      setLoading(true)
      try{
        const params = new URLSearchParams({
            message:message
          })
          const url = `/api/chatbot?${params.toString()}`
          const res = await fetch(url)
          const data = await res.json()
          console.log(data)
        }
        catch(error){
          if(error instanceof Error){
            console.error("Invalid JSON provided:", error.message);
          }
        }
        finally{
          setLoading(false)
}}, [])
  useEffect(()=>{
    const messageInput = document.getElementById("message-input") as HTMLInputElement
    if(isClicked){
      fetchMessage(messageInput.value)
    }
  }, [fetchMessage, isClicked])
    // ── Fetch articles from /api/news ─────────────────────────
    const fetchArticles = useCallback(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?`);
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        console.log(data)
        let weeklyNews=""
        data.articles.forEach((article:NewsArticle) => {
          const today = new Date()
          const articleDate=new Date(article.published_at)
          const currentDate=Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
          const pastDate=Date.UTC(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate())
          const msDifference = currentDate - pastDate;
          const daysDifference = Math.floor(msDifference / (1000 * 60 * 60 * 24));
          if(daysDifference < 8){
            weeklyNews += (article.content)
          }
        })
        if(weeklyNews){
          fetchMessage(`Summarize ${weeklyNews}. Include important dates and highlights.`)
        } else{
          console.log("I'm sorry. Looks like there is no recent news to summarize.")
        }
      } catch (err) {
        console.error("News fetch error:", err);
      } finally {
        setLoading(false);
      }
      setNewsClicked(false)
    }, []);
  
    useEffect(() => {
    if(newsClicked){
      fetchArticles()
    }
    }, [fetchArticles, newsClicked]);

    useEffect(() => {
      const sendButton = document.getElementById("send-btn") as HTMLInputElement
      sendButton.disabled = isLoading
    }, [isLoading]);
    
    useEffect(() => {
      const sendIcon = document.getElementById("send-icon")
      const loadIcon = document.getElementById("load-icon")
      if(loadIcon && sendIcon){
      if(isLoading){
        loadIcon.style.display = "block"
        sendIcon.style.display = "none"
      } else{
        loadIcon.style.display = "none"
        sendIcon.style.display = "block"
      }
    }
    }, [isLoading]);
  return (
    <div>
      <button
      onClick={changePanelState}
      className={`${isOpen ? "hidden" : "block"} width-200 height-200 bg-[#997E67] p-3 chatbutton fixed bottom-5 right-5 border border-[#000000] border-3 z-50 cursor-pointer hover:b-4 hover:shadow-xl/57 transition duration-200`}>
        <BotMessageSquare size={48} />
      </button>
      <div className={`${isOpen ? "block" : "hidden"} chatbot fixed bottom-5 right-5 z-50 hover:cursor-pointer rounded transition duration-200`}>
        <div className='rounded-t-2xl px-5 py-4 border-b border-(--border) bg-[#404E3B] flex items-center justify-between'>
          <p className='inline-block float-left text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-(--font-heading)'>Chatbot</p> 
          <X className={'cursor-pointer float-right'} onClick={changePanelState}/>
        </div>
        <div className='border border-[#7B9669] bg-[#BAC8B1] p-5 rounded-b-2xl flex flex-col justify-center text-center'>
          <p className='text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-(--font-heading) block cursor-default text-[#123456]' id="to-send">Questions? I can help!</p>
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
         className='flex-row justify-between w-full'>
            <ChatbotOption icon={Search} content="Browse Resources by Category" action={()=>{console.log("Run")}}/>
            <ChatbotOption icon={Locate} content="Show Events in my Borough" action={()=>{}}/>
            <ChatbotOption icon={Newspaper} content="Summarize this Week's News" action={
            changedNewsClickedState}/>
            <ChatbotOption icon={CircleQuestionMark} content="Help me get Started" action={()=>{}}/>
          </motion.div>
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-center relative w-full">
            <input id="message-input" type='text' placeholder='Ask another question' className='w-full text-[#404E3B] bg-[#e6e6e6] rounded-l-xl sm:rounded-l-2xl w-[80%] p-4 sm:p-6 py-4 sm:py-5 placeholder:text-[#BAC8B1]'></input>
            <button id="send-btn"
            onClick={changeClickedState}
            className='!rounded-l-none !rounded-r-xl !sm:rounded-r-2xl bg-[#404E3B] text-[#E6E6E6] px-3 sm:px-4 py-4 sm:py-5 h-[%100] justify-center hover:cursor-pointer hover:bg-[#7B9669] transition duration-200'>
              <SendHorizontal id="send-icon"/>
              <Loader id="load-icon"/>
            </button>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}