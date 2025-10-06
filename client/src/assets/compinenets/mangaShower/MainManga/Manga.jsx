import { useState, useEffect, useLayoutEffect, useContext, createContext } from "react";
import axios from 'axios';
import { MangaContainer } from "./MangaContainer";
// import { useGSAP } from "@gsap/react";

export function Manga() {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);


  // useLayoutEffect(() => {
  //   ScrollSmoother.create({
  //     smooth: 1, // how long (in seconds) it takes to "catch up" to the native scroll position
  //     smoothTouch: 0.1
  //   });
  // }, []);


  return(
    // <div id="smooth-wrapper">
    //   <div id="smooth-content"> 
        <MangaContainer></MangaContainer>
    //   </div>
    // </div>
  )
}