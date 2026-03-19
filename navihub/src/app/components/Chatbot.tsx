'use client';
import {useState, useEffect, useCallback, createElement, ReactElement} from 'react';
import {motion} from 'framer-motion'
;import { supabase } from "../lib/supabaseClient";
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

enum From{
  You,
  Chat
}
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
  const [isScanning, setScanning] = useState(false)
  const [messages, setMessages] = useState<ReactElement[]>([])
  const changePanelState = ()=> {
    setChatbotState(!isOpen)
  }  
  const changeScanningState = ()=> {
    setScanning(true)
  }
  const changeClickedState = () => {
    setClicked(true)
  }
  const changedNewsClickedState = () => {
    setNewsClicked(true)
  }    
  const addMessage = (content:string, from:From) => {
    if(typeof content == "string"){
    const contents = content.split("\\n")
    const cleanedContents: any[] = []
    if(contents.length > 1){
      contents.forEach((item)=>{
        cleanedContents.push(item)
        cleanedContents.push(createElement("br", {key:`${Date.now() + Math.random()}`}))
      })
    }
    else{
      cleanedContents.push(contents[0])
    }
    const message = createElement(
          'p',
          {key:`${Date.now() + Math.random()}`, className: `bg-[#7B9669] p-2 rounded-2xl m-1 ${from==From.You ? "text-right" : "text-left"}`, style:{whiteSpace:"pre-line"}},
          cleanedContents
        )
        setMessages(messages => [...messages, message])
      }
    else {
        const message = createElement(
          'p',
          {key:`${Date.now() + Math.random()}`, className: `bg-[#7B9669] p-2 rounded-2xl m-1 ${from==From.You ? "text-right" : "text-left"}`, style:{whiteSpace:"pre-line"}},
          `There was an error try to get your response. Please try again.`
        )
        setMessages(messages => [...messages, message])
      }
    }
  const fetchMessage = useCallback(async (message:string, messageDisplay:string, openEnded:boolean)=>{
    const url ="/api/moderate"
    const res =  await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageDisplay }),
      });
    const data = await res.json()
    if(data.safe){
    addMessage(messageDisplay, From.You)
      setClicked(false)
      setLoading(true)
      let toSend = ""
      if(openEnded){
        const articles = JSON.stringify(await fetchArticles())
        const resources = JSON.stringify(await fetchResources())
        const events = JSON.stringify(await fetchEvents())
        toSend = `You are a helpful community hub assistant for the citizens of New York City. These are the resources on our community hub: ${resources}. These are the news articles on our community hub: ${articles}. These are the events the user sees on our community hub: ${events}. This is the user's question: ${message}. You may use anything else you need from google to answer the user's questions. Do not lie or hallucinate. If the question is irrelevant for the community hub, try as much as possible to steer the conversation back in the direction of the hub.`;
      } else{
        toSend=message
      }
      try{
          const url = `/api/chatbot`
          const res = await fetch(url,{
            method:"POST",
            headers:{
              "Content-Type":"application/json"
            },
            body: JSON.stringify( toSend )
          })
          const data = await res.json()
          addMessage(data, From.Chat)
        }
        catch(error){
          if(error instanceof Error){
            console.error("Invalid JSON provided:", error.message);
          }
        }
        finally{
          setLoading(false)
}
} else{
  addMessage("...", From.You)
  addMessage("I'm sorry. Your message included inappropriate language. Please word your question with more appropriate language. Thank you!", From.Chat)
}}, [])
  useEffect(()=>{
    const messageInput = document.getElementById("message-input") as HTMLInputElement
    if(isClicked){
      fetchMessage(messageInput.value, messageInput.value, true)
    }
  }, [fetchMessage, isClicked])
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:"50"
    })
    const url = `/api/news?${params.toString()}`
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();
    return data.articles;
  }, []);
const fetchResources = async () => {
      try {
        let query = supabase.from("resources").select("*");

        const { data, error } = await query;
        
        if (error) {
          console.error("Error refetching resources:", error);
          return;
        }
        
        if (data) {
          // Fetch reviews to calculate average ratings
          const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("resource_id, rating");

          if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
          }

          // Calculate average rating for each resource
          const ratingMap: { [key: string]: { total: number; count: number } } = {};
          if (reviews) {
            reviews.forEach((review:any) => {
              if (!ratingMap[review.resource_id]) {
                ratingMap[review.resource_id] = { total: 0, count: 0 };
              }
              ratingMap[review.resource_id].total += review.rating;
              ratingMap[review.resource_id].count += 1;
            });
          }
          return data
        }
      } catch (err) {
        console.error("Unexpected error refetching resources:", err);
      }
    };
    const fetchEvents = async () => {
      let query = supabase.from("events").select("*").order("event_date", { ascending: true });
      const { data } = await query;
      return data;
    };
const sortArticles = useCallback(async () => {
  const data = await fetchArticles()
  let weeklyNews=""
  data.forEach((article:NewsArticle) => {
      const today = new Date()
      const articleDate=new Date(article.published_at)
      const currentDate=Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const pastDate=Date.UTC(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate())
    const msDifference = currentDate - pastDate;
    const daysDifference = Math.floor(msDifference / (1000 * 60 * 60 * 24));
    if(daysDifference < 25){ //TODO: change to 8 later, but not really any recent news to test feature.
        weeklyNews += (article.content)
      }
        })
        if(weeklyNews){
          fetchMessage(`Summarize ${weeklyNews}. Include important dates and highlights. Categorize them. Ex: Crime: {text here}, Sports: {text here}, etc.`, "Summarize this week's news.", false)
        } else{
          addMessage("I'm sorry. Looks like there is no recent news to summarize.", From.Chat)
        }
      setNewsClicked(false)
}, [])
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
    useEffect(() => {
    if(newsClicked){
      sortArticles()
    }
    }, [sortArticles, newsClicked]);
    const fetchPageInfo = () => {
      const url = window.location.href
      let text=""
      if(url.includes("resources")){
        text += "This is the resources page, where you can browse, filter, suggest, and locate resources on a map. Click a resource card to learn more about any specific resource."
      } else if(url.includes("news")){
        text += "This is the news page, where you can browse and filter through New York City's news. Click a news card to read the full news article."
      } else if(url.includes("events")){
        text += "This is the events page, where you can see everything that's going on in New York City. Click an event card to learn more about and register for any event."
      } else if(url.includes("NaviLink")){
        text += "This is navihub's forumn, where you can talk about anything that matters to you in the community."
      } else if(url.includes("about")){
        text += "This pages tells you about navihub and its goals. It also answers questions asked by many users."
      } else if(url.includes("about")){
        text += "This page tells you about navihub and its goals. It also answers questions asked by many users."
      } else if(url.includes("references")){
        text += "This page includes a site map telling you where all of the core features are and all of our website's dependencies."
      } else if(url.includes("signin")){
        text += "This page lets you sign in to an account if you already have one. Don't have account yet? Just click the sign up link underneath the password input."
      } else if(url.includes("signup")){
        text += "This page lets you create a new account if you don't already have one. Once you click sign up, head to your email address to confirm your account. Already have an account? Just click the sign in link underneath the password input."
      } else{
        text += "Welcome to Navihub! On our homepage, you can see our most popular resources, what people have to say about our community, and what features we have on our site."
      }
      addMessage("Tell me about this page.", From.You)
      addMessage(text, From.Chat)
      setScanning(false)
    }
    
    useEffect(() => {
    if(isScanning){
      fetchPageInfo()
    }
    }, [fetchPageInfo, newsClicked]);

  return (
    <div className='!w-[10%]'>
      <button
      onClick={changePanelState}
      className={`${isOpen ? "hidden" : "block"} bg-[#997E67] p-3 chatbutton fixed bottom-5 right-5 border border-[#000000] border-3 z-50 cursor-pointer hover:b-4 hover:shadow-xl/57 transition duration-200`}>
        <BotMessageSquare size={48} />
      </button>
      <div className={`${isOpen ? "block" : "hidden"} chatbot fixed bottom-5 right-5 z-50 hover:cursor-pointer rounded transition duration-200`}>
        <div className='rounded-t-2xl px-5 py-4 border-b border-(--border) bg-[#404E3B] flex items-center justify-between'>
          <p className='inline-block float-left text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-(--font-heading)'>Chatbot</p> 
          <X className={'cursor-pointer float-right'} onClick={changePanelState}/>
        </div>
        <div className='border border-[#7B9669] bg-[#BAC8B1] p-5 rounded-b-2xl flex flex-col justify-center text-center'>
          <div id="message-div" className='overflow-y-auto'>
            {messages}
          </div>
          <p className='text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-(--font-heading) block cursor-default text-[#123456]' id="to-send">Questions? I can help!</p>
          <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
         className='flex-row justify-between w-full'>
            <ChatbotOption icon={Newspaper} content="Summarize this Week's News" action={
            changedNewsClickedState}/>
            <ChatbotOption icon={CircleQuestionMark} content="Tell me About this page" action={changeScanningState}/>
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