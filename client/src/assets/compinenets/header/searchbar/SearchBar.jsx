import {useState, useEffect, useRef} from "react";
import axios from 'axios';
import {SearchResult} from "./SearchResult";
import styles from "./SearchBar.module.css"
import {useGSAP} from "@gsap/react";
import gsap from "gsap";

export function SearchBar() {
  const URL = 'http://localhost:3000/';


  const buttonRef = useRef(null);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const cardRef = useRef([]);

  const tlRef = useRef(null);

  const [inputIsSelected, setInputIsSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!inputValue) {
        setError(null);
        setData([]);
        return;
      }
      try {
        const result = await axios.get(`${URL}search?q=${inputValue}`)
        setData(result.data);
      } catch (err) {
        console.log(err)
        setError('FAiled to fetch results, try again.');
      } finally {
        setIsLoading(false);
      }
    }
  const timeOutId = setTimeout(fetchData, 500);
    return () => clearTimeout(timeOutId);
  }, [inputValue]);

  useEffect(() => {
    console.log(inputIsSelected)
  }, [inputIsSelected, setInputIsSelected]);


  const {contextSafe} = useGSAP(() => {
    const tl = gsap.timeline({paused: true})
      .from((inputRef.current), {
        width: 0,
        padding: 0,
        margin: 0
      })

    tlRef.current = tl;
  });
  const onPointerEnter = contextSafe(() => {
    tlRef.current.play()
  })
  const onPointerLeave = contextSafe(() => {
    if (inputIsSelected) {
      return;
    }
    tlRef.current.reverse()
  })


  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value);
  }
  const handleSubmit = (e) => e.preventDefault();
  const handleFocus = () => {
    setInputIsSelected(true);
    tlRef.current.play();
  }
  const handleBlur = () => {
    setInputIsSelected(false);
    tlRef.current.reverse().eventCallback("onUpdate", () => setInputValue(""))
  }

  const onClickButton = () => {
    if (inputIsSelected) {
      return;
    }
    console.log("this should reroute to results page");
  }


  return (
    <div
      className={styles.container}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Search..."
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <button
          className={styles.button}
          ref={buttonRef}
          onClick={onClickButton}
        >
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 30 30">
            <path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"></path>
          </svg>
        </button>
      </form>
      <div className={styles.result__container}>
        {isLoading ? <h1>loading</h1> : error ? <p>{error}</p> :
          data.map((e, i) => {
          return (
          <div className={"result-card"} ref={cardRef} key={i}>
          <SearchResult
            title={e.title}
            main_image_medium={e.main_picture_medium}
            status={e.status}
            mean={e.mean}
            synopsis={e.synopsis}
            start_date={e.start_date}
            end_date={e.end_date}
            media_type={e.media_type}
          ></SearchResult>
          </div>)
        })}
      </div>

    </div>
  )
}