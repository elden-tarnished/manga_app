import { useState, useEffect, useLayoutEffect, useRef} from "react";
import axios from 'axios';
import { SearchResult } from "./SearchResult";
export function SearchBar() {
  const URL = 'http://localhost:3000/';

  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('')
  const [data, setData] = useState([]);
  
  useEffect(() => {
    async function fetchData() {      
      if(!query) return
      try {      
        const result = await axios.get(`${URL}search?q=${query}`)
        console.log(result.data);
        setData(result.data);
      } catch (err) {
        console.log(err)
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [query]);

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value);
  }
  const handleSubmit = (e) => {
    e.preventDefault();
  }

  return (
    <div>
    <form onSubmit={handleSubmit}>
      <input
      type="text"
      placeholder="Search..."
      value={query}
      onChange={handleChange}
      />
      <button style={{backgroundColor: 'cyan'}}>button</button>
    </form>
    {isLoading? <h1>loading</h1> : data.map((e, i) => {
      return <SearchResult
      key={i}
      title={e.title}
      main_image_medium={e.main_picture_medium}
      status={e.status}
      mean={e.status}
      synopsis={e.synopsis}
      start_date={e.start_date}
      end_date={e.end_date}
      media_type={e.media_type}
      ></SearchResult>
    })}

    </div>
  )
}